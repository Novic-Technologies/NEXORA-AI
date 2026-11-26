export type BinanceCoinSymbol =
  | 'USDT'
  | 'USDC'
  | 'BNB'
  | 'BTC'
  | 'ETH'
  | 'SOL'
  | 'XRP'
  | 'TRX';

export type BinanceNetworkCode =
  | 'TRC20'
  | 'BEP20'
  | 'ERC20'
  | 'SOL'
  | 'BASE'
  | 'BTC'
  | 'ARBITRUM'
  | 'XRPL';

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
  cycleDays: number;
  simulatedDaysElapsed: number;
  collectedYield: number;
  status: 'active' | 'completed';
  rentedAt: string;
  lastClaimedAt: string | null;
}

export interface EnrichedMachineRental extends MachineRental {
  daysElapsed: number;
  exactDaysElapsed: number;
  remainingDays: number;
  accruedUnclaimedYield: number;
  totalProjectedYield: number;
  progressPercent: number;
}

export type TransactionType = 'deposit' | 'withdraw' | 'rental' | 'yield_payout';
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
}

export interface AdminOverviewData {
  summary: {
    totalUsers: number;
    pendingDepositsCount: number;
    pendingWithdrawalsCount: number;
    pendingKycCount: number;
    pendingDepositVolume: number;
    pendingWithdrawalVolume: number;
    activeRentalsCount: number;
  };
  users: InvestorProfile[];
  pendingTransactions: WalletTransaction[];
  recentReviewedTransactions: WalletTransaction[];
  robots: RobotMachine[];
}
