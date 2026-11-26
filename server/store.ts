import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AccountStatus,
  EnrichedMachineRental,
  FleetDispatch,
  InvestorClassification,
  InvestorProfile,
  KycStatus,
  MachineRental,
  RobotMachine,
  UserRole,
  WalletTransaction,
} from '../src/types.ts';

export interface StoredInvestor extends InvestorProfile {
  passwordHash: string;
  passwordSalt: string;
  isDemoAccount?: boolean;
}

export interface DatabaseState {
  investors: StoredInvestor[];
  robots: RobotMachine[];
  rentals: MachineRental[];
  transactions: WalletTransaction[];
  dispatches: FleetDispatch[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexora_db.json');

export const DEMO_INVESTOR_EMAIL = 'daniel.kigozi@nexora.ai';

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
    specs: {
      neuralCore: 'Nexora Vision V4 · 275 TOPS',
      autonomyLevel: 'Level 4 Full Fleet Mesh',
      payloadCapacity: '650 kg continuous',
      uptimeSla: '99.4% verified',
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
    specs: {
      neuralCore: 'Nexora Embodied Dual-NPU',
      autonomyLevel: 'Adaptive Task Generalist',
      payloadCapacity: '24 kg bimanual lift',
      uptimeSla: '99.1% verified',
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
    specs: {
      neuralCore: 'Nexora Tactile Control Core',
      autonomyLevel: 'Closed-Loop Micro-Vision',
      payloadCapacity: '12 kg · ±0.02 mm',
      uptimeSla: '99.7% verified',
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
  },
  {
    id: 'disp-02',
    category: 'Hardware',
    publishedAt: 'Nov 2026',
    title: 'Kestrel H2 firmware 4.2 cuts bimanual pick cycle latency by 22%',
    summary:
      'Over-the-air embodied neural updates are now live across all Zurich assembly units without halting shift hours.',
  },
  {
    id: 'disp-03',
    category: 'Settlement',
    publishedAt: 'Oct 2026',
    title: 'Binance multi-network settlement live across 8 major cryptocurrencies',
    summary:
      'Treasury settlement desk now reviews USDT, USDC, BNB, BTC, ETH, SOL, XRP, and TRX deposits and withdrawals.',
  },
];

function seedDemoInvestor(db: DatabaseState): boolean {
  if (db.investors.some((inv) => inv.email === DEMO_INVESTOR_EMAIL)) {
    return false;
  }

  const demoId = 'inv_demo_nexora_01';
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const demoInvestor: StoredInvestor = {
    id: demoId,
    role: 'investor',
    accountStatus: 'active',
    fullName: 'Daniel Kigozi',
    email: DEMO_INVESTOR_EMAIL,
    phone: '+256 700 418 920',
    companyName: 'Kampala Industrial Holdings',
    country: 'Uganda',
    city: 'Kampala',
    investorType: 'Individual Investor',
    kycStatus: 'pending',
    verification: {
      documentType: 'National ID',
      documentNumber: 'CM92048105KLM',
      frontImageUrl: '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
      backOrSelfieUrl: '/src/assets/images/robot_service_ai_1795701352399.jpg',
      sourceOfFunds: 'Business Revenue & Capital Reserve',
      annualCapacity: '$10,000 – $50,000',
      financialProofNote: 'Commercial bank statement attached for compliance review.',
      submittedAt: threeHoursAgo,
    },
    walletBalance: 4500,
    heldBalance: 0,
    totalDeposited: 5700,
    totalWithdrawn: 0,
    totalYieldCollected: 0,
    createdAt: twoDaysAgo,
    passwordHash: '',
    passwordSalt: '',
    isDemoAccount: true,
  };

  const sampleRental: MachineRental = {
    id: 'rnt_demo_atlas_01',
    investorId: demoId,
    robotId: 'nx-atlas-m4',
    robotName: 'Atlas M4 Autonomous Mover',
    robotModelCode: 'NX-ATLAS-M4',
    robotImageUrl: '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
    facilityHub: 'Munich Fulfillment Hub',
    quantity: 1,
    unitPrice: 1200,
    totalCost: 1200,
    dailyReturnRate: 1.55,
    dailyPayout: 18.6,
    cycleDays: 45,
    simulatedDaysElapsed: 0,
    collectedYield: 0,
    status: 'active',
    rentedAt: twoDaysAgo,
    lastClaimedAt: null,
  };

  const approvedDepositTx: WalletTransaction = {
    id: 'tx_demo_dep_01',
    investorId: demoId,
    investorName: demoInvestor.fullName,
    investorEmail: demoInvestor.email,
    type: 'deposit',
    amount: 5700,
    status: 'completed',
    coinSymbol: 'USDT',
    networkCode: 'BEP20',
    networkName: 'BNB Smart Chain (BEP20)',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    txHash: '0x9a4f8b21c6e71234d9e8a7123c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    reference: 'USDT Deposit · BNB Smart Chain (BEP20)',
    reviewedBy: 'System Settlement',
    reviewedAt: twoDaysAgo,
    createdAt: twoDaysAgo,
  };

  const rentalTx: WalletTransaction = {
    id: 'tx_demo_rnt_01',
    investorId: demoId,
    investorName: demoInvestor.fullName,
    investorEmail: demoInvestor.email,
    type: 'rental',
    amount: 1200,
    status: 'completed',
    reference: 'Rented 1x Atlas M4 Autonomous Mover (45d cycle)',
    createdAt: oneDayAgo,
  };

  const pendingDepositTx: WalletTransaction = {
    id: 'tx_demo_pending_01',
    investorId: demoId,
    investorName: demoInvestor.fullName,
    investorEmail: demoInvestor.email,
    type: 'deposit',
    amount: 2400,
    status: 'pending',
    coinSymbol: 'USDT',
    networkCode: 'TRC20',
    networkName: 'TRON (TRC20)',
    walletAddress: 'TX9K4vP7mR2sE8wQ1zL6nB3cV5xY8dF2aG9',
    txHash: '4f8d2a7c9e1b3056a2c4f6e8d0b1a3c5e7f902468ace13579bdf0123456789ab',
    reference: 'USDT Deposit · TRON (TRC20)',
    createdAt: threeHoursAgo,
  };

  db.investors.push(demoInvestor);
  db.rentals.unshift(sampleRental);
  db.transactions.unshift(pendingDepositTx, rentalTx, approvedDepositTx);
  return true;
}

function normalizeInvestorRecord(inv: StoredInvestor): StoredInvestor {
  return {
    ...inv,
    role: (inv.role as UserRole) || 'investor',
    accountStatus: (inv.accountStatus as AccountStatus) || 'active',
    kycStatus: (inv.kycStatus as KycStatus) || 'unverified',
    heldBalance: typeof inv.heldBalance === 'number' ? inv.heldBalance : 0,
    walletBalance: typeof inv.walletBalance === 'number' ? inv.walletBalance : 0,
    totalDeposited: typeof inv.totalDeposited === 'number' ? inv.totalDeposited : 0,
    totalWithdrawn: typeof inv.totalWithdrawn === 'number' ? inv.totalWithdrawn : 0,
    totalYieldCollected: typeof inv.totalYieldCollected === 'number' ? inv.totalYieldCollected : 0,
  };
}

function createSeedDatabase(): DatabaseState {
  const db: DatabaseState = {
    investors: [],
    robots: SEEDED_ROBOTS,
    rentals: [],
    transactions: [],
    dispatches: SEEDED_DISPATCHES,
  };
  seedDemoInvestor(db);
  return db;
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
    const db: DatabaseState = {
      investors: Array.isArray(parsed.investors)
        ? parsed.investors.map(normalizeInvestorRecord)
        : [],
      robots:
        Array.isArray(parsed.robots) && parsed.robots.length > 0
          ? parsed.robots
          : SEEDED_ROBOTS,
      rentals: Array.isArray(parsed.rentals) ? parsed.rentals : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      dispatches:
        Array.isArray(parsed.dispatches) && parsed.dispatches.length > 0
          ? parsed.dispatches
          : SEEDED_DISPATCHES,
    };
    if (seedDemoInvestor(db)) {
      saveDatabase(db);
    }
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
  const envEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.MASTER_ADMIN_PASSWORD;
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
    createdAt: investor.createdAt,
  };
}

export function enrichRental(rental: MachineRental): EnrichedMachineRental {
  const elapsedMs = Math.max(0, Date.now() - new Date(rental.rentedAt).getTime());
  const exactDaysElapsed = Math.min(
    rental.cycleDays,
    Math.max(0, elapsedMs / (1000 * 60 * 60 * 24) + rental.simulatedDaysElapsed)
  );
  const daysElapsed = Math.floor(exactDaysElapsed);
  const totalEarnedToDate = exactDaysElapsed * rental.dailyPayout;
  const accruedUnclaimedYield = Number(
    Math.max(0, totalEarnedToDate - rental.collectedYield).toFixed(4)
  );
  const totalProjectedYield = Number((rental.cycleDays * rental.dailyPayout).toFixed(2));
  const remainingDays = Math.max(0, rental.cycleDays - daysElapsed);
  const progressPercent = Math.min(
    100,
    Math.round((exactDaysElapsed / Math.max(1, rental.cycleDays)) * 100)
  );

  return {
    ...rental,
    daysElapsed,
    exactDaysElapsed: Number(exactDaysElapsed.toFixed(4)),
    remainingDays,
    accruedUnclaimedYield,
    totalProjectedYield,
    progressPercent,
  };
}
