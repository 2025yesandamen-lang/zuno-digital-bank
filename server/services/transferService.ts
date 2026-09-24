import { db } from '../db/database';
import { ledgerService } from './ledgerService';
import { authService } from './authService';
import { fraudEngine } from './fraudEngine';
import { Transaction, TransactionStatus, Beneficiary, User } from '../../src/types/banking';

export interface InterbankProviderAdapter {
  nameEnquiry(bankCode: string, accountNumber: string): Promise<{ success: boolean; accountName: string; sessionRef: string; kycTier: string }>;
  sendTransfer(params: {
    reference: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    narration: string;
  }): Promise<{ status: TransactionStatus; sessionRef: string; providerMessage: string }>;
}

export class MockNIBSSProvider implements InterbankProviderAdapter {
  async nameEnquiry(bankCode: string, accountNumber: string): Promise<{ success: boolean; accountName: string; sessionRef: string; kycTier: string }> {
    const cleanedAcc = (accountNumber || '').trim().replace(/\D/g, '');
    if (cleanedAcc.length < 9) {
      throw new Error('Account number must be a valid 10-digit NUBAN number.');
    }
    const targetAcc = cleanedAcc.length >= 10 ? cleanedAcc.slice(-10) : cleanedAcc;

    // Check if internal ZUNO account or user by account number, phone, or email
    const internalAcc = Array.from(db.accounts.values()).find(a => 
      a.accountNumber === targetAcc || a.accountNumber === cleanedAcc || a.accountNumber.endsWith(targetAcc)
    );
    if (internalAcc) {
      return {
        success: true,
        accountName: internalAcc.accountName,
        sessionRef: `0000090555${Date.now()}`,
        kycTier: internalAcc.tier
      };
    }

    const internalUser = Array.from(db.users.values()).find(u => 
      u.phoneNumber.replace(/\D/g, '').endsWith(targetAcc.slice(-9)) || 
      u.phoneNumber === cleanedAcc ||
      (u.email || '').toLowerCase() === (accountNumber || '').trim().toLowerCase()
    );
    if (internalUser) {
      const userAcc = Array.from(db.accounts.values()).find(a => a.userId === internalUser.id);
      return {
        success: true,
        accountName: userAcc?.accountName || `${internalUser.firstName.toUpperCase()} ${internalUser.lastName.toUpperCase()}`,
        sessionRef: `0000090555${Date.now()}`,
        kycTier: userAcc?.tier || 'TIER_1'
      };
    }

    // Find bank in directory (by code, NIP code, or slug)
    let bank = db.bankDirectory.find(b => 
      b.code === bankCode || 
      b.nipCode === bankCode || 
      b.slug === (bankCode || '').toLowerCase()
    );

    if (!bank) {
      if (bankCode === '090555' || bankCode === '000000' || !bankCode) {
        bank = {
          code: '090555',
          name: 'ZUNO Partner Bank (Providus MFB Rails)',
          slug: 'zuno-bank',
          nipCode: '090555',
          active: true,
          logoColor: '#2563EB'
        };
      } else {
        // Fallback for valid 10-digit interbank routing
        bank = {
          code: bankCode,
          name: 'Commercial Bank of Nigeria (NIBSS)',
          slug: 'cbn-bank',
          nipCode: bankCode,
          active: true,
          logoColor: '#00558F'
        };
      }
    }

    // Check pre-saved demo beneficiaries
    for (const benList of db.beneficiaries.values()) {
      const found = benList.find(b => (b.bankCode === bankCode || !bankCode) && b.accountNumber === targetAcc);
      if (found) {
        return {
          success: true,
          accountName: found.accountName,
          sessionRef: `0000${bank.nipCode || '000014'}${Date.now()}`,
          kycTier: 'TIER_3'
        };
      }
    }

    // Deterministic realistic simulated name generator based on last digits
    const namesByDigit: Record<string, string> = {
      '0': 'ADEBAYO OLAWALE SAMUEL',
      '1': 'CHUKWUMA EMMANUEL OKAFOR',
      '2': 'FATIMA MOHAMMED ZULAIHAT',
      '3': 'BABATUNDE ADENIYI GBENGA',
      '4': 'NGOZI BLESSING EZENWA',
      '5': 'KAYODE ABAYOMI VICTOR',
      '6': 'AISHA ABUBAKAR BELLO',
      '7': 'OLUWASEUN DANIEL AJAYI',
      '8': 'CHINWE PRECIOUS NWOSU',
      '9': 'EMMANUEL KINGSLEY EBI'
    };
    const lastDigit = targetAcc.slice(-1);
    const resolvedName = namesByDigit[lastDigit] || 'VERIFIED ACCOUNT HOLDER';

    return {
      success: true,
      accountName: resolvedName,
      sessionRef: `0000${bank.nipCode || '000014'}${Date.now()}`,
      kycTier: 'TIER_3'
    };
  }

