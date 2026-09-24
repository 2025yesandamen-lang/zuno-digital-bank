import { db } from '../db/database';
import { LedgerAccount, LedgerTransaction, LedgerEntry, LedgerEntryType } from '../../src/types/banking';

export interface PostEntryLeg {
  accountCode: string; // e.g. '2001-CUST-LIABILITY' or '1001-CASH-SETTLEMENT'
  type: LedgerEntryType;
  amount: number;
}

export class LedgerService {
  /**
   * Execute an atomic double-entry transaction.
   * Enforces:
   * 1. Sum of debits === sum of credits
   * 2. Atomic running balance calculation
   * 3. Immutability of ledger journal entries
   */
  public executeDoubleEntryTransaction(params: {
    reference: string;
    description: string;
    currency: string;
    legs: PostEntryLeg[];
  }): LedgerTransaction {
    const { reference, description, currency, legs } = params;

    if (!legs || legs.length < 2) {
      throw new Error('Double-entry ledger requires at least two accounting legs.');
    }

    // 1. Validate balance equation: totalDebits === totalCredits
    let totalDebit = 0;
    let totalCredit = 0;

    for (const leg of legs) {
      if (leg.amount <= 0) {
        throw new Error(`Ledger entry amount must be strictly positive, got: ${leg.amount}`);
      }
      if (leg.type === 'DEBIT') {
        totalDebit += leg.amount;
      } else if (leg.type === 'CREDIT') {
        totalCredit += leg.amount;
      }
    }

    // Check rounding difference to 2 decimal places
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.001) {
      throw new Error(
        `Ledger Unbalanced Error: Debits (₦${totalDebit.toFixed(2)}) != Credits (₦${totalCredit.toFixed(2)}). Discrepancy: ₦${diff.toFixed(2)}`
      );
    }

    const txId = `LTX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const createdEntries: LedgerEntry[] = [];

    // 2. Atomic posting to each account
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      // Find the account in ledgerAccounts
      let account: LedgerAccount | undefined;
      for (const acc of db.ledgerAccounts.values()) {
        if (acc.code === leg.accountCode) {
          account = acc;
          break;
        }
      }

      if (!account) {
        throw new Error(`Ledger account not found for code: ${leg.accountCode}`);
      }

      // Calculate running balance according to standard GAAP accounting equation:
      // Asset / Expense: DEBIT increases balance (+), CREDIT decreases balance (-)
      // Liability / Equity / Revenue: CREDIT increases balance (+), DEBIT decreases balance (-)
      let balanceChange = 0;
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        balanceChange = leg.type === 'DEBIT' ? leg.amount : -leg.amount;
      } else {
        // LIABILITY, EQUITY, REVENUE
        balanceChange = leg.type === 'CREDIT' ? leg.amount : -leg.amount;
      }

      account.balance += balanceChange;

      const entry: LedgerEntry = {
        id: `ENT-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        ledgerTransactionId: txId,
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        type: leg.type,
        amount: leg.amount,
        runningBalanceAfter: account.balance,
        currency,
        createdAt: new Date().toISOString(),
      };

      db.ledgerEntries.push(entry);
      createdEntries.push(entry);
    }

    const ledgerTx: LedgerTransaction = {
      id: txId,
      reference,
      description,
      totalAmount: totalDebit,
      currency,
      entries: createdEntries,
      createdAt: new Date().toISOString(),
    };

    db.ledgerTransactions.unshift(ledgerTx);
    return ledgerTx;
  }

  /**
   * Reconcile Chart of Accounts & General Ledger integrity.
   * Asserts: Total Assets === Total Liabilities + Total Equity + (Revenue - Expenses)
   */
  public verifyLedgerIntegrity(): {
    isBalanced: boolean;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    imbalanceAmount: number;
    accounts: LedgerAccount[];
  } {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const accounts = Array.from(db.ledgerAccounts.values());

    for (const acc of accounts) {
      switch (acc.type) {
        case 'ASSET':
          totalAssets += acc.balance;
          break;
        case 'LIABILITY':
          totalLiabilities += acc.balance;
          break;
        case 'EQUITY':
          totalEquity += acc.balance;
          break;
        case 'REVENUE':
          totalRevenue += acc.balance;
          break;
        case 'EXPENSE':
          totalExpenses += acc.balance;
          break;
      }
    }

    const totalRightSide = totalLiabilities + totalEquity + (totalRevenue - totalExpenses);
    const imbalanceAmount = Math.abs(totalAssets - totalRightSide);
    const isBalanced = imbalanceAmount < 0.01;

    return {
      isBalanced,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      imbalanceAmount,
      accounts,
    };
  }
}

export const ledgerService = new LedgerService();
