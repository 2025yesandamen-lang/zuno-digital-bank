import { db } from '../db/database';
import { ledgerService } from './ledgerService';
import { authService } from './authService';
import { Transaction, Wallet } from '../../src/types/banking';

export interface ElectricityDisco {
  id: string;
  name: string;
  code: string;
  type: 'PREPAID' | 'POSTPAID';
}

export interface TVPackage {
  id: string;
  provider: 'DSTV' | 'GOTV' | 'STARTIMES';
  name: string;
  price: number;
  channelsCount: number;
}

export class BillPaymentService {
  private ensureWallet(userId?: string): Wallet {
    let effectiveId = (userId || '').trim() || 'USR-882109';
    let wallet = db.wallets.get(effectiveId);
    if (!wallet) {
      wallet = db.wallets.get('USR-882109') || Array.from(db.wallets.values())[0];
    }
    if (!wallet) {
      wallet = {
        id: `WAL-${effectiveId.replace('USR-', '')}`,
        userId: effectiveId,
        accountId: `ACC-${effectiveId.replace('USR-', '')}`,
        currency: 'NGN',
        availableBalance: 250000.00,
        pendingBalance: 0.00,
        ledgerBalance: 250000.00,
        dailySpentToday: 0.00,
        lastSpentDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      };
      db.wallets.set(effectiveId, wallet);
    }
    return wallet;
  }

  // Electricity Discos
  public getElectricityDiscos(): ElectricityDisco[] {
    return [
      { id: 'ikedc', name: 'Ikeja Electric (IKEDC)', code: 'IKEDC', type: 'PREPAID' },
      { id: 'ekedc', name: 'Eko Electricity (EKEDC)', code: 'EKEDC', type: 'PREPAID' },
      { id: 'aedc', name: 'Abuja Electricity (AEDC)', code: 'AEDC', type: 'PREPAID' },
      { id: 'ibedc', name: 'Ibadan Electricity (IBEDC)', code: 'IBEDC', type: 'PREPAID' },
      { id: 'eedc', name: 'Enugu Electricity (EEDC)', code: 'EEDC', type: 'PREPAID' },
      { id: 'kedc', name: 'Kano Electricity (KEDC)', code: 'KEDC', type: 'PREPAID' },
      { id: 'phedc', name: 'Port Harcourt Electricity (PHEDC)', code: 'PHEDC', type: 'PREPAID' },
    ];
  }

  // TV Bouquets
  public getTVPackages(provider: 'DSTV' | 'GOTV' | 'STARTIMES'): TVPackage[] {
    const packages: Record<string, TVPackage[]> = {
      DSTV: [
        { id: 'dstv-padi', provider: 'DSTV', name: 'DStv Padi', price: 4400, channelsCount: 45 },
        { id: 'dstv-yanga', provider: 'DSTV', name: 'DStv Yanga', price: 6000, channelsCount: 85 },
        { id: 'dstv-confam', provider: 'DSTV', name: 'DStv Confam', price: 11000, channelsCount: 105 },
        { id: 'dstv-compact', provider: 'DSTV', name: 'DStv Compact', price: 19000, channelsCount: 130 },
        { id: 'dstv-compact-plus', provider: 'DSTV', name: 'DStv Compact Plus', price: 30000, channelsCount: 145 },
        { id: 'dstv-premium', provider: 'DSTV', name: 'DStv Premium', price: 44000, channelsCount: 165 },
      ],
      GOTV: [
        { id: 'gotv-smallie', provider: 'GOTV', name: 'GOtv Smallie', price: 1900, channelsCount: 35 },
        { id: 'gotv-jinja', provider: 'GOTV', name: 'GOtv Jinja', price: 3900, channelsCount: 45 },
        { id: 'gotv-jolli', provider: 'GOTV', name: 'GOtv Jolli', price: 5800, channelsCount: 65 },
        { id: 'gotv-max', provider: 'GOTV', name: 'GOtv Max', price: 8500, channelsCount: 75 },
        { id: 'gotv-supa', provider: 'GOTV', name: 'GOtv Supa+', price: 16800, channelsCount: 85 },
      ],
      STARTIMES: [
        { id: 'st-nova', provider: 'STARTIMES', name: 'StarTimes Nova', price: 1700, channelsCount: 30 },
        { id: 'st-basic', provider: 'STARTIMES', name: 'StarTimes Basic', price: 3300, channelsCount: 48 },
        { id: 'st-smart', provider: 'STARTIMES', name: 'StarTimes Smart', price: 4700, channelsCount: 60 },
        { id: 'st-classic', provider: 'STARTIMES', name: 'StarTimes Classic', price: 5500, channelsCount: 75 },
        { id: 'st-super', provider: 'STARTIMES', name: 'StarTimes Super', price: 9000, channelsCount: 100 },
      ]
    };
    return packages[provider] || [];
  }

