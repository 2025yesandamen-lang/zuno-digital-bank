import { db } from '../db/database';
import { ledgerService } from './ledgerService';
import { SystemMetrics, User, SupportTicket, FraudEvent, KYCStatus, KYCTier } from '../../src/types/banking';

export class AdminService {
  public getSystemMetrics(): SystemMetrics {
    const users = Array.from(db.users.values());
    const txs = Array.from(db.transactions.values());

    const successfulTxs = txs.filter(t => t.status === 'SUCCESSFUL');
    const failedTxs = txs.filter(t => t.status === 'FAILED');
    const pendingTxs = txs.filter(t => t.status === 'PENDING' || t.status === 'INITIATED' || t.status === 'PROCESSING');

    const totalVolume = successfulTxs.reduce((sum, t) => sum + t.amount, 0);

    const ledgerCheck = ledgerService.verifyLedgerIntegrity();

    const pendingFraudAlerts = db.fraudEvents.filter(f => f.status === 'PENDING_REVIEW').length;

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      totalVolume,
      successfulTransactions: successfulTxs.length,
      failedTransactions: failedTxs.length,
      pendingTransactions: pendingTxs.length,
      totalCustomerLiabilities: ledgerCheck.totalLiabilities,
      totalSettlementAssets: ledgerCheck.totalAssets,
      totalFeeRevenue: ledgerCheck.totalRevenue,
      isLedgerBalanced: ledgerCheck.isBalanced,
      fraudAlertsCount: pendingFraudAlerts
    };
  }

  public getAllUsers(): Array<{ user: User; wallet?: any; kyc?: any; account?: any }> {
    return Array.from(db.users.values()).map(user => {
      const wallet = db.wallets.get(user.id);
      const kyc = db.kycProfiles.get(user.id);
      const account = Array.from(db.accounts.values()).find(a => a.userId === user.id);
      return { user, wallet, kyc, account };
    });
  }

  public updateUserStatus(userId: string, status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED', reason: string, adminId: string): User {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found.');

    user.status = status;
    user.updatedAt = new Date().toISOString();
    db.users.set(userId, user);

    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actorId: adminId,
      actorName: 'Admin User',
      actorRole: 'COMPLIANCE_ADMIN',
      action: `USER_STATUS_${status}`,
      resource: `USER:${userId}`,
      details: `Account status updated to ${status}. Reason: ${reason}`,
      ipAddress: '10.0.4.12',
      timestamp: new Date().toISOString()
    });

    return user;
  }

  public updateKYCStatus(userId: string, tier: KYCTier, status: KYCStatus, notes: string, adminId: string) {
    const kyc = db.kycProfiles.get(userId);
    if (!kyc) throw new Error('KYC record not found.');

    kyc.tier = tier;
    kyc.status = status;
    kyc.verificationNotes = notes;
    if (status === 'VERIFIED') {
      kyc.verifiedAt = new Date().toISOString();
      if (tier === 'TIER_3') {
        kyc.dailyLimit = 5000000;
        kyc.singleTransferLimit = 2000000;
        kyc.maxBalanceLimit = 50000000;
      } else if (tier === 'TIER_2') {
        kyc.dailyLimit = 200000;
        kyc.singleTransferLimit = 100000;
        kyc.maxBalanceLimit = 1000000;
      }
    }
    db.kycProfiles.set(userId, kyc);

    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actorId: adminId,
      actorName: 'Compliance Officer',
      actorRole: 'COMPLIANCE_ADMIN',
      action: `KYC_TIER_OVERRIDE`,
      resource: `KYC:${userId}`,
      details: `KYC tier updated to ${tier} (Status: ${status}). Notes: ${notes}`,
      ipAddress: '10.0.4.12',
      timestamp: new Date().toISOString()
    });

    return kyc;
  }

  public getAllTransactions() {
    return Array.from(db.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllLedgerEntries() {
    return db.ledgerEntries.slice().reverse();
  }

  public getAllLedgerAccounts() {
    return Array.from(db.ledgerAccounts.values());
  }

  public getFraudEvents(): FraudEvent[] {
    return db.fraudEvents;
  }

  public resolveFraudEvent(eventId: string, resolution: 'APPROVED' | 'BLOCKED' | 'RESOLVED', adminId: string) {
    const event = db.fraudEvents.find(f => f.id === eventId);
    if (!event) throw new Error('Fraud alert event not found.');

    event.status = resolution;
    event.resolvedBy = adminId;

    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actorId: adminId,
      actorName: 'Fraud Analyst',
      actorRole: 'OPERATIONS_ADMIN',
      action: `FRAUD_ALERT_${resolution}`,
      resource: `FRAUD_EVENT:${eventId}`,
      details: `Fraud flag risk score ${event.riskScore} resolved as ${resolution}.`,
      ipAddress: '10.0.4.12',
      timestamp: new Date().toISOString()
    });

    return event;
  }

  public getSupportTickets(): SupportTicket[] {
    return Array.from(db.supportTickets.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public updateTicketStatus(ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', resolutionNotes?: string) {
    const ticket = db.supportTickets.get(ticketId);
    if (!ticket) throw new Error('Support ticket not found.');

    ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    ticket.updatedAt = new Date().toISOString();
    db.supportTickets.set(ticketId, ticket);
    return ticket;
  }

  public createSupportTicket(params: {
    userId: string;
    subject: string;
    category: any;
    priority: any;
    description: string;
    transactionReference?: string;
  }): SupportTicket {
    const user = db.users.get(params.userId);
    const id = `TCK-${Date.now()}`;
    const ticket: SupportTicket = {
      id,
      ticketNumber: `ZN-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: params.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'ZUNO Customer',
      userPhone: user ? user.phoneNumber : '',
      subject: params.subject,
      category: params.category || 'TRANSFER_ISSUE',
      priority: params.priority || 'MEDIUM',
      status: 'OPEN',
      description: params.description,
      transactionReference: params.transactionReference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.supportTickets.set(id, ticket);
    return ticket;
  }

  public getAuditLogs() {
    return db.auditLogs.slice().reverse();
  }

  public updateProviderSimulation(settings: Partial<typeof db.providerSettings>) {
    Object.assign(db.providerSettings, settings);
    return db.providerSettings;
  }
}

export const adminService = new AdminService();
