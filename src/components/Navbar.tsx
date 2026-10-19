import React from 'react';
import { 
  Shield, 
  Layers, 
  User as UserIcon, 
  Bell, 
  CheckCircle2, 
  ChevronDown, 
  Building2, 
  Cpu, 
  ArrowLeftRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { User, AppNotification } from '../types/banking';

interface NavbarProps {
  currentView: 'APP' | 'ADMIN' | 'ARCHITECTURE';
  setCurrentView: (view: 'APP' | 'ADMIN' | 'ARCHITECTURE') => void;
  currentUser: User;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenKYC: () => void;
  onSwitchUser: (userId: string) => void;
  activeAppTab?: 'DASHBOARD' | 'BUSINESS' | 'SAVINGS' | 'CARDS' | 'TRANSACTIONS';
  onSelectAppTab?: (tab: 'DASHBOARD' | 'BUSINESS' | 'SAVINGS' | 'CARDS' | 'TRANSACTIONS') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  notifications,
  onOpenNotifications,
  onOpenAuth,
  onOpenKYC,
  onSwitchUser,
  activeAppTab,
  onSelectAppTab
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] text-white shadow-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Mode */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => { setCurrentView('APP'); onSelectAppTab?.('DASHBOARD'); }}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-sm transition-transform group-hover:scale-105">
              Z
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-tight">ZUNO</span>
              <span className="text-[10px] text-slate-400 font-medium">Digital Bank</span>
            </div>
          </div>

          {/* Wise / Revolut Personal ↔ Business Mode Switcher */}
          {currentView === 'APP' && onSelectAppTab && (
            <div className="hidden sm:flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                id="btn-nav-mode-personal"
                onClick={() => onSelectAppTab('DASHBOARD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeAppTab !== 'BUSINESS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Personal</span>
              </button>
              <button
                type="button"
                id="btn-nav-mode-business"
                onClick={() => onSelectAppTab('BUSINESS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeAppTab === 'BUSINESS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Business (SME)</span>
              </button>
            </div>
          )}
        </div>

        {/* View Switcher: App vs Admin vs Architecture */}
        <nav className="hidden lg:flex items-center gap-1 text-xs text-slate-400">
          <button
            onClick={() => setCurrentView('APP')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'APP' ? 'text-white font-bold bg-slate-800/80' : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Banking App
          </button>
          <button
            onClick={() => setCurrentView('ADMIN')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'ADMIN' ? 'text-white font-bold bg-slate-800/80' : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Operations & Ledger
          </button>
          <button
            onClick={() => setCurrentView('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'ARCHITECTURE' ? 'text-white font-bold bg-slate-800/80' : 'hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Architecture
          </button>
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Notification Button */}
          <button
            id="btn-notifications-trigger"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-[#0F172A]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile / Switcher Dropdown */}
          <div className="relative">
            <button
              id="btn-profile-dropdown"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700/80 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-blue-400 text-white flex items-center justify-center font-bold text-xs">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  {currentUser.firstName} {currentUser.lastName}
                  {currentUser.role === 'ADMIN' && (
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1 rounded border border-amber-500/30">Admin</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentUser.phoneNumber}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="p-3 bg-slate-50 rounded-lg mb-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logged in as</div>
                  <div className="text-sm font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</div>
                  <div className="text-xs text-blue-600 font-mono">{currentUser.email}</div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={onOpenKYC}
                    className="w-full text-left flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      KYC Verification & Limits
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded">Tier 3</span>
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Switch Demo Role
                    </div>
                    <button
                      onClick={() => onSwitchUser('USR-882109')}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                      John Doe (Standard Customer)
                    </button>
                    <button
                      onClick={() => onSwitchUser('USR-ADMIN-01')}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      Amina Bello (Super Admin)
                    </button>
                  </div>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      onClick={onOpenAuth}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Create New Account / Register
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Mode Switcher Bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-[#0F172A] px-2 py-1.5 justify-around">
        <button
          onClick={() => setCurrentView('APP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentView === 'APP' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Banking
        </button>
        <button
          onClick={() => setCurrentView('ADMIN')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentView === 'ADMIN' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin & Ledger
        </button>
        <button
          onClick={() => setCurrentView('ARCHITECTURE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentView === 'ARCHITECTURE' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Architecture
        </button>
      </div>
    </header>
  );
};
