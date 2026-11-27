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
  SupportTicket,
  UserRole,
  WalletTransaction,
} from '../src/types.ts';
import { build114UniqueFleetUnits } from './fleetCatalog.ts';

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
  supportTickets: SupportTicket[];
  cryptoCoins: BinanceCoinConfig[];
  siteConfig: SiteConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexora_db.json');

let cachedDb: DatabaseState | null = null;

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: 'Nexora AI',
  brandSubtitle: 'Robotics Fleet',
  headquartersAddress: 'Technoparkstrasse 1, Tower A, 8005 Zurich, Switzerland',
  heroKicker: '12 Global Robotics Hubs',
  heroTitle: 'Industrial AI Robotics Leasing',
  heroDescription:
    'Select from 114 unique Nexora AI robotic units deployed across Europe, Asia, and North America. Fund leases via 16 Binance-supported coins with Finance Department settlement.',
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
  withdrawFeePct: 27,
  dailyWithdrawLimit: 3,
  withdrawProcessingDays: 2,
  minWithdrawUsd: 50,
  footerNotice: '© 2026 Nexora AI Robotics',
  howItWorksSteps: [
    {
      title: '01. Invest across any of the 114 unique fleet units',
      body: 'Invest in any active fleet unit or robot as much as your wallet balance allows—you can lease two or more fleet units simultaneously. Minimum crypto deposit starts at the price of the least expensive active fleet unit.',
    },
    {
      title: '02. Fund via Binance crypto & collect daily yields',
      body: 'Register, complete KYC verification, select from 16 Binance-supported coins, and submit your TXID or screenshot. Once Finance approves your deposit, activate units to earn live daily returns.',
    },
    {
      title: '03. Same-day yield withdrawals & payout rules',
      body: 'Daily yields can be withdrawn the very same day they arrive in your Available Wallet Balance. Minimum withdrawal is $50 USD across all coins, limited to 3 withdrawals per day, with a 27% platform withdrawal rule applied and 2-day processing.',
    },
  ],
};

const SEEDED_ROBOTS: RobotMachine[] = build114UniqueFleetUnits(5.5);

const LEGACY_18_IDS = new Set([
  'nx-atlas-m4',
  'nx-veridian-a7',
  'nx-kestrel-h2',
  'nx-sentinel-q4',
  'nx-aura-s3',
  'nx-terra-g8',
  'nx-titan-f9',
  'nx-delta-s6',
  'nx-volt-w5',
  'nx-lumina-c1',
  'nx-aero-v3',
  'nx-aegis-r6',
  'nx-nexus-h4',
  'nx-nano-p2',
  'nx-cargo-x8',
  'nx-orion-q7',
  'nx-helios-d5',
  'nx-vertex-m9',
]);

const SEEDED_DISPATCHES: FleetDispatch[] = [
  {
    id: 'disp-01',
    category: 'Deployment',
    publishedAt: 'Nov 2026',
    title: '114 unique AI robotic fleet units live across global European, Asian & GCC hubs',
    summary:
      'Expanded throughput contracts across Munich, Singapore, Basel, Hamburg, and Tokyo lifted fleet utilization above 96% with dedicated one-to-one hardware allocation across all 114 unique deployed robots.',
    imageUrl: '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
  },
  {
    id: 'disp-02',
    category: 'Hardware',
    publishedAt: 'Nov 2026',
    title: 'Kestrel H2 & Nexus H4 firmware 4.2 cuts pick cycle latency by 22%',
    summary:
      'Over-the-air embodied neural updates are now live across all Zurich and Tokyo humanoid assembly units without halting shift hours.',
    imageUrl: '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
  },
  {
    id: 'disp-03',
    category: 'Settlement',
    publishedAt: 'Nov 2026',
    title: 'Binance multi-network settlement expanded to 16 global cryptocurrencies',
    summary:
      'Finance Department settlement desk now supports USDT, USDC, FDUSD, SOL, BNB, BTC, ETH, TON, XRP, TRX, LTC, DOGE, ADA, AVAX, POL, and XLM with same-day yield payouts.',
    imageUrl: '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
  },
];

