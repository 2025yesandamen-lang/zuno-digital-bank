import crypto from 'crypto';
import {
  User,
  UserProfile,
  KYCProfile,
  BankAccount,
  Wallet,
  LedgerAccount,
  LedgerTransaction,
  LedgerEntry,
  Transaction,
  Beneficiary,
  BankInstitution,
  SavingsProduct,
  SavingsAccount,
  VirtualCard,
  FraudEvent,
  AppNotification,
  SupportTicket,
  AuditLog
} from '../../src/types/banking';

const hashSecret = (val: string, salt: string) =>
  crypto.createHash('sha256').update(val + salt).digest('hex');

export class ZunoDatabase {
  users: Map<string, User> = new Map();
  userCredentials: Map<string, { passwordHash: string; pinHash: string; salt: string }> = new Map();
  profiles: Map<string, UserProfile> = new Map();
  kycProfiles: Map<string, KYCProfile> = new Map();
  accounts: Map<string, BankAccount> = new Map();
  wallets: Map<string, Wallet> = new Map();
  ledgerAccounts: Map<string, LedgerAccount> = new Map();
  ledgerTransactions: LedgerTransaction[] = [];
  ledgerEntries: LedgerEntry[] = [];
  transactions: Map<string, Transaction> = new Map();
  beneficiaries: Map<string, Beneficiary[]> = new Map(); // userId -> list
  bankDirectory: BankInstitution[] = [];
  savingsProducts: SavingsProduct[] = [];
  savingsAccounts: Map<string, SavingsAccount> = new Map();
  virtualCards: Map<string, VirtualCard[]> = new Map(); // userId -> cards
  fraudEvents: FraudEvent[] = [];
  notifications: AppNotification[] = [];
  supportTickets: Map<string, SupportTicket> = new Map();
  auditLogs: AuditLog[] = [];
  otpStore: Map<string, { code: string; expiresAt: number; attempts: number; verified: boolean }> = new Map();
  idempotencyStore: Map<string, { response: any; timestamp: number }> = new Map();

