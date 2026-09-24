import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authService } from '../services/authService';
import { kycService } from '../services/kycService';
import { ledgerService } from '../services/ledgerService';
import { transferService } from '../services/transferService';
import { billPaymentService } from '../services/billPaymentService';
import { savingsAndCardService } from '../services/savingsAndCardService';
import { adminService } from '../services/adminService';

export const apiRouter = Router();

// Helper error wrapper
const handleAsync = (fn: (req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      console.error(`API Error on ${req.method} ${req.path}:`, err.message);
      res.status(400).json({
        success: false,
        error: err.message || 'An unexpected banking error occurred.',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ---------------- AUTH & ONBOARDING ROUTES ----------------

apiRouter.post('/auth/send-otp', handleAsync(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ success: false, error: 'Phone number is required.' });
  const result = authService.sendOtp(phoneNumber);
  res.json({ success: true, ...result });
}));

apiRouter.post('/auth/verify-otp', handleAsync(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) return res.status(400).json({ success: false, error: 'Phone number and OTP code are required.' });
  const valid = authService.verifyOtp(phoneNumber, otp);
  res.json({ success: true, verified: valid, message: 'Phone number successfully verified.' });
}));

apiRouter.post('/auth/register', handleAsync(async (req, res) => {
  const result = authService.register(req.body);
  res.status(201).json({ success: true, ...result });
}));

apiRouter.post('/auth/login', handleAsync(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ success: false, error: 'Identifier and password are required.' });
  const result = authService.login(identifier, password);
  res.json({ success: true, ...result });
}));

apiRouter.post('/auth/update-pin', handleAsync(async (req, res) => {
  const { userId, currentPin, newPin } = req.body;
  const success = authService.updatePin(userId, currentPin, newPin);
  res.json({ success: true, message: '4-digit transaction PIN updated successfully.' });
}));

// ---------------- USER & WALLET DATA ----------------

apiRouter.get('/users/me', handleAsync(async (req, res) => {
  const userId = (req.query.userId as string) || 'USR-882109';
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

  const profile = db.profiles.get(userId);
  const kyc = kycService.getKYCProfile(userId);
  const wallet = db.wallets.get(userId);
  const account = Array.from(db.accounts.values()).find(a => a.userId === userId);

  res.json({
    success: true,
    user,
    profile,
    kyc,
    wallet,
    account
  });
}));

apiRouter.get('/wallet/balance', handleAsync(async (req, res) => {
  const userId = (req.query.userId as string) || 'USR-882109';
  const wallet = db.wallets.get(userId);
  if (!wallet) return res.status(404).json({ success: false, error: 'Wallet not found.' });
  res.json({ success: true, wallet });
}));

// ---------------- KYC ROUTES ----------------

apiRouter.post('/kyc/upgrade/tier2', handleAsync(async (req, res) => {
  const { userId, bvn, nin } = req.body;
  if (!userId || !bvn) return res.status(400).json({ success: false, error: 'User ID and 11-digit BVN are required.' });
  const kyc = await kycService.submitTier2Verification(userId, bvn, nin);
  res.json({ success: true, kyc, message: 'Tier 2 KYC upgrade successfully verified!' });
}));

apiRouter.post('/kyc/upgrade/tier3', handleAsync(async (req, res) => {
  const { userId, idType, idNumber } = req.body;
  if (!userId || !idType || !idNumber) return res.status(400).json({ success: false, error: 'User ID, document type, and document number are required.' });
  const kyc = await kycService.submitTier3Verification({ userId, idType, idNumber });
  res.json({ success: true, kyc, message: 'Tier 3 VIP KYC upgrade successfully approved!' });
}));

// ---------------- TRANSFERS & BANKING ----------------

apiRouter.get('/banks', handleAsync(async (req, res) => {
  const banks = transferService.getBanks();
  res.json({ success: true, banks });
}));

apiRouter.post('/transfers/name-enquiry', handleAsync(async (req, res) => {
  const { bankCode, accountNumber } = req.body;
  if (!bankCode || !accountNumber) return res.status(400).json({ success: false, error: 'Bank code and 10-digit account number are required.' });
  const result = await transferService.nameEnquiry(bankCode, accountNumber);
  res.json({ success: true, ...result });
}));

