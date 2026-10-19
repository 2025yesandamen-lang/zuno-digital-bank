import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Globe2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  RotateCcw, 
  Sparkles, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { User, SupportedCurrency, Wallet, KYCProfile, Transaction } from '../types/banking';

interface InternationalTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  wallets: Record<SupportedCurrency, Wallet> | null;
  kyc: KYCProfile | null;
  onTransferSuccess: (tx: Transaction) => void;
}

export const InternationalTransferModal: React.FC<InternationalTransferModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  wallets,
  kyc,
  onTransferSuccess
}) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Details & Quote, 2: PIN Authorization
  const [sourceCurrency, setSourceCurrency] = useState<SupportedCurrency>('NGN');
  const [destinationCountry, setDestinationCountry] = useState('United States');
  const [destinationCurrency, setDestinationCurrency] = useState('USD');
  const [sendAmount, setSendAmount] = useState('150000');
  
  // Recipient details
  const [recipientName, setRecipientName] = useState('');
  const [recipientBank, setRecipientBank] = useState('JPMorgan Chase Bank, N.A.');
  const [recipientAccountOrIban, setRecipientAccountOrIban] = useState('');
  const [routingOrSwift, setRoutingOrSwift] = useState('021000021');
  const [narration, setNarration] = useState('');
  const [pin, setPin] = useState('1234');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const countries = [
    { name: 'United States', code: 'US', currency: 'USD', bank: 'JPMorgan Chase / Bank of America', routingLabel: 'ACH / Wire Routing Number' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP', bank: 'Barclays / HSBC UK', routingLabel: 'UK Sort Code' },
    { name: 'Eurozone (Germany/France)', code: 'EU', currency: 'EUR', bank: 'Deutsche Bank / BNP Paribas', routingLabel: 'SWIFT / BIC Code' },
    { name: 'Canada', code: 'CA', currency: 'CAD', bank: 'Royal Bank of Canada (RBC)', routingLabel: 'Transit / Institution Number' },
    { name: 'Ghana', code: 'GH', currency: 'GHS', bank: 'Ecobank Ghana / MTN MoMo', routingLabel: 'Branch / Network Code' },
    { name: 'Kenya', code: 'KE', currency: 'KES', bank: 'KCB Bank / M-Pesa', routingLabel: 'Paybill / Branch Code' },
    { name: 'South Africa', code: 'ZA', currency: 'ZAR', bank: 'Standard Bank South Africa', routingLabel: 'Branch Code' },
  ];

  if (!isOpen) return null;

  const currentCountry = countries.find(c => c.name === destinationCountry) || countries[0];
  const sourceWallet = wallets ? wallets[sourceCurrency] : null;

  // Calculate conversion rates & fees
  const numSend = parseFloat(sendAmount) || 0;
  const transferFee = sourceCurrency === 'NGN' ? 1500 : sourceCurrency === 'USD' ? 5.00 : 4.00;
  const totalDeducted = numSend + transferFee;

  let fxRate = 1.0;
  if (sourceCurrency === 'NGN' && destinationCurrency === 'USD') fxRate = 1 / 1485.50;
  else if (sourceCurrency === 'NGN' && destinationCurrency === 'GBP') fxRate = 1 / 1920.00;
  else if (sourceCurrency === 'NGN' && destinationCurrency === 'EUR') fxRate = 1 / 1610.00;
  else if (sourceCurrency === 'NGN' && destinationCurrency === 'CAD') fxRate = 1 / 1090.00;
  else if (sourceCurrency === 'NGN' && destinationCurrency === 'GHS') fxRate = 1 / 95.00;
  else if (sourceCurrency === 'NGN' && destinationCurrency === 'KES') fxRate = 1 / 11.50;
  else if (sourceCurrency === 'USD' && destinationCurrency === 'EUR') fxRate = 0.92;
  else if (sourceCurrency === 'USD' && destinationCurrency === 'GBP') fxRate = 0.77;
  else if (sourceCurrency === 'USD' && destinationCurrency === 'GHS') fxRate = 15.50;
  else if (sourceCurrency === 'USD' && destinationCurrency === 'KES') fxRate = 129.50;
  else fxRate = 1.0;

  const estimatedPayout = Number((numSend * fxRate).toFixed(2));

  // KYC daily limit check
  const tier = kyc?.tier || 'TIER_1';
  const dailyLimitUsd = tier === 'TIER_1' ? 100 : tier === 'TIER_2' ? 1000 : tier === 'TIER_3' ? 10000 : 50000;

  const handleCountryChange = (cName: string) => {
    setDestinationCountry(cName);
    const matched = countries.find(c => c.name === cName);
    if (matched) {
      setDestinationCurrency(matched.currency);
      setRecipientBank(matched.bank.split(' / ')[0]);
    }
  };

  const handleProceedToAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientAccountOrIban.trim()) {
      setErrorMessage('Please fill in all recipient bank and account details.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.transferInternational({
        userId: currentUser.id,
        sourceCurrency,
        destinationCountry,
        destinationCurrency,
        sendAmount: numSend,
        recipientName: recipientName.trim(),
        recipientAccountOrIban: recipientAccountOrIban.trim(),
        recipientBank: recipientBank.trim(),
        routingOrSwift: routingOrSwift.trim(),
        narration: narration.trim() || `Remittance to ${recipientName}`,
        pin: pin || '1234'
      });

      onTransferSuccess(res.transaction);
      onClose();

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceSymbol = sourceCurrency === 'NGN' ? '₦' : sourceCurrency === 'USD' ? '$' : sourceCurrency === 'GBP' ? '£' : '€';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Send Money Abroad
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Global Remittance
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct transfers to US, UK, Europe, Ghana, Kenya, and 50+ countries via regulated partner rails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: TRANSFER DETAILS & QUOTE */}
        {step === 1 && (
          <form onSubmit={handleProceedToAuth} className="p-6 overflow-y-auto flex-1 space-y-4">
            
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* KYC Tier Limits info */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Tier: <strong className="font-bold">{tier}</strong></span>
              </div>
              <div>
                <span>Daily Outward Limit: <strong>${dailyLimitUsd.toLocaleString()} USD</strong></span>
              </div>
            </div>

            {/* Destination Country & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Country</label>
                <select
                  value={destinationCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.name}>{c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Wallet</label>
                <select
                  value={sourceCurrency}
                  onChange={(e) => setSourceCurrency(e.target.value as SupportedCurrency)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="NGN">₦ NGN Wallet (Bal: ₦{wallets?.NGN?.availableBalance?.toLocaleString() ?? 0})</option>
                  <option value="USD">$ USD Wallet (Bal: ${wallets?.USD?.availableBalance?.toLocaleString() ?? 0})</option>
                  <option value="GBP">£ GBP Wallet (Bal: £{wallets?.GBP?.availableBalance?.toLocaleString() ?? 0})</option>
                  <option value="EUR">€ EUR Wallet (Bal: €{wallets?.EUR?.availableBalance?.toLocaleString() ?? 0})</option>
                </select>
              </div>
            </div>

            {/* Amount input & payout calculation */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Sending Amount ({sourceCurrency})</span>
                <span>Available: {sourceSymbol}{sourceWallet?.availableBalance?.toLocaleString() ?? 0}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Rate & Payout Card */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Guaranteed FX Rate:</span>
                  <span className="font-mono font-bold text-slate-900">
                    1 {sourceCurrency} ≈ {fxRate.toFixed(4)} {destinationCurrency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Recipient Receives (Estimated):</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {destinationCurrency} {estimatedPayout.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Transfer Fee: {sourceSymbol}{transferFee.toLocaleString()} | Arrives: ~15 mins via Swift/Local Rails</span>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recipient Bank Account Details
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Recipient Full Legal Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Michael Smith or Global Partners LLC"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Recipient Bank Name</label>
                  <input
                    type="text"
                    value={recipientBank}
                    onChange={(e) => setRecipientBank(e.target.value)}
                    placeholder="e.g. Bank of America"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {destinationCurrency === 'EUR' ? 'IBAN' : destinationCurrency === 'GBP' ? 'Account Number' : 'Account / IBAN Number'}
                  </label>
                  <input
                    type="text"
                    value={recipientAccountOrIban}
                    onChange={(e) => setRecipientAccountOrIban(e.target.value)}
                    placeholder={destinationCurrency === 'EUR' ? 'DE89370400440532013000' : '9820491029'}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">{currentCountry.routingLabel}</label>
                <input
                  type="text"
                  value={routingOrSwift}
                  onChange={(e) => setRoutingOrSwift(e.target.value)}
                  placeholder="e.g. 021000021 or SWIFT Code"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Reference / Narration</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. Consulting Services / Tuition / Invoice #1029"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={numSend <= 0 || !recipientName.trim() || !recipientAccountOrIban.trim()}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Review & Authorize Transfer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: PIN AUTHORIZATION */}
        {step === 2 && (
          <form onSubmit={handleExecuteTransfer} className="p-6 overflow-y-auto flex-1 space-y-5 text-center">
            
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 max-w-sm mx-auto text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-500">Sending to <span className="font-bold text-slate-900">{recipientName}</span></div>
              <div className="text-3xl font-bold font-mono text-slate-900 my-1">
                {sourceSymbol}{numSend.toLocaleString()} {sourceCurrency}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Recipient receives approx: <strong className="text-emerald-700 font-mono font-bold">{destinationCurrency} {estimatedPayout.toLocaleString()}</strong> in {destinationCountry}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Bank:</span>
                <span className="font-bold text-slate-900">{recipientBank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account / IBAN:</span>
                <span className="font-mono font-bold text-slate-900">{recipientAccountOrIban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Deducted:</span>
                <span className="font-mono font-bold text-slate-900">{sourceSymbol}{totalDeducted.toLocaleString()} {sourceCurrency}</span>
              </div>
            </div>

            <div className="max-w-xs mx-auto">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter 4-Digit Security PIN <span className="text-slate-400 font-normal">(Demo: 1234)</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-center text-base font-mono tracking-widest text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex gap-3 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !pin}
                className="w-2/3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Clearing Rails...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize Outward Remittance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
