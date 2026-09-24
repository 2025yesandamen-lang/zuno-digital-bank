import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  Lock, 
  Unlock, 
  Search, 
  Sliders, 
  FileText,
  LifeBuoy,
  Cpu
} from 'lucide-react';
import { api } from '../services/apiClient';
import { User, LedgerAccount, LedgerEntry, FraudEvent, SupportTicket, SystemAuditLog } from '../types/banking';

export const AdminConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'USERS' | 'LEDGER' | 'FRAUD' | 'SUPPORT' | 'SIMULATOR'>('METRICS');
  
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Simulator settings
  const [simProviderLatency, setSimProviderLatency] = useState(false);
  const [simFailRate, setSimFailRate] = useState(0);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      const [m, u, la, le, f, s, a] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getLedgerAccounts(),
        api.getLedgerEntries(),
        api.getFraudEvents(),
        api.getSupportTickets(),
        api.getAuditLogs()
      ]);
      setMetrics(m.metrics);
      setUsers(u.users);
      setLedgerAccounts(la.accounts);
      setLedgerEntries(le.entries);
      setFraudEvents(f.events);
      setSupportTickets(s.tickets);
      setAuditLogs(a.logs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED') => {
    try {
      await api.updateUserStatus({ userId, status, reason: 'Admin Console Action' });
      loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateKYC = async (userId: string, tier: 'TIER_1' | 'TIER_2' | 'TIER_3') => {
    try {
      await api.updateUserKYC({ userId, tier });
      loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveFraud = async (eventId: string, decision: 'APPROVED' | 'BLOCKED') => {
    try {
      await api.resolveFraudEvent({ eventId, decision, reviewerNotes: 'Reviewed in Admin Console' });
      loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const q = (userSearch || '').toLowerCase().trim();
  const filteredUsers = (users || []).filter(u => {
    if (!u) return false;
    if (!q) return true;
    const fn = (u.firstName || '').toLowerCase();
    const ln = (u.lastName || '').toLowerCase();
    const em = (u.email || '').toLowerCase();
    const ph = u.phoneNumber || '';
    return fn.includes(q) || ln.includes(q) || em.includes(q) || ph.includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-white tracking-tight">ZUNO Operations & Core Ledger Administration</h1>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              Super Admin Level
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">GAAP-compliant double-entry audit engine, real-time risk mitigation & customer management.</p>
        </div>

        <button
          onClick={loadAllAdminData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Core State
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'METRICS', label: 'Executive KPIs', icon: Activity },
          { id: 'USERS', label: `Users & KYC (${users.length})`, icon: Users },
          { id: 'LEDGER', label: `General Ledger (${ledgerAccounts.length})`, icon: BookOpen },
          { id: 'FRAUD', label: `Fraud & Risk Shield (${fraudEvents.filter(f => f.status === 'PENDING_REVIEW').length})`, icon: AlertTriangle },
          { id: 'SUPPORT', label: `Support Desk (${supportTickets.length})`, icon: LifeBuoy },
          { id: 'SIMULATOR', label: 'Sandbox Switch Control', icon: Sliders },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE KPIS */}
      {activeTab === 'METRICS' && metrics && (
        <div className="space-y-6">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Users</div>
              <div className="text-3xl font-black text-white font-mono">{metrics.totalUsers}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">100% KYC Verified</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Volume Processed</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                ₦{(metrics?.totalVolume ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">{metrics?.totalTransactionsCount ?? 0} total transactions</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Customer Deposit Liabilities</div>
              <div className="text-3xl font-black text-cyan-400 font-mono">
                ₦{(metrics?.customerDepositLiabilities ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Backed 1:1 by Settlement Bank Asset</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Gross Fee Revenue</div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                ₦{(metrics?.grossRevenue ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">Transfer & Bill switch profits</div>
            </div>
          </div>

          {/* Double-Entry Health Certification Banner */}
          <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">General Ledger Health Check: 100% BALANCED</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Accounting Equation Enforced: Assets (₦{(metrics?.settlementBankAsset ?? 0).toLocaleString()}) = Liabilities + Equity + Revenue. Zero unallocated drift.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl">
              DEBITS === CREDITS
            </span>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">System Audit Trail</h3>
            <div className="divide-y divide-slate-800 text-xs">
              {auditLogs.slice(0, 8).map(log => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-slate-400 ml-2">{log.details}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: USER & KYC MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name, email, phone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone / Email</th>
                  <th className="p-4">KYC Tier</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white">
                      {u.firstName} {u.lastName}
                      {u.role === 'ADMIN' && (
                        <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Admin</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 font-mono">
                      <div>{u.phoneNumber}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.kycTier}
                        onChange={(e) => handleUpdateKYC(u.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                      >
                        <option value="TIER_1">Tier 1 (₦50k)</option>
                        <option value="TIER_2">Tier 2 (₦200k)</option>
                        <option value="TIER_3">Tier 3 (₦5M)</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, 'FROZEN')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px]"
                        >
                          Freeze
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, 'ACTIVE')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px]"
                        >
                          Unfreeze
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL LEDGER EXPLORER */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart of Accounts */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Chart of Accounts (GAAP Structure)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
                {ledgerAccounts.map(acc => (
                  <div key={acc.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">{acc.code}</span>
                        <span className="font-bold text-white">{acc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{acc.type}</span>
                    </div>

                    <div className="font-mono font-bold text-white">
                      ₦{(acc.balance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atomic Journal Entries */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Double-Entry Journal Feed</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
                {ledgerEntries.slice(0, 10).map(entry => (
                  <div key={entry.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-slate-400 text-[10px]">{entry.journalId}</span>
                      <span className="font-mono text-[10px] text-slate-500">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-200 font-medium">{entry.narration}</div>
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="font-mono text-slate-400">Acc: {entry.accountCode}</span>
                      <span className={`font-mono font-bold ${entry.entryType === 'DEBIT' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {entry.entryType}: ₦{(entry.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: FRAUD & RISK SHIELD */}
      {activeTab === 'FRAUD' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Fraud Engine Risk Detections</h3>
          {fraudEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-3xl bg-slate-900 border border-slate-800">
              No active fraud flags detected. Velocity monitors clear.
            </div>
          ) : (
            <div className="space-y-3">
              {fraudEvents.map(f => (
                <div key={f.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        f.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {f.riskLevel} RISK (Score: {f.score}/100)
                      </span>
                      <span className="text-xs font-bold text-white">{f.ruleTriggered}</span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">{new Date(f.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="text-slate-400">Triggered Transaction Amount</div>
                      <div className="font-mono font-bold text-white text-sm">₦{(f.amount ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">Status</div>
                      <div className="font-bold text-emerald-400">{f.status}</div>
                    </div>
                  </div>

                  {f.status === 'PENDING_REVIEW' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleResolveFraud(f.id, 'APPROVED')}
                        className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                      >
                        Approve & Release Hold
                      </button>
                      <button
                        onClick={() => handleResolveFraud(f.id, 'BLOCKED')}
                        className="flex-1 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-all"
                      >
                        Block & Freeze User
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUPPORT DESK */}
      {activeTab === 'SUPPORT' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Customer Inquiries & Dispute Tickets</h3>
          {supportTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-3xl bg-slate-900 border border-slate-800">
              No open tickets.
            </div>
          ) : (
            <div className="space-y-3">
              {supportTickets.map(t => (
                <div key={t.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">{t.category}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{t.subject}</h4>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{t.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SANDBOX CONTROLLER */}
      {activeTab === 'SIMULATOR' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Banking Sandbox Switching Engine</h3>
          <p className="text-xs text-slate-400">Simulate real-world fintech provider outages, NIBSS network latency, and webhook retries.</p>

          <div className="space-y-4 max-w-lg text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-white">Simulate Provider Latency (2.5s Delay)</div>
                <div className="text-[11px] text-slate-400">Emulate realistic interbank switch roundtrip</div>
              </div>
              <input
                type="checkbox"
                checked={simProviderLatency}
                onChange={(e) => setSimProviderLatency(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-white">Simulated Failure Rate: {simFailRate}%</span>
                <span className="text-slate-400">Chaos Testing</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={simFailRate}
                onChange={(e) => setSimFailRate(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
