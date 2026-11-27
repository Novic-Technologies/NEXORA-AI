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
  heroKicker: '12 Global Robotics Hubs',
  heroTitle: 'Industrial AI Robotics Leasing',
  heroDescription:
    'Select from 18 active Nexora AI robotic systems operating across Europe, Asia, and North America. Fund leases via 16 Binance-supported coins with Finance Department settlement.',
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
  {
    id: 'nx-titan-f9',
    modelCode: 'NX-TITAN-F9',
    name: 'Titan F9 Autonomous Pallet AGV',
    category: 'Warehouse & Logistics',
    tagline: 'Heavy-lift autonomous electric pallet stacker for high-bay distribution hubs.',
    description:
      'Operates 24/7 in cold-chain and port logistics bays with 3D LiDAR fork alignment, predictive fleet traffic routing, and automated opportunity charging.',
    imageUrl: '/src/assets/images/robot_forklift_agv_1795770658231.jpg',
    rentalPrice: 5400,
    dailyReturnRate: 2.02,
    cycleDays: 60,
    availableUnits: 10,
    totalUnits: 14,
    facilityHub: 'Hamburg Port Logistics',
    referralBonusUsd: 297,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Heavy Fleet V5',
      autonomyLevel: 'Level 4 Dock-to-Rack',
      payloadCapacity: '1,800 kg pallet lift',
      uptimeSla: '99.5% verified',
    },
  },
  {
    id: 'nx-delta-s6',
    modelCode: 'NX-DELTA-S6',
    name: 'Delta S6 Optical Sorting Gantry',
    category: 'Warehouse & Logistics',
    tagline: 'High-velocity delta vision cell sorting 140 parcels per minute.',
    description:
      'Carbon-fiber parallel kinematic arms paired with overhead stereo vision classify, orient, and route e-commerce parcels with near-zero missort rate.',
    imageUrl: '/src/assets/images/robot_sorting_gantry_1795770659036.jpg',
    rentalPrice: 2100,
    dailyReturnRate: 1.68,
    cycleDays: 45,
    availableUnits: 16,
    totalUnits: 20,
    facilityHub: 'Singapore Tuas Mega Hub',
    referralBonusUsd: 115.5,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora High-Speed Vision',
      autonomyLevel: 'Continuous Line Sync',
      payloadCapacity: '6 kg @ 140 picks/min',
      uptimeSla: '99.6% verified',
    },
  },
  {
    id: 'nx-volt-w5',
    modelCode: 'NX-VOLT-W5',
    name: 'Volt W5 Laser Welding Cobot',
    category: 'Precision Assembly',
    tagline: '6-axis AI seam-tracking welder and CNC tending fabrication cell.',
    description:
      'Real-time laser weld-pool telemetry automatically adjusts feed speed and torch angle across EV battery trays and aerospace structural frames.',
    imageUrl: '/src/assets/images/robot_welding_cobot_1795770656337.jpg',
    rentalPrice: 3650,
    dailyReturnRate: 1.84,
    cycleDays: 55,
    availableUnits: 12,
    totalUnits: 16,
    facilityHub: 'Stuttgart Auto-Tech Line',
    referralBonusUsd: 200.75,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Thermal Seam AI',
      autonomyLevel: 'Adaptive Path Correction',
      payloadCapacity: '25 kg · ±0.03 mm',
      uptimeSla: '99.4% verified',
    },
  },
  {
    id: 'nx-lumina-c1',
    modelCode: 'NX-LUMINA-C1',
    name: 'Lumina C1 Cleanroom Dual-Arm',
    category: 'Precision Assembly',
    tagline: 'ISO-Class 3 semiconductor wafer and biopharma compounding manipulator.',
    description:
      'Dual ceramic-titanium arms execute sterile micro-assembly, optical wafer transfer, and automated QA metrology inside partner fabrication labs.',
    imageUrl: '/src/assets/images/robot_cleanroom_wafer_1795770657308.jpg',
    rentalPrice: 7800,
    dailyReturnRate: 2.18,
    cycleDays: 75,
    availableUnits: 7,
    totalUnits: 10,
    facilityHub: 'Leuven Silicon Cleanroom',
    referralBonusUsd: 429,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Sub-Micron Dual Core',
      autonomyLevel: 'ISO-3 Autonomous Fab',
      payloadCapacity: '10 kg · ±0.008 mm',
      uptimeSla: '99.8% verified',
    },
  },
  {
    id: 'nx-aero-v3',
    modelCode: 'NX-AERO-V3',
    name: 'Aero V3 LiDAR Inspection Drone',
    category: 'Autonomous Inspection',
    tagline: 'Shrouded autonomous UAV performing structural and wind-turbine audits.',
    description:
      'Launches from automated docking pods to map storage silos, offshore substations, and warehouse roofs using solid-state LiDAR and RGB-thermal fusion.',
    imageUrl: '/src/assets/images/robot_aerial_inspector_1795770659062.jpg',
    rentalPrice: 1450,
    dailyReturnRate: 1.58,
    cycleDays: 40,
    availableUnits: 19,
    totalUnits: 24,
    facilityHub: 'Aberdeen Offshore Grid',
    referralBonusUsd: 79.75,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Aero-SLAM V3',
      autonomyLevel: 'Beyond-Visual Flight',
      payloadCapacity: '4.5 kg LiDAR pod',
      uptimeSla: '99.1% verified',
    },
  },
  {
    id: 'nx-aegis-r6',
    modelCode: 'NX-AEGIS-R6',
    name: 'Aegis R6 Perimeter Patrol Rover',
    category: 'Autonomous Inspection',
    tagline: '6-wheel thermal & acoustic surveillance unit for hyperscale data campuses.',
    description:
      'Continuously patrols critical cloud infrastructure yards, identifying perimeter anomalies, thermal hotspots, and badge compliance without blind spots.',
    imageUrl: '/src/assets/images/robot_security_rover_1795770659229.jpg',
    rentalPrice: 2950,
    dailyReturnRate: 1.76,
    cycleDays: 50,
    availableUnits: 13,
    totalUnits: 18,
    facilityHub: 'Frankfurt Data Campus',
    referralBonusUsd: 162.25,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Sentinel Vision',
      autonomyLevel: '24/7 Campus Patrol',
      payloadCapacity: '360° Mast + 35 kg bay',
      uptimeSla: '99.5% verified',
    },
  },
  {
    id: 'nx-nexus-h4',
    modelCode: 'NX-NEXUS-H4',
    name: 'Nexus H4 Bipedal Cargo Humanoid',
    category: 'Humanoid AI',
    tagline: 'High-torque humanoid worker built for multi-shift tote loading and kitting.',
    description:
      'Trained on 10M+ manipulation hours, Nexus H4 bridges narrow aisles, climbs loading ramps, and operates standard industrial carts autonomously.',
    imageUrl: '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
    rentalPrice: 6200,
    dailyReturnRate: 2.08,
    cycleDays: 65,
    availableUnits: 8,
    totalUnits: 12,
    facilityHub: 'Tokyo Haneda Cargo Bay',
    referralBonusUsd: 341,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Embodied Gen-4',
      autonomyLevel: 'Whole-Body Loco-Manip',
      payloadCapacity: '30 kg dynamic carry',
      uptimeSla: '99.2% verified',
    },
  },
  {
    id: 'nx-nano-p2',
    modelCode: 'NX-NANO-P2',
    name: 'Nano P2 Micro-Assembly Arm',
    category: 'Precision Assembly',
    tagline: 'Entry-tier benchtop precision cobot for electronics QA and testing.',
    description:
      'Compact 6-axis benchtop unit running automated smartphone display testing, connector insertion, and vision-guided micro-soldering.',
    imageUrl: '/src/assets/images/robot_precision_arm_1795701352118.jpg',
    rentalPrice: 650,
    dailyReturnRate: 1.38,
    cycleDays: 30,
    availableUnits: 28,
    totalUnits: 36,
    facilityHub: 'Seoul Digital Foundry',
    referralBonusUsd: 35.75,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Micro-Vision Lite',
      autonomyLevel: 'Supervised Cell Mesh',
      payloadCapacity: '5 kg · ±0.02 mm',
      uptimeSla: '99.6% verified',
    },
  },
  {
    id: 'nx-cargo-x8',
    modelCode: 'NX-CARGO-X8',
    name: 'Cargo X8 Cross-Dock Shuttle',
    category: 'Warehouse & Logistics',
    tagline: 'High-throughput freight shuttle synchronizing container unloading docks.',
    description:
      'Coordinates in swarms of up to 40 rovers to stage cross-dock freight pallets directly onto outbound autonomous carrier bays.',
    imageUrl: '/src/assets/images/robot_forklift_agv_1795770658231.jpg',
    rentalPrice: 3900,
    dailyReturnRate: 1.88,
    cycleDays: 55,
    availableUnits: 11,
    totalUnits: 15,
    facilityHub: 'Antwerp Freight Terminal',
    referralBonusUsd: 214.5,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Swarm Router V4',
      autonomyLevel: 'Multi-Agent Dock Sync',
      payloadCapacity: '1,400 kg deck load',
      uptimeSla: '99.4% verified',
    },
  },
  {
    id: 'nx-orion-q7',
    modelCode: 'NX-ORION-Q7',
    name: 'Orion Q7 Subterranean Quadruped',
    category: 'Autonomous Inspection',
    tagline: 'IP67 sealed quadruped AI inspector for utility tunnels and rail vaults.',
    description:
      'Navigates wet industrial gratings, measures gas telemetry, and streams 3D point clouds from confined infrastructure corridors.',
    imageUrl: '/src/assets/images/robot_quadruped_scout_1795701352026.jpg',
    rentalPrice: 4200,
    dailyReturnRate: 1.90,
    cycleDays: 60,
    availableUnits: 9,
    totalUnits: 12,
    facilityHub: 'Oslo Subsea Utility',
    referralBonusUsd: 231,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Rugged SLAM',
      autonomyLevel: 'GPS-Denied Tunnel Nav',
      payloadCapacity: '22 kg waterproof rig',
      uptimeSla: '99.1% verified',
    },
  },
  {
    id: 'nx-helios-d5',
    modelCode: 'NX-HELIOS-D5',
    name: 'Helios D5 Solar & Greenhouse Unit',
    category: 'Service & Agri',
    tagline: 'Dual-role arid greenhouse cultivator and solar panel dry-cleaning rover.',
    description:
      'Operates along desert solar arrays and controlled-environment vertical farms with automated dust diagnostics and yield forecasting.',
    imageUrl: '/src/assets/images/robot_agri_drone_1795701353223.jpg',
    rentalPrice: 1150,
    dailyReturnRate: 1.50,
    cycleDays: 40,
    availableUnits: 20,
    totalUnits: 26,
    facilityHub: 'Dubai Clean Energy Park',
    referralBonusUsd: 63.25,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora Solar Telemetry AI',
      autonomyLevel: 'Day/Night Auto-Dock',
      payloadCapacity: '90 kg utility deck',
      uptimeSla: '99.3% verified',
    },
  },
  {
    id: 'nx-vertex-m9',
    modelCode: 'NX-VERTEX-M9',
    name: 'Vertex M9 Pharma Automation Cell',
    category: 'Precision Assembly',
    tagline: 'Institutional-grade sterile blister inspection and robotic vial handling cell.',
    description:
      'Flagship long-horizon contract unit deployed inside European GMP pharmaceutical logistics facilities with triple-redundant optical validation.',
    imageUrl: '/src/assets/images/robot_cleanroom_wafer_1795770657308.jpg',
    rentalPrice: 10500,
    dailyReturnRate: 2.35,
    cycleDays: 90,
    availableUnits: 5,
    totalUnits: 8,
    facilityHub: 'Basel Bio-Automation Wing',
    referralBonusUsd: 577.5,
    doubleYieldEligible: true,
    specs: {
      neuralCore: 'Nexora GMP Dual-Redundant',
      autonomyLevel: 'Full Sterile Cell Ops',
      payloadCapacity: '16 kg · 24/7 validated',
      uptimeSla: '99.9% verified',
    },
  },
];

