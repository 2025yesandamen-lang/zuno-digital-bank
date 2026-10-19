import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PlusCircle, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Sparkles, 
  FileText, 
  TrendingUp,
  Globe2,
  DollarSign,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  Edit3,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/apiClient';
import { User, BusinessProfile, PaymentLink, SupportedCurrency, Wallet, Transaction } from '../types/banking';

interface BusinessWorkspaceProps {
  currentUser: User;
  wallets: Record<SupportedCurrency, Wallet> | null;
  onRefreshData: () => void;
  onOpenReceiveUsd: () => void;
  onOpenInternationalTransfer: () => void;
}

export const BusinessWorkspace: React.FC<BusinessWorkspaceProps> = ({
  currentUser,
  wallets,
  onRefreshData,
  onOpenReceiveUsd,
  onOpenInternationalTransfer
}) => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LINKS' | 'EXPENSES' | 'ANALYTICS'>('LINKS');
  const [statusMessage, setStatusMessage] = useState('');

  // Edit Profile Form State
  const [tradingName, setTradingName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [registrationType, setRegistrationType] = useState<'UNREGISTERED_SOLE_TRADER' | 'CAC_REGISTERED_BN' | 'CAC_LIMITED_COMPANY'>('UNREGISTERED_SOLE_TRADER');
  const [rcNumber, setRcNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [description, setDescription] = useState('');

  // Create Link Form State
  const [linkTitle, setLinkTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [linkAmount, setLinkAmount] = useState('250');
  const [linkCurrency, setLinkCurrency] = useState<SupportedCurrency>('USD');
  const [linkDescription, setLinkDescription] = useState('');

  useEffect(() => {
    loadBusinessData();
  }, [currentUser.id]);

  const loadBusinessData = async () => {
    try {
      const [profRes, linksRes] = await Promise.all([
        api.getBusinessProfile(currentUser.id),
        api.getPaymentLinks(currentUser.id)
      ]);

      if (profRes.profile) {
        setProfile(profRes.profile);
        setTradingName(profRes.profile.tradingName);
        setBusinessCategory(profRes.profile.businessCategory);
        setRegistrationType(profRes.profile.registrationType);
        setRcNumber(profRes.profile.rcNumber || '');
        setSupportEmail(profRes.profile.supportEmail);
        setSupportPhone(profRes.profile.supportPhone);
        setBusinessAddress(profRes.profile.businessAddress);
        setDescription(profRes.profile.description);
      }
      if (linksRes.paymentLinks) {
        setPaymentLinks(linksRes.paymentLinks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveBusinessProfile({
        userId: currentUser.id,
        tradingName,
        businessCategory,
        registrationType,
        rcNumber,
        supportEmail,
        supportPhone,
        businessAddress,
        description
      });
      if (res.profile) setProfile(res.profile);
      setIsEditingProfile(false);
      setStatusMessage('Business profile successfully updated.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update profile.');
    }
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createPaymentLink({
        userId: currentUser.id,
        title: linkTitle,
        customerName,
        customerEmail,
        amount: parseFloat(linkAmount),
        currency: linkCurrency,
        description: linkDescription
      });

      if (res.paymentLink) {
        setPaymentLinks([res.paymentLink, ...paymentLinks]);
      }
      setIsCreatingLink(false);
      setLinkTitle('');
      setCustomerName('');
      setCustomerEmail('');
      setLinkAmount('250');
      setLinkDescription('');
      setStatusMessage('Digital invoice & payment link generated.');
      setTimeout(() => setStatusMessage(''), 3000);

      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (err) {}
    } catch (e: any) {
      alert(e.message || 'Failed to create payment link.');
    }
  };

  const handleSimulatePayment = async (linkId: string) => {
    try {
      const res = await api.payPaymentLink({
        linkId,
        payerName: 'Acme International Client LLC',
        paymentMethod: 'US ACH Corporate Gateway'
      });
      
      setPaymentLinks(paymentLinks.map(l => l.id === linkId ? res.link : l));
      onRefreshData();
      setStatusMessage(res.alreadySettled ? 'This invoice has already been settled.' : `Payment received! ${res.link.currency} ${res.link.amount.toLocaleString()} credited to your wallet.`);
      setTimeout(() => setStatusMessage(''), 4000);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (e: any) {
      alert(e.message || 'Payment simulation failed.');
    }
  };

  const copyLinkUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const exportStatementCsv = () => {
    const headers = ['Invoice / Link ID', 'Title', 'Customer Name', 'Amount', 'Currency', 'Reference', 'Status', 'Date'];
    const rows = paymentLinks.map(l => [
      l.id,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.customerName.replace(/"/g, '""')}"`,
      l.amount,
      l.currency,
      l.reference,
      l.status,
      new Date(l.createdAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ZUNO_Business_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ngnBal = wallets?.NGN?.availableBalance ?? 0;
  const usdBal = wallets?.USD?.availableBalance ?? 0;
  const gbpBal = wallets?.GBP?.availableBalance ?? 0;
  const eurBal = wallets?.EUR?.availableBalance ?? 0;

  return (
    <div className="space-y-6">
      
      {/* Status banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
        </div>
      )}

      {/* Business Profile Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
              {profile?.tradingName ? profile.tradingName.charAt(0) : 'B'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {profile?.tradingName || 'ZUNO Business Account'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {profile?.registrationType === 'CAC_LIMITED_COMPANY' ? 'CAC RC Registered' : 'Sole Trader / Freelance Entrepreneur'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Merchant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {profile?.description || 'Receive cross-border client payments, generate digital invoices, and collect in USD, GBP, EUR, and NGN.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                <span>Category: <strong className="text-slate-800">{profile?.businessCategory || 'Technology Services'}</strong></span>
                <span>•</span>
                <span>Support: <strong className="text-slate-800">{profile?.supportEmail || 'support@zunobank.ng'}</strong></span>
                {profile?.rcNumber && (
                  <>
                    <span>•</span>
                    <span>Reg No: <strong className="font-mono text-slate-800">{profile.rcNumber}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <button
              onClick={exportStatementCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Export Statement (CSV)
            </button>
          </div>

        </div>

        {/* Business Balances Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">NGN Commercial Balance</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              ₦{ngnBal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-700">USD International Balance</div>
            <div className="text-lg font-bold font-mono text-blue-950 mt-0.5">
              ${usdBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">GBP UK Balance</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              £{gbpBal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">EUR European Balance</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              €{eurBal.toLocaleString('en-EU', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts for Business */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={() => setIsCreatingLink(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create Payment Link / Invoice
          </button>

          <button
            onClick={onOpenReceiveUsd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <Globe2 className="w-4 h-4 text-blue-600" />
            View USD / Global Receiving Details
          </button>

          <button
            onClick={onOpenInternationalTransfer}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            Send Supplier Payment Abroad
          </button>
        </div>
      </div>

      {/* Payment Links & Invoices Table */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Links & Digital Invoices</h2>
            <p className="text-xs text-slate-500">Collect multi-currency payments from domestic & international clients</p>
          </div>
          <button
            onClick={() => setIsCreatingLink(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            New Link
          </button>
        </div>

        {paymentLinks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No payment links created yet. Click "Create Payment Link" to start billing clients.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Title / Description</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentLinks.map(link => {
                  const sym = link.currency === 'NGN' ? '₦' : link.currency === 'USD' ? '$' : link.currency === 'GBP' ? '£' : '€';
                  return (
                    <tr key={link.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{link.title}</div>
                        <div className="text-[11px] text-slate-400">{link.description}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{link.customerName}</div>
                        {link.customerEmail && <div className="text-[11px] text-slate-400">{link.customerEmail}</div>}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {sym}{link.amount.toLocaleString()} {link.currency}
                      </td>
                      <td className="py-3 px-3">
                        {link.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {link.reference}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => copyLinkUrl(link.shareUrl, link.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                        >
                          {copiedLink === link.id ? 'Copied!' : 'Copy Link'}
                        </button>

                        {link.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleSimulatePayment(link.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                            title="Simulate international client paying this invoice"
                          >
                            Simulate Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL: EDIT BUSINESS PROFILE */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Business Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trading Name / Brand Name</label>
                <input
                  type="text"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Registration Type</label>
                <select
                  value={registrationType}
                  onChange={(e) => setRegistrationType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="UNREGISTERED_SOLE_TRADER">Unregistered Sole Trader / Freelancer (Operating under Trading Name)</option>
                  <option value="CAC_REGISTERED_BN">CAC Registered Business Name (BN)</option>
                  <option value="CAC_LIMITED_COMPANY">CAC Private Limited Company (LTD / PLC)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Eligible Nigerian sole proprietors can operate under a verified trading name in compliance with partner bank rules.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
                  <input
                    type="text"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder="e.g. Technology & Design"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RC / BN Number (Optional)</label>
                  <input
                    type="text"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder="RC-192849"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Save Business Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PAYMENT LINK */}
      {isCreatingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Payment Link / Invoice</h3>
              <button onClick={() => setIsCreatingLink(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentLink} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice / Service Title</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. Website Development Sprint #2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Johnathan Miller"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={linkCurrency}
                    onChange={(e) => setLinkCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                  >
                    <option value="USD">$ USD (US Dollars)</option>
                    <option value="NGN">₦ NGN (Nigerian Naira)</option>
                    <option value="GBP">£ GBP (British Pounds)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={linkAmount}
                    onChange={(e) => setLinkAmount(e.target.value)}
                    placeholder="250.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Scope of Work</label>
                <textarea
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Details of deliverables, terms of service, or itemized services."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingLink(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  Generate Invoice Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
