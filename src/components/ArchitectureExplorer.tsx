import React, { useState } from 'react';
import { 
  Cpu, 
  Database, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Code2, 
  GitBranch, 
  BookOpen, 
  Server,
  Lock,
  ArrowRight
} from 'lucide-react';

export const ArchitectureExplorer: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'DATABASE' | 'LEDGER_RULES' | 'STATE_MACHINE' | 'API_SPEC'>('OVERVIEW');

  return (
    <div className="space-y-6">
      
      {/* Blueprint Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-black text-white tracking-tight">ZUNO Master Architecture & Engineering Blueprint</h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              PRD Specification
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete technical specification covering double-entry accounting, state machines, and regulatory compliance.
          </p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'OVERVIEW', label: 'System Topology & Architecture', icon: Layers },
          { id: 'DATABASE', label: 'Database Schema & ERD', icon: Database },
          { id: 'LEDGER_RULES', label: 'Double-Entry Accounting Matrix', icon: BookOpen },
          { id: 'STATE_MACHINE', label: 'Transaction State Machine', icon: GitBranch },
          { id: 'API_SPEC', label: 'API Specifications', icon: Code2 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all shrink-0 cursor-pointer ${
                activeSection === tab.id
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

      {/* SECTION 1: SYSTEM TOPOLOGY */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Client & Edge Gateway</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                React 18 SPA + Vite with SHA-256 PIN hashing, JWT session management, TLS 1.3 encryption, and Idempotency key injection.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Core Banking Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic service layer containing LedgerService, TransferService, FraudEngine, KYCService, and BillPaymentService.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-sm font-bold text-white">External Financial Rails</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                NIBSS NIP Interbank Switch, Paystack/Monnify Virtual Accounts, Disco STS Token Generators, and VTU aggregators.
              </p>
            </div>

          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Core Security & Fraud Defense Engine</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400">Rule 1: Velocity Shield</span>
                <p className="text-slate-400">Flags accounts making &gt; 3 transactions within 60 seconds to prevent automated drain attacks.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400">Rule 2: Out-of-Pattern High Value</span>
                <p className="text-slate-400">Automatically routes transfers &gt; ₦500,000 to manual compliance queue with Step-Up OTP.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400">Rule 3: Idempotency Protection</span>
                <p className="text-slate-400">Unique Idempotency-Key headers prevent double-charging during network timeout retries.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400">Rule 4: Tier Limit Enforcement</span>
                <p className="text-slate-400">Strictly blocks transfers exceeding CBN tiered limits (₦50k for Tier 1, ₦200k for Tier 2, ₦5M for Tier 3).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PRISMA / DATABASE ERD */}
      {activeSection === 'DATABASE' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Prisma Relational Database Schema</h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">PostgreSQL Compliant</span>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`model User {
  id            String         @id @default(uuid())
  phoneNumber   String         @unique
  email         String         @unique
  passwordHash  String
  pinHash       String
  kycTier       KYCTier        @default(TIER_1)
  status        AccountStatus  @default(ACTIVE)
  wallet        Wallet?
  bankAccounts  BankAccount[]
  transactions  Transaction[]
  savings       SavingsAccount[]
  cards         VirtualCard[]
}

model Wallet {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  availableBalance Decimal  @default(0.00)
  pendingBalance   Decimal  @default(0.00)
  ledgerBalance    Decimal  @default(0.00)
  currency         String   @default("NGN")
}

model LedgerAccount {
  id          String         @id @default(uuid())
  code        String         @unique // e.g. 1001-ASSET, 2001-LIABILITY
  name        String
  type        AccountType    // ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  balance     Decimal        @default(0.00)
  entries     LedgerEntry[]
}

model LedgerEntry {
  id          String         @id @default(uuid())
  journalId   String
  accountCode String
  account     LedgerAccount  @relation(fields: [accountCode], references: [code])
  entryType   EntryType      // DEBIT | CREDIT
  amount      Decimal
  narration   String
  createdAt   DateTime       @default(now())
}`}
          </pre>
        </div>
      )}

      {/* SECTION 3: DOUBLE-ENTRY ACCOUNTING RULES */}
      {activeSection === 'LEDGER_RULES' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">ZUNO Double-Entry Accounting Rulebook</h3>
          <p className="text-xs text-slate-400">Every money movement generates balanced Debit and Credit entries with zero loss.</p>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-3 space-y-1">
              <div className="font-bold text-white">1. Inward Customer Deposit (₦100,000)</div>
              <div className="text-slate-400 flex gap-4 font-mono">
                <span className="text-emerald-400">DEBIT: 1001-SETTLEMENT-ASSET (+₦100,000)</span>
                <span className="text-amber-400">CREDIT: 2001-CUSTOMER-DEPOSIT-LIABILITY (+₦100,000)</span>
              </div>
            </div>

            <div className="py-3 space-y-1">
              <div className="font-bold text-white">2. Outward Interbank Transfer (₦10,000 + ₦26.88 Fee)</div>
              <div className="text-slate-400 flex flex-col gap-1 font-mono">
                <span className="text-amber-400">DEBIT: 2001-CUSTOMER-DEPOSIT-LIABILITY (-₦10,026.88)</span>
                <span className="text-emerald-400">CREDIT: 1001-SETTLEMENT-ASSET (-₦10,000.00)</span>
                <span className="text-cyan-400">CREDIT: 4001-TRANSFER-FEE-REVENUE (+₦26.88)</span>
              </div>
            </div>

            <div className="py-3 space-y-1">
              <div className="font-bold text-white">3. Electricity Token Purchase (₦5,000)</div>
              <div className="text-slate-400 flex flex-col gap-1 font-mono">
                <span className="text-amber-400">DEBIT: 2001-CUSTOMER-DEPOSIT-LIABILITY (-₦5,000.00)</span>
                <span className="text-emerald-400">CREDIT: 1002-DISCO-SETTLEMENT-CLEARING (+₦4,900.00)</span>
                <span className="text-cyan-400">CREDIT: 4002-BILL-COMMISSION-REVENUE (+₦100.00)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: STATE MACHINE */}
      {activeSection === 'STATE_MACHINE' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Transaction Finite State Machine</h3>
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold">INITIATED</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-bold">PIN_VERIFIED</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold">FRAUD_CLEARED</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold">SETTLED</span>
            </div>

            <div className="pt-2 text-slate-400 leading-relaxed text-[11px]">
              If external network switch times out, transaction transitions to <span className="text-amber-400 font-bold">PENDING_RECONCILIATION</span> and background worker initiates TSQ (Transaction Status Query) every 30s. If rejected by receiving bank, atomic rollback restores user ledger balance.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: API SPECIFICATION */}
      {activeSection === 'API_SPEC' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">REST Endpoints Catalog</h3>
          <div className="divide-y divide-slate-800 text-xs font-mono">
            <div className="py-2 flex items-center justify-between">
              <span className="text-emerald-400">POST /api/auth/register</span>
              <span className="text-slate-400">Customer Registration & Account Number Creation</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-emerald-400">POST /api/transfers/external</span>
              <span className="text-slate-400">Interbank NIP Transfer with Idempotency</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-emerald-400">POST /api/transfers/name-enquiry</span>
              <span className="text-slate-400">Instant NUBAN Account Resolution</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-emerald-400">POST /api/bills/electricity/pay</span>
              <span className="text-slate-400">Prepaid Meter STS Token Generation</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-emerald-400">GET /api/admin/metrics</span>
              <span className="text-slate-400">Executive Ledger & Compliance KPI Engine</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