  async sendTransfer(params: {
    reference: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    narration: string;
  }): Promise<{ status: TransactionStatus; sessionRef: string; providerMessage: string }> {
    const sessionRef = `999${params.bankCode}${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    if (!db.providerSettings.nibssSwitchOnline) {
      return {
        status: 'FAILED',
        sessionRef,
        providerMessage: 'NIBSS Central Interbank Switch is currently experiencing scheduled maintenance.'
      };
    }

    // High amount sandbox simulation (e.g. amounts ending in 999 simulate delayed pending)
    if (params.amount.toString().endsWith('999')) {
      return {
        status: 'PENDING',
        sessionRef,
        providerMessage: 'Transaction routed to destination bank. Awaiting remote settlement clearance.'
      };
    }

    return {
      status: 'SUCCESSFUL',
      sessionRef,
      providerMessage: 'Transaction approved and credited by destination financial institution.'
    };
  }
}

export class TransferService {
  private provider: InterbankProviderAdapter = new MockNIBSSProvider();

  public getBanks() {
    return db.bankDirectory.filter(b => b.active);
  }

  public async nameEnquiry(bankCode: string, accountNumber: string) {
    return await this.provider.nameEnquiry(bankCode, accountNumber);
  }

  public getBeneficiaries(userId: string): Beneficiary[] {
    return db.beneficiaries.get(userId) || [];
  }

  public saveBeneficiary(userId: string, data: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
    nickname?: string;
  }): Beneficiary {
    const list = db.beneficiaries.get(userId) || [];
    const exists = list.find(b => b.accountNumber === data.accountNumber && b.bankCode === data.bankCode);
    if (exists) {
      return exists;
    }

    const ben: Beneficiary = {
      id: `BEN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      bankCode: data.bankCode,
      bankName: data.bankName,
      nickname: data.nickname || data.accountName.split(' ')[0],
      isFavorite: false,
      createdAt: new Date().toISOString()
    };

