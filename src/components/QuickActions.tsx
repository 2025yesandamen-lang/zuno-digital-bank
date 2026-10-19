import React from 'react';
import { 
  Smartphone, 
  Wifi, 
  Zap, 
  Tv, 
  PiggyBank, 
  CreditCard, 
  Building2,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export type QuickActionType = 
  | 'TRANSFER' 
  | 'DEPOSIT' 
  | 'AIRTIME' 
  | 'DATA' 
  | 'ELECTRICITY' 
  | 'TV' 
  | 'SAVINGS' 
  | 'CARDS' 
  | 'SUPPORT'
  | 'RECEIVE_USD'
  | 'CONVERT'
  | 'INTERNATIONAL'
  | 'BUSINESS';

interface QuickActionsProps {
  onSelectAction: (action: QuickActionType) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  return (
    <div className="space-y-4">
      
      {/* 1. Everyday Utilities Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bills & Everyday Payments
            </h2>
            <p className="text-[11px] text-slate-400">Zero fee utilities with instant receipt token</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            2% Cash Back
          </span>
        </div>

        {/* 4 Clean Action Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          <button
            id="action-airtime"
            type="button"
            onClick={() => onSelectAction('AIRTIME')}
            className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group active:scale-95 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Airtime</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Top-up lines</span>
          </button>

          <button
            id="action-data"
            type="button"
            onClick={() => onSelectAction('DATA')}
            className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group active:scale-95 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform mb-2">
              <Wifi className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Data Bundle</span>
            <span className="text-[10px] text-slate-400 mt-0.5">4G/5G plans</span>
          </button>

          <button
            id="action-electricity"
            type="button"
            onClick={() => onSelectAction('ELECTRICITY')}
            className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group active:scale-95 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform mb-2">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Electricity</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Prepaid token</span>
          </button>

          <button
            id="action-tv"
            type="button"
            onClick={() => onSelectAction('TV')}
            className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group active:scale-95 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform mb-2">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Cable TV</span>
            <span className="text-[10px] text-slate-400 mt-0.5">DSTV, GOtv</span>
          </button>

        </div>
      </div>

      {/* 2. Wealth, Cards & Business Quick Tiles (Clean 2-Column Showcase) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* ZUNO Save Card */}
        <div 
          onClick={() => onSelectAction('SAVINGS')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-sm transition-all cursor-pointer group hover:bg-emerald-50/30 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              16.5% p.a.
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 flex items-center gap-1">
              <span>ZUNO High-Yield Vault</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Automated savings & daily compound interest with instant free withdrawals.
            </p>
          </div>
        </div>

        {/* Virtual & Physical Cards Card */}
        <div 
          onClick={() => onSelectAction('CARDS')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm transition-all cursor-pointer group hover:bg-blue-50/30 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              USD & NGN
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-800 flex items-center gap-1">
              <span>Virtual & Physical Cards</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mastercard & Visa for international spending, Netflix, and Apple subscriptions.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