export function getMinActiveFleetPrice(db: Pick<DatabaseState, 'robots'>): number {
  const active = db.robots.filter((r) => r.availableUnits > 0);
  if (active.length > 0) {
    return Number(Math.min(...active.map((r) => r.rentalPrice)).toFixed(2));
  }
  if (db.robots.length > 0) {
    return Number(Math.min(...db.robots.map((r) => r.rentalPrice)).toFixed(2));
  }
  return 50;
}

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
    yieldMultiplier:
      typeof r.yieldMultiplier === 'number' && r.yieldMultiplier >= 1 ? r.yieldMultiplier : 1,
    accruedYieldCarry: typeof r.accruedYieldCarry === 'number' ? r.accruedYieldCarry : 0,
    accrualAnchorAt: r.accrualAnchorAt || r.rentedAt,
  };
}

function normalizeSiteConfig(cfg?: Partial<SiteConfig>): { config: SiteConfig; migrated: boolean } {
  const isLegacySteps =
    Array.isArray(cfg?.howItWorksSteps) &&
    (cfg.howItWorksSteps[0]?.title?.startsWith('01. Register, upload photo') ||
      cfg.howItWorksSteps[0]?.title?.includes('333 fleet units'));
  const isLegacyHero =
    typeof cfg?.heroDescription === 'string' &&
    (cfg.heroDescription.includes('Select from 18 active Nexora AI') ||
      cfg.heroDescription.includes('Select from 333 unique Nexora AI'));

  const migrated = Boolean(isLegacySteps || isLegacyHero);

  return {
    migrated,
    config: {
      ...DEFAULT_SITE_CONFIG,
      ...(cfg ?? {}),
      heroDescription:
        isLegacyHero || !cfg?.heroDescription
          ? DEFAULT_SITE_CONFIG.heroDescription
          : cfg.heroDescription,
      headquartersAddress:
        typeof cfg?.headquartersAddress === 'string' && cfg.headquartersAddress.trim()
          ? cfg.headquartersAddress.trim()
          : DEFAULT_SITE_CONFIG.headquartersAddress,
      withdrawFeePct:
        typeof cfg?.withdrawFeePct === 'number' &&
        Number.isFinite(cfg.withdrawFeePct) &&
        cfg.withdrawFeePct >= 0 &&
        cfg.withdrawFeePct <= 90
          ? cfg.withdrawFeePct
          : DEFAULT_SITE_CONFIG.withdrawFeePct,
      dailyWithdrawLimit:
        typeof cfg?.dailyWithdrawLimit === 'number' &&
        Number.isFinite(cfg.dailyWithdrawLimit) &&
        cfg.dailyWithdrawLimit >= 1 &&
        cfg.dailyWithdrawLimit <= 50
          ? Math.floor(cfg.dailyWithdrawLimit)
          : DEFAULT_SITE_CONFIG.dailyWithdrawLimit,
      withdrawProcessingDays:
        typeof cfg?.withdrawProcessingDays === 'number' &&
        Number.isFinite(cfg.withdrawProcessingDays) &&
        cfg.withdrawProcessingDays >= 1 &&
        cfg.withdrawProcessingDays <= 30
          ? Math.floor(cfg.withdrawProcessingDays)
          : DEFAULT_SITE_CONFIG.withdrawProcessingDays,
      minWithdrawUsd:
        typeof cfg?.minWithdrawUsd === 'number' &&
        Number.isFinite(cfg.minWithdrawUsd) &&
        cfg.minWithdrawUsd >= 1
          ? cfg.minWithdrawUsd
          : DEFAULT_SITE_CONFIG.minWithdrawUsd,
      howItWorksSteps:
        !isLegacySteps && Array.isArray(cfg?.howItWorksSteps) && cfg.howItWorksSteps.length > 0
          ? cfg.howItWorksSteps
          : DEFAULT_SITE_CONFIG.howItWorksSteps,
    },
  };
}

function createSeedDatabase(): DatabaseState {
  return {
    investors: [],
    robots: structuredClone(SEEDED_ROBOTS),
    rentals: [],
    transactions: [],
    dispatches: structuredClone(SEEDED_DISPATCHES),
    notifications: [],
    passwordResetRequests: [],
    supportTickets: [],
    cryptoCoins: structuredClone(BINANCE_COINS),
    siteConfig: structuredClone(DEFAULT_SITE_CONFIG),
  };
}