    list.unshift(ben);
    db.beneficiaries.set(userId, list);
    return ben;
  }

  /**
   * Internal P2P Transfer between ZUNO bank users
   */
  public async transferInternal(params: {
    senderUserId: string;
    recipientIdentifier: string; // phone or account number
    amount: number;
    narration: string;
    pin: string;
    idempotencyKey?: string;
  }): Promise<Transaction> {
    const { senderUserId, recipientIdentifier, amount, narration, pin, idempotencyKey } = params;

    // 1. Idempotency Guard
    if (idempotencyKey && db.idempotencyStore.has(idempotencyKey)) {
      return db.idempotencyStore.get(idempotencyKey)!.response;
    }

    if (amount <= 0) throw new Error('Transfer amount must be strictly greater than zero.');

    // 2. PIN Validation
    if (!authService.verifyPin(senderUserId, pin)) {
      throw new Error('Incorrect 4-digit transaction PIN.');
    }

    // 3. Sender Wallet and Balance Verification
    const senderWallet = db.wallets.get(senderUserId);
    const senderUser = db.users.get(senderUserId);
    if (!senderWallet || !senderUser) throw new Error('Sender account not found.');

    if (senderWallet.availableBalance < amount) {
      throw new Error(`Insufficient funds. Your available balance is ₦${senderWallet.availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`);
    }

    // 4. Find Recipient
    let recipientUser: User | undefined;
    let recipientAccount: any;

    const cleanedIdentifier = (recipientIdentifier || '').trim().replace(/\s+/g, '');
    const cleanedLower = cleanedIdentifier.toLowerCase();
    for (const u of db.users.values()) {
      if (u.phoneNumber === cleanedIdentifier || (u.email || '').toLowerCase() === cleanedLower) {
        recipientUser = u;
        break;
      }
    }

    if (!recipientUser) {
      // Check by account number
      const acc = Array.from(db.accounts.values()).find(a => a.accountNumber === cleanedIdentifier);
      if (acc) {
        recipientUser = db.users.get(acc.userId);
        recipientAccount = acc;
      }
    }

    if (!recipientUser) {
      throw new Error('Recipient ZUNO user or account number not found.');
    }

    if (recipientUser.id === senderUserId) {
      throw new Error('Cannot transfer funds to your own wallet in a peer-to-peer transfer.');
    }

    const recipientWallet = db.wallets.get(recipientUser.id);
    if (!recipientWallet) throw new Error('Recipient wallet is inactive.');

    // 5. Fraud Engine Check
    const fraudEval = fraudEngine.evaluateTransactionRisk({
      userId: senderUserId,
      amount,
      type: 'TRANSFER_INTERNAL',
      destinationAccount: cleanedIdentifier
    });

    if (fraudEval.action === 'BLOCK') {
      throw new Error('Transfer blocked by automated security controls due to high-risk anomaly detection.');
    }

    // 6. Double-Entry Ledger Posting
    const ref = `ZUN-INT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Internal P2P transfer from ${senderUser.firstName} ${senderUser.lastName} to ${recipientUser.firstName} ${recipientUser.lastName}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount },
        { accountCode: '2001-CUST-LIABILITY', type: 'CREDIT', amount },
      ]
    });

    // 7. Atomic Balance Update
    senderWallet.availableBalance -= amount;
    senderWallet.ledgerBalance -= amount;
    senderWallet.dailySpentToday = (senderWallet.dailySpentToday || 0) + amount;
    senderWallet.updatedAt = new Date().toISOString();

    recipientWallet.availableBalance += amount;
    recipientWallet.ledgerBalance += amount;
    recipientWallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      idempotencyKey,
      userId: senderUserId,
      type: 'TRANSFER_INTERNAL',
      amount,
      fee: 0,
      totalDeducted: amount,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: senderWallet.accountId,
      destinationAccount: recipientWallet.accountId,
      counterpartyName: `${recipientUser.firstName} ${recipientUser.lastName}`,
      counterpartyBank: 'ZUNO Digital Bank',
      narration: narration || 'Internal ZUNO Transfer',
      sessionReference: `ZUNO-INT-${Date.now()}`,
      category: 'TRANSFER',
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    // Create Recipient Transaction Record
    const creditTx: Transaction = {
      id: `TXN-${Date.now()}-REC`,
      reference: `${ref}-IN`,
      userId: recipientUser.id,
      type: 'TRANSFER_INTERNAL',
      amount,
      fee: 0,
      totalDeducted: amount,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'CREDIT',
      sourceAccount: senderWallet.accountId,
      destinationAccount: recipientWallet.accountId,
      counterpartyName: `${senderUser.firstName} ${senderUser.lastName}`,
      counterpartyBank: 'ZUNO Digital Bank',
      narration: narration || 'Internal ZUNO Transfer',
      sessionReference: `ZUNO-INT-${Date.now()}`,
      category: 'TRANSFER',
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    db.transactions.set(creditTx.id, creditTx);

    // Notifications
    db.notifications.push({
      id: `NOTIF-${Date.now()}-SND`,
      userId: senderUserId,
      title: 'Transfer Sent 💸',
      message: `You sent ₦${amount.toLocaleString()} to ${recipientUser.firstName} ${recipientUser.lastName}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    db.notifications.push({
      id: `NOTIF-${Date.now()}-REC`,
      userId: recipientUser.id,
      title: 'Money Received 💰',
      message: `You received ₦${amount.toLocaleString()} from ${senderUser.firstName} ${senderUser.lastName}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    if (idempotencyKey) {
      db.idempotencyStore.set(idempotencyKey, { response: tx, timestamp: Date.now() });
    }

    return tx;
  }

  /**
   * External NIBSS Interbank Transfer
   */
  public async transferExternal(params: {
    userId: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    narration: string;
    pin: string;
    saveAsBeneficiary?: boolean;
    idempotencyKey?: string;
  }): Promise<Transaction> {
    const { userId, bankCode, accountNumber, accountName, amount, narration, pin, saveAsBeneficiary, idempotencyKey } = params;

    // 1. Idempotency Guard
    if (idempotencyKey && db.idempotencyStore.has(idempotencyKey)) {
      return db.idempotencyStore.get(idempotencyKey)!.response;
    }

    if (amount <= 0) throw new Error('Transfer amount must be positive.');

    // 2. PIN Validation
    if (!authService.verifyPin(userId, pin)) {
      throw new Error('Invalid 4-digit transaction PIN.');
    }

    const wallet = db.wallets.get(userId);
    const user = db.users.get(userId);
    let bank = db.bankDirectory.find(b => b.code === bankCode || b.nipCode === bankCode || b.slug === (bankCode || '').toLowerCase());
    if (!bank) {
      bank = {
        code: bankCode,
        name: 'Interbank Destination Financial Institution',
        slug: 'interbank-dest',
        nipCode: bankCode,
        active: true,
        logoColor: '#00558F'
      };
    }

    if (!wallet || !user) throw new Error('Sender wallet or user details missing.');

    // Tier 1 / 2 / 3 Limit enforcement
    const kyc = db.kycProfiles.get(userId);
    if (kyc && amount > kyc.singleTransferLimit) {
      throw new Error(`Amount exceeds your KYC ${kyc.tier} single transfer limit of ₦${kyc.singleTransferLimit.toLocaleString()}. Upgrade your account to send more.`);
    }

    // Fee structure: ₦10.75 standard NIBSS interbank fee
    const fee = amount > 50000 ? 53.75 : amount > 5000 ? 26.88 : 10.75;
    const totalDeducted = amount + fee;

    if (wallet.availableBalance < totalDeducted) {
      throw new Error(`Insufficient balance. Required: ₦${totalDeducted.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (Amount: ₦${amount.toLocaleString()} + Fee: ₦${fee}), Available: ₦${wallet.availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
    }

    // 3. Fraud Engine Check
    const fraudEval = fraudEngine.evaluateTransactionRisk({
      userId,
      amount,
      type: 'TRANSFER_EXTERNAL',
      destinationAccount: accountNumber
    });

    if (fraudEval.action === 'BLOCK') {
      throw new Error('Transaction blocked: High security risk flags detected by automated compliance system.');
    }

    // 4. Double-Entry Ledger Posting:
    // Debit Customer Liability (₦totalDeducted)
    // Credit Interbank Settlement Pool (₦amount)
    // Credit Fee Revenue Account (₦fee)
    const ref = `ZUN-EXT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `NIP Outward transfer to ${accountName} (${bank.name})`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount: totalDeducted },
        { accountCode: '1001-CASH-SETTLEMENT', type: 'CREDIT', amount: amount },
        { accountCode: '4001-FEE-INCOME', type: 'CREDIT', amount: fee }
      ]
    });

    // 5. Deduct Sender Wallet Balance Atomically
    wallet.availableBalance -= totalDeducted;
    wallet.ledgerBalance -= totalDeducted;
    wallet.dailySpentToday = (wallet.dailySpentToday || 0) + totalDeducted;
    wallet.updatedAt = new Date().toISOString();

    // 6. Dispatch to Interbank Banking Rails Adapter
    const providerResult = await this.provider.sendTransfer({
      reference: ref,
      bankCode,
      accountNumber,
      accountName,
      amount,
      narration: narration || 'Interbank Transfer'
    });

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      idempotencyKey,
      userId,
      type: 'TRANSFER_EXTERNAL',
      amount,
      fee,
      totalDeducted,
      currency: 'NGN',
      status: providerResult.status,
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: accountNumber,
      counterpartyName: accountName,
      counterpartyBank: bank.name,
      narration: narration || `Transfer to ${accountName}`,
      sessionReference: providerResult.sessionRef,
      category: 'TRANSFER',
      ledgerTransactionId: ledgerTx.id,
      failureReason: providerResult.status === 'FAILED' ? providerResult.providerMessage : undefined,
      createdAt: new Date().toISOString(),
      completedAt: providerResult.status === 'SUCCESSFUL' ? new Date().toISOString() : undefined
    };

    db.transactions.set(tx.id, tx);

    // Save beneficiary if requested
    if (saveAsBeneficiary) {
      this.saveBeneficiary(userId, {
        accountNumber,
        accountName,
        bankCode,
        bankName: bank.name
      });
    }

    // Dispatch Notification
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: providerResult.status === 'SUCCESSFUL' ? 'Transfer Sent Successfully' : 'Transfer Processing',
      message: `₦${amount.toLocaleString()} sent to ${accountName} (${bank.name}). Ref: ${ref}`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    if (idempotencyKey) {
      db.idempotencyStore.set(idempotencyKey, { response: tx, timestamp: Date.now() });
    }

    return tx;
  }

  /**
   * Mock Deposit / Wallet Funding (for testing & sandbox)
   */
  public async depositMock(userId: string, amount: number, sourceName: string): Promise<Transaction> {
    if (amount <= 0) throw new Error('Deposit amount must be positive.');

    const wallet = db.wallets.get(userId);
    const user = db.users.get(userId);
    if (!wallet || !user) throw new Error('User wallet not found.');

    const ref = `ZUN-DEP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Ledger: Debit Interbank Settlement Pool, Credit Customer Liability
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Inward account deposit / topup for ${user.firstName} ${user.lastName}`,
      currency: 'NGN',
      legs: [
        { accountCode: '1001-CASH-SETTLEMENT', type: 'DEBIT', amount },
        { accountCode: '2001-CUST-LIABILITY', type: 'CREDIT', amount }
      ]
    });

    wallet.availableBalance += amount;
    wallet.ledgerBalance += amount;
    wallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'DEPOSIT_MOCK',
      amount,
      fee: 0,
      totalDeducted: amount,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'CREDIT',
      sourceAccount: 'NIP-INWARD-FEED',
      destinationAccount: wallet.accountId,
      counterpartyName: sourceName || 'Card / Bank Transfer Topup',
      counterpartyBank: 'Central Inward Rails',
      narration: 'Account Top-up Deposit',
      sessionReference: `000099${Date.now()}`,
      category: 'TOPUP',
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Wallet Funded 💳',
      message: `Your ZUNO account was credited with ₦${amount.toLocaleString()}. Current balance: ₦${wallet.availableBalance.toLocaleString()}.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return tx;
  }
}

export const transferService = new TransferService();
