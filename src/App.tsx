import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Send, 
  PiggyBank, 
  CreditCard, 
  History, 
  Briefcase,
  Globe2,
  ArrowLeftRight
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { WalletBalanceCard } from './components/WalletBalanceCard';
import { QuickActions, QuickActionType } from './components/QuickActions';
import { TransferModal } from './components/TransferModal';
import { BillPaymentModal } from './components/BillPaymentModal';
import { SavingsHub } from './components/SavingsHub';
import { CardsHub } from './components/CardsHub';
import { KYCTierModal } from './components/KYCTierModal';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { TransactionHistory } from './components/TransactionHistory';
import { DepositModal } from './components/DepositModal';
import { AdminConsole } from './components/AdminConsole';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';
import { AuthModal } from './components/AuthModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { BusinessWorkspace } from './components/BusinessWorkspace';
import { ReceiveInternationalModal } from './components/ReceiveInternationalModal';
import { ConvertCurrencyModal } from './components/ConvertCurrencyModal';
import { InternationalTransferModal } from './components/InternationalTransferModal';
import { api } from './services/apiClient';
import { User, Wallet, BankAccount, KYCProfile, Transaction, AppNotification, SupportedCurrency } from './types/banking';

export default function App() {
  const [currentView, setCurrentView] = useState<'APP' | 'ADMIN' | 'ARCHITECTURE'>('APP');
  const [activeAppTab, setActiveAppTab] = useState<'DASHBOARD' | 'BUSINESS' | 'SAVINGS' | 'CARDS' | 'TRANSACTIONS'>('DASHBOARD');

  // Active User & Financial State
  const [currentUserId, setCurrentUserId] = useState<string>('USR-882109');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'USR-882109',
    phoneNumber: '+2348012345678',
    email: 'john.doe@zunobank.ng',
    firstName: 'John',
    lastName: 'Doe',
    status: 'ACTIVE',
    role: 'USER',
    isPhoneVerified: true,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [allWallets, setAllWallets] = useState<Record<SupportedCurrency, Wallet> | null>(null);
  const [activeCurrency, setActiveCurrency] = useState<SupportedCurrency>('NGN');
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [kyc, setKyc] = useState<KYCProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billDefaultTab, setBillDefaultTab] = useState<'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'TV'>('AIRTIME');
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  // International & FX Modals
  const [isReceiveUsdOpen, setIsReceiveUsdOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isInternationalTransferOpen, setIsInternationalTransferOpen] = useState(false);

  // Load User and Banking State
  const loadBankingData = useCallback(async () => {
    try {
      const [userRes, txRes, notifRes] = await Promise.all([
        api.getUserData(currentUserId),
        api.getTransactions(currentUserId),
        api.getNotifications(currentUserId)
      ]);

      if (userRes.user) setCurrentUser(userRes.user);
      if (userRes.wallets) {
        setAllWallets(userRes.wallets);
        setWallet(userRes.wallets[activeCurrency] || userRes.wallet);
      } else if (userRes.wallet) {
        setWallet(userRes.wallet);
      }
      if (userRes.account) setAccount(userRes.account);
      if (userRes.kyc) setKyc(userRes.kyc);
      if (txRes.transactions) setTransactions(txRes.transactions);
      if (notifRes.notifications) setNotifications(notifRes.notifications);
    } catch (e) {
      console.error('Failed to load banking data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, activeCurrency]);

  useEffect(() => {
    loadBankingData();
  }, [loadBankingData]);

  const handleSelectCurrency = (curr: SupportedCurrency) => {
    setActiveCurrency(curr);
    if (allWallets && allWallets[curr]) {
      setWallet(allWallets[curr]);
    }
  };

  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    if (userId === 'USR-ADMIN-01') {
      setCurrentView('ADMIN');
    } else {
      setCurrentView('APP');
    }
  };

  const handleQuickAction = (action: QuickActionType) => {
    switch (action) {
      case 'TRANSFER':
        setIsTransferOpen(true);
        break;
      case 'DEPOSIT':
        setIsDepositOpen(true);
        break;
      case 'RECEIVE_USD':
        setIsReceiveUsdOpen(true);
        break;
      case 'CONVERT':
        setIsConvertOpen(true);
        break;
      case 'INTERNATIONAL':
        setIsInternationalTransferOpen(true);
        break;
      case 'BUSINESS':
        setActiveAppTab('BUSINESS');
        break;
      case 'AIRTIME':
        setBillDefaultTab('AIRTIME');
        setIsBillOpen(true);
        break;
      case 'DATA':
        setBillDefaultTab('DATA');
        setIsBillOpen(true);
        break;
      case 'ELECTRICITY':
        setBillDefaultTab('ELECTRICITY');
        setIsBillOpen(true);
        break;
      case 'TV':
        setBillDefaultTab('TV');
        setIsBillOpen(true);
        break;
      case 'SAVINGS':
        setActiveAppTab('SAVINGS');
        break;
      case 'CARDS':
        setActiveAppTab('CARDS');
        break;
      default:
        break;
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.markNotificationsRead(currentUserId);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Global Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenKYC={() => setIsKYCOpen(true)}
        onSwitchUser={handleSwitchUser}
        activeAppTab={activeAppTab}
        onSelectAppTab={setActiveAppTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* VIEW 1: BANKING APPLICATION */}
        {currentView === 'APP' && (
          <div className="space-y-6">
            
            {/* Top Navigation Tabs & Quick Action Shortcuts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-none">
                {[
                  { id: 'DASHBOARD', label: 'Wallet & Overview', icon: Building2 },
                  { id: 'BUSINESS', label: 'Business Suite (SME)', icon: Briefcase, badge: 'Invoices' },
                  { id: 'SAVINGS', label: 'Savings Vault (16.5%)', icon: PiggyBank },
                  { id: 'CARDS', label: 'Cards', icon: CreditCard },
                  { id: 'TRANSACTIONS', label: 'Statements', icon: History },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeAppTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-app-${(tab.id || '').toLowerCase()}`}
                      onClick={() => setActiveAppTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Fast Action Shortcuts */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsReceiveUsdOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                  title="Receive USD directly without forced conversion"
                >
                  <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Receive USD</span>
                </button>
                <button
                  onClick={() => setIsConvertOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                  title="Instant FX Currency Exchange"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>Swap FX</span>
                </button>
                <button
                  onClick={() => setIsTransferOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Money</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PERSONAL DASHBOARD */}
            {activeAppTab === 'DASHBOARD' && (
              <div className="space-y-6">
                
                {/* Top Row: Multi-Currency Wallet Card & Services Hub Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">
                    <WalletBalanceCard
                      wallet={wallet}
                      allWallets={allWallets}
                      activeCurrency={activeCurrency}
                      onSelectCurrency={handleSelectCurrency}
                      account={account}
                      kyc={kyc}
                      onOpenTransfer={() => setIsTransferOpen(true)}
                      onOpenDeposit={() => setIsDepositOpen(true)}
                      onOpenKYC={() => setIsKYCOpen(true)}
                      onOpenReceiveUsd={() => setIsReceiveUsdOpen(true)}
                      onOpenConvert={() => setIsConvertOpen(true)}
                    />
                  </div>

                  <div className="lg:col-span-5">
                    <QuickActions onSelectAction={handleQuickAction} />
                  </div>
                </div>

                {/* Bottom Row: Recent Transaction Feed */}
                <TransactionHistory
                  transactions={transactions}
                  onSelectTransaction={(tx) => setReceiptTx(tx)}
                />

              </div>
            )}

            {/* TAB 2: BUSINESS WORKSPACE & PAYMENT COLLECTION */}
            {activeAppTab === 'BUSINESS' && (
              <BusinessWorkspace
                currentUser={currentUser}
                wallets={allWallets}
                onRefreshData={loadBankingData}
                onOpenReceiveUsd={() => setIsReceiveUsdOpen(true)}
                onOpenInternationalTransfer={() => setIsInternationalTransferOpen(true)}
              />
            )}

            {/* TAB 3: SAVINGS */}
            {activeAppTab === 'SAVINGS' && (
              <SavingsHub
                currentUser={currentUser}
                wallet={wallet}
                onRefreshData={loadBankingData}
              />
            )}

            {/* TAB 4: CARDS */}
            {activeAppTab === 'CARDS' && (
              <CardsHub
                currentUser={currentUser}
                onRefreshData={loadBankingData}
              />
            )}

            {/* TAB 5: ALL TRANSACTIONS */}
            {activeAppTab === 'TRANSACTIONS' && (
              <TransactionHistory
                transactions={transactions}
                onSelectTransaction={(tx) => setReceiptTx(tx)}
              />
            )}

          </div>
        )}

        {/* VIEW 2: OPERATIONS & CORE LEDGER CONSOLE */}
        {currentView === 'ADMIN' && (
          <AdminConsole />
        )}

        {/* VIEW 3: MASTER ARCHITECTURE & ERD BLUEPRINT */}
        {currentView === 'ARCHITECTURE' && (
          <ArchitectureExplorer />
        )}

      </main>

      {/* Regulated Financial Institution Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="font-semibold text-slate-800">&copy; 2026 ZUNO Digital Bank Group</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Regulated banking partner rails (Providus MFB, CFSB NY, ClearBank UK)</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-emerald-700 font-medium">NDIC Insured Deposits</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>256-bit Bank Grade Security</span>
          <span>•</span>
          <span>Multi-Currency Ledgers</span>
        </div>
      </footer>

      {/* MODALS */}
      
      {/* 1. Transfer Modal (Local & NIP) */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        currentUser={currentUser}
        wallet={wallet}
        onTransferSuccess={(tx) => {
          loadBankingData();
        }}
      />

      {/* 2. Deposit / Add Money Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        currentUser={currentUser}
        account={account}
        onDepositSuccess={(tx) => {
          loadBankingData();
        }}
      />

      {/* 3. Bill Payment Modal */}
      <BillPaymentModal
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        defaultTab={billDefaultTab}
        currentUser={currentUser}
        wallet={wallet}
        onPaymentSuccess={(tx) => {
          loadBankingData();
        }}
      />

      {/* 4. KYC Verification Modal */}
      <KYCTierModal
        isOpen={isKYCOpen}
        onClose={() => setIsKYCOpen(false)}
        currentUser={currentUser}
        kyc={kyc}
        onKYCUpdated={loadBankingData}
      />

      {/* 5. Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={!!receiptTx}
        onClose={() => setReceiptTx(null)}
        transaction={receiptTx}
      />

      {/* 6. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUserId(user.id);
          setCurrentUser(user);
          loadBankingData();
        }}
      />

      {/* 7. Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkNotificationsRead}
      />

      {/* 8. Receive USD / International Payments (Zero forced conversion) */}
      <ReceiveInternationalModal
        isOpen={isReceiveUsdOpen}
        onClose={() => setIsReceiveUsdOpen(false)}
        currentUser={currentUser}
        onPaymentReceived={(tx) => {
          loadBankingData();
          setReceiptTx(tx);
        }}
      />

      {/* 9. FX Currency Conversion Modal */}
      <ConvertCurrencyModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        currentUser={currentUser}
        wallets={allWallets}
        onConversionSuccess={(tx) => {
          loadBankingData();
          setReceiptTx(tx);
        }}
      />

      {/* 10. International Outward Transfer Modal */}
      <InternationalTransferModal
        isOpen={isInternationalTransferOpen}
        onClose={() => setIsInternationalTransferOpen(false)}
        currentUser={currentUser}
        wallets={allWallets}
        kyc={kyc}
        onTransferSuccess={(tx) => {
          loadBankingData();
          setReceiptTx(tx);
        }}
      />

    </div>
  );
}
