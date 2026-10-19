import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe2, 
  Copy, 
  Check, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Info,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { User, SupportedCurrency, InternationalReceivingDetails, Transaction } from '../types/banking';

interface ReceiveInternationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPaymentReceived: (tx: Transaction) => void;
}

export const ReceiveInternationalModal: React.FC<ReceiveInternationalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPaymentReceived
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');
  const [details, setDetails] = useState<InternationalReceivingDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState('500');
  const [simulateSender, setSimulateSender] = useState('Stripe Payments US');
  const [simulateRail, setSimulateRail] = useState<'ACH' | 'WIRE' | 'SWIFT'>('ACH');
  const [simulateSuccessMessage, setSimulateSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadReceivingDetails(selectedCurrency);
      setSimulateSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen, selectedCurrency, currentUser.id]);

  const loadReceivingDetails = async (curr: SupportedCurrency) => {
    setIsLoading(true);
    try {
      const res = await api.getReceivingDetails(currentUser.id, curr);
      if (res.details) setDetails(res.details);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to load receiving bank details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllDetails = () => {
    if (!details) return;
    const text = `ZUNO INTERNATIONAL RECEIVING DETAILS (${details.currency})
Beneficiary Name: ${details.beneficiaryName}
Account Number: ${details.accountNumber}
${details.routingNumber ? `Routing Number (ACH): ${details.routingNumber}\n` : ''}${details.wireRoutingNumber ? `Wire Routing (Fedwire): ${details.wireRoutingNumber}\n` : ''}${details.sortCode ? `Sort Code: ${details.sortCode}\n` : ''}${details.iban ? `IBAN: ${details.iban}\n` : ''}${details.swiftBic ? `SWIFT/BIC: ${details.swiftBic}\n` : ''}Bank Name: ${details.bankName}
Bank Address: ${details.bankAddress}
Note: Funds are credited directly in ${details.currency} without forced conversion to NGN.`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSimulateInflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setErrorMessage('');
    setSimulateSuccessMessage('');

    try {
      const res = await api.simulateIncomingPayment({
        userId: currentUser.id,
        currency: selectedCurrency,
        amount: parseFloat(simulateAmount),
        senderName: simulateSender || 'International Client',
        senderBank: selectedCurrency === 'USD' ? 'JPMorgan Chase NY' : selectedCurrency === 'GBP' ? 'Barclays Bank UK' : 'Deutsche Bank AG',
        paymentRail: simulateRail,
        narration: `Inward ${selectedCurrency} ${simulateRail} remittance from ${simulateSender}`
      });

      setSimulateSuccessMessage(
        `Successfully received ${details?.symbol || '$'}${parseFloat(simulateAmount).toLocaleString()} from ${simulateSender} via ${simulateRail}. 100% credited to your ${selectedCurrency} balance!`
      );
      onPaymentReceived(res.transaction);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Receive International Payments
                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  0% Auto-Convert
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Receive USD, GBP & EUR directly into foreign currency wallets without forced Naira conversion
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Key Advantage Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-950">ZUNO Multi-Currency Advantage: No Forced Conversion</div>
              <p className="text-blue-800/90 mt-0.5">
                Payments received in your foreign currency accounts are credited 100% in that currency (USD, GBP, EUR). 
                You hold your foreign exchange securely and convert to Naira only whenever you choose.
              </p>
            </div>
          </div>

          {/* Currency Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Receiving Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'USD', name: 'US Dollar', symbol: '$', rail: 'ACH & Fedwire' },
                { code: 'GBP', name: 'British Pound', symbol: '£', rail: 'UK Faster Payments' },
                { code: 'EUR', name: 'Euro', symbol: '€', rail: 'SEPA Instant' },
              ].map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCurrency(c.code as SupportedCurrency)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedCurrency === c.code
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{c.symbol} {c.code}</span>
                    {selectedCurrency === c.code && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{c.rail}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Receiving Details Card */}
          {details && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">{details.bankName}</span>
                </div>
                <button
                  type="button"
                  onClick={copyAllDetails}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'Copied Full Details' : 'Copy All'}</span>
                </button>
              </div>

              {/* Grid of detail rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Beneficiary Name */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Beneficiary / Account Name</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold font-mono text-slate-900">{details.beneficiaryName}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(details.beneficiaryName, 'beneficiary')}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                    >
                      {copiedField === 'beneficiary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Account Number</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold font-mono text-slate-900 tracking-wider">{details.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(details.accountNumber, 'accountNumber')}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                    >
                      {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Routing / Sort Code / IBAN */}
                {details.routingNumber && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Routing Number (ACH / Direct Deposit)</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold font-mono text-slate-900">{details.routingNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(details.routingNumber!, 'routingNumber')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                      >
                        {copiedField === 'routingNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {details.wireRoutingNumber && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Wire Routing (Fedwire)</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold font-mono text-slate-900">{details.wireRoutingNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(details.wireRoutingNumber!, 'wireRouting')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                      >
                        {copiedField === 'wireRouting' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {details.sortCode && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">UK Sort Code</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold font-mono text-slate-900">{details.sortCode}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(details.sortCode!, 'sortCode')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                      >
                        {copiedField === 'sortCode' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {details.iban && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 sm:col-span-2">
                    <div className="text-[11px] text-slate-500 font-medium">European IBAN</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold font-mono text-slate-900 break-all">{details.iban}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(details.iban!, 'iban')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                      >
                        {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {details.swiftBic && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">SWIFT / BIC Code</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold font-mono text-slate-900">{details.swiftBic}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(details.swiftBic!, 'swiftBic')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                      >
                        {copiedField === 'swiftBic' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Receiving Fee</div>
                  <div className="font-bold text-emerald-700 mt-1">{details.depositFee}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 sm:col-span-2">
                  <div className="text-[11px] text-slate-500 font-medium">Bank Address</div>
                  <div className="text-slate-800 mt-1">{details.bankAddress}</div>
                </div>

              </div>

              {/* Supported Platforms Tag Cloud */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium mb-1.5">
                  Compatible with Global Payout Gateways & Employers:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Stripe', 'PayPal', 'Upwork', 'Deel', 'Fiverr', 'Google AdSense', 'Remote.com', 'Wise', 'Direct Corporate Wire'].map(tag => (
                    <span key={tag} className="text-[10px] bg-white border border-slate-200 font-semibold text-slate-700 px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sandbox Inward Wire Simulation */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Sandbox Incoming Payment Simulator
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Test Inward Webhook
              </span>
            </div>
            <p className="text-xs text-emerald-800/90">
              Test an incoming {selectedCurrency} ACH or wire payment (e.g. from Stripe or Upwork). The backend processes the webhook, credits your {selectedCurrency} wallet, and logs the transaction without NGN conversion.
            </p>

            <form onSubmit={handleSimulateInflow} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={simulateSender}
                  onChange={(e) => setSimulateSender(e.target.value)}
                  placeholder="e.g. Stripe Inc"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount ({selectedCurrency})</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Rail</label>
                <select
                  value={simulateRail}
                  onChange={(e) => setSimulateRail(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="ACH">ACH Direct Deposit</option>
                  <option value="WIRE">Fedwire / Domestic Wire</option>
                  <option value="SWIFT">International SWIFT</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSimulating ? (
                    <span>Processing Inward Webhook...</span>
                  ) : (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Trigger Test Inward Credit of {details?.symbol || '$'}{simulateAmount} {selectedCurrency}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {simulateSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>{simulateSuccessMessage}</div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Partner Gateway: Active & Regulated</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
