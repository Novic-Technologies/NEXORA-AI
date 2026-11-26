import type {
  AccountStatus,
  AdminOverviewData,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  EnrichedMachineRental,
  FleetDispatch,
  IdentityDocType,
  InvestorClassification,
  InvestorProfile,
  RobotMachine,
  UserRole,
  WalletTransaction,
} from '../types.ts';

let inMemoryAuthToken: string | null = null;

export function getAuthToken(): string | null {
  return inMemoryAuthToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryAuthToken = token;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryAuthToken) {
    headers.set('Authorization', `Bearer ${inMemoryAuthToken}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export interface OverviewResponse {
  masterAdminClaimed: boolean;
  stats: {
    totalFleetUnits: number;
    availableFleetUnits: number;
    activeHubs: number;
    dailyRateRange: string;
    supportedCoins: number;
    verifiedInvestors: number;
  };
  featuredRobots: RobotMachine[];
  dispatches: FleetDispatch[];
}

export function fetchOverview(): Promise<OverviewResponse> {
  return apiRequest<OverviewResponse>('/api/overview');
}

export async function claimMasterAdmin(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  avatarUrl?: string;
}): Promise<{ token: string; investor: InvestorProfile }> {
  const res = await apiRequest<{ token: string; investor: InvestorProfile }>(
    '/api/auth/claim-master-admin',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setAuthToken(res.token);
  return res;
}

export async function registerInvestor(payload: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
  country: string;
  city?: string;
  avatarUrl?: string;
  investorType: InvestorClassification;
}): Promise<{ token: string; investor: InvestorProfile }> {
  const res = await apiRequest<{ token: string; investor: InvestorProfile }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setAuthToken(res.token);
  return res;
}

export async function loginInvestor(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; investor: InvestorProfile }> {
  const res = await apiRequest<{ token: string; investor: InvestorProfile }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setAuthToken(res.token);
  return res;
}

export async function loginDemoInvestor(): Promise<{
  token: string;
  investor: InvestorProfile;
}> {
  const res = await apiRequest<{ token: string; investor: InvestorProfile }>(
    '/api/auth/demo-investor',
    { method: 'POST' }
  );
  setAuthToken(res.token);
  return res;
}

export async function logoutInvestor(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  } finally {
    setAuthToken(null);
  }
}

export function fetchCurrentInvestor(): Promise<{ investor: InvestorProfile }> {
  return apiRequest<{ investor: InvestorProfile }>('/api/auth/me');
}

export function updateInvestorProfile(payload: {
  fullName: string;
  phone: string;
  companyName: string;
  country: string;
  city?: string;
  avatarUrl?: string;
  investorType: InvestorClassification;
}): Promise<{ investor: InvestorProfile }> {
  return apiRequest<{ investor: InvestorProfile }>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function submitVerificationRecords(payload: {
  avatarUrl?: string;
  documentType: IdentityDocType;
  documentNumber: string;
  frontImageUrl: string;
  backOrSelfieUrl: string;
  sourceOfFunds?: string;
  annualCapacity?: string;
  financialProofUrl?: string;
  financialProofNote?: string;
}): Promise<{ investor: InvestorProfile }> {
  return apiRequest<{ investor: InvestorProfile }>('/api/auth/verification', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchRobots(): Promise<{ robots: RobotMachine[] }> {
  return apiRequest<{ robots: RobotMachine[] }>('/api/robots');
}

export function submitCryptoDeposit(payload: {
  coinSymbol: BinanceCoinSymbol;
  networkCode: BinanceNetworkCode;
  amountUsd: number;
  txHash?: string;
  receiptImageUrl?: string;
}): Promise<{ investor: InvestorProfile; transaction: WalletTransaction }> {
  return apiRequest<{ investor: InvestorProfile; transaction: WalletTransaction }>(
    '/api/wallet/deposit',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export function submitCryptoWithdrawal(payload: {
  coinSymbol: BinanceCoinSymbol;
  networkCode: BinanceNetworkCode;
  amountUsd: number;
  walletAddress: string;
  memo?: string;
}): Promise<{ investor: InvestorProfile; transaction: WalletTransaction }> {
  return apiRequest<{ investor: InvestorProfile; transaction: WalletTransaction }>(
    '/api/wallet/withdraw',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export function rentRobotMachine(payload: {
  robotId: string;
  quantity: number;
}): Promise<{
  investor: InvestorProfile;
  rental: EnrichedMachineRental;
  robot: RobotMachine;
  transaction: WalletTransaction;
}> {
  return apiRequest('/api/rentals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchRentals(): Promise<{ rentals: EnrichedMachineRental[] }> {
  return apiRequest<{ rentals: EnrichedMachineRental[] }>('/api/rentals');
}

export function claimRentalYield(rentalId: string): Promise<{
  investor: InvestorProfile;
  rental: EnrichedMachineRental;
  transaction: WalletTransaction;
}> {
  return apiRequest(`/api/rentals/${encodeURIComponent(rentalId)}/claim`, {
    method: 'POST',
  });
}

export function fetchTransactions(): Promise<{ transactions: WalletTransaction[] }> {
  return apiRequest<{ transactions: WalletTransaction[] }>('/api/transactions');
}

// Master Admin / Staff endpoints
export function fetchAdminOverview(): Promise<AdminOverviewData> {
  return apiRequest<AdminOverviewData>('/api/admin/overview');
}

export function reviewAdminTransaction(
  txId: string,
  payload: { action: 'approve' | 'reject'; adminNote?: string; txHash?: string }
): Promise<{ transaction: WalletTransaction; investor: InvestorProfile }> {
  return apiRequest(`/api/admin/transactions/${encodeURIComponent(txId)}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function reviewUserKyc(
  userId: string,
  payload: { action: 'approve' | 'reject'; reviewNote?: string }
): Promise<{ user: InvestorProfile }> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/kyc`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUserRole(
  userId: string,
  payload: { role?: UserRole; accountStatus?: AccountStatus }
): Promise<{ user: InvestorProfile }> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function publishFleetDispatch(payload: {
  category: string;
  title: string;
  summary: string;
}): Promise<{ dispatch: FleetDispatch }> {
  return apiRequest('/api/admin/dispatches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function advanceAllRentalsCycle(): Promise<{ ok: boolean; updated: number }> {
  return apiRequest('/api/admin/rentals/advance-all', {
    method: 'POST',
  });
}

export function formatUsd(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
