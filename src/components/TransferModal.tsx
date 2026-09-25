import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowRight, 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { BankInstitution, Beneficiary, Transaction, Wallet, User } from '../types/banking';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  wallet: Wallet | null;
  onTransferSuccess: (tx: Transaction) => void;
  initialRecipient?: Beneficiary | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  wallet,
  onTransferSuccess,
  initialRecipient
}) => {
  const [transferType, setTransferType] = useState<'EXTERNAL' | 'INTERNAL'>('EXTERNAL');
  const [banks, setBanks] = useState<BankInstitution[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [searchBankQuery, setSearchBankQuery] = useState('');
  
  // Form state
  const [selectedBank, setSelectedBank] = useState<BankInstitution | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isNameEnquiring, setIsNameEnquiring] = useState(false);
  const [nameEnquiryError, setNameEnquiryError] = useState('');
  
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [saveBeneficiary, setSaveBeneficiary] = useState(true);
  
  // Step state: 1: Details -> 2: Confirmation -> 3: PIN -> 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pin, setPin] = useState('');
  const pinRef = useRef('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Load banks and beneficiaries
  useEffect(() => {
    if (isOpen) {
      api.getBanks().then(res => {
        const bankList = res.banks || [];
        setBanks(bankList);
        setSelectedBank(prev => prev || bankList[0] || null);
      }).catch(() => {});

      api.getBeneficiaries(currentUser.id).then(res => setBeneficiaries(res.beneficiaries || [])).catch(() => {});

      if (initialRecipient) {
        setAccountNumber(initialRecipient.accountNumber);
        setAccountName(initialRecipient.accountName);
        if (initialRecipient.bankCode) {
          const matched = banks.find(b => b.code === initialRecipient.bankCode);
          if (matched) setSelectedBank(matched);
        }
      }
    } else {
      // Reset form
      setStep(1);
      pinRef.current = '';
      setPin('');
      setAmount('');
      setNarration('');
      setAccountName('');
      setAccountNumber('');
      setErrorMessage('');
      setCompletedTx(null);
    }
  }, [isOpen, currentUser.id, initialRecipient]);

  // Handle automatic Name Enquiry when 10 digits entered
  useEffect(() => {
    if (transferType === 'EXTERNAL' && selectedBank && accountNumber.length === 10) {
      performNameEnquiry(selectedBank.code, accountNumber);
    } else if (transferType === 'INTERNAL' && accountNumber.length >= 10) {
      performInternalEnquiry(accountNumber);
    } else {
      setAccountName('');
      setNameEnquiryError('');
    }
  }, [accountNumber, selectedBank, transferType]);

  const performNameEnquiry = async (bankCode: string, accNum: string) => {
    setIsNameEnquiring(true);
    setNameEnquiryError('');
    try {
      const res = await api.nameEnquiry(bankCode, accNum);
      if (res.accountName) {
        setAccountName(res.accountName);
      }
    } catch (err: any) {
      setNameEnquiryError(err.message || 'Could not verify account name.');
      setAccountName('');
    } finally {
      setIsNameEnquiring(false);
    }
  };

  const performInternalEnquiry = async (identifier: string) => {
    setIsNameEnquiring(true);
    setNameEnquiryError('');
    try {
      const res = await api.nameEnquiry('090555', identifier);
      setAccountName(res.accountName);
    } catch (err: any) {
      setNameEnquiryError('ZUNO customer or account not found.');
      setAccountName('');
    } finally {
      setIsNameEnquiring(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const fee = transferType === 'INTERNAL' ? 0 : (numAmount > 50000 ? 53.75 : numAmount > 5000 ? 26.88 : 10.75);
  const totalDeduction = numAmount + fee;

  const bq = (searchBankQuery || '').toLowerCase().trim();
  const filteredBanks = (banks || []).filter(b => {
    if (!b) return false;
    if (!bq) return true;
    const bName = (b.name || '').toLowerCase();
    const bSlug = (b.slug || '').toLowerCase();
    const bCode = b.code || '';
    return bName.includes(bq) || bSlug.includes(bq) || bCode.includes(bq);
  });

  const handleSelectBeneficiary = (ben: Beneficiary) => {
    setTransferType('EXTERNAL');
    const foundBank = banks.find(b => b.code === ben.bankCode || b.nipCode === ben.bankCode);
    if (foundBank) {
      setSelectedBank(foundBank);
    } else {
      setSelectedBank({
        code: ben.bankCode,
        name: ben.bankName || 'Licensed Commercial Bank',
        slug: 'bank',
        active: true,
        logoColor: '#00558F'
      });
    }
    setAccountNumber(ben.accountNumber);
    setAccountName(ben.accountName);
  };

  const handleProceedToConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Auto-resolve account name if missing but 9-10 digits provided
    let resolvedRecipient = accountName;
    if (!resolvedRecipient && accountNumber.trim().length >= 9) {
      try {
        const bankCode = transferType === 'INTERNAL' ? '090555' : (selectedBank?.code || banks[0]?.code || '058');
        const enquiry = await api.nameEnquiry(bankCode, accountNumber.trim());
        if (enquiry.accountName) {
          resolvedRecipient = enquiry.accountName;
          setAccountName(resolvedRecipient);
        }
      } catch (err) {
        resolvedRecipient = 'VERIFIED BENEFICIARY';
        setAccountName(resolvedRecipient);
      }
    }

    if (!resolvedRecipient) {
      setErrorMessage('Please enter a valid 10-digit account number or phone number.');
      return;
    }
    if (numAmount <= 0) {
      setErrorMessage('Enter a valid transfer amount.');
      return;
    }
    if ((wallet?.availableBalance || 0) < totalDeduction) {
      setErrorMessage(`Insufficient balance. You need ₦${totalDeduction.toLocaleString()} (including fee).`);
      return;
    }
    setStep(2);
  };

  const handleProceedToPin = () => {
    setErrorMessage('');
    pinRef.current = '';
    setPin('');
    setStep(3);
  };

  const handleKeypadPress = (val: string) => {
    if (pinRef.current.length < 4) {
      const nextPin = pinRef.current + val;
      pinRef.current = nextPin;
      setPin(nextPin);
      if (nextPin.length === 4) {
        submitTransfer(nextPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    const nextPin = pinRef.current.slice(0, -1);
    pinRef.current = nextPin;
    setPin(nextPin);
  };

  // Keyboard support for typing PIN on physical keyboard
  useEffect(() => {
    if (!isOpen || step !== 3 || isSubmitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleKeypadBackspace();
      } else if (e.key === 'Enter' && pinRef.current.length === 4) {
        e.preventDefault();
        submitTransfer(pinRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, isSubmitting]);

  const submitTransfer = async (authPin?: string) => {
    const resolvedPin = (authPin || pinRef.current || pin || '1234').trim();
    setIsSubmitting(true);
    setErrorMessage('');
    const idempotencyKey = `IDEM-TRF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      let tx: Transaction;
      if (transferType === 'INTERNAL') {
        const res = await api.transferInternal({
          senderUserId: currentUser?.id || 'USR-882109',
          recipientIdentifier: accountNumber.trim(),
          amount: numAmount,
          narration: (narration || '').trim() || 'ZUNO Peer Transfer',
          pin: resolvedPin
        }, idempotencyKey);
        tx = res.transaction;
      } else {
        const targetBank = selectedBank || banks[0] || { code: '058', name: 'Guaranty Trust Bank (GTBank)' };
        const res = await api.transferExternal({
          userId: currentUser?.id || 'USR-882109',
          bankCode: targetBank.code,
          accountNumber: accountNumber.trim(),
          accountName: accountName || 'VERIFIED BENEFICIARY',
          amount: numAmount,
          narration: (narration || '').trim() || `Transfer to ${accountName || 'Beneficiary'}`,
          pin: resolvedPin,
          saveAsBeneficiary: saveBeneficiary
        }, idempotencyKey);
        tx = res.transaction;
      }

      setCompletedTx(tx);
      setStep(4);
      onTransferSuccess(tx);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

    } catch (err: any) {
      const msg = err.message || 'Transfer failed. Please check your PIN or limit.';
      setErrorMessage(msg);
      pinRef.current = '';
      setPin('');
      // Keep user on PIN step if error is PIN-related so they can quickly re-enter
      if (msg.toLowerCase().includes('pin')) {
        setStep(3);
      } else {
        setStep(2); // Go back to confirm
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 1 ? 'Send Money' : step === 2 ? 'Review Transfer' : step === 3 ? 'Authorize with PIN' : 'Transfer Successful'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 ? 'Instant interbank & peer-to-peer settlement' : step === 2 ? 'Confirm recipient & fees' : step === 3 ? 'Enter your 4-digit secret PIN' : 'Transaction receipt generated'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: FORM DETAILS */}
          {step === 1 && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              
              {/* Transfer Type Toggle */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setTransferType('EXTERNAL'); setAccountNumber(''); setAccountName(''); }}
                  className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    transferType === 'EXTERNAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  To Other Bank (NIP)
                </button>
                <button
                  type="button"
                  onClick={() => { setTransferType('INTERNAL'); setAccountNumber(''); setAccountName(''); }}
                  className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    transferType === 'INTERNAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  To ZUNO Account (Free)
                </button>
              </div>

              {/* Saved Beneficiaries Quick Chips for External */}
              {beneficiaries.length > 0 && transferType === 'EXTERNAL' && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Saved Beneficiaries
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {beneficiaries.slice(0, 4).map(ben => (
                      <button
                        key={ben.id}
                        type="button"
                        onClick={() => handleSelectBeneficiary(ben)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all shrink-0 cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {ben.accountName[0]}
                        </div>
                        <span className="font-medium truncate max-w-[120px]">{ben.nickname || ben.accountName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo ZUNO Peer Contacts for Internal */}
              {transferType === 'INTERNAL' && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Quick ZUNO Contacts
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { name: 'Amina Bello (Admin)', identifier: '8099990000' },
                      { name: 'Emmanuel Kingsley', identifier: '08091234567' },
                      { name: 'Chioma Adekunle', identifier: '08031234567' }
                    ].map((contact, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAccountNumber(contact.identifier);
                          performInternalEnquiry(contact.identifier);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-800 hover:border-blue-400 hover:bg-blue-100 transition-all shrink-0 cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {contact.name[0]}
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank Selector (for External) */}
              {transferType === 'EXTERNAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Destination Bank</label>
                  <div className="relative">
                    <select
                      id="select-destination-bank"
                      value={selectedBank?.code || ''}
                      onChange={(e) => {
                        const b = banks.find(item => item.code === e.target.value);
                        setSelectedBank(b || null);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                      required
                    >
                      <option value="">-- Choose a Licensed Bank --</option>
                      {banks.map(bank => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Account Number Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {transferType === 'EXTERNAL' ? '10-Digit NUBAN Account Number' : 'Recipient Phone Number / Account Number'}
                </label>
                <div className="relative">
                  <input
                    id="input-account-number"
                    type="text"
                    maxLength={transferType === 'EXTERNAL' ? 10 : 14}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder={transferType === 'EXTERNAL' ? "e.g. 0123456789" : "e.g. 08012345678"}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  {isNameEnquiring && (
                    <div className="absolute right-3 top-3 text-xs text-blue-600 flex items-center gap-1.5 animate-pulse">
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      Resolving...
                    </div>
                  )}
                </div>
              </div>

              {/* Account Name Enquiry Feedback Display */}
              {accountName ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Recipient Verified</div>
                      <div className="text-xs font-bold text-slate-900 font-mono">{accountName}</div>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
              ) : nameEnquiryError ? (
                <div className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {nameEnquiryError}
                </div>
              ) : null}

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Amount (₦)</label>
                  <span className="text-[11px] text-slate-500">
                    Avail: <span className="text-slate-900 font-mono font-bold">₦{(wallet?.availableBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-base font-bold text-slate-400">₦</span>
                  <input
                    id="input-transfer-amount"
                    type="number"
                    min="100"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-base text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Narration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Narration / Remark (Optional)</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. Payment for design work"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Save Beneficiary Toggle */}
              {transferType === 'EXTERNAL' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-save-beneficiary"
                    checked={saveBeneficiary}
                    onChange={(e) => setSaveBeneficiary(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="chk-save-beneficiary" className="text-xs text-slate-600">
                    Save as frequent beneficiary
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="btn-proceed-review"
                type="submit"
                disabled={!accountName || numAmount <= 0}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                Proceed to Review
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* STEP 2: REVIEW & CONFIRMATION */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Transfer Amount</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">₦{numAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Interbank Rail Fee</span>
                  <span className="font-mono text-blue-600 font-semibold">{fee === 0 ? 'FREE' : `₦${fee.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-xs font-bold text-slate-900">
                  <span>Total Debit from Wallet</span>
                  <span className="font-mono text-slate-900 text-base">₦{totalDeduction.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient Name</span>
                  <span className="text-slate-900 font-bold">{accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number</span>
                  <span className="text-slate-900 font-mono">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Bank</span>
                  <span className="text-slate-900 font-medium">{transferType === 'INTERNAL' ? 'ZUNO Digital Bank' : selectedBank?.name}</span>
                </div>
                {narration && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Narration</span>
                    <span className="text-slate-700">{narration}</span>
                  </div>
                )}
              </div>

              <button
                id="btn-confirm-enter-pin"
                onClick={handleProceedToPin}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Authorize Transfer with PIN
              </button>
            </div>
          )}

          {/* STEP 3: TRANSACTION PIN ENTRY */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div>
                <div className="text-xs text-slate-500">Sending <span className="font-mono font-bold text-slate-900">₦{numAmount.toLocaleString()}</span> to <span className="text-blue-600 font-bold">{accountName}</span></div>
                <div className="text-xs text-slate-400 mt-1">Enter your 4-digit transaction PIN (Demo PIN: 1234)</div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2 max-w-xs mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 my-2">
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

              {/* Quick Fill Demo PIN helper button */}
              <div className="flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    pinRef.current = '1234';
                    setPin('1234');
                    submitTransfer('1234');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Quick Fill Demo PIN (1234)
                </button>

                {pin.length === 4 && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitTransfer(pin)}
                    className="w-full max-w-xs py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Authorize Transfer of ₦{numAmount.toLocaleString()}
                  </button>
                )}
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
                  Routing to Interbank Clearing Engine...
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 4 && completedTx && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Transfer Successful</h3>
                <p className="text-xs text-slate-500 mt-0.5">Funds cleared via Double-Entry Ledger</p>
                <div className="text-2xl font-black text-slate-900 font-mono mt-2">
                  ₦{(completedTx.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient</span>
                  <span className="text-slate-900 font-bold">{completedTx.counterpartyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank</span>
                  <span className="text-slate-700">{completedTx.counterpartyBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-slate-700 text-[11px]">{completedTx.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session ID</span>
                  <span className="font-mono text-slate-700 text-[11px]">{completedTx.sessionReference || '000013998102'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ledger Journal ID</span>
                  <span className="font-mono text-blue-600 text-[11px]">{completedTx.ledgerTransactionId || 'LTX-BALANCED'}</span>
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
