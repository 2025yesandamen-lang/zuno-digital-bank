import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Lock, 
  RotateCcw,
  Info,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { User, SupportedCurrency, Wallet, ExchangeQuote, Transaction } from '../types/banking';

interface ConvertCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  wallets: Record<SupportedCurrency, Wallet> | null;
  onConversionSuccess: (tx: Transaction) => void;
}

export const ConvertCurrencyModal: React.FC<ConvertCurrencyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  wallets,
  onConversionSuccess
}) => {
  const [fromCurrency, setFromCurrency] = useState<SupportedCurrency>('NGN');
  const [toCurrency, setToCurrency] = useState<SupportedCurrency>('USD');
  const [amount, setAmount] = useState('50000');
  const [quote, setQuote] = useState<ExchangeQuote | null>(null);
  const [pin, setPin] = useState('1234');
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currencies: { code: SupportedCurrency; name: string; symbol: string }[] = [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
  ];

  const fromWallet = wallets ? wallets[fromCurrency] : null;
  const toWallet = wallets ? wallets[toCurrency] : null;

  // Auto fetch quote when currencies or amount change
  useEffect(() => {
    if (!isOpen) return;
    const num = parseFloat(amount);
    if (!num || num <= 0 || fromCurrency === toCurrency) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(() => {
      fetchQuote(fromCurrency, toCurrency, num);
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, fromCurrency, toCurrency, amount]);

  const fetchQuote = async (from: SupportedCurrency, to: SupportedCurrency, numAmount: number) => {
    setIsQuoting(true);
    setErrorMessage('');
    try {
      const res = await api.getExchangeQuote({ from, to, amount: numAmount });
      if (res.quote) setQuote(res.quote);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to fetch exchange quote.');
      setQuote(null);
    } finally {
      setIsQuoting(false);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.convertCurrency({
        userId: currentUser.id,
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
        pin: pin || '1234'
      });

      onConversionSuccess(res.transaction);
      onClose();

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Conversion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const fromSymbol = currencies.find(c => c.code === fromCurrency)?.symbol || '';
  const toSymbol = currencies.find(c => c.code === toCurrency)?.symbol || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Convert Currency</h2>
              <p className="text-xs text-slate-500">Instant multi-currency exchange with transparent zero-spread rates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleConvert} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* From Currency Block */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>You Convert (From)</span>
              <span>Available: {fromSymbol}{fromWallet?.availableBalance?.toLocaleString() ?? '0.00'}</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />

              <select
                value={fromCurrency}
                onChange={(e) => {
                  const val = e.target.value as SupportedCurrency;
                  if (val === toCurrency) setToCurrency(fromCurrency);
                  setFromCurrency(val);
                }}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwapCurrencies}
              className="p-2 rounded-full bg-white border border-slate-300 shadow-xs hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-all active:rotate-180 cursor-pointer"
              title="Swap Currencies"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* To Currency Block */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>You Receive (Estimated)</span>
              <span>Balance: {toSymbol}{toWallet?.availableBalance?.toLocaleString() ?? '0.00'}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base font-bold font-mono text-slate-900">
                {isQuoting ? (
                  <span className="text-slate-400 font-normal text-xs animate-pulse">Calculating guaranteed quote...</span>
                ) : quote ? (
                  <span>{toSymbol}{quote.toAmount.toLocaleString()}</span>
                ) : (
                  <span className="text-slate-400">0.00</span>
                )}
              </div>

              <select
                value={toCurrency}
                onChange={(e) => {
                  const val = e.target.value as SupportedCurrency;
                  if (val === fromCurrency) setFromCurrency(toCurrency);
                  setToCurrency(val);
                }}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transparent Rate & Fee Breakdown */}
          {quote && (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Mid-Market Exchange Rate:</span>
                <span className="font-mono font-bold text-slate-900">
                  1 {fromCurrency} = {quote.exchangeRate} {toCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Transparent Platform Fee (0.5%):</span>
                <span className="font-mono font-bold text-slate-900">
                  {fromSymbol}{quote.fee.toLocaleString()} {fromCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Settlement Speed:</span>
                <span className="font-bold text-emerald-700">Instant Double-Entry Settlement</span>
              </div>
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction PIN <span className="text-slate-400 font-normal">(Demo PIN: 1234)</span>
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !quote || parseFloat(amount) <= 0}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Executing Ledger Settlement...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Convert to {toCurrency} Now</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
