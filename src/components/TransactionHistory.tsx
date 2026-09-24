import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Zap, 
  Smartphone, 
  Tv, 
  PiggyBank, 
  CreditCard 
} from 'lucide-react';
import { Transaction } from '../types/banking';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onSelectTransaction
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter(tx => {
    // Type Filter
    if (filterType === 'TRANSFERS' && !['INTERNAL_TRANSFER', 'EXTERNAL_TRANSFER'].includes(tx.type)) return false;
    if (filterType === 'BILLS' && !['AIRTIME_PURCHASE', 'DATA_PURCHASE', 'ELECTRICITY_BILL', 'TV_SUBSCRIPTION'].includes(tx.type)) return false;
    if (filterType === 'SAVINGS' && !['SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAW'].includes(tx.type)) return false;
    if (filterType === 'DEPOSIT' && tx.type !== 'DEPOSIT') return false;

    // Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = (tx.reference || '').toLowerCase().includes(q);
      const matchName = (tx.counterpartyName || '').toLowerCase().includes(q);
      const matchNarration = (tx.narration || '').toLowerCase().includes(q);
      return matchRef || matchName || matchNarration;
    }
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
      case 'AIRTIME_PURCHASE':
        return <Smartphone className="w-4 h-4 text-cyan-600" />;
      case 'DATA_PURCHASE':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'ELECTRICITY_BILL':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'TV_SUBSCRIPTION':
        return <Tv className="w-4 h-4 text-purple-600" />;
      case 'SAVINGS_DEPOSIT':
      case 'SAVINGS_WITHDRAW':
        return <PiggyBank className="w-4 h-4 text-emerald-600" />;
      default:
        return <ArrowUpRight className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction History</h2>
          <p className="text-xs text-slate-400">Audited double-entry record of all inflows & outflows</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, recipient..."
            className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Transactions' },
          { id: 'TRANSFERS', label: 'Transfers' },
          { id: 'BILLS', label: 'Bills & Utilities' },
          { id: 'SAVINGS', label: 'Savings Vault' },
          { id: 'DEPOSIT', label: 'Inflows' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs rounded-lg bg-slate-50 border border-slate-200">
          No transactions match your search or filter criteria.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(tx => {
            const isCredit = tx.type === 'DEPOSIT' || tx.type === 'SAVINGS_WITHDRAW';
            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3 px-2 hover:bg-slate-50 rounded-lg transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{tx.counterpartyName || tx.narration || tx.type.replace('_', ' ')}</span>
                      {tx.status === 'PENDING' && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                      {tx.status === 'FAILED' && (
                        <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" /> Failed
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[100px] sm:max-w-none">{tx.reference}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isCredit ? '+' : '-'}₦{(tx?.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  <button className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-1 justify-end ml-auto">
                    <FileText className="w-3 h-3" />
                    Receipt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
