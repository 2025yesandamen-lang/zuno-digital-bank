import { db } from '../db/database';
import { KYCProfile, KYCTier, KYCStatus } from '../../src/types/banking';

export interface KYCProviderAdapter {
  verifyBVN(bvn: string): Promise<{ success: boolean; valid: boolean; matchName?: string; message: string }>;
  verifyNIN(nin: string): Promise<{ success: boolean; valid: boolean; matchName?: string; message: string }>;
  verifyGovtID(idType: string, idNumber: string): Promise<{ success: boolean; valid: boolean; message: string }>;
}

export class MockKYCProvider implements KYCProviderAdapter {
  async verifyBVN(bvn: string): Promise<{ success: boolean; valid: boolean; matchName?: string; message: string }> {
    if (bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
      return { success: false, valid: false, message: 'BVN must be an 11-digit numeric identifier.' };
    }
    // Sandbox rule: BVN ending in 000 triggers failed match
    if (bvn.endsWith('000')) {
      return { success: false, valid: false, message: 'BVN validation failed. Name mismatch on NIBSS regulatory registry.' };
    }
    return {
      success: true,
      valid: true,
      matchName: 'VERIFIED REGULATORY RECORD',
      message: 'BVN successfully validated with NIBSS Central Identity Registry.'
    };
  }

  async verifyNIN(nin: string): Promise<{ success: boolean; valid: boolean; matchName?: string; message: string }> {
    if (nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      return { success: false, valid: false, message: 'NIN must be an 11-digit numeric identifier.' };
    }
    return {
      success: true,
      valid: true,
      matchName: 'NIMC NATIONAL RECORD',
      message: 'NIN biometric record matched with NIMC identity database.'
    };
  }

  async verifyGovtID(idType: string, idNumber: string): Promise<{ success: boolean; valid: boolean; message: string }> {
    if (!idNumber || idNumber.trim().length < 5) {
      return { success: false, valid: false, message: 'Invalid ID document serial number.' };
    }
    return {
      success: true,
      valid: true,
      message: `${idType} document format and digital security watermark verified.`
    };
  }
}

export class KYCService {
  private provider: KYCProviderAdapter = new MockKYCProvider();

  public getKYCProfile(userId: string): KYCProfile {
    let profile = db.kycProfiles.get(userId);
    if (!profile) {
      profile = {
        id: `KYC-${userId.replace('USR-', '')}`,
        userId,
        tier: 'TIER_1',
        status: 'VERIFIED',
        dailyLimit: 50000,
        singleTransferLimit: 20000,
        maxBalanceLimit: 300000,
        verifiedAt: new Date().toISOString(),
        verificationNotes: 'Base Tier 1 Onboarding'
      };
      db.kycProfiles.set(userId, profile);
    }
    return profile;
  }

  public async submitTier2Verification(userId: string, bvn: string, nin?: string): Promise<KYCProfile> {
    const profile = this.getKYCProfile(userId);
    const bvnResult = await this.provider.verifyBVN(bvn);

    if (!bvnResult.valid) {
      profile.status = 'FAILED';
      profile.verificationNotes = bvnResult.message;
      db.kycProfiles.set(userId, profile);
      throw new Error(bvnResult.message);
    }

    if (nin) {
      const ninResult = await this.provider.verifyNIN(nin);
      if (!ninResult.valid) {
        throw new Error(ninResult.message);
      }
      profile.ninMasked = nin.slice(0, 3) + '******' + nin.slice(-2);
    }

    profile.tier = 'TIER_2';
    profile.status = 'VERIFIED';
    profile.bvnMasked = bvn.slice(0, 3) + '******' + bvn.slice(-2);
    profile.dailyLimit = 200000;
    profile.singleTransferLimit = 100000;
    profile.maxBalanceLimit = 1000000;
    profile.verifiedAt = new Date().toISOString();
    profile.verificationNotes = 'Tier 2 BVN identity verification approved.';

    db.kycProfiles.set(userId, profile);

    // Notify user
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Tier 2 KYC Upgrade Completed',
      message: 'Your BVN has been verified! Your daily transaction limit is now ₦200,000.',
      channel: 'IN_APP',
      type: 'KYC',
      read: false,
      createdAt: new Date().toISOString()
    });

    return profile;
  }

  public async submitTier3Verification(params: {
    userId: string;
    idType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
    idNumber: string;
    addressProofUrl?: string;
  }): Promise<KYCProfile> {
    const { userId, idType, idNumber } = params;
    const profile = this.getKYCProfile(userId);

    const docResult = await this.provider.verifyGovtID(idType, idNumber);
    if (!docResult.valid) {
      throw new Error(docResult.message);
    }

    profile.tier = 'TIER_3';
    profile.status = 'VERIFIED';
    profile.idType = idType;
    profile.idNumberMasked = `${idType.slice(0, 3)}-${idNumber.slice(0, 3)}***${idNumber.slice(-2)}`;
    profile.dailyLimit = 5000000;
    profile.singleTransferLimit = 2000000;
    profile.maxBalanceLimit = 50000000;
    profile.verifiedAt = new Date().toISOString();
    profile.verificationNotes = `Tier 3 full identity upgrade verified via ${idType}.`;

    db.kycProfiles.set(userId, profile);

    // Notify user
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId,
      title: 'Tier 3 Unlimited Status Unlocked 🛡️',
      message: 'Your Tier 3 verification is complete! Your daily transaction limit is now ₦5,000,000.',
      channel: 'IN_APP',
      type: 'KYC',
      read: false,
      createdAt: new Date().toISOString()
    });

    return profile;
  }
}

export const kycService = new KYCService();
