import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  Target, 
  Lock, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  ShieldCheck,
  Calendar,
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { SavingsAccount, SavingsProduct, Wallet, User } from '../types/banking';

interface SavingsHubProps {
  currentUser: User;
  wallet: Wallet | null;
  onRefreshData: () => void;
}

export const SavingsHub: React.FC<SavingsHubProps> = ({ currentUser, wallet, onRefreshData }) => {
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Plan Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
  const [planName, setPlanName] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('50000');
  const [targetAmount, setTargetAmount] = useState('500000');
  const [durationDays, setDurationDays] = useState('180');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Withdraw Modal State
  const [withdrawPlan, setWithdrawPlan] = useState<SavingsAccount | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');

  useEffect(() => {
    loadSavingsData();
  }, [currentUser.id]);

  const loadSavingsData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, accRes] = await Promise.all([
        api.getSavingsProducts(),
        api.getUserSavings(currentUser.id)
      ]);
      setProducts(prodRes.products);
      setSavingsAccounts(accRes.accounts);
      if (prodRes.products.length > 0 && !selectedProduct) {
        setSelectedProduct(prodRes.products[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSaved = savingsAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalInterest = savingsAccounts.reduce((sum, acc) => sum + acc.accruedInterest, 0);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.createSavingsPlan({
        userId: currentUser.id,
        productId: selectedProduct.id,
        name: planName || `${selectedProduct.name} Plan`,
        initialDeposit: parseFloat(initialDeposit),
        targetAmount: selectedProduct.type === 'TARGET' ? parseFloat(targetAmount) : undefined,
        durationDays: selectedProduct.type === 'FIXED' ? parseInt(durationDays) : undefined,
        pin
      });

      setIsCreateModalOpen(false);
      setPlanName('');
      setPin('');
      loadSavingsData();
      onRefreshData();

      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create savings plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawPlan) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.withdrawSavings({
        userId: currentUser.id,
        savingsId: withdrawPlan.id,
        amount: parseFloat(withdrawAmount),
        pin: withdrawPin
      });

      setWithdrawPlan(null);
      setWithdrawAmount('');
      setWithdrawPin('');
      loadSavingsData();
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Withdrawal failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">ZUNO High-Yield Wealth Vaults</h2>
          </div>
          <p className="text-xs text-slate-500">Earn up to 16.5% p.a. calculated daily and compound your wealth with zero barriers.</p>
        </div>

        <button
          id="btn-create-savings-plan"
          onClick={() => { setIsCreateModalOpen(true); setErrorMessage(''); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Savings Goal
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Savings Portfolio</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₦{(totalSaved ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Across {savingsAccounts.length} active plans</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Interest Earned</div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            +₦{(totalInterest ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Credited automatically</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Peak Annual Yield</div>
          <div className="text-2xl font-black text-blue-600 font-mono">16.5% p.a.</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">NDIC Insured Partner Trust</div>
        </div>
      </div>

      {/* Products Catalog Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Available Savings Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(prod => (
            <div 
              key={prod.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    {prod.tag}
                  </span>
                  <span className="font-mono text-sm font-black text-blue-600">{prod.interestRateAnnualPcnt}% p.a.</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{prod.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{prod.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Min ₦{(prod.minimumAmount ?? 0).toLocaleString()}</span>
                <button
                  onClick={() => { setSelectedProduct(prod); setIsCreateModalOpen(true); }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  Start Saving
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active User Savings Plans */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Your Active Savings Plans</h3>
        {savingsAccounts.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-400 text-xs shadow-sm">
            You don't have any active savings plans yet. Create one to begin earning high interest.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsAccounts.map(acc => {
              const progressPcnt = acc.targetAmount ? Math.min(100, Math.round(((acc.currentBalance ?? 0) / acc.targetAmount) * 100)) : 100;
              const isLocked = acc.productType === 'FIXED' && acc.lockedUntil && new Date(acc.lockedUntil).getTime() > Date.now();

              return (
                <div key={acc.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        {acc.productType === 'TARGET' ? <Target className="w-5 h-5" /> : acc.productType === 'FIXED' ? <Lock className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{acc.interestRatePcnt}% p.a.</span>
                          {acc.maturityDate && (
                            <>
                              <span>•</span>
                              <span>Matures {new Date(acc.maturityDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                      {acc.productType}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-slate-500">Current Balance</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        ₦{(acc.currentBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {acc.targetAmount && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPcnt}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{progressPcnt}% of Target</span>
                          <span>Target: ₦{(acc.targetAmount ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-emerald-600 font-semibold">
                      Accrued Interest: +₦{(acc.accruedInterest ?? 0).toLocaleString()}
                    </div>

                    <button
                      onClick={() => { setWithdrawPlan(acc); setWithdrawAmount((acc.currentBalance ?? 0).toString()); }}
                      disabled={isLocked}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      {isLocked ? 'Locked' : 'Withdraw'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SAVINGS MODAL */}
      {isCreateModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create {selectedProduct.name}</h3>
                <p className="text-xs text-blue-600 font-semibold">{selectedProduct.interestRateAnnualPcnt}% Annual Yield</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan / Goal Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder={selectedProduct.type === 'TARGET' ? "e.g. Master's Degree Tuition 🎓" : "e.g. Wealth Growth Vault"}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Initial Deposit (₦)</label>
                  <span className="text-[10px] text-slate-500">Wallet: ₦{(wallet?.availableBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
                <input
                  type="number"
                  min={selectedProduct.minimumAmount}
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {selectedProduct.type === 'TARGET' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Goal Amount (₦)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              )}

              {selectedProduct.type === 'FIXED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lock Duration</label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="90">90 Days (Quarterly Lock)</option>
                    <option value="180">180 Days (Half-Year Lock)</option>
                    <option value="365">365 Days (Full-Year Maximum Yield)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">4-Digit Transaction PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-center text-slate-900 tracking-widest font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !pin}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Activate Plan & Lock In Yield
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAW SAVINGS MODAL */}
      {withdrawPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Withdraw from {withdrawPlan.name}</h3>
                <p className="text-xs text-slate-500">Funds will be instantly returned to your main wallet</p>
              </div>
              <button onClick={() => setWithdrawPlan(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Withdraw Amount (₦)</label>
                <input
                  type="number"
                  max={withdrawPlan.currentBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">4-Digit Transaction PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={withdrawPin}
                  onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-center text-slate-900 tracking-widest font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !withdrawPin}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal to Wallet'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
