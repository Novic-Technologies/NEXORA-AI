export type BinanceCoinSymbol =
  | 'USDT'
  | 'USDC'
  | 'FDUSD'
  | 'BNB'
  | 'BTC'
  | 'ETH'
  | 'SOL'
  | 'TON'
  | 'XRP'
  | 'TRX'
  | 'LTC'
  | 'DOGE'
  | 'ADA'
  | 'AVAX'
  | 'POL'
  | 'XLM';

export type BinanceNetworkCode =
  | 'TRC20'
  | 'BEP20'
  | 'ERC20'
  | 'SOL'
  | 'TON'
  | 'BASE'
  | 'BTC'
  | 'ARBITRUM'
  | 'POLYGON'
  | 'AVAXC'
  | 'XRPL'
  | 'LTC'
  | 'DOGE'
  | 'ADA'
  | 'XLM';

export interface BinanceNetworkOption {
  networkCode: BinanceNetworkCode;
  networkName: string;
  depositAddress: string;
  memo?: string;
  minDepositUsd: number;
  minWithdrawUsd: number;
  withdrawFeeUsd: number;
  confirmations: string;
  addressHint: string;
}

export interface BinanceCoinConfig {
  symbol: BinanceCoinSymbol;
  name: string;
  badgeColor: string;
  networks: BinanceNetworkOption[];
}

export type InvestorClassification =
  | 'Individual Investor'
  | 'Corporate Partner'
  | 'Institutional Fund';

export type UserRole = 'master_admin' | 'admin' | 'moderator' | 'investor';

export type CorporateDepartment =
  | 'Executive Operations'
  | 'Finance Department'
  | 'Technical Department'
  | 'Compliance Department'
  | 'Fleet Operations';

export type AccountStatus = 'active' | 'suspended';

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type IdentityDocType = 'National ID' | 'Passport' | 'Driver License';

export interface VerificationRecords {
  documentType: IdentityDocType;
  documentNumber: string;
  frontImageUrl: string;
  backOrSelfieUrl: string;
  sourceOfFunds?: string;
  annualCapacity?: string;
  financialProofUrl?: string;
  financialProofNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface InvestorProfile {
  id: string;
  role: UserRole;
  department?: CorporateDepartment;
  accountStatus: AccountStatus;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  country: string;
  city?: string;
  avatarUrl?: string;
  investorType: InvestorClassification;
  kycStatus: KycStatus;
  verification?: VerificationRecords;
  walletBalance: number;
  heldBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalYieldCollected: number;
  referralCode: string;
  referredByUserId?: string;
  referredByCode?: string;
  referredByName?: string;
  referralBonusEarned: number;
  doubleYieldActiveUntil?: string;
  hasApprovedDeposit?: boolean;
  createdAt: string;
}

export type RobotCategory =
  | 'Warehouse & Logistics'
  | 'Humanoid AI'
  | 'Precision Assembly'
  | 'Autonomous Inspection'
  | 'Service & Agri';

export interface RobotMachine {
  id: string;
  modelCode: string;
  name: string;
  category: RobotCategory;
  tagline: string;
  description: string;
  imageUrl: string;
  rentalPrice: number;
  dailyReturnRate: number;
  cycleDays: number;
  availableUnits: number;
  totalUnits: number;
  facilityHub: string;
  referralBonusUsd?: number;
  doubleYieldEligible?: boolean;
  specs: {
    neuralCore: string;
    autonomyLevel: string;
    payloadCapacity: string;
    uptimeSla: string;
  };
}

export interface MachineRental {
  id: string;
  investorId: string;
  robotId: string;
  robotName: string;
  robotModelCode: string;
  robotImageUrl: string;
  facilityHub: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  dailyReturnRate: number;
  dailyPayout: number;
  yieldMultiplier: number;
  accruedYieldCarry: number;
  accrualAnchorAt: string;
  cycleDays: number;
  simulatedDaysElapsed: number;
  collectedYield: number;
  status: 'active' | 'completed';
  rentedAt: string;
  lastClaimedAt: string | null;
}

export interface EnrichedMachineRental extends MachineRental {
  effectiveDailyPayout: number;
  daysElapsed: number;
  exactDaysElapsed: number;
  remainingDays: number;
  accruedUnclaimedYield: number;
  totalProjectedYield: number;
  progressPercent: number;
}

export type TransactionType =
  | 'deposit'
  | 'withdraw'
  | 'rental'
  | 'yield_payout'
  | 'referral_reward';

export type TransactionStatus = 'pending' | 'completed' | 'rejected';

export interface WalletTransaction {
  id: string;
  investorId: string;
  investorName?: string;
  investorEmail?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  coinSymbol?: BinanceCoinSymbol;
  networkCode?: BinanceNetworkCode;
  networkName?: string;
  walletAddress?: string;
  memo?: string;
  txHash?: string;
  receiptImageUrl?: string;
  reference: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface FleetDispatch {
  id: string;
  category: string;
  publishedAt: string;
  title: string;
  summary: string;
  imageUrl?: string;
}

export interface HowItWorksStep {
  title: string;
  body: string;
}

export interface SiteConfig {
  brandName: string;
  brandSubtitle: string;
  headquartersAddress: string;
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  activeHubsCount: number;
  announcementBanner: string;
  referralHeadline: string;
  referralDescription: string;
  referralRewardRatePct: number;
  referralDoubleYieldDays: number;
  footerNotice: string;
  howItWorksSteps: HowItWorksStep[];
}

export type NotificationCategory =
  | 'transfer'
  | 'kyc'
  | 'referral'
  | 'rental'
  | 'system'
  | 'admin';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  actionScreen?:
    | 'wallet'
    | 'verification'
    | 'referrals'
    | 'mine'
    | 'activity'
    | 'account'
    | 'admin'
    | 'news'
    | 'rent';
  createdAt: string;
}

export interface TeamMemberSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  kycStatus: KycStatus;
  hasDeposited: boolean;
  totalDeposited: number;
  activeRentalsCount: number;
  rentedValueUsd: number;
  rewardGeneratedUsd: number;
}

export interface ReferralSummary {
  referralCode: string;
  rewardRatePct: number;
  doubleYieldDaysPerInvite: number;
  doubleYieldActive: boolean;
  doubleYieldActiveUntil?: string;
  totalTeamMembers: number;
  qualifyingDepositors: number;
  totalReferralEarned: number;
  teamMembers: TeamMemberSummary[];
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  investorId?: string;
  investorName?: string;
  note?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedByDepartment?: string;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminOverviewData {
  summary: {
    totalUsers: number;
    pendingDepositsCount: number;
    pendingWithdrawalsCount: number;
    pendingKycCount: number;
    pendingPasswordResetsCount: number;
    pendingDepositVolume: number;
    pendingWithdrawalVolume: number;
    activeRentalsCount: number;
    totalRentalsCount: number;
    totalReferralPayouts: number;
  };
  users: InvestorProfile[];
  pendingTransactions: WalletTransaction[];
  allTransactions: WalletTransaction[];
  passwordResetRequests: PasswordResetRequest[];
  rentals: EnrichedMachineRental[];
  robots: RobotMachine[];
  dispatches: FleetDispatch[];
  cryptoCoins: BinanceCoinConfig[];
  siteConfig: SiteConfig;
}
