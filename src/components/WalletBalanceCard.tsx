import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  TrendingUp, 
  CreditCard, 
  Sparkles,
  Info
} from 'lucide-react';
import { Wallet, BankAccount, KYCProfile } from '../types/banking';

interface WalletBalanceCardProps {
  wallet: Wallet | null;
  account: BankAccount | null;
  kyc: KYCProfile | null;
  onOpenTransfer: () => void;
  onOpenDeposit: () => void;
  onOpenKYC: () => void;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  wallet,
  account,
  kyc,
  onOpenTransfer,
  onOpenDeposit,
  onOpenKYC
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);

  const available = wallet?.availableBalance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const ledger = wallet?.ledgerBalance ?? 0;
  const accountNumber = account?.accountNumber || '8012345678';
  const bankName = account?.bankName || 'ZUNO Partner Bank';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
      <div className="relative z-10 flex flex-col justify-between gap-6">
        
        {/* Top Row: Title & Tier Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Available Balance</span>
            <button
              id="btn-hide-balance"
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={hideBalance ? "Show balance" : "Hide balance"}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* KYC Tier Pill */}
          <button
            onClick={onOpenKYC}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{kyc?.tier || 'TIER_1'}</span>
            <span className="text-[10px] text-blue-500 font-normal underline ml-1">Limits</span>
          </button>
        </div>

        {/* Big Balance Display */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-400">₦</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-mono">
              {hideBalance ? '••••••••' : (available ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Ledger Balance: <span className="text-slate-800 font-mono font-semibold">₦{hideBalance ? '••••••' : (ledger ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </span>
            {pending > 0 && (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Pending: ₦{(pending ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* Account Info Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Regulated Account Details (NUBAN)</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                  {accountNumber}
                </span>
                <button
                  id="btn-copy-account-num"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Partner Bank Rails</div>
            <div className="text-xs font-semibold text-slate-800">{bankName}</div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            id="btn-send-money-primary"
            onClick={onOpenTransfer}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            Send Money
          </button>

          <button
            id="btn-add-money-primary"
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            Add Money / Top-up
          </button>
        </div>

      </div>
    </div>
  );
};
