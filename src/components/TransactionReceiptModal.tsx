import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  QrCode,
  Sparkles
} from 'lucide-react';
import { Transaction } from '../types/banking';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCredit = transaction.type === 'DEPOSIT' || transaction.type === 'SAVINGS_WITHDRAW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Transaction Receipt</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt-area" className="p-6 overflow-y-auto flex-1 space-y-5 bg-white text-slate-900">
          
          {/* Bank Brand Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-2xl mx-auto flex items-center justify-center shadow-md mb-2">
              Z
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">ZUNO DIGITAL BANK</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Official Electronic Transaction Record</p>
          </div>

          {/* Amount Box */}
          <div className="text-center py-2">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Transaction Amount</div>
            <div className={`text-3xl font-black font-mono mt-1 ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
              {isCredit ? '+' : '-'}₦{(transaction?.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{transaction.status} (SETTLED)</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Type</span>
              <span className="font-bold text-slate-900 uppercase">{transaction.type.replace('_', ' ')}</span>
            </div>

            {transaction.counterpartyName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Counterparty</span>
                <span className="font-bold text-slate-800">{transaction.counterpartyName}</span>
              </div>
            )}

            {transaction.counterpartyBank && (
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Bank</span>
                <span className="font-bold text-slate-800">{transaction.counterpartyBank}</span>
              </div>
            )}

            {transaction.counterpartyAccount && (
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono text-slate-800">{transaction.counterpartyAccount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-500">Fee Charged</span>
              <span className="font-mono text-slate-800">₦{transaction.fee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Date & Timestamp</span>
              <span className="font-mono text-slate-800">{new Date(transaction.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Reference</span>
              <span className="font-mono text-blue-600 font-bold text-[11px]">{transaction.reference}</span>
            </div>

            {transaction.sessionReference && (
              <div className="flex justify-between">
                <span className="text-slate-500">NIP Session ID</span>
                <span className="font-mono text-slate-700 text-[11px]">{transaction.sessionReference}</span>
              </div>
            )}

            {transaction.ledgerTransactionId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Double-Entry Journal ID</span>
                <span className="font-mono text-teal-600 text-[11px]">{transaction.ledgerTransactionId}</span>
              </div>
            )}

            {transaction.narration && (
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">Narration</span>
                <span className="text-slate-800 text-right max-w-[200px] truncate">{transaction.narration}</span>
              </div>
            )}
          </div>

          {/* Verification Barcode & Legal Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              <span className="font-bold text-slate-700">NIBSS / CBN Digitally Signed Receipt.</span>
              <br />
              This electronic receipt confirms final settlement in the ZUNO Core Ledger. No physical signature required.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
