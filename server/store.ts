import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { BINANCE_COINS } from '../src/lib/cryptoCoins.ts';
import type {
  AccountStatus,
  AppNotification,
  BinanceCoinConfig,
  EnrichedMachineRental,
  FleetDispatch,
  InvestorClassification,
  InvestorProfile,
  KycStatus,
  MachineRental,
  NotificationCategory,
  PasswordResetRequest,
  RobotMachine,
  SiteConfig,
  UserRole,
  WalletTransaction,
} from '../src/types.ts';

export interface StoredInvestor extends InvestorProfile {
  passwordHash: string;
  passwordSalt: string;
}

export interface DatabaseState {
  investors: StoredInvestor[];
  robots: RobotMachine[];
  rentals: MachineRental[];
  transactions: WalletTransaction[];
  dispatches: FleetDispatch[];
  notifications: AppNotification[];
  passwordResetRequests: PasswordResetRequest[];
  cryptoCoins: BinanceCoinConfig[];
  siteConfig: SiteConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexora_db.json');

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: 'Nexora AI',
  brandSubtitle: 'Robotics Fleet',
  headquartersAddress: 'Technoparkstrasse 1, Tower A, 8005 Zurich, Switzerland',
  heroKicker: '6 European Facilities',
  heroTitle: 'Industrial AI Robotics Leasing',
  heroDescription:
    'Select active Nexora AI robots operating in Munich, Zurich, Eindhoven, and Rotterdam. Fund leases via Binance-supported coins with Finance Department settlement oversight.',
  heroImageUrl: '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
  primaryCtaText: 'Browse Robots',
  secondaryCtaText: 'How it works',
  activeHubsCount: 6,
  announcementBanner: '',
  referralHeadline: 'Invite Investors & Earn 2x Daily Yields',
  referralDescription:
    'Share your invite code. When a team member registers and completes a verified deposit, you earn an instant 5.5% cash reward (e.g. $143 on a $2,600 Veridian A7 allocation) plus double daily yields (2x) across your active units.',
  referralRewardRatePct: 5.5,
  referralDoubleYieldDays: 7,
  footerNotice: '© 2026 Nexora AI Robotics',
  howItWorksSteps: [
    {
      title: '01. Register, upload photo & verify ID',
      body: 'Create your account, add your profile photo, and submit your government ID (plus optional proof of financial ability) for Compliance Department approval.',
    },
    {
      title: '02. Deposit crypto with Finance Dept review',
      body: 'Choose any Binance-supported coin, scan or copy the treasury address, and submit your TXID or screenshot. Funds credit once verified by the Finance Department.',
    },
    {
      title: '03. Lease AI robots & invite team members',
      body: 'Lease active AI robots for live daily returns, and invite partners to unlock 5.5% instant deposit rewards plus 2x double daily yields.',
    },
  ],
};

