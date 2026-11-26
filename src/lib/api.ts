import type {
  AccountStatus,
  AdminOverviewData,
  AppNotification,
  BinanceCoinConfig,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  EnrichedMachineRental,
  FleetDispatch,
  IdentityDocType,
  InvestorClassification,
  InvestorProfile,
  KycStatus,
  ReferralSummary,
  RobotCategory,
  RobotMachine,
  SiteConfig,
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
  siteConfig: SiteConfig;
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
  cryptoCoins: BinanceCoinConfig[];
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
  referralCode?: string;
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

export function fetchReferrals(): Promise<ReferralSummary> {
  return apiRequest<ReferralSummary>('/api/referrals');
}

export function fetchNotifications(): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  return apiRequest('/api/notifications');
}

export function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
  });
}

export function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiRequest('/api/notifications/read-all', { method: 'POST' });
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

// Master Admin / Staff Full CRUD endpoints
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

export function createAdminUser(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  companyName?: string;
  role: UserRole;
  walletBalance?: number;
  kycStatus?: KycStatus;
}): Promise<{ user: InvestorProfile }> {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(
  userId: string,
  payload: Partial<{
    fullName: string;
    phone: string;
    companyName: string;
    country: string;
    city: string;
    investorType: InvestorClassification;
    walletBalance: number;
    heldBalance: number;
    kycStatus: KycStatus;
    role: UserRole;
    accountStatus: AccountStatus;
    doubleYieldDays: number;
  }>
): Promise<{ user: InvestorProfile }> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(userId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
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

export function updateSiteConfig(
  payload: Partial<SiteConfig>
): Promise<{ siteConfig: SiteConfig }> {
  return apiRequest('/api/admin/site-config', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateCryptoNetwork(payload: {
  symbol: BinanceCoinSymbol;
  networkCode: BinanceNetworkCode;
  depositAddress?: string;
  memo?: string;
  minDepositUsd?: number;
  minWithdrawUsd?: number;
  withdrawFeeUsd?: number;
}): Promise<{ cryptoCoins: BinanceCoinConfig[] }> {
  return apiRequest('/api/admin/crypto-coins', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function createAdminRobot(payload: {
  name: string;
  modelCode: string;
  category: RobotCategory;
  tagline: string;
  description: string;
  facilityHub: string;
  rentalPrice: number;
  dailyReturnRate: number;
  cycleDays: number;
  totalUnits: number;
  availableUnits: number;
  referralBonusUsd?: number;
  imageUrl?: string;
}): Promise<{ robot: RobotMachine }> {
  return apiRequest('/api/admin/robots', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminRobot(
  robotId: string,
  payload: Partial<RobotMachine>
): Promise<{ robot: RobotMachine }> {
  return apiRequest(`/api/admin/robots/${encodeURIComponent(robotId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminRobot(robotId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/admin/robots/${encodeURIComponent(robotId)}`, {
    method: 'DELETE',
  });
}

export function publishFleetDispatch(payload: {
  category: string;
  title: string;
  summary: string;
  imageUrl?: string;
}): Promise<{ dispatch: FleetDispatch }> {
  return apiRequest('/api/admin/dispatches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminDispatch(
  id: string,
  payload: Partial<FleetDispatch>
): Promise<{ dispatch: FleetDispatch }> {
  return apiRequest(`/api/admin/dispatches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminDispatch(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/admin/dispatches/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function updateAdminRental(
  rentalId: string,
  payload: { yieldMultiplier?: number; status?: 'active' | 'completed'; simulatedDaysAdd?: number }
): Promise<{ rental: EnrichedMachineRental }> {
  return apiRequest(`/api/admin/rentals/${encodeURIComponent(rentalId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminRental(rentalId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/admin/rentals/${encodeURIComponent(rentalId)}`, {
    method: 'DELETE',
  });
}

export function deleteAdminTransaction(txId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/admin/transactions/${encodeURIComponent(txId)}`, {
    method: 'DELETE',
  });
}

export function sendAdminNotification(payload: {
  userId: string;
  title: string;
  message: string;
}): Promise<{ sentCount: number }> {
  return apiRequest('/api/admin/notifications', {
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