  // Simulated provider config
  providerSettings = {
    simulateNetworkDelayMs: 350,
    simulateProviderFailureRatePcnt: 0,
    nibssSwitchOnline: true,
    vtuProviderOnline: true,
    discoGatewayOnline: true,
    kycProviderMode: 'SANDBOX' as 'SANDBOX' | 'MOCK' | 'LIVE',
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Setup Standard General Ledger Chart of Accounts
    const defaultLedgerAccounts: LedgerAccount[] = [
      { id: 'LA-1001', code: '1001-CASH-SETTLEMENT', name: 'Interbank Settlement Pool (NIBSS)', type: 'ASSET', balance: 500000000, currency: 'NGN' },
      { id: 'LA-1002', code: '1002-VTU-ESCROW', name: 'VTU & Telco Float Pool', type: 'ASSET', balance: 50000000, currency: 'NGN' },
      { id: 'LA-1003', code: '1003-UTILITY-ESCROW', name: 'Discos & Utility Escrow', type: 'ASSET', balance: 50000000, currency: 'NGN' },
      { id: 'LA-2001', code: '2001-CUST-LIABILITY', name: 'Customer Wallets (Total Deposits)', type: 'LIABILITY', balance: 500000000, currency: 'NGN' },
      { id: 'LA-2002', code: '2002-SAVINGS-LIABILITY', name: 'Customer Fixed & Target Savings', type: 'LIABILITY', balance: 50000000, currency: 'NGN' },
      { id: 'LA-3001', code: '3001-EQUITY-CAPITAL', name: 'ZUNO Equity Capital Reserve', type: 'EQUITY', balance: 50000000, currency: 'NGN' },
      { id: 'LA-4001', code: '4001-FEE-INCOME', name: 'Transfer & Platform Fee Revenue', type: 'REVENUE', balance: 0, currency: 'NGN' },
      { id: 'LA-5001', code: '5001-INTEREST-EXPENSE', name: 'Savings Interest Paid', type: 'EXPENSE', balance: 0, currency: 'NGN' },
    ];

    defaultLedgerAccounts.forEach(acc => this.ledgerAccounts.set(acc.id, acc));

    // 2. Setup Bank Directory (Licensed Nigerian Financial Institutions)
    this.bankDirectory = [
      { code: '090555', name: 'ZUNO Partner Bank (Providus MFB Rails)', slug: 'zuno-bank', nipCode: '090555', active: true, logoColor: '#2563EB' },
      { code: '058', name: 'Guaranty Trust Bank (GTBank)', slug: 'gtbank', nipCode: '000013', active: true, logoColor: '#F26522' },
      { code: '044', name: 'Access Bank PLC', slug: 'access-bank', nipCode: '000014', active: true, logoColor: '#00558F' },
      { code: '057', name: 'Zenith Bank PLC', slug: 'zenith-bank', nipCode: '000015', active: true, logoColor: '#B61F24' },
      { code: '011', name: 'First Bank of Nigeria', slug: 'first-bank', nipCode: '000016', active: true, logoColor: '#0B2265' },
      { code: '033', name: 'United Bank for Africa (UBA)', slug: 'uba', nipCode: '000004', active: true, logoColor: '#D32F2F' },
      { code: '035', name: 'Wema Bank / ALAT', slug: 'wema-bank', nipCode: '000017', active: true, logoColor: '#781F69' },
      { code: '090267', name: 'Kuda Microfinance Bank', slug: 'kuda-bank', nipCode: '090267', active: true, logoColor: '#40196D' },
      { code: '090405', name: 'Moniepoint MFB', slug: 'moniepoint', nipCode: '090405', active: true, logoColor: '#0368FF' },
      { code: '090325', name: 'OPay Digital Services (Paycom)', slug: 'opay', nipCode: '090325', active: true, logoColor: '#12C288' },
      { code: '090393', name: 'PalmPay Limited', slug: 'palmpay', nipCode: '090393', active: true, logoColor: '#6A1B9A' },
      { code: '070', name: 'Fidelity Bank PLC', slug: 'fidelity-bank', nipCode: '000007', active: true, logoColor: '#1E88E5' },
      { code: '214', name: 'First City Monument Bank (FCMB)', slug: 'fcmb', nipCode: '000003', active: true, logoColor: '#5C1D82' },
      { code: '221', name: 'Stanbic IBTC Bank', slug: 'stanbic-ibtc', nipCode: '000012', active: true, logoColor: '#0033A0' },
      { code: '232', name: 'Sterling Bank', slug: 'sterling-bank', nipCode: '000001', active: true, logoColor: '#D81B60' },
      { code: '076', name: 'Polaris Bank', slug: 'polaris-bank', nipCode: '000008', active: true, logoColor: '#43A047' },
      { code: '082', name: 'Keystone Bank', slug: 'keystone-bank', nipCode: '000002', active: true, logoColor: '#00796B' }
    ];

    // 3. Savings Products Catalog
    this.savingsProducts = [
      {
        id: 'SP-FLEX',
        name: 'ZUNO Flex Vault',
        type: 'FLEXIBLE',
        interestRateAnnualPcnt: 12.0,
        minimumAmount: 1000,
        minDurationDays: 1,
        description: 'Earn 12.0% p.a. calculated daily with instant free withdrawals anytime.',
        tag: 'High Liquidity'
      },
      {
        id: 'SP-TARGET',
        name: 'ZUNO Target Goal',
        type: 'TARGET',
        interestRateAnnualPcnt: 14.0,
        minimumAmount: 5000,
        minDurationDays: 30,
        description: 'Save automatically towards rent, gadgets, or travel. Earn 14.0% p.a.',
        tag: 'Goal Focused'
      },
      {
        id: 'SP-FIXED',
        name: 'ZUNO Prime Fixed Deposit',
        type: 'FIXED',
        interestRateAnnualPcnt: 16.5,
        minimumAmount: 50000,
        minDurationDays: 90,
        description: 'Lock funds for 90 to 365 days and lock in premium 16.5% p.a. guaranteed yield.',
        tag: 'Maximum Yield'
      }
    ];

    // 4. Seed Standard Demo User (John Doe - Blueprint sample)
    const demoUser: User = {
      id: 'USR-882109',
      phoneNumber: '+2348012345678',
      email: 'john.doe@zunobank.ng',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isPhoneVerified: true,
      isEmailVerified: true,
      status: 'ACTIVE',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-28T08:00:00.000Z',
    };

    // Password: "Password123!", PIN: "1234" (pre-hashed with salt)
    const demoSalt = 'zuno_secure_salt_8821';
    this.userCredentials.set(demoUser.id, {
      passwordHash: hashSecret('Password123!', demoSalt),
      pinHash: hashSecret('1234', demoSalt),
      salt: demoSalt,
    });

    this.users.set(demoUser.id, demoUser);

    this.profiles.set(demoUser.id, {
      userId: demoUser.id,
      dateOfBirth: '1995-04-12',
      residentialAddress: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      notificationPreferences: { sms: true, email: true, push: true, inApp: true },
      securitySettings: { biometricsEnabled: true, twoFactorRequiredForTransfers: false, loginNotifications: true }
    });

    this.kycProfiles.set(demoUser.id, {
      id: 'KYC-882109',
      userId: demoUser.id,
      tier: 'TIER_3',
      status: 'VERIFIED',
      bvnMasked: '222******89',
      ninMasked: '709******12',
      idType: 'NATIONAL_ID',
      idNumberMasked: 'NIN-889021-X',
      dailyLimit: 5000000,
      singleTransferLimit: 2000000,
      maxBalanceLimit: 50000000,
      verifiedAt: '2026-08-02T12:00:00.000Z',
      verificationNotes: 'Automated biometric and NIBSS BVN match verified.'
    });

    const demoAccount: BankAccount = {
      id: 'ACC-882109',
      userId: demoUser.id,
      accountNumber: '8012345678', // Dynamic regulated partner mapped
      accountName: 'JOHN DOE',
      bankName: 'ZUNO Partner Bank (Providus MFB Rails)',
      bankCode: '090555',
      tier: 'TIER_3',
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: '2026-08-01T10:05:00.000Z'
    };
    this.accounts.set(demoAccount.id, demoAccount);

    const demoWallet: Wallet = {
      id: 'WAL-882109',
      userId: demoUser.id,
      accountId: demoAccount.id,
      currency: 'NGN',
      availableBalance: 250000.00,
      pendingBalance: 0.00,
      ledgerBalance: 250000.00,
      dailySpentToday: 35000.00,
      lastSpentDate: '2026-08-28',
      updatedAt: new Date().toISOString()
    };
    this.wallets.set(demoUser.id, demoWallet);

    // 5. Seed Admin User
    const adminUser: User = {
      id: 'USR-ADMIN-01',
      phoneNumber: '+2348099990000',
      email: 'compliance.admin@zunobank.ng',
      firstName: 'Amina',
      lastName: 'Bello',
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      isPhoneVerified: true,
      isEmailVerified: true,
      status: 'ACTIVE',
      createdAt: '2026-07-01T09:00:00.000Z',
      updatedAt: '2026-08-28T08:00:00.000Z'
    };
    const adminSalt = 'zuno_admin_salt_9999';
    this.userCredentials.set(adminUser.id, {
      passwordHash: hashSecret('Password123!', adminSalt),
      pinHash: hashSecret('1234', adminSalt),
      salt: adminSalt
    });
    this.users.set(adminUser.id, adminUser);

    // 6. Seed Beneficiaries for Demo User
    this.beneficiaries.set(demoUser.id, [
      {
        id: 'BEN-001',
        userId: demoUser.id,
        accountNumber: '0123456789',
        accountName: 'CHIOMA ADEKUNLE',
        bankCode: '058',
        bankName: 'Guaranty Trust Bank (GTBank)',
        nickname: 'Chioma GTB',
        isFavorite: true,
        createdAt: '2026-08-10T14:20:00.000Z'
      },
      {
        id: 'BEN-002',
        userId: demoUser.id,
        accountNumber: '2049817721',
        accountName: 'IBRAHIM MUSA',
        bankCode: '057',
        bankName: 'Zenith Bank PLC',
        nickname: 'Ibrahim Zenith',
        isFavorite: false,
        createdAt: '2026-08-15T11:10:00.000Z'
      },
      {
        id: 'BEN-003',
        userId: demoUser.id,
        accountNumber: '0098765432',
        accountName: 'ZUNO LOGISTICS LTD',
        bankCode: '044',
        bankName: 'Access Bank PLC',
        nickname: 'Vendor Logistics',
        isFavorite: true,
        createdAt: '2026-08-20T09:40:00.000Z'
      }
    ]);

    // 7. Seed Demo Savings
    const targetSavings: SavingsAccount = {
      id: 'SAV-8821-01',
      userId: demoUser.id,
      productId: 'SP-TARGET',
      productType: 'TARGET',
      name: 'Buy a Car 🚗',
      targetAmount: 5000000,
      currentBalance: 750000,
      accruedInterest: 26250,
      interestRatePcnt: 14.0,
      frequency: 'MONTHLY',
      autoDebitAmount: 150000,
      startDate: '2026-06-01T00:00:00.000Z',
      maturityDate: '2027-06-01T00:00:00.000Z',
      status: 'ACTIVE',
      createdAt: '2026-06-01T00:00:00.000Z'
    };
    this.savingsAccounts.set(targetSavings.id, targetSavings);

    const fixedSavings: SavingsAccount = {
      id: 'SAV-8821-02',
      userId: demoUser.id,
      productId: 'SP-FIXED',
      productType: 'FIXED',
      name: 'Emergency 180-Day Reserve',
      currentBalance: 500000,
      accruedInterest: 40685,
      interestRatePcnt: 16.5,
      startDate: '2026-05-01T00:00:00.000Z',
      maturityDate: '2026-11-01T00:00:00.000Z',
      lockedUntil: '2026-11-01T00:00:00.000Z',
      status: 'ACTIVE',
      createdAt: '2026-05-01T00:00:00.000Z'
    };
    this.savingsAccounts.set(fixedSavings.id, fixedSavings);

    // 8. Seed Demo Cards
    this.virtualCards.set(demoUser.id, [
      {
        id: 'CRD-9021',
        userId: demoUser.id,
        cardholderName: 'JOHN DOE',
        panMasked: '5399 •••• •••• 4482',
        fullPan: '5399881029484482',
        expiryMonth: '08',
        expiryYear: '29',
        cvv: '821',
        brand: 'MASTERCARD',
        cardType: 'VIRTUAL',
        status: 'ACTIVE',
        balance: 75000,
        monthlyLimit: 500000,
        dailyLimit: 100000,
        createdAt: '2026-08-05T00:00:00.000Z'
      },
      {
        id: 'CRD-9022',
        userId: demoUser.id,
        cardholderName: 'JOHN DOE',
        panMasked: '4187 •••• •••• 9104',
        fullPan: '4187662019489104',
        expiryMonth: '11',
        expiryYear: '30',
        cvv: '390',
        brand: 'VISA',
        cardType: 'PHYSICAL',
        status: 'ACTIVE',
        balance: 150000,
        monthlyLimit: 1500000,
        dailyLimit: 300000,
        createdAt: '2026-08-08T00:00:00.000Z'
      }
    ]);

    // 9. Seed Realistic Recent Transactions
    const seedTxs: Transaction[] = [
      {
        id: 'TXN-990182',
        reference: 'ZUN-TRF-20260828-001',
        userId: demoUser.id,
        type: 'TRANSFER_EXTERNAL',
        amount: 10000,
        fee: 10.75,
        totalDeducted: 10010.75,
        currency: 'NGN',
        status: 'SUCCESSFUL',
        direction: 'DEBIT',
        sourceAccount: '8012345678',
        destinationAccount: '0123456789',
        counterpartyName: 'CHIOMA ADEKUNLE',
        counterpartyBank: 'Guaranty Trust Bank (GTBank)',
        narration: 'Project milestone invoice payment',
        sessionReference: '00001326082810452281902',
        category: 'TRANSFER',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 2 + 1500).toISOString()
      },
      {
        id: 'TXN-990181',
        reference: 'ZUN-VTU-20260827-042',
        userId: demoUser.id,
        type: 'AIRTIME',
        amount: 5000,
        fee: 0,
        totalDeducted: 5000,
        currency: 'NGN',
        status: 'SUCCESSFUL',
        direction: 'DEBIT',
        sourceAccount: '8012345678',
        destinationAccount: '+2348039988112',
        counterpartyName: 'MTN Nigeria',
        counterpartyBank: 'MTN VTU Gateway',
        narration: 'Airtime recharge - MTN 08039988112',
        category: 'BILL',
        metadata: { operator: 'MTN', phoneNumber: '+2348039988112', discountEarned: 100 },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000 + 1200).toISOString()
      },
      {
        id: 'TXN-990180',
        reference: 'ZUN-ELEC-20260826-089',
        userId: demoUser.id,
        type: 'ELECTRICITY',
        amount: 15000,
        fee: 100,
        totalDeducted: 15100,
        currency: 'NGN',
        status: 'SUCCESSFUL',
        direction: 'DEBIT',
        sourceAccount: '8012345678',
        destinationAccount: '04192837461',
        counterpartyName: 'Ikeja Electric (IKEDC)',
        counterpartyBank: 'IKEDC Disco Switch',
        narration: 'Prepaid Electricity Token Purchase',
        category: 'BILL',
        metadata: {
          meterNumber: '04192837461',
          disco: 'IKEDC',
          customerName: 'JOHN DOE',
          token: '4829-1094-8821-3940-1128',
          unitsKw: '218.4 kWh'
        },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 2 + 2000).toISOString()
      },
      {
        id: 'TXN-990179',
        reference: 'ZUN-DEP-20260825-104',
        userId: demoUser.id,
        type: 'DEPOSIT_MOCK',
        amount: 300000,
        fee: 0,
        totalDeducted: 300000,
        currency: 'NGN',
        status: 'SUCCESSFUL',
        direction: 'CREDIT',
        sourceAccount: '057-ZENITH-4401',
        destinationAccount: '8012345678',
        counterpartyName: 'TECHVENTURES CORP',
        counterpartyBank: 'Zenith Bank PLC',
        narration: 'Salary / Consulting Retainer August',
        sessionReference: '00001526082512003847291',
        category: 'TOPUP',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 3 + 800).toISOString()
      }
    ];

    seedTxs.forEach(tx => this.transactions.set(tx.id, tx));

    // 10. Seed Notifications
    this.notifications = [
      {
        id: 'NOTIF-01',
        userId: demoUser.id,
        title: 'Transfer Successful',
        message: 'You successfully sent ₦10,000 to CHIOMA ADEKUNLE (GTBank). Ref: ZUN-TRF-20260828-001',
        channel: 'IN_APP',
        type: 'TRANSACTION',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'NOTIF-02',
        userId: demoUser.id,
        title: 'Tier 3 Upgrade Approved',
        message: 'Your identity document and BVN matching have been approved. Daily limit increased to ₦5,000,000.',
        channel: 'IN_APP',
        type: 'KYC',
        read: true,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'NOTIF-03',
        userId: demoUser.id,
        title: 'Interest Credited',
        message: 'Your ZUNO Target Goal earned ₦3,850 in interest for this cycle.',
        channel: 'IN_APP',
        type: 'TRANSACTION',
        read: true,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ];

    // 11. Seed Support Tickets
    const ticket1: SupportTicket = {
      id: 'TCK-1049',
      ticketNumber: 'ZN-SUP-1049',
      userId: demoUser.id,
      userName: 'John Doe',
      userPhone: '+2348012345678',
      subject: 'Inquiry regarding card monthly limits',
      category: 'ACCOUNT_ACCESS',
      priority: 'LOW',
      status: 'RESOLVED',
      description: 'Can I increase my virtual card monthly spend limit to ₦1,000,000 for foreign travel?',
      resolutionNotes: 'User guided to tier 3 limit configurations in card settings.',
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-21T09:00:00.000Z'
    };
    this.supportTickets.set(ticket1.id, ticket1);

    // 12. Seed Audit Logs
    this.auditLogs.push({
      id: 'AUD-001',
      actorId: 'SYSTEM',
      actorName: 'ZUNO Core Ledger',
      actorRole: 'SYSTEM_ENGINE',
      action: 'GENERAL_LEDGER_RECONCILE',
      resource: 'LEDGER_ACCOUNTS',
      details: 'Automated 24hr ledger reconciliation passed. Zero balance discrepancies across 8 chart accounts.',
      ipAddress: '127.0.0.1',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    });
  }
}

export const db = new ZunoDatabase();
