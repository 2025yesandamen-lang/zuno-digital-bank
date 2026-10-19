import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  PlusCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  CreditCard, 
  Globe2, 
  ArrowLeftRight,
  Send,
  Building2,
  ChevronRight
} from 'lucide-react';
import { Wallet, BankAccount, KYCProfile, SupportedCurrency } from '../types/banking';

interface WalletBalanceCardProps {
  wallet: Wallet | null;
  allWallets?: Record<SupportedCurrency, Wallet> | null;
  activeCurrency?: SupportedCurrency;
  onSelectCurrency?: (curr: SupportedCurrency) => void;
  account: BankAccount | null;
  kyc: KYCProfile | null;
  onOpenTransfer: () => void;
  onOpenDeposit: () => void;
  onOpenKYC: () => void;
  onOpenReceiveUsd?: () => void;
  onOpenConvert?: () => void;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  wallet,
  allWallets,
  activeCurrency = 'NGN',
  onSelectCurrency,
  account,
  kyc,
  onOpenTransfer,
  onOpenDeposit,
  onOpenKYC,
  onOpenReceiveUsd,
  onOpenConvert
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active wallet for the selected currency
  const currentWallet = allWallets && allWallets[activeCurrency] 
    ? allWallets[activeCurrency] 
    : wallet;

  const available = currentWallet?.availableBalance ?? 0;
  const pending = currentWallet?.pendingBalance ?? 0;
  const ledger = currentWallet?.ledgerBalance ?? 0;

  const currencyConfig: Record<SupportedCurrency, { 
    symbol: string; 
    name: string; 
    flag: string;
    railTitle: string; 
    acct: string; 
    bank: string; 
    badge: string;
  }> = {
    NGN: {
      symbol: '₦',
      name: 'Nigerian Naira',
      flag: '🇳🇬',
      railTitle: 'NUBAN Account',
      acct: account?.accountNumber || '8012345678',
      bank: account?.bankName || 'ZUNO Partner Bank (Providus MFB)',
      badge: 'Instant NIBSS NIP'
    },
    USD: {
      symbol: '$',
      name: 'US Dollar',
      flag: '🇺🇸',
      railTitle: 'ACH Routing & Wire',
      acct: 'CFSB •• 9820018821 (Routing: 026073150)',
      bank: 'Community Federal Savings Bank NY',
      badge: 'Zero Auto-Conversion'
    },
    GBP: {
      symbol: '£',
      name: 'British Pound',
      flag: '🇬🇧',
      railTitle: 'UK Faster Payments',
      acct: 'ClearBank •• 78492109 (Sort: 04-00-75)',
      bank: 'ClearBank Limited London',
      badge: 'UK FPS Rails'
    },
    EUR: {
      symbol: '€',
      name: 'Euro',
      flag: '🇪🇺',
      railTitle: 'SEPA Instant IBAN',
      acct: 'LU89 •••• 4819 2109 (BIC: BCIRLULLXXX)',
      bank: 'Banking Circle S.A. Luxembourg',
      badge: 'SEPA Instant Credit'
    }
  };

  const activeRail = currencyConfig[activeCurrency] || currencyConfig.NGN;
  const activeSymbol = activeRail.symbol;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeRail.acct);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Multi-Currency Accounts Strip (Wise / Revolut Inspiration) */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <span>Currency Accounts</span>
          <span className="text-[11px] font-normal text-slate-500 lowercase">(tap to switch)</span>
        </div>
        <button
          onClick={onOpenConvert}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Live FX Rates</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(['NGN', 'USD', 'GBP', 'EUR'] as SupportedCurrency[]).map((curr) => {
          const isSelected = activeCurrency === curr;
          const conf = currencyConfig[curr];
          const currWallet = allWallets ? allWallets[curr] : (curr === 'NGN' ? wallet : null);
          const bal = currWallet?.availableBalance ?? 0;

          return (
            <button
              key={curr}
              type="button"
              id={`btn-currency-${curr.toLowerCase()}`}
              onClick={() => onSelectCurrency?.(curr)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg leading-none" role="img" aria-label={conf.name}>
                  {conf.flag}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {curr}
                </span>
              </div>
              
              <div className={`text-xs font-medium truncate ${
                isSelected ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {conf.name}
              </div>

              <div className={`font-mono text-sm sm:text-base font-bold mt-1 tracking-tight ${
                isSelected ? 'text-white' : 'text-slate-900'
              }`}>
                {hideBalance ? '••••' : `${conf.symbol}${bal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Focused Currency Hero Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
        
        {/* Top Header inside Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{activeRail.flag}</span>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {activeRail.name} ({activeCurrency})
              </div>
              <div className="text-[11px] text-slate-500">
                {activeRail.badge}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-hide-balance"
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={hideBalance ? "Show balance" : "Hide balance"}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenKYC}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="View account limits"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{kyc?.tier || 'TIER_1'}</span>
            </button>
          </div>
        </div>

        {/* Hero Amount */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider mb-1">
            Available Balance
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {hideBalance ? '••••••••••' : `${activeSymbol}${(available ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* Ledger & Pending Breakdown */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            <span>
              Book Balance: <strong className="font-mono text-slate-700 font-semibold">{activeSymbol}{hideBalance ? '••••' : (ledger ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            {pending > 0 && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium">
                Pending: {activeSymbol}{(pending ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* 3. Account Details Strip */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-bold">
              {activeCurrency === 'NGN' ? <CreditCard className="w-4 h-4" /> : <Globe2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">
                {activeRail.railTitle} · <span className="text-slate-700 font-semibold">{activeRail.bank}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-slate-900 tracking-wide text-xs sm:text-sm">
                  {activeRail.acct}
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

          {activeCurrency === 'USD' && (
            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                Zero Naira auto-conversion
              </span>
            </div>
          )}
        </div>

        {/* 4. Action Buttons (Revolut / Wise 4-Action Dock) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          
          {/* Send */}
          <button
            id="btn-send-money-primary"
            onClick={onOpenTransfer}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>

          {/* Receive */}
          <button
            id="btn-receive-usd-primary"
            onClick={onOpenReceiveUsd}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
            title="View receiving details"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Receive {activeCurrency}</span>
          </button>

          {/* Convert */}
          <button
            id="btn-convert-primary"
            onClick={onOpenConvert}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Convert / FX</span>
          </button>

          {/* Add Money */}
          <button
            id="btn-add-money-primary"
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Money</span>
          </button>

        </div>

      </div>

    </div>
  );
};
