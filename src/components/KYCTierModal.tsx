import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  Lock, 
  Sparkles,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { KYCProfile, User } from '../types/banking';

interface KYCTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  kyc: KYCProfile | null;
  onKYCUpdated: () => void;
}

export const KYCTierModal: React.FC<KYCTierModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  kyc,
  onKYCUpdated
}) => {
  const currentTier = kyc?.tier || 'TIER_1';
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'UPGRADE_TIER_2' | 'UPGRADE_TIER_3'>('OVERVIEW');

  // Tier 2 Form
  const [bvn, setBvn] = useState(kyc?.bvn || '');
  const [nin, setNin] = useState(kyc?.nin || '');

  // Tier 3 Form
  const [idType, setIdType] = useState<'NIN_SLIP' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | 'INTERNATIONAL_PASSPORT'>('INTERNATIONAL_PASSPORT');
  const [idNumber, setIdNumber] = useState(kyc?.idNumber || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleUpgradeTier2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.upgradeKYCTier2({
        userId: currentUser.id,
        bvn,
        nin
      });
      setSuccessMessage('Tier 2 Verification successful! Daily limit raised to ₦200,000.00.');
      setActiveTab('OVERVIEW');
      onKYCUpdated();
      try { confetti({ particleCount: 60 }); } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'BVN verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgradeTier3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.upgradeKYCTier3({
        userId: currentUser.id,
        idType,
        idNumber
      });
      setSuccessMessage('Tier 3 Verification approved! You now have full enterprise banking limits (₦5,000,000/day).');
      setActiveTab('OVERVIEW');
      onKYCUpdated();
      try { confetti({ particleCount: 80 }); } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'ID verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">KYC Verification & Tier Limits</h2>
              <p className="text-xs text-slate-500">CBN/Regulatory Compliance & Identity Protection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              
              {/* Current Tier Status Card */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Your Active KYC Level</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{currentTier}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Daily Limit: <span className="font-mono text-slate-900 font-bold">₦{(kyc?.dailyLimit ?? 50000).toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-200">
                  {currentTier.replace('TIER_', 'T')}
                </div>
              </div>

              {/* Tier Breakdown Comparison */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Tiers & Limits</div>

                {/* Tier 1 */}
                <div className={`p-4 rounded-xl border ${currentTier === 'TIER_1' ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        Tier 1 (Basic Starter)
                        {currentTier === 'TIER_1' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Phone Number + Basic KYC</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-slate-500 text-[10px]">Daily Limit</div>
                      <div className="font-mono font-bold text-slate-900">₦50,000.00</div>
                    </div>
                  </div>
                </div>

                {/* Tier 2 */}
                <div className={`p-4 rounded-xl border ${currentTier === 'TIER_2' ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        Tier 2 (Standard Verified)
                        {currentTier === 'TIER_2' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">BVN + NIN Identity Validation</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-slate-500 text-[10px]">Daily Limit</div>
                      <div className="font-mono font-bold text-blue-600">₦200,000.00</div>
                    </div>
                  </div>

                  {currentTier === 'TIER_1' && (
                    <button
                      onClick={() => setActiveTab('UPGRADE_TIER_2')}
                      className="mt-3 w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Upgrade to Tier 2 with BVN
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tier 3 */}
                <div className={`p-4 rounded-xl border ${currentTier === 'TIER_3' ? 'bg-blue-50/40 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        Tier 3 (Premium / Unlimited)
                        {currentTier === 'TIER_3' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Government ID + Address Proof</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-slate-500 text-[10px]">Daily Limit</div>
                      <div className="font-mono font-bold text-slate-900">₦5,000,000.00</div>
                    </div>
                  </div>

                  {currentTier !== 'TIER_3' && (
                    <button
                      onClick={() => setActiveTab('UPGRADE_TIER_3')}
                      className="mt-3 w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Upgrade to Tier 3 with Govt ID
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* UPGRADE TIER 2 FORM */}
          {activeTab === 'UPGRADE_TIER_2' && (
            <form onSubmit={handleUpgradeTier2} className="space-y-4">
              <div className="text-xs text-slate-500">
                Enter your 11-digit Bank Verification Number (BVN) to raise your limits instantly.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">11-Digit BVN</label>
                <input
                  type="text"
                  maxLength={11}
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                  placeholder="22234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">11-Digit NIN (Optional)</label>
                <input
                  type="text"
                  maxLength={11}
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                  placeholder="10098765432"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('OVERVIEW')}
                  className="w-1/3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={bvn.length !== 11 || isSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : 'Verify BVN with NIBSS'}
                </button>
              </div>
            </form>
          )}

          {/* UPGRADE TIER 3 FORM */}
          {activeTab === 'UPGRADE_TIER_3' && (
            <form onSubmit={handleUpgradeTier3} className="space-y-4">
              <div className="text-xs text-slate-500">
                Provide an official government ID number to activate Tier 3 unrestricted banking limits.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">ID Document Type</label>
                <select
                  value={idType}
                  onChange={(e: any) => setIdType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="INTERNATIONAL_PASSPORT">International Passport (Standard)</option>
                  <option value="DRIVERS_LICENSE">FRSC Driver's License</option>
                  <option value="NIN_SLIP">Digital NIN Slip / Card</option>
                  <option value="VOTERS_CARD">INEC Permanent Voter's Card (PVC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Number</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. A01928472"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('OVERVIEW')}
                  className="w-1/3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!idNumber || isSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : 'Submit & Complete Tier 3'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