const SEEDED_ROBOTS: RobotMachine[] = [
  {
    id: 'nx-atlas-m4',
    modelCode: 'NX-ATLAS-M4',
    name: 'Atlas M4 Autonomous Mover',
    category: 'Warehouse & Logistics',
    tagline: 'Heavy-payload fleet rover running 24/7 autonomous fulfillment lanes.',
    description:
      'Deployed across European e-commerce hubs, the Atlas M4 integrates Nexora Vision Core for dynamic obstacle rerouting, pallet staging, and automated dock charging.',
    imageUrl: '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
    rentalPrice: 1200,
    dailyReturnRate: 1.55,
    cycleDays: 45,
    availableUnits: 18,
    totalUnits: 24,
    facilityHub: 'Munich Fulfillment Hub',
    referralBonusUsd: 66,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Vision V4 · 275 TOPS',
      autonomyLevel: 'Level 4 Full Fleet Mesh',
      payloadCapacity: '650 kg continuous',
      uptimeSla: '99.4% verified',
    },
  },
  {
    id: 'nx-veridian-a7',
    modelCode: 'NX-VERIDIAN-A7',
    name: 'Veridian A7 Precision Arm',
    category: 'Precision Assembly',
    tagline: '7-axis micron-grade AI manipulator for semiconductor and EV sub-assemblies.',
    description:
      'High-speed force-torque feedback arm executing sub-millimeter PCB placement, optical calibration, and automated cleanroom inspection cycles.',
    imageUrl: '/src/assets/images/robot_precision_arm_1795701352118.jpg',
    rentalPrice: 2600,
    dailyReturnRate: 1.72,
    cycleDays: 50,
    availableUnits: 14,
    totalUnits: 20,
    facilityHub: 'Eindhoven Cleanroom Bay',
    referralBonusUsd: 143,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Tactile Control Core',
      autonomyLevel: 'Closed-Loop Micro-Vision',
      payloadCapacity: '12 kg · ±0.02 mm',
      uptimeSla: '99.7% verified',
    },
  },
  {
    id: 'nx-kestrel-h2',
    modelCode: 'NX-KESTREL-H2',
    name: 'Kestrel H2 Humanoid Worker',
    category: 'Humanoid AI',
    tagline: 'Bipedal AI production unit built for multi-station assembly and kitting.',
    description:
      'Kestrel H2 operates in human-scale manufacturing cells without facility retrofitting. Equipped with tactile 16-DOF hands and real-time spatial reasoning.',
    imageUrl: '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
    rentalPrice: 4800,
    dailyReturnRate: 1.95,
    cycleDays: 60,
    availableUnits: 9,
    totalUnits: 14,
    facilityHub: 'Zurich Robotics Annex',
    referralBonusUsd: 264,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Embodied Dual-NPU',
      autonomyLevel: 'Adaptive Task Generalist',
      payloadCapacity: '24 kg bimanual lift',
      uptimeSla: '99.1% verified',
    },
  },
  {
    id: 'nx-sentinel-q4',
    modelCode: 'NX-SENTINEL-Q4',
    name: 'Sentinel Q4 Inspection Scout',
    category: 'Autonomous Inspection',
    tagline: 'All-terrain quadruped AI unit auditing energy grids and industrial plants.',
    description:
      'Climbs industrial stairways and inspects substations with LiDAR mapping, thermal anomaly detection, and acoustic leak diagnostics under commercial contracts.',
    imageUrl: '/src/assets/images/robot_quadruped_scout_1795701352026.jpg',
    rentalPrice: 3200,
    dailyReturnRate: 1.80,
    cycleDays: 55,
    availableUnits: 11,
    totalUnits: 16,
    facilityHub: 'Rotterdam Energy Terminal',
    referralBonusUsd: 176,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Edge-LiDAR Fusion',
      autonomyLevel: 'Autonomous Patrol & Alert',
      payloadCapacity: '18 kg sensor suite',
      uptimeSla: '99.2% verified',
    },
  },
  {
    id: 'nx-aura-s3',
    modelCode: 'NX-AURA-S3',
    name: 'Aura S3 Service Concierge',
    category: 'Service & Agri',
    tagline: 'Conversational AI hospitality and clinical corridor delivery robot.',
    description:
      'Operates inside partner airports, medical campuses, and corporate towers handling autonomous reception, badge verification, and sterile parcel runs.',
    imageUrl: '/src/assets/images/robot_service_ai_1795701352399.jpg',
    rentalPrice: 950,
    dailyReturnRate: 1.42,
    cycleDays: 35,
    availableUnits: 22,
    totalUnits: 30,
    facilityHub: 'London Canary Wharf',
    referralBonusUsd: 52.25,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Multimodal Voice AI',
      autonomyLevel: 'Elevator & Crowd Nav',
      payloadCapacity: '40 kg locked bay',
      uptimeSla: '99.5% verified',
    },
  },
  {
    id: 'nx-terra-g8',
    modelCode: 'NX-TERRA-G8',
    name: 'Terra G8 Agri-Vision Rover',
    category: 'Service & Agri',
    tagline: 'Solar-assisted greenhouse AI harvester with ripeness computer vision.',
    description:
      'Continuous precision harvesting and canopy health telemetry across high-yield vertical farms under multi-year produce partner leases.',
    imageUrl: '/src/assets/images/robot_agri_drone_1795701353223.jpg',
    rentalPrice: 1850,
    dailyReturnRate: 1.60,
    cycleDays: 45,
    availableUnits: 15,
    totalUnits: 18,
    facilityHub: 'Almeria Agro-Tech Park',
    referralBonusUsd: 101.75,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Multispectral Vision',
      autonomyLevel: '24h Greenhouse Mesh',
      payloadCapacity: '120 kg harvest bin',
      uptimeSla: '99.0% verified',
    },
  },
];

