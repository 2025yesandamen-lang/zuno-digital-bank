import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Send, 
  PlusCircle, 
  Smartphone, 
  Wifi, 
  Zap, 
  Tv, 
  PiggyBank, 
  CreditCard, 
  History, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { WalletBalanceCard } from './components/WalletBalanceCard';
import { QuickActions } from './components/QuickActions';
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
import { api } from './services/apiClient';
import { User, Wallet, BankAccount, KYCProfile, Transaction, AppNotification } from './types/banking';

export default function App() {
  const [currentView, setCurrentView] = useState<'APP' | 'ADMIN' | 'ARCHITECTURE'>('APP');
  const [activeAppTab, setActiveAppTab] = useState<'DASHBOARD' | 'SAVINGS' | 'CARDS' | 'TRANSACTIONS'>('DASHBOARD');

  // Active User & Financial State
  const [currentUserId, setCurrentUserId] = useState<string>('USR-882109');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'USR-882109',
    phoneNumber: '+2348012345678',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    kycTier: 'TIER_1',
    status: 'ACTIVE',
    role: 'CUSTOMER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [wallet, setWallet] = useState<Wallet | null>(null);
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

  // Load User and Banking State
  const loadBankingData = useCallback(async () => {
    try {
      const [userRes, txRes, notifRes] = await Promise.all([
        api.getUserData(currentUserId),
        api.getTransactions(currentUserId),
        api.getNotifications(currentUserId)
      ]);

      if (userRes.user) setCurrentUser(userRes.user);
      if (userRes.wallet) setWallet(userRes.wallet);
      if (userRes.account) setAccount(userRes.account);
      if (userRes.kyc) setKyc(userRes.kyc);
      if (txRes.transactions) setTransactions(txRes.transactions);
      if (notifRes.notifications) setNotifications(notifRes.notifications);
    } catch (e) {
      console.error('Failed to load banking data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadBankingData();
  }, [loadBankingData]);

  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    if (userId === 'USR-ADMIN-01') {
      setCurrentView('ADMIN');
    } else {
      setCurrentView('APP');
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'TRANSFER':
        setIsTransferOpen(true);
        break;
      case 'DEPOSIT':
        setIsDepositOpen(true);
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
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* VIEW 1: PERSONAL BANKING APP */}
        {currentView === 'APP' && (
          <div className="space-y-6">
            
            {/* Banking Sub-Navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex gap-2 overflow-x-auto text-xs pb-1">
                {[
                  { id: 'DASHBOARD', label: 'Wallet & Overview', icon: Building2 },
                  { id: 'SAVINGS', label: 'ZUNO Save (16.5% p.a.)', icon: PiggyBank },
                  { id: 'CARDS', label: 'Debit & Virtual Cards', icon: CreditCard },
                  { id: 'TRANSACTIONS', label: 'Audit Statements', icon: History },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-app-${(tab.id || '').toLowerCase()}`}
                      onClick={() => setActiveAppTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                        activeAppTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Fast Transfer Shortcut */}
              <button
                onClick={() => setIsTransferOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Quick Transfer
              </button>
            </div>

            {/* TAB: DASHBOARD */}
            {activeAppTab === 'DASHBOARD' && (
              <div className="space-y-6">
                
                {/* Top Row: Wallet Card & Quick Actions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-6">
                    <WalletBalanceCard
                      wallet={wallet}
                      account={account}
                      kyc={kyc}
                      onOpenTransfer={() => setIsTransferOpen(true)}
                      onOpenDeposit={() => setIsDepositOpen(true)}
                      onOpenKYC={() => setIsKYCOpen(true)}
                    />
                  </div>

                  <div className="lg:col-span-6">
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

            {/* TAB: SAVINGS */}
            {activeAppTab === 'SAVINGS' && (
              <SavingsHub
                currentUser={currentUser}
                wallet={wallet}
                onRefreshData={loadBankingData}
              />
            )}

            {/* TAB: CARDS */}
            {activeAppTab === 'CARDS' && (
              <CardsHub
                currentUser={currentUser}
                onRefreshData={loadBankingData}
              />
            )}

            {/* TAB: ALL TRANSACTIONS */}
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

      {/* Professional Polish System Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 mt-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Core Ledger Active: 100% Immutability</span>
          </div>
          <span className="text-slate-300">•</span>
          <span>&copy; 2026 ZUNO Financial Technologies Group</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
          <span>ENV: PRODUCTION_READY</span>
          <span>REGION: NG-LAGOS-1</span>
          <span>NODE_ID: ZN-8842-X</span>
        </div>
      </footer>

      {/* MODALS */}
      
      {/* 1. Transfer Modal */}
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

    </div>
  );
}
