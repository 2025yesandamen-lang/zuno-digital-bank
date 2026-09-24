import React from 'react';
import { 
  Send, 
  Smartphone, 
  Wifi, 
  Zap, 
  Tv, 
  PiggyBank, 
  CreditCard, 
  PlusCircle,
  QrCode,
  FileText
} from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (action: 'TRANSFER' | 'DEPOSIT' | 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'TV' | 'SAVINGS' | 'CARDS' | 'SUPPORT') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  const actions = [
    {
      id: 'action-transfer',
      label: 'Transfer',
      icon: Send,
      action: 'TRANSFER' as const,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      badge: 'Fast'
    },
    {
      id: 'action-add-money',
      label: 'Add Money',
      icon: PlusCircle,
      action: 'DEPOSIT' as const,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    {
      id: 'action-airtime',
      label: 'Airtime',
      icon: Smartphone,
      action: 'AIRTIME' as const,
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      badge: '2% Back'
    },
    {
      id: 'action-data',
      label: 'Data Bundle',
      icon: Wifi,
      action: 'DATA' as const,
      color: 'bg-sky-100 text-sky-700 border-sky-200'
    },
    {
      id: 'action-electricity',
      label: 'Electricity',
      icon: Zap,
      action: 'ELECTRICITY' as const,
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      badge: 'Token'
    },
    {
      id: 'action-tv',
      label: 'Pay TV',
      icon: Tv,
      action: 'TV' as const,
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'action-savings',
      label: 'ZUNO Save',
      icon: PiggyBank,
      action: 'SAVINGS' as const,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      badge: '16.5%'
    },
    {
      id: 'action-cards',
      label: 'Cards',
      icon: CreditCard,
      action: 'CARDS' as const,
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ];

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Actions</h2>
        <span className="text-xs text-slate-400 font-medium">Instant & Zero Friction</span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              id={act.id}
              onClick={() => onSelectAction(act.action)}
              className="flex flex-col items-center text-center p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all group active:scale-95 cursor-pointer relative shadow-xs hover:shadow-sm"
            >
              {act.badge && (
                <span className="absolute -top-1.5 right-1 text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded-full shadow-xs">
                  {act.badge}
                </span>
              )}
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center border mb-2 transition-transform group-hover:scale-105 ${act.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