apiRouter.get('/beneficiaries', handleAsync(async (req, res) => {
  const userId = (req.query.userId as string) || 'USR-882109';
  const beneficiaries = transferService.getBeneficiaries(userId);
  res.json({ success: true, beneficiaries });
}));

apiRouter.post('/transfers/internal', handleAsync(async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  const tx = await transferService.transferInternal({
    ...req.body,
    idempotencyKey: idempotencyKey || req.body.idempotencyKey
  });
  res.json({ success: true, transaction: tx, message: 'Internal transfer completed successfully.' });
}));

apiRouter.post('/transfers/external', handleAsync(async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  const tx = await transferService.transferExternal({
    ...req.body,
    idempotencyKey: idempotencyKey || req.body.idempotencyKey
  });
  res.json({ success: true, transaction: tx, message: 'Interbank transfer processed.' });
}));

apiRouter.post('/wallet/deposit-mock', handleAsync(async (req, res) => {
  const { userId, amount, sourceName } = req.body;
  const tx = await transferService.depositMock(userId, Number(amount), sourceName);
  res.json({ success: true, transaction: tx, message: 'Wallet deposit credited successfully.' });
}));

apiRouter.get('/transactions', handleAsync(async (req, res) => {
  const userId = req.query.userId as string;
  const allTxs = Array.from(db.transactions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filtered = userId ? allTxs.filter(t => t.userId === userId) : allTxs;
  res.json({ success: true, transactions: filtered });
}));

// ---------------- BILL PAYMENTS ----------------

apiRouter.get('/bills/electricity/discos', (req, res) => {
  res.json({ success: true, discos: billPaymentService.getElectricityDiscos() });
});

apiRouter.post('/bills/electricity/validate', handleAsync(async (req, res) => {
  const { discoCode, meterNumber } = req.body;
  const data = await billPaymentService.validateMeter(discoCode, meterNumber);
  res.json({ success: true, ...data });
}));

apiRouter.post('/bills/electricity/pay', handleAsync(async (req, res) => {
  const tx = await billPaymentService.payElectricity(req.body);
  res.json({ success: true, transaction: tx, message: 'Electricity token generated.' });
}));

apiRouter.get('/bills/data/plans', (req, res) => {
  const network = (req.query.network as any) || 'MTN';
  res.json({ success: true, plans: billPaymentService.getDataPlans(network) });
});

apiRouter.post('/bills/airtime', handleAsync(async (req, res) => {
  const tx = await billPaymentService.buyAirtime(req.body);
  res.json({ success: true, transaction: tx, message: 'Airtime recharge successful.' });
}));

apiRouter.post('/bills/data', handleAsync(async (req, res) => {
  const tx = await billPaymentService.buyData(req.body);
  res.json({ success: true, transaction: tx, message: 'Data plan activated.' });
}));

apiRouter.get('/bills/tv/packages', (req, res) => {
  const provider = (req.query.provider as any) || 'DSTV';
  res.json({ success: true, packages: billPaymentService.getTVPackages(provider) });
});

apiRouter.post('/bills/tv/validate', handleAsync(async (req, res) => {
  const { provider, smartcardNumber } = req.body;
  const result = await billPaymentService.validateSmartcard(provider, smartcardNumber);
  res.json({ success: true, ...result });
}));

apiRouter.post('/bills/tv/pay', handleAsync(async (req, res) => {
  const tx = await billPaymentService.payTV(req.body);
  res.json({ success: true, transaction: tx, message: 'TV subscription renewed.' });
}));

// ---------------- SAVINGS & CARDS ----------------

apiRouter.get('/savings/products', (req, res) => {
  res.json({ success: true, products: savingsAndCardService.getSavingsProducts() });
});

apiRouter.get('/savings/accounts', handleAsync(async (req, res) => {
  const userId = (req.query.userId as string) || 'USR-882109';
  const accounts = savingsAndCardService.getUserSavings(userId);
  res.json({ success: true, accounts });
}));

apiRouter.post('/savings/create', handleAsync(async (req, res) => {
  const account = savingsAndCardService.createSavingsPlan(req.body);
  res.status(201).json({ success: true, account, message: 'Savings plan created.' });
}));

apiRouter.post('/savings/withdraw', handleAsync(async (req, res) => {
  const result = savingsAndCardService.withdrawSavings(req.body);
  res.json({ success: true, ...result, message: 'Savings withdrawn to primary wallet.' });
}));

apiRouter.get('/cards', handleAsync(async (req, res) => {
  const userId = (req.query.userId as string) || 'USR-882109';
  const cards = savingsAndCardService.getUserCards(userId);
  res.json({ success: true, cards });
}));

apiRouter.post('/cards/issue', handleAsync(async (req, res) => {
  const card = savingsAndCardService.issueCard(req.body);
  res.status(201).json({ success: true, card, message: 'Card issued successfully.' });
}));

apiRouter.post('/cards/freeze', handleAsync(async (req, res) => {
  const { userId, cardId } = req.body;
  const card = savingsAndCardService.toggleFreezeCard(userId, cardId);
  res.json({ success: true, card });
}));

// ---------------- NOTIFICATIONS & SUPPORT ----------------

apiRouter.get('/notifications', handleAsync(async (req, res) => {
  const userId = (req.query.userId as string) || 'USR-882109';
  const notifs = db.notifications.filter(n => n.userId === userId).reverse();
  res.json({ success: true, notifications: notifs });
}));

apiRouter.post('/notifications/mark-read', handleAsync(async (req, res) => {
  const userId = (req.body.userId as string) || 'USR-882109';
  db.notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  res.json({ success: true, message: 'All notifications marked as read.' });
}));

apiRouter.post('/support/tickets', handleAsync(async (req, res) => {
  const ticket = adminService.createSupportTicket(req.body);
  res.status(201).json({ success: true, ticket, message: 'Support ticket submitted.' });
}));

apiRouter.get('/support/tickets', handleAsync(async (req, res) => {
  const tickets = adminService.getSupportTickets();
  res.json({ success: true, tickets });
}));

// ---------------- ADMIN & LEDGER CONSOLE ----------------

apiRouter.get('/admin/metrics', handleAsync(async (req, res) => {
  const metrics = adminService.getSystemMetrics();
  res.json({ success: true, metrics });
}));

apiRouter.get('/admin/users', handleAsync(async (req, res) => {
  const users = adminService.getAllUsers();
  res.json({ success: true, users });
}));

apiRouter.post('/admin/users/status', handleAsync(async (req, res) => {
  const { userId, status, reason, adminId } = req.body;
  const user = adminService.updateUserStatus(userId, status, reason, adminId || 'ADM-01');
  res.json({ success: true, user });
}));

apiRouter.post('/admin/users/kyc', handleAsync(async (req, res) => {
  const { userId, tier, status, notes, adminId } = req.body;
  const kyc = adminService.updateKYCStatus(userId, tier, status, notes, adminId || 'ADM-01');
  res.json({ success: true, kyc });
}));

apiRouter.get('/admin/ledger/accounts', (req, res) => {
  const accounts = adminService.getAllLedgerAccounts();
  const integrity = ledgerService.verifyLedgerIntegrity();
  res.json({ success: true, accounts, integrity });
});

apiRouter.get('/admin/ledger/entries', (req, res) => {
  const entries = adminService.getAllLedgerEntries();
  res.json({ success: true, entries });
});

apiRouter.get('/admin/fraud/events', (req, res) => {
  const events = adminService.getFraudEvents();
  res.json({ success: true, events });
});

apiRouter.post('/admin/fraud/resolve', handleAsync(async (req, res) => {
  const { eventId, resolution, adminId } = req.body;
  const event = adminService.resolveFraudEvent(eventId, resolution, adminId || 'ADM-01');
  res.json({ success: true, event });
}));

apiRouter.get('/admin/audit-logs', (req, res) => {
  res.json({ success: true, logs: adminService.getAuditLogs() });
});

apiRouter.post('/admin/provider-settings', (req, res) => {
  const updated = adminService.updateProviderSimulation(req.body);
  res.json({ success: true, settings: updated });
});