const SEEDED_DISPATCHES: FleetDispatch[] = [
  {
    id: 'disp-01',
    category: 'Deployment',
    publishedAt: 'Nov 2026',
    title: '18 AI robotic models live across 12 European, Asian & GCC hubs',
    summary:
      'Expanded throughput contracts across Munich, Singapore, Basel, Hamburg, and Tokyo lifted fleet utilization above 96% across Q4.',
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
      'Finance Department settlement desk now supports USDT, USDC, FDUSD, SOL, BNB, BTC, ETH, TON, XRP, TRX, LTC, DOGE, ADA, AVAX, POL, and XLM.',
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
    const existingRobots =
      Array.isArray(parsed.robots) && parsed.robots.length > 0
        ? [...parsed.robots]
        : structuredClone(SEEDED_ROBOTS);
    if (existingRobots.length < 16) {
      const existingIds = new Set(existingRobots.map((r) => r.id));
      for (const seeded of SEEDED_ROBOTS) {
        if (!existingIds.has(seeded.id)) {
          existingRobots.push(structuredClone(seeded));
        }
      }
    }

    const existingCoins: BinanceCoinConfig[] =
      Array.isArray(parsed.cryptoCoins) && parsed.cryptoCoins.length > 0
        ? structuredClone(parsed.cryptoCoins)
        : structuredClone(BINANCE_COINS);
    for (const defCoin of BINANCE_COINS) {
      const match = existingCoins.find((c) => c.symbol === defCoin.symbol);
      if (!match) {
        existingCoins.push(structuredClone(defCoin));
      } else {
        for (const defNet of defCoin.networks) {
          if (!match.networks.some((n) => n.networkCode === defNet.networkCode)) {
            match.networks.push(structuredClone(defNet));
          }
        }
      }
    }

    const db: DatabaseState = {
      investors: Array.isArray(parsed.investors)
        ? parsed.investors.map((inv) => normalizeInvestorRecord(inv, usedCodes))
        : [],
      robots: existingRobots,
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
      cryptoCoins: existingCoins,
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
