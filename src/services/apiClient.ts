// Frontend API Client for ZUNO Digital Bank

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'An error occurred while processing request.');
  }
  return data;
}

export const api = {
  // Auth
  sendOtp: (phoneNumber: string) => fetchApi<{ success: boolean; message: string; otpCode?: string; expiresAt: number }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber })
  }),
  verifyOtp: (phoneNumber: string, otp: string) => fetchApi<{ success: boolean; verified: boolean; message: string }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otp })
  }),
  register: (payload: any) => fetchApi<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  login: (payload: { identifier: string; password: string }) => fetchApi<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updatePin: (payload: { userId: string; currentPin: string; newPin: string }) => fetchApi<any>('/auth/update-pin', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // User & Wallet
  getUserData: (userId?: string) => fetchApi<any>(`/users/me${userId ? `?userId=${userId}` : ''}`),
  getWalletBalance: (userId?: string) => fetchApi<any>(`/wallet/balance${userId ? `?userId=${userId}` : ''}`),
  depositMock: (payload: { userId: string; amount: number; sourceName: string }) => fetchApi<any>('/wallet/deposit-mock', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // KYC
  upgradeKYCTier2: (payload: { userId: string; bvn: string; nin?: string }) => fetchApi<any>('/kyc/upgrade/tier2', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  upgradeKYCTier3: (payload: { userId: string; idType: string; idNumber: string }) => fetchApi<any>('/kyc/upgrade/tier3', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Transfers
  getBanks: () => fetchApi<{ success: boolean; banks: any[] }>('/banks'),
  nameEnquiry: (bankCode: string, accountNumber: string) => fetchApi<any>('/transfers/name-enquiry', {
    method: 'POST',
    body: JSON.stringify({ bankCode, accountNumber })
  }),
  getBeneficiaries: (userId?: string) => fetchApi<any>(`/beneficiaries${userId ? `?userId=${userId}` : ''}`),
  transferInternal: (payload: any, idempotencyKey?: string) => fetchApi<any>('/transfers/internal', {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    body: JSON.stringify(payload)
  }),
  transferExternal: (payload: any, idempotencyKey?: string) => fetchApi<any>('/transfers/external', {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    body: JSON.stringify(payload)
  }),
  getTransactions: (userId?: string) => fetchApi<any>(`/transactions${userId ? `?userId=${userId}` : ''}`),

  // Bills
  getElectricityDiscos: () => fetchApi<any>('/bills/electricity/discos'),
  validateMeter: (discoCode: string, meterNumber: string) => fetchApi<any>('/bills/electricity/validate', {
    method: 'POST',
    body: JSON.stringify({ discoCode, meterNumber })
  }),
  payElectricity: (payload: any) => fetchApi<any>('/bills/electricity/pay', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getDataPlans: (network: string) => fetchApi<any>(`/bills/data/plans?network=${network}`),
  buyAirtime: (payload: any) => fetchApi<any>('/bills/airtime', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  buyData: (payload: any) => fetchApi<any>('/bills/data', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getTVPackages: (provider: string) => fetchApi<any>(`/bills/tv/packages?provider=${provider}`),
  validateTV: (provider: string, smartcardNumber: string) => fetchApi<any>('/bills/tv/validate', {
    method: 'POST',
    body: JSON.stringify({ provider, smartcardNumber })
  }),
  payTV: (payload: any) => fetchApi<any>('/bills/tv/pay', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Savings & Cards
  getSavingsProducts: () => fetchApi<any>('/savings/products'),
  getUserSavings: (userId?: string) => fetchApi<any>(`/savings/accounts${userId ? `?userId=${userId}` : ''}`),
  createSavingsPlan: (payload: any) => fetchApi<any>('/savings/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  withdrawSavings: (payload: any) => fetchApi<any>('/savings/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getUserCards: (userId?: string) => fetchApi<any>(`/cards${userId ? `?userId=${userId}` : ''}`),
  issueCard: (payload: any) => fetchApi<any>('/cards/issue', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  toggleFreezeCard: (payload: { userId: string; cardId: string }) => fetchApi<any>('/cards/freeze', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Notifications & Support
  getNotifications: (userId?: string) => fetchApi<any>(`/notifications${userId ? `?userId=${userId}` : ''}`),
  markNotificationsRead: (userId?: string) => fetchApi<any>('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  createSupportTicket: (payload: any) => fetchApi<any>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getSupportTickets: () => fetchApi<any>('/support/tickets'),

  // Admin
  getAdminMetrics: () => fetchApi<any>('/admin/metrics'),
  getAdminUsers: () => fetchApi<any>('/admin/users'),
  updateUserStatus: (payload: any) => fetchApi<any>('/admin/users/status', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateUserKYC: (payload: any) => fetchApi<any>('/admin/users/kyc', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getLedgerAccounts: () => fetchApi<any>('/admin/ledger/accounts'),
  getLedgerEntries: () => fetchApi<any>('/admin/ledger/entries'),
  getFraudEvents: () => fetchApi<any>('/admin/fraud/events'),
  resolveFraudEvent: (payload: any) => fetchApi<any>('/admin/fraud/resolve', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAuditLogs: () => fetchApi<any>('/admin/audit-logs'),
  updateProviderSettings: (payload: any) => fetchApi<any>('/admin/provider-settings', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
};
