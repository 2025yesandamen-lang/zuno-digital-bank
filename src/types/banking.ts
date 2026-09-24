export type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
export type KYCTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';
export type TransactionStatus = 'INITIATED' | 'PROCESSING' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED' | 'REQUIRES_REVIEW';
export type TransactionType = 
  | 'TRANSFER_INTERNAL' 
  | 'TRANSFER_EXTERNAL' 
  | 'AIRTIME' 
  | 'DATA' 
  | 'ELECTRICITY' 
  | 'TV' 
  | 'SAVINGS_DEPOSIT' 
  | 'SAVINGS_WITHDRAW' 
  | 'CARD_FUND'
  | 'DEPOSIT_MOCK';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type RiskAction = 'ALLOW' | 'STEP_UP_AUTHENTICATION' | 'BLOCK' | 'MANUAL_REVIEW';
export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'COMPLIANCE_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_AGENT';

export interface User {
  id: string;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'MERCHANT' | 'BUSINESS' | 'ADMIN';
  adminRole?: AdminRole;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  dateOfBirth?: string;
  residentialAddress?: string;
  city?: string;
  state?: string;
  country: string;
  avatarUrl?: string;
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  securitySettings: {
    biometricsEnabled: boolean;
    twoFactorRequiredForTransfers: boolean;
    loginNotifications: boolean;
  };
}

export interface KYCProfile {
  id: string;
  userId: string;
  tier: KYCTier;
  status: KYCStatus;
  bvnMasked?: string;
  ninMasked?: string;
  idType?: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  idNumberMasked?: string;
  verificationNotes?: string;
  dailyLimit: number;
  singleTransferLimit: number;
  maxBalanceLimit: number;
  verifiedAt?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  tier: KYCTier;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  accountId: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  ledgerBalance: number;
  dailySpentToday: number;
  lastSpentDate: string;
  updatedAt: string;
}

export interface LedgerAccount {
  id: string;
  code: string; // e.g. 1001-CUST-WALLET, 2001-NIBSS-SETTLEMENT, 4001-FEE-INCOME
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
  currency: string;
}

export interface LedgerEntry {
  id: string;
  ledgerTransactionId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  type: LedgerEntryType;
  amount: number;
  runningBalanceAfter: number;
  currency: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  reference: string;
  description: string;
  totalAmount: number;
  currency: string;
  entries: LedgerEntry[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  idempotencyKey?: string;
  userId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  totalDeducted: number;
  currency: string;
  status: TransactionStatus;
  direction: 'DEBIT' | 'CREDIT';
  sourceAccount?: string;
  destinationAccount?: string;
  counterpartyName?: string;
  counterpartyBank?: string;
  narration: string;
  sessionReference?: string;
  category: 'TRANSFER' | 'BILL' | 'SAVINGS' | 'CARD' | 'TOPUP';
  metadata?: Record<string, any>;
  ledgerTransactionId?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BankInstitution {
  code: string;
  name: string;
  slug: string;
  nipCode: string;
  active: boolean;
  logoColor: string;
}

export interface Beneficiary {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  nickname?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface SavingsProduct {
  id: string;
  name: string;
  type: 'FLEXIBLE' | 'TARGET' | 'FIXED';
  interestRateAnnualPcnt: number;
  minimumAmount: number;
  minDurationDays: number;
  description: string;
  tag: string;
}

export interface SavingsAccount {
  id: string;
  userId: string;
  productId: string;
  productType: 'FLEXIBLE' | 'TARGET' | 'FIXED';
  name: string;
  targetAmount?: number;
  currentBalance: number;
  accruedInterest: number;
  interestRatePcnt: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  autoDebitAmount?: number;
  startDate: string;
  maturityDate?: string;
  lockedUntil?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED_EARLY';
  createdAt: string;
}

export interface VirtualCard {
  id: string;
  userId: string;
  cardholderName: string;
  panMasked: string;
  fullPan: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: 'VISA' | 'MASTERCARD';
  cardType: 'VIRTUAL' | 'PHYSICAL';
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  balance: number;
  monthlyLimit: number;
  dailyLimit: number;
  createdAt: string;
}

export interface FraudEvent {
  id: string;
  transactionId?: string;
  userId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  actionTaken: RiskAction;
  rulesTriggered: string[];
  clientIp?: string;
  deviceFingerprint?: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'BLOCKED' | 'RESOLVED';
  resolvedBy?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: 'IN_APP' | 'SMS' | 'EMAIL' | 'PUSH';
  type: 'TRANSACTION' | 'SECURITY' | 'KYC' | 'SYSTEM';
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  subject: string;
  category: 'TRANSFER_ISSUE' | 'FAILED_TRANSACTION' | 'KYC_DISPUTE' | 'ACCOUNT_ACCESS' | 'BILL_ISSUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  description: string;
  transactionReference?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export type SystemAuditLog = AuditLog;

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalCustomerLiabilities: number;
  totalSettlementAssets: number;
  totalFeeRevenue: number;
  isLedgerBalanced: boolean;
  fraudAlertsCount: number;
}
