import { db } from '../db/database';
import { ledgerService } from './ledgerService';
import { authService } from './authService';
import { SavingsAccount, VirtualCard, Transaction } from '../../src/types/banking';

export class SavingsAndCardService {
  // --- SAVINGS MODULE ---

  public getSavingsProducts() {
    return db.savingsProducts;
  }

  public getUserSavings(userId: string): SavingsAccount[] {
    return Array.from(db.savingsAccounts.values()).filter(s => s.userId === userId);
  }

  public createSavingsPlan(params: {
    userId: string;
    productId: string;
    name: string;
    initialDeposit: number;
    targetAmount?: number;
    durationDays?: number;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    autoDebitAmount?: number;
    pin: string;
  }): SavingsAccount {
    const { userId, productId, name, initialDeposit, targetAmount, durationDays, frequency, autoDebitAmount, pin } = params;

    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect transaction PIN.');

    const product = db.savingsProducts.find(p => p.id === productId);
    if (!product) throw new Error('Savings product not found.');

    if (initialDeposit < product.minimumAmount) {
      throw new Error(`Initial deposit must be at least ₦${product.minimumAmount.toLocaleString()} for ${product.name}.`);
    }

    const wallet = db.wallets.get(userId);
    if (!wallet || wallet.availableBalance < initialDeposit) {
      throw new Error(`Insufficient wallet balance for initial deposit.`);
    }

    const planId = `SAV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const days = durationDays || product.minDurationDays || 30;
    const maturityDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    // Ledger: Move funds from Customer Wallet to Customer Savings Vault
    const ref = `ZUN-SAV-DEP-${Date.now()}`;
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Savings Deposit to plan: ${name}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2001-CUST-LIABILITY', type: 'DEBIT', amount: initialDeposit },
        { accountCode: '2002-SAVINGS-LIABILITY', type: 'CREDIT', amount: initialDeposit }
      ]
    });

    wallet.availableBalance -= initialDeposit;
    wallet.ledgerBalance -= initialDeposit;
    wallet.updatedAt = new Date().toISOString();

    const plan: SavingsAccount = {
      id: planId,
      userId,
      productId: product.id,
      productType: product.type,
      name,
      targetAmount: targetAmount || (product.type === 'TARGET' ? initialDeposit * 5 : undefined),
      currentBalance: initialDeposit,
      accruedInterest: 0,
      interestRatePcnt: product.interestRateAnnualPcnt,
      frequency: frequency || 'MONTHLY',
      autoDebitAmount: autoDebitAmount || (product.type === 'TARGET' ? initialDeposit : undefined),
      startDate: now.toISOString(),
      maturityDate: product.type !== 'FLEXIBLE' ? maturityDate : undefined,
      lockedUntil: product.type === 'FIXED' ? maturityDate : undefined,
      status: 'ACTIVE',
      createdAt: now.toISOString()
    };

    db.savingsAccounts.set(plan.id, plan);

    // Record Transaction
    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'SAVINGS_DEPOSIT',
      amount: initialDeposit,
      fee: 0,
      totalDeducted: initialDeposit,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'DEBIT',
      sourceAccount: wallet.accountId,
      destinationAccount: plan.id,
      counterpartyName: name,
      counterpartyBank: 'ZUNO Wealth Vault',
      narration: `Deposit to ${name} (${product.interestRateAnnualPcnt}% p.a.)`,
      category: 'SAVINGS',
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Savings Plan Created 🌱',
      message: `Your savings vault "${name}" is active earning ${product.interestRateAnnualPcnt}% p.a.!`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return plan;
  }

  public withdrawSavings(params: {
    userId: string;
    savingsId: string;
    amount: number;
    pin: string;
  }): { savings: SavingsAccount; wallet: any; amountWithdrawn: number } {
    const { userId, savingsId, amount, pin } = params;

    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect transaction PIN.');

    const plan = db.savingsAccounts.get(savingsId);
    if (!plan || plan.userId !== userId) throw new Error('Savings plan not found.');

    if (plan.status !== 'ACTIVE') throw new Error('This savings plan is not active.');

    if (plan.productType === 'FIXED' && plan.lockedUntil && new Date(plan.lockedUntil).getTime() > Date.now()) {
      throw new Error(`This fixed deposit is locked until ${new Date(plan.lockedUntil).toLocaleDateString()}. Early liquidation requires admin penalty waiver.`);
    }

    if (amount > plan.currentBalance) {
      throw new Error(`Insufficient savings balance. Maximum withdrawable: ₦${plan.currentBalance.toLocaleString()}`);
    }

    const wallet = db.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found.');

    const ref = `ZUN-SAV-WTH-${Date.now()}`;

    // Ledger: Debit Savings Liability, Credit Customer Wallet Liability
    const ledgerTx = ledgerService.executeDoubleEntryTransaction({
      reference: ref,
      description: `Withdrawal from savings plan: ${plan.name}`,
      currency: 'NGN',
      legs: [
        { accountCode: '2002-SAVINGS-LIABILITY', type: 'DEBIT', amount },
        { accountCode: '2001-CUST-LIABILITY', type: 'CREDIT', amount }
      ]
    });

    plan.currentBalance -= amount;
    if (plan.currentBalance <= 0 && plan.productType === 'FIXED') {
      plan.status = 'COMPLETED';
    }
    db.savingsAccounts.set(plan.id, plan);

    wallet.availableBalance += amount;
    wallet.ledgerBalance += amount;
    wallet.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: `TXN-${Date.now()}`,
      reference: ref,
      userId,
      type: 'SAVINGS_WITHDRAW',
      amount,
      fee: 0,
      totalDeducted: amount,
      currency: 'NGN',
      status: 'SUCCESSFUL',
      direction: 'CREDIT',
      sourceAccount: plan.id,
      destinationAccount: wallet.accountId,
      counterpartyName: plan.name,
      counterpartyBank: 'ZUNO Wealth Vault',
      narration: `Withdrawal from ${plan.name}`,
      category: 'SAVINGS',
      ledgerTransactionId: ledgerTx.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    db.transactions.set(tx.id, tx);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Savings Withdrawn 💰',
      message: `₦${amount.toLocaleString()} withdrawn from "${plan.name}" into your primary wallet.`,
      channel: 'IN_APP',
      type: 'TRANSACTION',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { savings: plan, wallet, amountWithdrawn: amount };
  }

  // --- CARDS MODULE ---

  public getUserCards(userId: string): VirtualCard[] {
    return db.virtualCards.get(userId) || [];
  }

  public issueCard(params: {
    userId: string;
    brand: 'VISA' | 'MASTERCARD';
    cardType: 'VIRTUAL' | 'PHYSICAL';
    pin: string;
  }): VirtualCard {
    const { userId, brand, cardType, pin } = params;

    if (!authService.verifyPin(userId, pin)) throw new Error('Incorrect transaction PIN.');

    const user = db.users.get(userId);
    if (!user) throw new Error('User not found.');

    const prefix = brand === 'VISA' ? '4187' : '5399';
    const randMid = Math.floor(10000000 + Math.random() * 90000000).toString();
    const fullPan = `${prefix}${randMid}`;
    const panMasked = `${fullPan.slice(0, 4)} •••• •••• ${fullPan.slice(-4)}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const expiryYear = (new Date().getFullYear() + 4).toString().slice(-2);
    const expiryMonth = '09';

    const card: VirtualCard = {
      id: `CRD-${Date.now()}`,
      userId,
      cardholderName: `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`,
      panMasked,
      fullPan,
      expiryMonth,
      expiryYear,
      cvv,
      brand,
      cardType,
      status: 'ACTIVE',
      balance: cardType === 'VIRTUAL' ? 25000 : 50000,
      monthlyLimit: 1000000,
      dailyLimit: 250000,
      createdAt: new Date().toISOString()
    };

    const list = db.virtualCards.get(userId) || [];
    list.unshift(card);
    db.virtualCards.set(userId, list);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: `${brand} ${cardType === 'VIRTUAL' ? 'Virtual' : 'Physical'} Card Issued 💳`,
      message: `Your new ZUNO ${brand} ending in ${fullPan.slice(-4)} is ready for online and POS spending.`,
      channel: 'IN_APP',
      type: 'SECURITY',
      read: false,
      createdAt: new Date().toISOString()
    });

    return card;
  }

  public toggleFreezeCard(userId: string, cardId: string): VirtualCard {
    const list = db.virtualCards.get(userId) || [];
    const card = list.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found.');

    card.status = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    db.virtualCards.set(userId, list);

    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: `Card ${card.status === 'FROZEN' ? 'Frozen' : 'Unfrozen'}`,
      message: `Your card ending in ${card.panMasked.slice(-4)} is now ${(card.status || '').toLowerCase()}.`,
      channel: 'IN_APP',
      type: 'SECURITY',
      read: false,
      createdAt: new Date().toISOString()
    });

    return card;
  }

  public updateCardLimits(userId: string, cardId: string, dailyLimit: number, monthlyLimit: number): VirtualCard {
    const list = db.virtualCards.get(userId) || [];
    const card = list.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found.');

    card.dailyLimit = dailyLimit;
    card.monthlyLimit = monthlyLimit;
    db.virtualCards.set(userId, list);
    return card;
  }
}

export const savingsAndCardService = new SavingsAndCardService();
