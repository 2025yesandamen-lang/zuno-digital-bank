import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Copy, 
  Check, 
  RotateCcw,
  Sparkles,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { User, Wallet, BankAccount, Transaction } from '../types/banking';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  account: BankAccount | null;
  onDepositSuccess: (tx: Transaction) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  account,
  onDepositSuccess
}) => {
  const [depositMethod, setDepositMethod] = useState<'BANK_TRANSFER' | 'CARD_SIMULATION'>('BANK_TRANSFER');
  const [amount, setAmount] = useState('100000');
  const [sourceName, setSourceName] = useState('Direct Bank Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const accountNumber = account?.accountNumber || '8012345678';
  const bankName = account?.bankName || 'ZUNO Partner Bank';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.depositMock({
        userId: currentUser.id,
        amount: parseFloat(amount),
        sourceName: sourceName || 'Direct Sandbox Inflow'
      });

      onDepositSuccess(res.transaction);
      onClose();

      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Deposit simulation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Money to ZUNO Wallet</h2>
              <p className="text-xs text-slate-500">Zero charges on all incoming transfers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Method Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setDepositMethod('BANK_TRANSFER')}
              className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                depositMethod === 'BANK_TRANSFER' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bank Transfer (NUBAN)
            </button>
            <button
              onClick={() => setDepositMethod('CARD_SIMULATION')}
              className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                depositMethod === 'CARD_SIMULATION' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Instant Sandbox Top-Up
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {depositMethod === 'BANK_TRANSFER' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs text-slate-600">Transfer from any banking app to your dedicated account number:</div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Account Number</div>
                    <div className="font-mono text-lg font-bold text-slate-900 tracking-widest">{accountNumber}</div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="font-bold text-slate-800">{bankName}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Beneficiary Name</span>
                  <span className="font-bold text-slate-800">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Funds reflect instantly with zero transaction fee deductions.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSimulateDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Top-Up Amount (₦)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['50000', '100000', '500000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ₦{(parseInt(val || '0') || 0).toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Simulation Funding Source</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Salary Inflow from Employer"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || parseFloat(amount || '0') <= 0}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Credit ₦{(parseFloat(amount || '0') || 0).toLocaleString()} to Wallet
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