  // Data plans
  public getDataPlans(network: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE') {
    const plans = {
      MTN: [
        { id: 'mtn-1gb-1d', name: '1GB Daily Plan (24 Hours)', price: 400, data: '1 GB', validity: '1 Day' },
        { id: 'mtn-2gb-2d', name: '2.5GB 2-Day Pulse Plan', price: 750, data: '2.5 GB', validity: '2 Days' },
        { id: 'mtn-6gb-7d', name: '6GB Weekly Plan', price: 2000, data: '6 GB', validity: '7 Days' },
        { id: 'mtn-10gb-30d', name: '10GB Monthly Standard', price: 4000, data: '10 GB', validity: '30 Days' },
        { id: 'mtn-20gb-30d', name: '20GB Monthly Pro Data', price: 7500, data: '20 GB', validity: '30 Days' },
        { id: 'mtn-40gb-30d', name: '40GB Heavy Monthly Bundle', price: 13500, data: '40 GB', validity: '30 Days' },
      ],
      AIRTEL: [
        { id: 'art-1gb-1d', name: '1GB Daily Binge', price: 400, data: '1 GB', validity: '1 Day' },
        { id: 'art-5gb-7d', name: '5GB Weekly Bundle', price: 1800, data: '5 GB', validity: '7 Days' },
        { id: 'art-10gb-30d', name: '10GB Unlimited Monthly', price: 4000, data: '10 GB', validity: '30 Days' },
        { id: 'art-25gb-30d', name: '25GB Mega Monthly Plan', price: 9000, data: '25 GB', validity: '30 Days' },
      ],
      GLO: [
        { id: 'glo-1-3gb-1d', name: '1.35GB Special Daily', price: 350, data: '1.35 GB', validity: '1 Day' },
        { id: 'glo-7gb-7d', name: '7GB Weekly Grandmaster', price: 1800, data: '7 GB', validity: '7 Days' },
        { id: 'glo-12gb-30d', name: '12GB Monthly Always-On', price: 3800, data: '12 GB', validity: '30 Days' },
        { id: 'glo-30gb-30d', name: '30GB Super Heavy Monthly', price: 8500, data: '30 GB', validity: '30 Days' },
      ],
      '9MOBILE': [
        { id: '9m-1gb-1d', name: '1GB Daily Blaze', price: 400, data: '1 GB', validity: '1 Day' },
        { id: '9m-7gb-7d', name: '7GB Weekly Surge', price: 1900, data: '7 GB', validity: '7 Days' },
        { id: '9m-15gb-30d', name: '15GB Monthly Executive', price: 5500, data: '15 GB', validity: '30 Days' },
      ]
    };
    return plans[network] || [];
  }

