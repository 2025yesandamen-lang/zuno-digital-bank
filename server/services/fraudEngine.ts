import { db } from '../db/database';
import { FraudEvent, RiskLevel, RiskAction } from '../../src/types/banking';

export interface FraudEvaluationInput {
  userId: string;
  amount: number;
  type: string;
  destinationAccount?: string;
  clientIp?: string;
  deviceFingerprint?: string;
  isNewDevice?: boolean;
}

export class FraudEngine {
  public evaluateTransactionRisk(input: FraudEvaluationInput): {
    score: number;
    riskLevel: RiskLevel;
    action: RiskAction;
    rulesTriggered: string[];
    fraudEvent?: FraudEvent;
  } {
    const { userId, amount, type, destinationAccount, clientIp, deviceFingerprint, isNewDevice } = input;
    const rulesTriggered: string[] = [];
    let score = 5; // Base low risk baseline score

    const user = db.users.get(userId);
    const kyc = db.kycProfiles.get(userId);
    const wallet = db.wallets.get(userId);

    // 1. Check Amount against KYC Tier Limits
    if (kyc) {
      if (amount > kyc.singleTransferLimit) {
        rulesTriggered.push(`EXCEEDS_SINGLE_LIMIT: Amount (₦${amount}) exceeds Tier ${kyc.tier} single limit (₦${kyc.singleTransferLimit})`);
        score += 55;
      }
      if ((wallet?.dailySpentToday || 0) + amount > kyc.dailyLimit) {
        rulesTriggered.push(`EXCEEDS_DAILY_LIMIT: Cumulative spend today would exceed Tier limit (₦${kyc.dailyLimit})`);
        score += 50;
      }
    }

    // 2. High Spike Threshold Rule (> ₦2,000,000 on general consumer account)
    if (amount >= 2000000) {
      rulesTriggered.push('HIGH_VALUE_THRESHOLD: Single transaction amount equal or exceeding ₦2,000,000');
      score += 25;
    }

    // 3. Velocity / Rapid Burst Check (more than 4 transactions in last 5 minutes)
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const recentTxCount = Array.from(db.transactions.values()).filter(
      tx => tx.userId === userId && new Date(tx.createdAt).getTime() > fiveMinsAgo
    ).length;

    if (recentTxCount >= 4) {
      rulesTriggered.push(`HIGH_VELOCITY: ${recentTxCount} transactions initiated in under 5 minutes`);
      score += 35;
    }

    // 4. New Device Unrecognized Pattern
    if (isNewDevice) {
      rulesTriggered.push('UNRECOGNIZED_DEVICE: Transaction attempted from previously unregistered device fingerprint');
      score += 20;
    }

    // 5. Blacklisted / Suspicious Counterparty check
    if (destinationAccount && (destinationAccount.startsWith('999') || destinationAccount === '0000000000')) {
      rulesTriggered.push('FLAGGED_BENEFICIARY: Destination account matches regulatory watchlist blacklist pattern');
      score += 80;
    }

    // Determine Risk Level & Action
    let riskLevel: RiskLevel = 'LOW';
    let action: RiskAction = 'ALLOW';

    if (score >= 80) {
      riskLevel = 'EXTREME';
      action = 'MANUAL_REVIEW';
    } else if (score >= 50) {
      riskLevel = 'HIGH';
      action = 'BLOCK';
    } else if (score >= 25) {
      riskLevel = 'MEDIUM';
      action = 'STEP_UP_AUTHENTICATION';
    } else {
      riskLevel = 'LOW';
      action = 'ALLOW';
    }

    let fraudEvent: FraudEvent | undefined;

    // Log suspicious activity if MEDIUM or above
    if (score >= 25) {
      fraudEvent = {
        id: `FRD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId,
        riskScore: score,
        riskLevel,
        actionTaken: action,
        rulesTriggered,
        clientIp: clientIp || '127.0.0.1',
        deviceFingerprint: deviceFingerprint || 'WEB-CLIENT-STD',
        status: action === 'MANUAL_REVIEW' ? 'PENDING_REVIEW' : 'BLOCKED',
        createdAt: new Date().toISOString(),
      };
      db.fraudEvents.unshift(fraudEvent);
    }

    return {
      score,
      riskLevel,
      action,
      rulesTriggered,
      fraudEvent
    };
  }
}

export const fraudEngine = new FraudEngine();
