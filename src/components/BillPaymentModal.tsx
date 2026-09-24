import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Wifi, 
  Zap, 
  Tv, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ArrowLeft, 
  Lock, 
  Copy, 
  Check, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { Wallet, User, Transaction } from '../types/banking';

interface BillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'TV';
  currentUser: User;
  wallet: Wallet | null;
  onPaymentSuccess: (tx: Transaction) => void;
}

export const BillPaymentModal: React.FC<BillPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'AIRTIME',
  currentUser,
  wallet,
  onPaymentSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'TV'>(defaultTab);

  // Common State
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input -> 2: PIN -> 3: Success Token
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);

  // Airtime State
  const [airtimeOperator, setAirtimeOperator] = useState<'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'>('MTN');
  const [airtimePhone, setAirtimePhone] = useState(currentUser.phoneNumber || '');
  const [airtimeAmount, setAirtimeAmount] = useState('1000');

  // Data State
  const [dataOperator, setDataOperator] = useState<'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'>('MTN');
  const [dataPhone, setDataPhone] = useState(currentUser.phoneNumber || '');
  const [dataPlans, setDataPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Electricity State
  const [discos, setDiscos] = useState<any[]>([]);
  const [selectedDisco, setSelectedDisco] = useState('IKEDC');
  const [meterNumber, setMeterNumber] = useState('');
  const [isValidatingMeter, setIsValidatingMeter] = useState(false);
  const [verifiedMeterCustomer, setVerifiedMeterCustomer] = useState('');
  const [electricityAmount, setElectricityAmount] = useState('5000');

  // TV State
  const [tvProvider, setTvProvider] = useState<'DSTV' | 'GOTV' | 'STARTIMES'>('DSTV');
  const [tvPackages, setTvPackages] = useState<any[]>([]);
  const [selectedTvPackageId, setSelectedTvPackageId] = useState('');
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [isValidatingCard, setIsValidatingCard] = useState(false);
  const [verifiedTvCustomer, setVerifiedTvCustomer] = useState('');

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (isOpen) {
      // Load initial data
      api.getElectricityDiscos().then(res => setDiscos(res.discos)).catch(() => {});
      loadDataPlans(dataOperator);
      loadTvPackages(tvProvider);
    } else {
      setStep(1);
      setPin('');
      setErrorMessage('');
      setCompletedTx(null);
    }
  }, [isOpen, dataOperator, tvProvider]);

  const loadDataPlans = (operator: string) => {
    api.getDataPlans(operator).then(res => {
      setDataPlans(res.plans);
      if (res.plans.length > 0) setSelectedPlanId(res.plans[0].id);
    }).catch(() => {});
  };

  const loadTvPackages = (provider: string) => {
    api.getTVPackages(provider).then(res => {
      setTvPackages(res.packages);
      if (res.packages.length > 0) setSelectedTvPackageId(res.packages[0].id);
    }).catch(() => {});
  };

  // Validate Meter Handler
  const handleValidateMeter = async () => {
    if (meterNumber.length < 8) return;
    setIsValidatingMeter(true);
    setErrorMessage('');
    try {
      const res = await api.validateMeter(selectedDisco, meterNumber);
      setVerifiedMeterCustomer(res.customerName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Meter validation failed.');
      setVerifiedMeterCustomer('');
    } finally {
      setIsValidatingMeter(false);
    }
  };

  // Validate TV Smartcard Handler
  const handleValidateSmartcard = async () => {
    if (smartcardNumber.length < 9) return;
    setIsValidatingCard(true);
    setErrorMessage('');
    try {
      const res = await api.validateTV(tvProvider, smartcardNumber);
      setVerifiedTvCustomer(res.customerName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Smartcard validation failed.');
      setVerifiedTvCustomer('');
    } finally {
      setIsValidatingCard(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 4) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
        submitBillPayment(nextPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const submitBillPayment = async (authPin: string) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      let tx: Transaction;
      if (activeTab === 'AIRTIME') {
        const res = await api.buyAirtime({
          userId: currentUser.id,
          operator: airtimeOperator,
          phoneNumber: airtimePhone,
          amount: parseFloat(airtimeAmount),
          pin: authPin
        });
        tx = res.transaction;
      } else if (activeTab === 'DATA') {
        const res = await api.buyData({
          userId: currentUser.id,
          operator: dataOperator,
          phoneNumber: dataPhone,
          planId: selectedPlanId,
          pin: authPin
        });
        tx = res.transaction;
      } else if (activeTab === 'ELECTRICITY') {
        const res = await api.payElectricity({
          userId: currentUser.id,
          discoCode: selectedDisco,
          meterNumber,
          customerName: verifiedMeterCustomer || 'VERIFIED METER USER',
          amount: parseFloat(electricityAmount),
          pin: authPin
        });
        tx = res.transaction;
      } else {
        const res = await api.payTV({
          userId: currentUser.id,
          provider: tvProvider,
          smartcardNumber,
          packageId: selectedTvPackageId,
          customerName: verifiedTvCustomer || 'VERIFIED IUC USER',
          pin: authPin
        });
        tx = res.transaction;
      }

      setCompletedTx(tx);
      setStep(3);
      onPaymentSuccess(tx);

      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed.');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToken = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setPin(''); }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 1 ? 'Bills & Utilities' : step === 2 ? 'Authorize Bill Payment' : 'Receipt & Token Generated'}
              </h2>
              <p className="text-xs text-slate-500">Instant airtime, data, disco tokens & bouquets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: BILL SELECTION & CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-4">
              
              {/* Category Tabs */}
              <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveTab('AIRTIME')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'AIRTIME' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Airtime
                </button>
                <button
                  onClick={() => setActiveTab('DATA')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'DATA' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  Data
                </button>
                <button
                  onClick={() => setActiveTab('ELECTRICITY')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'ELECTRICITY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Electricity
                </button>
                <button
                  onClick={() => setActiveTab('TV')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'TV' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  TV
                </button>
              </div>

              {/* AIRTIME TAB */}
              {activeTab === 'AIRTIME' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Network Operator</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['MTN', 'AIRTEL', 'GLO', '9MOBILE'] as const).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setAirtimeOperator(op)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            airtimeOperator === op
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={airtimePhone}
                      onChange={(e) => setAirtimePhone(e.target.value)}
                      placeholder="+23480..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Amount (₦)</label>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        2% ZUNO Cashback
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['500', '1000', '2000', '5000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAirtimeAmount(val)}
                          className="py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          ₦{val}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={airtimeAmount}
                      onChange={(e) => setAirtimeAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!airtimePhone || parseFloat(airtimeAmount || '0') < 50}
                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    Continue to Pay ₦{(parseFloat(airtimeAmount || '0') || 0).toLocaleString()}
                  </button>
                </div>
              )}

              {/* DATA TAB */}
              {activeTab === 'DATA' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operator</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['MTN', 'AIRTEL', 'GLO', '9MOBILE'] as const).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => { setDataOperator(op); loadDataPlans(op); }}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            dataOperator === op
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={dataPhone}
                      onChange={(e) => setDataPhone(e.target.value)}
                      placeholder="+23480..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Data Plan</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {dataPlans.map(plan => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            selectedPlanId === plan.id
                              ? 'bg-blue-50 border-blue-500 text-slate-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{plan.name}</div>
                            <div className="text-[10px] text-slate-500">{plan.validity}</div>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-600">₦{(plan.price ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!dataPhone || !selectedPlanId}
                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    Activate Data Plan
                  </button>
                </div>
              )}

              {/* ELECTRICITY TAB */}
              {activeTab === 'ELECTRICITY' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Electricity Distribution Company (Disco)</label>
                    <select
                      value={selectedDisco}
                      onChange={(e) => { setSelectedDisco(e.target.value); setVerifiedMeterCustomer(''); }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      {discos.map(d => (
                        <option key={d.id} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prepaid Meter Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={meterNumber}
                        onChange={(e) => { setMeterNumber(e.target.value.replace(/\D/g, '')); setVerifiedMeterCustomer(''); }}
                        placeholder="e.g. 04192837461"
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleValidateMeter}
                        disabled={meterNumber.length < 8 || isValidatingMeter}
                        className="px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold border border-slate-300 disabled:opacity-50 cursor-pointer"
                      >
                        {isValidatingMeter ? 'Validating...' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {verifiedMeterCustomer && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-700">Meter Verified</div>
                        <div className="text-xs font-bold text-slate-900">{verifiedMeterCustomer}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Recharge Amount (₦)</label>
                    <input
                      type="number"
                      min="1000"
                      value={electricityAmount}
                      onChange={(e) => setElectricityAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">Estimated Units: ~{(parseFloat(electricityAmount || '0') / 68.5).toFixed(1)} kWh</div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!meterNumber || parseFloat(electricityAmount) < 1000}
                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    Pay Electricity & Generate Token
                  </button>
                </div>
              )}

              {/* TV TAB */}
              {activeTab === 'TV' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">PayTV Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['DSTV', 'GOTV', 'STARTIMES'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setTvProvider(p); loadTvPackages(p); setVerifiedTvCustomer(''); }}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            tvProvider === p
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Smartcard / IUC Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={smartcardNumber}
                        onChange={(e) => { setSmartcardNumber(e.target.value.replace(/\D/g, '')); setVerifiedTvCustomer(''); }}
                        placeholder="e.g. 1029384756"
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleValidateSmartcard}
                        disabled={smartcardNumber.length < 9 || isValidatingCard}
                        className="px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold border border-slate-300 disabled:opacity-50 cursor-pointer"
                      >
                        {isValidatingCard ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {verifiedTvCustomer && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-700">Card Owner Verified</div>
                        <div className="text-xs font-bold text-slate-900">{verifiedTvCustomer}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bouquet / Package</label>
                    <select
                      value={selectedTvPackageId}
                      onChange={(e) => setSelectedTvPackageId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      {tvPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — ₦{(pkg.price ?? 0).toLocaleString()} ({pkg.channelsCount} Channels)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!smartcardNumber || !selectedTvPackageId}
                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    Renew TV Bouquet
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: PIN AUTHORIZATION */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <div>
                <div className="text-xs text-slate-500">Authorizing {activeTab} payment</div>
                <div className="text-xs text-slate-400 mt-1">Enter your 4-digit transaction PIN (Demo PIN: 1234)</div>
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 my-4">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? 'bg-blue-600 border-blue-600 scale-110 shadow-xs'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((k, i) => {
                  if (k === '') return <div key={i} />;
                  if (k === 'DEL') {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={handleKeypadBackspace}
                        className="py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                      >
                        DEL
                      </button>
                    );
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleKeypadPress(k)}
                      className="py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-lg active:scale-95 transition-all cursor-pointer"
                    >
                      {k}
                    </button>
                  );
                })}
              </div>

              {isSubmitting && (
                <div className="text-xs text-blue-600 flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Generating STS Token & Clearing Ledger...
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COMPLETED RECEIPT & TOKEN */}
          {step === 3 && completedTx && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Bill Payment Successful</h3>
                <p className="text-xs text-slate-500">{completedTx.narration}</p>
                <div className="text-2xl font-black text-slate-900 font-mono mt-2">
                  ₦{(completedTx.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* If electricity, prominent STS token display */}
              {completedTx.metadata?.token && (
                <div className="p-4 rounded-lg bg-slate-50 border border-blue-200 text-left space-y-2">
                  <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">STS 20-Digit Electricity Token</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-black text-slate-900 tracking-widest">
                      {completedTx.metadata.token}
                    </span>
                    <button
                      onClick={() => copyToken(completedTx.metadata.token)}
                      className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">Units: <span className="text-slate-900 font-bold">{completedTx.metadata.unitsKw}</span></div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-slate-700">{completedTx.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ledger Journal ID</span>
                  <span className="font-mono text-blue-600">{completedTx.ledgerTransactionId}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