export function loadDatabase(): DatabaseState {
  if (cachedDb) {
    return cachedDb;
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    cachedDb = initial;
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    const usedCodes = new Set<string>();
    let needsSave = false;

    let robots: RobotMachine[] =
      Array.isArray(parsed.robots) && parsed.robots.length > 0 ? [...parsed.robots] : [];

    // Upgrade legacy 18-model or 333-recycled catalog into the 114 unique 1:1 robotic fleet units
    const hasLegacyUnits =
      robots.length === 0 ||
      robots.some((r) => r.id.startsWith('nx-unit-') || LEGACY_18_IDS.has(r.id)) ||
      !robots.some((r) => r.id.startsWith('nx-r-'));
    if (hasLegacyUnits) {
      const seededIds = new Set(SEEDED_ROBOTS.map((r) => r.id));
      const customAdminRobots = robots.filter(
        (r) =>
          !r.id.startsWith('nx-unit-') &&
          !LEGACY_18_IDS.has(r.id) &&
          !seededIds.has(r.id)
      );
      robots = [...customAdminRobots, ...structuredClone(SEEDED_ROBOTS)];
      needsSave = true;
    }

    const existingCoins: BinanceCoinConfig[] =
      Array.isArray(parsed.cryptoCoins) && parsed.cryptoCoins.length > 0
        ? structuredClone(parsed.cryptoCoins)
        : structuredClone(BINANCE_COINS);

    for (const defCoin of BINANCE_COINS) {
      const match = existingCoins.find((c) => c.symbol === defCoin.symbol);
      if (!match) {
        existingCoins.push(structuredClone(defCoin));
        needsSave = true;
      } else {
        for (const defNet of defCoin.networks) {
          const existingNet = match.networks.find(
            (n) => n.networkCode === defNet.networkCode
          );
          if (!existingNet) {
            match.networks.push(structuredClone(defNet));
            needsSave = true;
          } else if (existingNet.minWithdrawUsd < 50) {
            existingNet.minWithdrawUsd = 50;
            needsSave = true;
          }
        }
      }
    }

    const dispatches =
      Array.isArray(parsed.dispatches) && parsed.dispatches.length > 0
        ? parsed.dispatches.map((d) => {
            if (
              d.id === 'disp-01' &&
              (d.title.includes('18 AI robotic models') ||
                d.title.includes('333 unique AI robotic'))
            ) {
              needsSave = true;
              return structuredClone(SEEDED_DISPATCHES[0]);
            }
            return d;
          })
        : structuredClone(SEEDED_DISPATCHES);

    const siteNorm = normalizeSiteConfig(parsed.siteConfig);
    if (siteNorm.migrated) {
      needsSave = true;
    }

    const investors = Array.isArray(parsed.investors)
      ? parsed.investors.map((inv) => normalizeInvestorRecord(inv, usedCodes))
      : [];

    // Ensure no investor record exposes a master_admin's personal name via referredByName
    const ownerIds = new Set(
      investors
        .filter(
          (i) =>
            i.role === 'master_admin' ||
            i.email.toLowerCase().startsWith('novictechnologies')
        )
        .map((i) => i.id)
    );
    for (const inv of investors) {
      if (
        inv.referredByUserId &&
        ownerIds.has(inv.referredByUserId) &&
        inv.referredByName &&
        inv.referredByName !== 'Nexora Partner Program'
      ) {
        inv.referredByName = 'Nexora Partner Program';
        needsSave = true;
      }
    }

    if (!Array.isArray(parsed.supportTickets)) {
      needsSave = true;
    }

    const db: DatabaseState = {
      investors,
      robots,
      rentals: Array.isArray(parsed.rentals)
        ? parsed.rentals.map(normalizeRentalRecord)
        : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      dispatches,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      passwordResetRequests: Array.isArray(parsed.passwordResetRequests)
        ? parsed.passwordResetRequests
        : [],
      supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
      cryptoCoins: existingCoins,
      siteConfig: siteNorm.config,
    };

    cachedDb = db;
    if (needsSave) {
      saveDatabase(db);
    }
    return db;
  } catch {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    cachedDb = initial;
    return initial;
  }
}

export function saveDatabase(db: DatabaseState): void {
  cachedDb = db;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
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
    createdByUserId: investor.createdByUserId,
    createdAt: investor.createdAt,
  };
}

export function isDoubleYieldActive(
  investor?: Pick<InvestorProfile, 'doubleYieldActiveUntil'>
): boolean {
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