const SEEDED_DISPATCHES: FleetDispatch[] = [
  {
    id: 'disp-01',
    category: 'Deployment',
    publishedAt: 'Nov 2026',
    title: '18 additional Atlas M4 units commissioned in Munich logistics bays',
    summary:
      'Expanded throughput contracts with regional parcel carriers lifted fleet utilization above 96% across Q4.',
    imageUrl: '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
  },
  {
    id: 'disp-02',
    category: 'Hardware',
    publishedAt: 'Nov 2026',
    title: 'Kestrel H2 firmware 4.2 cuts bimanual pick cycle latency by 22%',
    summary:
      'Over-the-air embodied neural updates are now live across all Zurich assembly units without halting shift hours.',
    imageUrl: '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
  },
  {
    id: 'disp-03',
    category: 'Settlement',
    publishedAt: 'Oct 2026',
    title: 'Binance multi-network settlement live across 8 major cryptocurrencies',
    summary:
      'Treasury settlement desk now reviews USDT, USDC, BNB, BTC, ETH, SOL, XRP, and TRX deposits and withdrawals.',
    imageUrl: '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
  },
];

export function generateReferralCode(fullName: string, existingCodes: Set<string>): string {
  const clean = fullName.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'NXR';
  for (let i = 0; i < 12; i += 1) {
    const suffix = crypto.randomInt(100, 999);
    const candidate = `NX-${clean}${suffix}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }
  return `NX-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function createNotificationRecord(
  db: DatabaseState,
  params: {
    userId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    actionScreen?: AppNotification['actionScreen'];
  }
): AppNotification {
  const notif: AppNotification = {
    id: `ntf_${crypto.randomUUID().slice(0, 12)}`,
    userId: params.userId,
    title: params.title,
    message: params.message,
    category: params.category,
    read: false,
    actionScreen: params.actionScreen,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 600) {
    db.notifications = db.notifications.slice(0, 600);
  }
  return notif;
}

function normalizeInvestorRecord(
  inv: StoredInvestor,
  existingCodes: Set<string>
): StoredInvestor {
  let code = inv.referralCode;
  if (!code || existingCodes.has(code)) {
    code = generateReferralCode(inv.fullName || 'NXR', existingCodes);
  }
  existingCodes.add(code);

  return {
    ...inv,
    role: (inv.role as UserRole) || 'investor',
    accountStatus: (inv.accountStatus as AccountStatus) || 'active',
    kycStatus: (inv.kycStatus as KycStatus) || 'unverified',
    heldBalance: typeof inv.heldBalance === 'number' ? inv.heldBalance : 0,
    walletBalance: typeof inv.walletBalance === 'number' ? inv.walletBalance : 0,
    totalDeposited: typeof inv.totalDeposited === 'number' ? inv.totalDeposited : 0,
    totalWithdrawn: typeof inv.totalWithdrawn === 'number' ? inv.totalWithdrawn : 0,
    totalYieldCollected:
      typeof inv.totalYieldCollected === 'number' ? inv.totalYieldCollected : 0,
    referralCode: code,
    referralBonusEarned:
      typeof inv.referralBonusEarned === 'number' ? inv.referralBonusEarned : 0,
    hasApprovedDeposit:
      typeof inv.hasApprovedDeposit === 'boolean'
        ? inv.hasApprovedDeposit
        : (inv.totalDeposited ?? 0) > 0,
  };
}

function normalizeRentalRecord(r: MachineRental): MachineRental {
  return {
    ...r,
    yieldMultiplier: typeof r.yieldMultiplier === 'number' && r.yieldMultiplier >= 1 ? r.yieldMultiplier : 1,
    accruedYieldCarry: typeof r.accruedYieldCarry === 'number' ? r.accruedYieldCarry : 0,
    accrualAnchorAt: r.accrualAnchorAt || r.rentedAt,
  };
}

function normalizeSiteConfig(cfg?: Partial<SiteConfig>): SiteConfig {
  return {
    ...DEFAULT_SITE_CONFIG,
    ...(cfg ?? {}),
    headquartersAddress:
      typeof cfg?.headquartersAddress === 'string' && cfg.headquartersAddress.trim()
        ? cfg.headquartersAddress.trim()
        : DEFAULT_SITE_CONFIG.headquartersAddress,
    howItWorksSteps:
      Array.isArray(cfg?.howItWorksSteps) && cfg.howItWorksSteps.length > 0
        ? cfg.howItWorksSteps
        : DEFAULT_SITE_CONFIG.howItWorksSteps,
  };
}

function createSeedDatabase(): DatabaseState {
  return {
    investors: [],
    robots: SEEDED_ROBOTS,
    rentals: [],
    transactions: [],
    dispatches: SEEDED_DISPATCHES,
    notifications: [],
    passwordResetRequests: [],
    cryptoCoins: structuredClone(BINANCE_COINS),
    siteConfig: structuredClone(DEFAULT_SITE_CONFIG),
  };
}

export function loadDatabase(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    const usedCodes = new Set<string>();
    const db: DatabaseState = {
      investors: Array.isArray(parsed.investors)
        ? parsed.investors.map((inv) => normalizeInvestorRecord(inv, usedCodes))
        : [],
      robots:
        Array.isArray(parsed.robots) && parsed.robots.length > 0
          ? parsed.robots
          : SEEDED_ROBOTS,
      rentals: Array.isArray(parsed.rentals)
        ? parsed.rentals.map(normalizeRentalRecord)
        : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      dispatches:
        Array.isArray(parsed.dispatches) && parsed.dispatches.length > 0
          ? parsed.dispatches
          : SEEDED_DISPATCHES,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      passwordResetRequests: Array.isArray(parsed.passwordResetRequests)
        ? parsed.passwordResetRequests
        : [],
      cryptoCoins:
        Array.isArray(parsed.cryptoCoins) && parsed.cryptoCoins.length > 0
          ? parsed.cryptoCoins
          : structuredClone(BINANCE_COINS),
      siteConfig: normalizeSiteConfig(parsed.siteConfig),
    };
    return db;
  } catch {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

export function saveDatabase(db: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function hasMasterAdmin(db: DatabaseState): boolean {
  const envEmail = (process.env.CORPORATE_OPS_EMAIL || process.env.MASTER_ADMIN_EMAIL)
    ?.trim()
    .toLowerCase();
  const envPassword =
    process.env.CORPORATE_OPS_PASSWORD || process.env.MASTER_ADMIN_PASSWORD;
  if (envEmail && envPassword) {
    return true;
  }
  return db.investors.some((inv) => inv.role === 'master_admin');
}

export function hashPassword(
  password: string,
  existingSalt?: string
): { hash: string; salt: string } {
  const salt = existingSalt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!hash || !salt) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

export function sanitizeInvestor(investor: StoredInvestor): InvestorProfile {
  return {
    id: investor.id,
    role: investor.role,
    department: investor.department,
    accountStatus: investor.accountStatus,
    fullName: investor.fullName,
    email: investor.email,
    phone: investor.phone,
    companyName: investor.companyName,
    country: investor.country,
    city: investor.city,
    avatarUrl: investor.avatarUrl,
    investorType: investor.investorType as InvestorClassification,
    kycStatus: investor.kycStatus,
    verification: investor.verification,
    walletBalance: Number(investor.walletBalance.toFixed(2)),
    heldBalance: Number((investor.heldBalance ?? 0).toFixed(2)),
    totalDeposited: Number(investor.totalDeposited.toFixed(2)),
    totalWithdrawn: Number(investor.totalWithdrawn.toFixed(2)),
    totalYieldCollected: Number(investor.totalYieldCollected.toFixed(2)),
    referralCode: investor.referralCode,
    referredByUserId: investor.referredByUserId,
    referredByCode: investor.referredByCode,
    referredByName: investor.referredByName,
    referralBonusEarned: Number((investor.referralBonusEarned ?? 0).toFixed(2)),
    doubleYieldActiveUntil: investor.doubleYieldActiveUntil,
    hasApprovedDeposit: investor.hasApprovedDeposit,
    createdAt: investor.createdAt,
  };
}

export function isDoubleYieldActive(investor?: Pick<InvestorProfile, 'doubleYieldActiveUntil'>): boolean {
  if (!investor?.doubleYieldActiveUntil) return false;
  return new Date(investor.doubleYieldActiveUntil).getTime() > Date.now();
}

export function syncRentalMultiplier(rental: MachineRental, nextMultiplier: number): void {
  const anchorMs = new Date(rental.accrualAnchorAt || rental.rentedAt).getTime();
  const totalElapsedMs = Math.max(0, Date.now() - new Date(rental.rentedAt).getTime());
  const totalDays = Math.min(
    rental.cycleDays,
    totalElapsedMs / (1000 * 60 * 60 * 24) + rental.simulatedDaysElapsed
  );
  const anchorTotalDays = Math.min(
    rental.cycleDays,
    Math.max(0, (anchorMs - new Date(rental.rentedAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const deltaDays = Math.max(0, totalDays - anchorTotalDays);
  const currentMult = rental.yieldMultiplier || 1;
  rental.accruedYieldCarry = Number(
    ((rental.accruedYieldCarry ?? 0) + deltaDays * rental.dailyPayout * currentMult).toFixed(6)
  );
  rental.accrualAnchorAt = new Date().toISOString();
  rental.yieldMultiplier = nextMultiplier;
}

export function enrichRental(rental: MachineRental): EnrichedMachineRental {
  const nowMs = Date.now();
  const rentedMs = new Date(rental.rentedAt).getTime();
  const anchorMs = new Date(rental.accrualAnchorAt || rental.rentedAt).getTime();

  const totalElapsedDays = Math.min(
    rental.cycleDays,
    Math.max(0, (nowMs - rentedMs) / (1000 * 60 * 60 * 24) + rental.simulatedDaysElapsed)
  );
  const anchorElapsedDays = Math.min(
    rental.cycleDays,
    Math.max(0, (anchorMs - rentedMs) / (1000 * 60 * 60 * 24))
  );
  const deltaDaysSinceAnchor = Math.max(0, totalElapsedDays - anchorElapsedDays);

  const mult = rental.yieldMultiplier >= 1 ? rental.yieldMultiplier : 1;
  const effectiveDailyPayout = Number((rental.dailyPayout * mult).toFixed(2));
  const totalEarnedToDate =
    (rental.accruedYieldCarry ?? 0) + deltaDaysSinceAnchor * effectiveDailyPayout;

  const daysElapsed = Math.floor(totalElapsedDays);
  const accruedUnclaimedYield = Number(
    Math.max(0, totalEarnedToDate - rental.collectedYield).toFixed(4)
  );
  const totalProjectedYield = Number((rental.cycleDays * effectiveDailyPayout).toFixed(2));
  const remainingDays = Math.max(0, rental.cycleDays - daysElapsed);
  const progressPercent = Math.min(
    100,
    Math.round((totalElapsedDays / Math.max(1, rental.cycleDays)) * 100)
  );

  return {
    ...rental,
    yieldMultiplier: mult,
    effectiveDailyPayout,
    daysElapsed,
    exactDaysElapsed: Number(totalElapsedDays.toFixed(4)),
    remainingDays,
    accruedUnclaimedYield,
    totalProjectedYield,
    progressPercent,
  };
}