  // Validate Electricity Meter
  public async validateMeter(discoCode: string, meterNumber: string): Promise<{ success: boolean; customerName: string; address: string; disco: string }> {
    if (!meterNumber || meterNumber.length < 8) {
      throw new Error('Meter number must contain at least 8 to 11 digits.');
    }
    const disco = this.getElectricityDiscos().find(d => d.code === discoCode);
    const discoName = disco ? disco.name : discoCode;

    // Realistic address generation
    const sampleNames = ['CHIEF ALHAJI BALOGUN', 'DR. OKONKWO BLESSING', 'ENGR. BABATUNDE A.', 'MRS. FOLASHADE OJO'];
    const index = Math.abs(meterNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % sampleNames.length;

    return {
      success: true,
      customerName: sampleNames[index],
      address: `Plot ${meterNumber.slice(-2)}, Block 4, Residential Zone, Lagos`,
      disco: discoName
    };
  }

  // Validate TV Smartcard
  public async validateSmartcard(provider: string, smartcardNumber: string): Promise<{ success: boolean; customerName: string; currentBouquet: string }> {
    if (!smartcardNumber || smartcardNumber.length < 9) {
      throw new Error('Smartcard / IUC number must be at least 9 digits.');
    }
    return {
      success: true,
      customerName: 'JOHN DOE',
      currentBouquet: `${provider} Active Sub`
    };
  }

  // Purchase Airtime
  public async buyAirtime(params: {
    userId: string;
    operator: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
    phoneNumber: string;
    amount: number;
    pin: string;
  }): Promise<Transaction> {
    const { userId, operator, phoneNumber, amount, pin } = params;

    if (amount < 50) throw new Error('Minimum airtime purchase is ₦50.');
    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect 4-digit transaction PIN. (Demo PIN: 1234)');

    const wallet = this.ensureWallet(userId);

    // 2% Cashback promotional discount for ZUNO users
    const cashback = Math.round(amount * 0.02);
    const finalDebit = amount - cashback;

    if (wallet.availableBalance < finalDebit) {
      throw new Error(`Insufficient wallet balance. Total: ₦${finalDebit.toLocaleString()}`);
    }

    const ref = `ZUN-VTU-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Ledger: Debit Customer Wallet Liability, Credit VTU Escrow Float
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `VTU Airtime Topup (${operator}) to ${phoneNumber}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount: finalDebit },
        { accountCode: '1002-VTU-ESCROW', type: 'CREDIT', amount: finalDebit }
      ]
    });

    wallet.availableBalance -= finalDebit;
    wallet.ledgerBalance -= finalDebit;
    wallet.dailySpentToday = (wallet.dailySpentToday || 0) + finalDebit;
    wallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'AIRTIME',
      amount,
      fee: 0,
      totalDeducted: finalDebit,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: phoneNumber,
      counterpartyName: `${operator} Nigeria`,
      counterpartyBank: 'VTU Telco Gateway',
      narration: `Airtime Topup - ${operator} ${phoneNumber} (Saved ₦${cashback})`,
      sessionReference: `VTU-${Date.now()}`,
      category: 'BILL',
      metadata: { operator, phoneNumber, cashbackDiscount: cashback },
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Airtime Recharged 📱',
      message: `₦${amount.toLocaleString()} airtime sent to ${phoneNumber}. You saved ₦${cashback} with ZUNO cashback!`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return tx;
  }

  // Purchase Mobile Data
  public async buyData(params: {
    userId: string;
    operator: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
    phoneNumber: string;
    planId: string;
    pin: string;
  }): Promise<Transaction> {
    const { userId, operator, phoneNumber, planId, pin } = params;

    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect transaction PIN. (Demo PIN: 1234)');

    const plans = this.getDataPlans(operator);
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) throw new Error('Invalid data plan selected.');

    const wallet = this.ensureWallet(userId);
    if (wallet.availableBalance < selectedPlan.price) {
      throw new Error(`Insufficient funds for ${selectedPlan.name}. Required: ₦${selectedPlan.price.toLocaleString()}`);
    }

    const ref = `ZUN-DAT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Data Bundle (${selectedPlan.name}) to ${phoneNumber}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount: selectedPlan.price },
        { accountCode: '1002-VTU-ESCROW', type: 'CREDIT', amount: selectedPlan.price }
      ]
    });

    wallet.availableBalance -= selectedPlan.price;
    wallet.ledgerBalance -= selectedPlan.price;
    wallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'DATA',
      amount: selectedPlan.price,
      fee: 0,
      totalDeducted: selectedPlan.price,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: phoneNumber,
      counterpartyName: `${operator} Data`,
      counterpartyBank: 'VTU Telco Gateway',
      narration: `Data Subscription - ${selectedPlan.name}`,
      category: 'BILL',
      metadata: { operator, phoneNumber, planName: selectedPlan.name, dataCap: selectedPlan.data, validity: selectedPlan.validity },
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Data Activated ⚡',
      message: `${selectedPlan.name} (${selectedPlan.data}) activated on ${phoneNumber}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return tx;
  }

  // Pay Electricity Bill & Generate STS 20-digit Token
  public async payElectricity(params: {
    userId: string;
    discoCode: string;
    meterNumber: string;
    customerName: string;
    amount: number;
    pin: string;
  }): Promise<Transaction> {
    const { userId, discoCode, meterNumber, customerName, amount, pin } = params;

    if (amount < 1000) throw new Error('Minimum electricity recharge is ₦1,000.');
    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect transaction PIN. (Demo PIN: 1234)');

    const wallet = this.ensureWallet(userId);
    const fee = 100; // standard disco processing fee
    const totalDeducted = amount + fee;

    if (wallet.availableBalance < totalDeducted) {
      throw new Error(`Insufficient wallet balance. Total: ₦${totalDeducted.toLocaleString()}`);
    }

    // Generate compliant 20-digit STS Electricity Token (4-4-4-4-4 format)
    const t1 = Math.floor(1000 + Math.random() * 9000);
    const t2 = Math.floor(1000 + Math.random() * 9000);
    const t3 = Math.floor(1000 + Math.random() * 9000);
    const t4 = Math.floor(1000 + Math.random() * 9000);
    const t5 = Math.floor(1000 + Math.random() * 9000);
    const token = `${t1}-${t2}-${t3}-${t4}-${t5}`;

    const calculatedKwh = (amount / 68.5).toFixed(1); // Standard NERC Band rate calculation

    const ref = `ZUN-ELEC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Electricity Token Purchase (${discoCode}) - Meter ${meterNumber}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount: totalDeducted },
        { accountCode: '1003-UTILITY-ESCROW', type: 'CREDIT', amount: amount },
        { accountCode: '4001-FEE-INCOME', type: 'CREDIT', amount: fee }
      ]
    });

    wallet.availableBalance -= totalDeducted;
    wallet.ledgerBalance -= totalDeducted;
    wallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'ELECTRICITY',
      amount,
      fee,
      totalDeducted,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: meterNumber,
      counterpartyName: discoCode,
      counterpartyBank: 'Disco Utility Gateway',
      narration: `Prepaid Power - Token ${token}`,
      category: 'BILL',
      metadata: {
        disco: discoCode,
        meterNumber,
        customerName,
        token,
        unitsKw: `${calculatedKwh} kWh`,
        receiptNo: `REC-${Date.now()}`
      },
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Electricity Token Generated 💡',
      message: `Token: ${token} for ${customerName} (${calculatedKwh} kWh).`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return tx;
  }

  // Pay TV Subscription
  public async payTV(params: {
    userId: string;
    provider: 'DSTV' | 'GOTV' | 'STARTIMES';
    smartcardNumber: string;
    packageId: string;
    customerName: string;
    pin: string;
  }): Promise<Transaction> {
    const { userId, provider, smartcardNumber, packageId, customerName, pin } = params;

    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect transaction PIN. (Demo PIN: 1234)');

    const packages = this.getTVPackages(provider);
    const selectedPkg = packages.find(p => p.id === packageId);
    if (!selectedPkg) throw new Error('Invalid TV bouquet selected.');

    const wallet = this.ensureWallet(userId);
    const fee = 100;
    const totalDeducted = selectedPkg.price + fee;

    if (wallet.availableBalance < totalDeducted) {
      throw new Error(`Insufficient wallet balance. Total required: ₦${totalDeducted.toLocaleString()}`);
    }

    const ref = `ZUN-TV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `PayTV Subscription (${provider}) - ${selectedPkg.name} for IUC ${smartcardNumber}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount: totalDeducted },
        { accountCode: '1003-UTILITY-ESCROW', type: 'CREDIT', amount: selectedPkg.price },
        { accountCode: '4001-FEE-INCOME', type: 'CREDIT', amount: fee }
      ]
    });

    wallet.availableBalance -= totalDeducted;
    wallet.ledgerBalance -= totalDeducted;
    wallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'TV',
      amount: selectedPkg.price,
      fee,
      totalDeducted,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: smartcardNumber,
      counterpartyName: `${provider} Subscription`,
      counterpartyBank: 'Multichoice / PayTV Switch',
      narration: `${provider} ${selectedPkg.name} - ${smartcardNumber}`,
      category: 'BILL',
      metadata: {
        provider,
        smartcardNumber,
        customerName,
        packageName: selectedPkg.name,
        channels: selectedPkg.channelsCount,
        invoiceNumber: `INV-${Date.now()}`
      },
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'TV Bouquet Renewed 📺',
      message: `${provider} ${selectedPkg.name} renewed on smartcard ${smartcardNumber}. Viewing restored!`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return tx;
  }
}

export const billPaymentService = new BillPaymentService();
