import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import { validateNetworkAddress } from './src/lib/cryptoCoins.ts';
import type {
  AccountStatus,
  AppNotification,
  BinanceCoinConfig,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  CorporateDepartment,
  FleetDispatch,
  IdentityDocType,
  InvestorClassification,
  KycStatus,
  MachineRental,
  PasswordResetRequest,
  RobotCategory,
  RobotMachine,
  TeamMemberSummary,
  UserRole,
  WalletTransaction,
} from './src/types.ts';
import {
  createNotificationRecord,
  enrichRental,
  generateReferralCode,
  hasMasterAdmin,
  hashPassword,
  isDoubleYieldActive,
  loadDatabase,
  sanitizeInvestor,
  saveDatabase,
  syncRentalMultiplier,
  verifyPassword,
} from './server/store.ts';
import type { DatabaseState, StoredInvestor } from './server/store.ts';

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE = 'nexora_session';

interface AuthenticatedRequest extends Request {
  investor?: StoredInvestor;
  authViaCookie?: boolean;
}

interface WsClientMeta {
  ws: WebSocket;
  userId?: string;
  role?: UserRole;
}

const VALID_CLASSIFICATIONS: InvestorClassification[] = [
  'Individual Investor',
  'Corporate Partner',
  'Institutional Fund',
];

const VALID_DOC_TYPES: IdentityDocType[] = [
  'National ID',
  'Passport',
  'Driver License',
];

const VALID_ROBOT_CATEGORIES: RobotCategory[] = [
  'Warehouse & Logistics',
  'Humanoid AI',
  'Precision Assembly',
  'Autonomous Inspection',
  'Service & Agri',
];

const ASSIGNABLE_ROLES: UserRole[] = ['investor', 'moderator', 'admin'];
const VALID_KYC_STATUSES: KycStatus[] = ['unverified', 'pending', 'verified', 'rejected'];
const VALID_DEPARTMENTS: CorporateDepartment[] = [
  'Executive Operations',
  'Finance Department',
  'Technical Department',
  'Compliance Department',
  'Fleet Operations',
];

function departmentForRole(role: UserRole): CorporateDepartment | undefined {
  if (role === 'master_admin') return 'Executive Operations';
  if (role === 'admin') return 'Finance Department';
  if (role === 'moderator') return 'Compliance Department';
  return undefined;
}

function signSessionToken(investorId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: investorId,
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub?: string;
      exp?: number;
    };
    if (!parsed.sub || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed.sub;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k) {
      out[k] = decodeURIComponent(rest.join('='));
    }
  }
  return out;
}

function extractToken(req: Request): { token: string | null; viaCookie: boolean } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { token: authHeader.slice(7).trim(), viaCookie: false };
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE]) {
    return { token: cookies[SESSION_COOKIE], viaCookie: true };
  }
  return { token: null, viaCookie: false };
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const proto = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || proto === 'https';
  const maxAgeSec = 7 * 24 * 60 * 60;
  if (isHttps) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=None; Partitioned`
    );
  } else {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax`
    );
  }
}

function clearSessionCookie(req: Request, res: Response): void {
  const proto = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || proto === 'https';
  if (isHttps) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`
    );
  } else {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
    );
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSafeImageRef(value: unknown, maxBytes = 1_800_000): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\/(src\/assets\/images|assets\/aistudio)\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length <= maxBytes) {
      return trimmed;
    }
  }
  return undefined;
}

function getCoinNetworkFromDb(
  db: DatabaseState,
  coinSymbol: BinanceCoinSymbol,
  networkCode: BinanceNetworkCode
) {
  const coin = db.cryptoCoins.find((c) => c.symbol === coinSymbol);
  return coin?.networks.find((n) => n.networkCode === networkCode);
}

function syncEnvMasterAdmin(): void {
  const envEmail = (process.env.CORPORATE_OPS_EMAIL || process.env.MASTER_ADMIN_EMAIL)
    ?.trim()
    .toLowerCase();
  const envPassword =
    process.env.CORPORATE_OPS_PASSWORD || process.env.MASTER_ADMIN_PASSWORD;
  if (!envEmail || !envPassword) return;

  const db = loadDatabase();
  const existing = db.investors.find((inv) => inv.email === envEmail);
  const { hash, salt } = hashPassword(envPassword);
  if (existing) {
    existing.role = 'master_admin';
    existing.department = existing.department || 'Executive Operations';
    existing.accountStatus = 'active';
    existing.kycStatus = 'verified';
    existing.passwordHash = hash;
    existing.passwordSalt = salt;
    saveDatabase(db);
  } else {
    const usedCodes = new Set(db.investors.map((i) => i.referralCode));
    db.investors.unshift({
      id: `inv_ops_${crypto.randomUUID().slice(0, 8)}`,
      role: 'master_admin',
      department: 'Executive Operations',
      accountStatus: 'active',
      fullName: 'Nexora Operations Director',
      email: envEmail,
      phone: '+41 44 580 1200',
      companyName: 'Nexora AI Corporate Operations',
      country: 'Switzerland',
      city: 'Zurich',
      investorType: 'Institutional Fund',
      kycStatus: 'verified',
      walletBalance: 0,
      heldBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalYieldCollected: 0,
      referralCode: generateReferralCode('Nexora Ops', usedCodes),
      referralBonusEarned: 0,
      hasApprovedDeposit: false,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    });
    saveDatabase(db);
  }
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { token, viaCookie } = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  if (
    viaCookie &&
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    req.method !== 'OPTIONS'
  ) {
    const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';
    const origin = req.headers.origin;
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
    const originMatches =
      typeof origin === 'string' &&
      host &&
      (origin.endsWith(`://${host}`) || origin.includes(host.split(':')[0]));
    if (!hasCustomHeader && !originMatches) {
      res.status(403).json({ error: 'Request verification header missing.' });
      return;
    }
  }

  const investorId = verifySessionToken(token);
  if (!investorId) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }
  const db = loadDatabase();
  const found = db.investors.find((inv) => inv.id === investorId);
  if (!found) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  if (found.accountStatus === 'suspended') {
    res.status(403).json({
      error: 'This account has been suspended by Nexora Compliance & Technical Support.',
    });
    return;
  }
  req.investor = found;
  req.authViaCookie = viaCookie;
  next();
}

function requireStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const role = req.investor?.role;
  if (role !== 'master_admin' && role !== 'admin' && role !== 'moderator') {
    res.status(403).json({ error: 'Corporate department authorization required.' });
    return;
  }
  next();
}

function requireMasterAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.investor?.role !== 'master_admin') {
    res.status(403).json({
      error: 'Requires Executive or Technical Department authorization.',
    });
    return;
  }
  next();
}

function buildReferralSummary(db: DatabaseState, investor: StoredInvestor) {
  const team = db.investors.filter((u) => u.referredByUserId === investor.id);
  const teamMembers: TeamMemberSummary[] = team.map((member) => {
    const memberRentals = db.rentals.filter((r) => r.investorId === member.id);
    const activeCount = memberRentals
      .filter((r) => r.status === 'active')
      .reduce((s, r) => s + r.quantity, 0);
    const rentedValueUsd = Number(
      memberRentals.reduce((s, r) => s + r.totalCost, 0).toFixed(2)
    );
    const rewardGeneratedUsd = Number(
      ((member.totalDeposited * db.siteConfig.referralRewardRatePct) / 100).toFixed(2)
    );
    return {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      avatarUrl: member.avatarUrl,
      joinedAt: member.createdAt,
      kycStatus: member.kycStatus,
      hasDeposited: Boolean(member.hasApprovedDeposit || member.totalDeposited > 0),
      totalDeposited: Number(member.totalDeposited.toFixed(2)),
      activeRentalsCount: activeCount,
      rentedValueUsd,
      rewardGeneratedUsd,
    };
  });

  return {
    referralCode: investor.referralCode,
    rewardRatePct: db.siteConfig.referralRewardRatePct,
    doubleYieldDaysPerInvite: db.siteConfig.referralDoubleYieldDays,
    doubleYieldActive: isDoubleYieldActive(investor),
    doubleYieldActiveUntil: investor.doubleYieldActiveUntil,
    totalTeamMembers: teamMembers.length,
    qualifyingDepositors: teamMembers.filter((m) => m.hasDeposited).length,
    totalReferralEarned: Number((investor.referralBonusEarned ?? 0).toFixed(2)),
    teamMembers,
  };
}

async function startServer() {
  syncEnvMasterAdmin();

  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '6mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WsClientMeta>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', 'http://localhost');
    const queryToken = url.searchParams.get('token');
    const cookies = parseCookies(req.headers.cookie);
    const token = queryToken || cookies[SESSION_COOKIE] || null;

    const meta: WsClientMeta = { ws };
    if (token) {
      const userId = verifySessionToken(token);
      if (userId) {
        const db = loadDatabase();
        const user = db.investors.find((inv) => inv.id === userId);
        if (user && user.accountStatus === 'active') {
          meta.userId = user.id;
          meta.role = user.role;
        }
      }
    }
    clients.add(meta);

    ws.send(
      JSON.stringify({
        type: 'connected',
        authenticated: Boolean(meta.userId),
        serverTime: new Date().toISOString(),
      })
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type?: string; token?: string };
        if (msg.type === 'auth' && typeof msg.token === 'string') {
          const userId = verifySessionToken(msg.token);
          if (userId) {
            const db = loadDatabase();
            const user = db.investors.find((inv) => inv.id === userId);
            if (user && user.accountStatus === 'active') {
              meta.userId = user.id;
              meta.role = user.role;
            }
          }
        }
      } catch {
        // Ignore invalid client messages
      }
    });

    ws.on('close', () => {
      clients.delete(meta);
    });
  });

  function sendToUser(userId: string, event: Record<string, unknown>): void {
    const payload = JSON.stringify(event);
    for (const c of clients) {
      if (c.ws.readyState === WebSocket.OPEN && c.userId === userId) {
        c.ws.send(payload);
      }
    }
  }

  function notifyUser(
    db: DatabaseState,
    params: {
      userId: string;
      title: string;
      message: string;
      category: AppNotification['category'];
      actionScreen?: AppNotification['actionScreen'];
    }
  ): AppNotification {
    const notif = createNotificationRecord(db, params);
    sendToUser(params.userId, {
      type: 'notification:new',
      appNotification: notif,
      notification: params.title,
    });
    return notif;
  }

  function broadcastToStaff(event: Record<string, unknown>): void {
    const payload = JSON.stringify(event);
    for (const c of clients) {
      if (
        c.ws.readyState === WebSocket.OPEN &&
        (c.role === 'master_admin' || c.role === 'admin' || c.role === 'moderator')
      ) {
        c.ws.send(payload);
      }
    }
  }

  function broadcastAll(event: Record<string, unknown>): void {
    const payload = JSON.stringify(event);
    for (const c of clients) {
      if (c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(payload);
      }
    }
  }

  // Real server heartbeat pushing live calculated rental accruals every 5 seconds
  setInterval(() => {
    if (clients.size === 0) return;
    const db = loadDatabase();
    let changed = false;
    for (const inv of db.investors) {
      const shouldBe2x = isDoubleYieldActive(inv);
      const userRentals = db.rentals.filter((r) => r.investorId === inv.id && r.status === 'active');
      for (const r of userRentals) {
        if (!shouldBe2x && r.yieldMultiplier === 2) {
          syncRentalMultiplier(r, 1);
          changed = true;
        }
        const enriched = enrichRental(r);
        if (enriched.daysElapsed >= r.cycleDays && r.status === 'active') {
          r.status = 'completed';
          const robot = db.robots.find((rb) => rb.id === r.robotId);
          if (robot) {
            robot.availableUnits = Math.min(robot.totalUnits, robot.availableUnits + r.quantity);
          }
          changed = true;
        }
      }
    }
    if (changed) {
      saveDatabase(db);
    }

    for (const c of clients) {
      if (c.ws.readyState !== WebSocket.OPEN || !c.userId) continue;
      const userRentals = db.rentals
        .filter((r) => r.investorId === c.userId)
        .map(enrichRental);
      if (userRentals.length > 0) {
        c.ws.send(
          JSON.stringify({
            type: 'rentals:tick',
            rentals: userRentals,
            serverTime: new Date().toISOString(),
          })
        );
      }
    }
  }, 5000);

  app.get('/api/overview', (_req: Request, res: Response) => {
    const db = loadDatabase();
    const totalUnits = db.robots.reduce((sum, r) => sum + r.totalUnits, 0);
    const availableUnits = db.robots.reduce((sum, r) => sum + r.availableUnits, 0);
    const minRate = db.robots.length ? Math.min(...db.robots.map((r) => r.dailyReturnRate)) : 0;
    const maxRate = db.robots.length ? Math.max(...db.robots.map((r) => r.dailyReturnRate)) : 0;

    res.json({
      corporateInitialized: hasMasterAdmin(db),
      masterAdminClaimed: hasMasterAdmin(db),
      siteConfig: db.siteConfig,
      stats: {
        totalFleetUnits: totalUnits,
        availableFleetUnits: availableUnits,
        activeHubs: db.siteConfig.activeHubsCount,
        dailyRateRange: `${minRate.toFixed(2)}%–${maxRate.toFixed(2)}%`,
        supportedCoins: db.cryptoCoins.length,
        verifiedInvestors: db.investors.filter((i) => i.kycStatus === 'verified').length,
      },
      featuredRobots: db.robots.slice(0, 8),
      dispatches: db.dispatches,
      cryptoCoins: db.cryptoCoins,
    });
  });

  // First-run Corporate Operations portal setup (locks once initialized or set via env)
  const handleCorporateSetup = (req: Request, res: Response) => {
    const db = loadDatabase();
    if (hasMasterAdmin(db)) {
      res.status(403).json({ error: 'Corporate Operations portal is already initialized.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const country = typeof body.country === 'string' ? body.country.trim() : '';
    const avatarUrl = validateSafeImageRef(body.avatarUrl);

    if (fullName.length < 2 || fullName.length > 100) {
      res.status(400).json({ error: 'Enter a valid full name for Operations Director.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Enter a valid corporate email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Corporate access password must be at least 8 characters.' });
      return;
    }
    if (db.investors.some((inv) => inv.email === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const usedCodes = new Set(db.investors.map((i) => i.referralCode));
    const { hash, salt } = hashPassword(password);
    const opsDirector: StoredInvestor = {
      id: `inv_ops_${crypto.randomUUID().slice(0, 8)}`,
      role: 'master_admin',
      department: 'Executive Operations',
      accountStatus: 'active',
      fullName,
      email,
      phone: phone || '+41 44 580 1200',
      companyName: 'Nexora AI Corporate Operations',
      country: country || 'Switzerland',
      city: 'Zurich',
      avatarUrl,
      investorType: 'Institutional Fund',
      kycStatus: 'verified',
      walletBalance: 0,
      heldBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalYieldCollected: 0,
      referralCode: generateReferralCode(fullName, usedCodes),
      referralBonusEarned: 0,
      hasApprovedDeposit: false,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.investors.unshift(opsDirector);
    createNotificationRecord(db, {
      userId: opsDirector.id,
      title: 'Corporate Operations Portal Activated',
      message:
        'Finance, Compliance, Technical, and Fleet Operations modules are active across the platform.',
      category: 'admin',
      actionScreen: 'admin',
    });
    saveDatabase(db);

    const token = signSessionToken(opsDirector.id);
    setSessionCookie(req, res, token);
    res.status(201).json({
      token,
      investor: sanitizeInvestor(opsDirector),
    });
  };

  app.post('/api/auth/corporate-setup', handleCorporateSetup);
  app.post('/api/auth/claim-master-admin', handleCorporateSetup);

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const country = typeof body.country === 'string' ? body.country.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const avatarUrl = validateSafeImageRef(body.avatarUrl);
    const referralCodeInput =
      typeof body.referralCode === 'string' ? body.referralCode.trim().toUpperCase() : '';
    const investorTypeRaw =
      typeof body.investorType === 'string' ? body.investorType.trim() : 'Individual Investor';

    if (fullName.length < 2 || fullName.length > 100) {
      res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (phone.length < 5 || phone.length > 32) {
      res.status(400).json({ error: 'Please provide a valid phone number.' });
      return;
    }
    if (country.length < 2 || country.length > 64) {
      res.status(400).json({ error: 'Please specify your country or jurisdiction.' });
      return;
    }

    const investorType: InvestorClassification = VALID_CLASSIFICATIONS.includes(
      investorTypeRaw as InvestorClassification
    )
      ? (investorTypeRaw as InvestorClassification)
      : 'Individual Investor';

    const db = loadDatabase();
    if (db.investors.some((inv) => inv.email === email)) {
      res.status(409).json({ error: 'An investor account with this email already exists.' });
      return;
    }

    let referrer: StoredInvestor | undefined;
    if (referralCodeInput) {
      referrer = db.investors.find(
        (inv) => inv.referralCode.toUpperCase() === referralCodeInput
      );
      if (!referrer) {
        res.status(400).json({ error: 'The referral invite code entered was not found.' });
        return;
      }
    }

    const usedCodes = new Set(db.investors.map((i) => i.referralCode));
    const { hash, salt } = hashPassword(password);
    const newInvestor: StoredInvestor = {
      id: `inv_${crypto.randomUUID().slice(0, 12)}`,
      role: 'investor',
      accountStatus: 'active',
      fullName,
      email,
      phone,
      companyName: companyName || 'Personal Portfolio',
      country,
      city: city || undefined,
      avatarUrl,
      investorType,
      kycStatus: 'unverified',
      walletBalance: 0,
      heldBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalYieldCollected: 0,
      referralCode: generateReferralCode(fullName, usedCodes),
      referredByUserId: referrer?.id,
      referredByCode: referrer?.referralCode,
      referredByName: referrer?.fullName,
      referralBonusEarned: 0,
      hasApprovedDeposit: false,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.investors.push(newInvestor);

    createNotificationRecord(db, {
      userId: newInvestor.id,
      title: `Welcome to ${db.siteConfig.brandName}`,
      message:
        'Complete your photo & ID verification, make a crypto deposit, and invite partners with your referral code to earn 2x daily yields.',
      category: 'system',
      actionScreen: 'verification',
    });

    if (referrer) {
      notifyUser(db, {
        userId: referrer.id,
        title: 'New Team Member Joined',
        message: `${fullName} registered using your invite code (${referrer.referralCode}). When their first deposit is approved, you earn ${db.siteConfig.referralRewardRatePct}% + 2x daily yields!`,
        category: 'referral',
        actionScreen: 'referrals',
      });
    }

    saveDatabase(db);
    broadcastToStaff({ type: 'admin:queue_updated' });

    const token = signSessionToken(newInvestor.id);
    setSessionCookie(req, res, token);
    res.status(201).json({
      token,
      investor: sanitizeInvestor(newInvestor),
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Enter both your email address and password.' });
      return;
    }

    syncEnvMasterAdmin();
    const db = loadDatabase();
    const investor = db.investors.find((inv) => inv.email === email);
    if (!investor) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!verifyPassword(password, investor.passwordHash, investor.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (investor.accountStatus === 'suspended') {
      res.status(403).json({
        error: 'This account is suspended. Contact Nexora Compliance or Technical Support.',
      });
      return;
    }

    const token = signSessionToken(investor.id);
    setSessionCookie(req, res, token);
    res.json({
      token,
      investor: sanitizeInvestor(investor),
    });
  });

  // Public password recovery request -> queued for Nexora Technical Department
  app.post('/api/auth/password-reset-request', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 280) : '';

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const db = loadDatabase();
    const matched = db.investors.find((inv) => inv.email === email);
    const ticket: PasswordResetRequest = {
      id: `pwr_${crypto.randomUUID().slice(0, 10)}`,
      email,
      investorId: matched?.id,
      investorName: matched?.fullName,
      note: note || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.passwordResetRequests.unshift(ticket);
    if (db.passwordResetRequests.length > 200) {
      db.passwordResetRequests = db.passwordResetRequests.slice(0, 200);
    }

    if (matched) {
      notifyUser(db, {
        userId: matched.id,
        title: 'Password Recovery Logged — Technical Dept',
        message:
          'Your password recovery request was logged with the Nexora Technical Department for verification and reset.',
        category: 'system',
        actionScreen: 'account',
      });
    }

    saveDatabase(db);
    broadcastToStaff({
      type: 'admin:queue_updated',
      notification: `Technical Dept: New password reset ticket for ${email}`,
    });

    res.status(201).json({
      ok: true,
      message:
        'If an account matches this email, the Nexora Technical Department has logged your password recovery request.',
    });
  });

  // Authenticated user password change (managed by Technical Department policies)
  app.post(
    '/api/auth/change-password',
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const currentPassword =
        typeof body.currentPassword === 'string' ? body.currentPassword : '';
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

      const db = loadDatabase();
      const target = db.investors.find((inv) => inv.id === req.investor!.id);
      if (!target) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      if (!verifyPassword(currentPassword, target.passwordHash, target.passwordSalt)) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }

      const minLen = target.role === 'master_admin' ? 8 : 6;
      if (newPassword.length < minLen || newPassword.length > 128) {
        res.status(400).json({
          error: `New password must be between ${minLen} and 128 characters.`,
        });
        return;
      }

      const { hash, salt } = hashPassword(newPassword);
      target.passwordHash = hash;
      target.passwordSalt = salt;

      for (const reqItem of db.passwordResetRequests) {
        if (
          reqItem.status === 'pending' &&
          (reqItem.investorId === target.id || reqItem.email === target.email)
        ) {
          reqItem.status = 'resolved';
          reqItem.resolvedByDepartment = 'Nexora Technical Department (Self-Service)';
          reqItem.resolvedAt = new Date().toISOString();
        }
      }

      notifyUser(db, {
        userId: target.id,
        title: 'Password Updated · Technical Department',
        message:
          'Your account credentials were updated and confirmed by the Nexora Technical Department.',
        category: 'system',
        actionScreen: 'account',
      });
      saveDatabase(db);

      res.json({ ok: true });
    }
  );

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ investor: sanitizeInvestor(req.investor!) });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const country = typeof body.country === 'string' ? body.country.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const investorTypeRaw =
      typeof body.investorType === 'string' ? body.investorType.trim() : '';
    const avatarUrl = validateSafeImageRef(body.avatarUrl);

    if (fullName.length < 2 || fullName.length > 100) {
      res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
      return;
    }
    if (phone.length < 5 || phone.length > 32) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }
    if (country.length < 2 || country.length > 64) {
      res.status(400).json({ error: 'Please enter a valid country.' });
      return;
    }

    const db = loadDatabase();
    const target = db.investors.find((inv) => inv.id === req.investor!.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    target.fullName = fullName;
    target.phone = phone;
    target.companyName = companyName || 'Personal Portfolio';
    target.country = country;
    target.city = city || undefined;
    if (avatarUrl) {
      target.avatarUrl = avatarUrl;
    }
    if (VALID_CLASSIFICATIONS.includes(investorTypeRaw as InvestorClassification)) {
      target.investorType = investorTypeRaw as InvestorClassification;
    }

    saveDatabase(db);
    broadcastToStaff({ type: 'admin:queue_updated' });
    res.json({ investor: sanitizeInvestor(target) });
  });

  // Submit KYC identity records & optional Proof of Financial Ability
  app.post(
    '/api/auth/verification',
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const docTypeRaw = typeof body.documentType === 'string' ? body.documentType.trim() : '';
      const documentNumber =
        typeof body.documentNumber === 'string' ? body.documentNumber.trim() : '';
      const frontImageUrl = validateSafeImageRef(body.frontImageUrl);
      const backOrSelfieUrl = validateSafeImageRef(body.backOrSelfieUrl);
      const sourceOfFunds =
        typeof body.sourceOfFunds === 'string' ? body.sourceOfFunds.trim().slice(0, 120) : '';
      const annualCapacity =
        typeof body.annualCapacity === 'string' ? body.annualCapacity.trim().slice(0, 80) : '';
      const financialProofUrl = validateSafeImageRef(body.financialProofUrl);
      const financialProofNote =
        typeof body.financialProofNote === 'string'
          ? body.financialProofNote.trim().slice(0, 300)
          : '';
      const avatarUrl = validateSafeImageRef(body.avatarUrl);

      if (!VALID_DOC_TYPES.includes(docTypeRaw as IdentityDocType)) {
        res.status(400).json({ error: 'Select a valid identity document type.' });
        return;
      }
      if (documentNumber.length < 4 || documentNumber.length > 48) {
        res.status(400).json({ error: 'Enter a valid ID / passport number.' });
        return;
      }
      if (!frontImageUrl || !backOrSelfieUrl) {
        res.status(400).json({
          error: 'Upload both the front of your ID document and a selfie / back photo.',
        });
        return;
      }

      const db = loadDatabase();
      const target = db.investors.find((inv) => inv.id === req.investor!.id);
      if (!target) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      if (avatarUrl) {
        target.avatarUrl = avatarUrl;
      }
      if (!target.avatarUrl) {
        res.status(400).json({
          error: 'Please upload a profile photo before submitting verification.',
        });
        return;
      }

      target.kycStatus = 'pending';
      target.verification = {
        documentType: docTypeRaw as IdentityDocType,
        documentNumber,
        frontImageUrl,
        backOrSelfieUrl,
        sourceOfFunds: sourceOfFunds || undefined,
        annualCapacity: annualCapacity || undefined,
        financialProofUrl: financialProofUrl || undefined,
        financialProofNote: financialProofNote || undefined,
        submittedAt: new Date().toISOString(),
      };

      notifyUser(db, {
        userId: target.id,
        title: 'KYC Verification Submitted',
        message: 'Your identity records have been queued for Nexora Compliance Department review.',
        category: 'kyc',
        actionScreen: 'verification',
      });

      saveDatabase(db);
      const sanitized = sanitizeInvestor(target);
      sendToUser(target.id, { type: 'investor:updated', investor: sanitized });
      broadcastToStaff({
        type: 'admin:queue_updated',
        notification: `${target.fullName} submitted KYC verification`,
      });

      res.json({ investor: sanitized });
    }
  );

  app.get('/api/robots', (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({ robots: db.robots });
  });

  // Referral & Team summary for authenticated user
  app.get('/api/referrals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const current = db.investors.find((i) => i.id === req.investor!.id);
    if (!current) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    res.json(buildReferralSummary(db, current));
  });

  // Persistent Notifications Inbox
  app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const list = db.notifications
      .filter((n) => n.userId === req.investor!.id)
      .slice(0, 100);
    res.json({
      notifications: list,
      unreadCount: list.filter((n) => !n.read).length,
    });
  });

  app.post(
    '/api/notifications/:id/read',
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const target = db.notifications.find(
        (n) => n.id === req.params.id && n.userId === req.investor!.id
      );
      if (target) {
        target.read = true;
        saveDatabase(db);
      }
      res.json({ ok: true });
    }
  );

  app.post(
    '/api/notifications/read-all',
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      for (const n of db.notifications) {
        if (n.userId === req.investor!.id) {
          n.read = true;
        }
      }
      saveDatabase(db);
      res.json({ ok: true });
    }
  );

  // Binance multi-network crypto deposit — ALWAYS enters PENDING for Master Admin approval
  app.post('/api/wallet/deposit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const coinSymbol = (
      typeof body.coinSymbol === 'string' ? body.coinSymbol : 'USDT'
    ) as BinanceCoinSymbol;
    const networkCode = (
      typeof body.networkCode === 'string' ? body.networkCode : 'TRC20'
    ) as BinanceNetworkCode;
    const amountUsd = Number(body.amountUsd);
    const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : '';
    const receiptImageUrl = validateSafeImageRef(body.receiptImageUrl);

    const db = loadDatabase();
    const net = getCoinNetworkFromDb(db, coinSymbol, networkCode);
    if (!net) {
      res.status(400).json({ error: 'Select a supported Binance coin and network.' });
      return;
    }
    if (!Number.isFinite(amountUsd) || amountUsd < net.minDepositUsd || amountUsd > 2500000) {
      res.status(400).json({
        error: `Deposit amount must be between $${net.minDepositUsd} and $2,500,000 for ${coinSymbol} (${net.networkName}).`,
      });
      return;
    }
    if (txHash.length < 8 && !receiptImageUrl) {
      res.status(400).json({
        error: 'Enter the blockchain TXID / hash or upload a transfer screenshot for verification.',
      });
      return;
    }

    const investor = db.investors.find((inv) => inv.id === req.investor!.id);
    if (!investor) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const cleanAmount = Number(amountUsd.toFixed(2));
    const tx: WalletTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 12)}`,
      investorId: investor.id,
      investorName: investor.fullName,
      investorEmail: investor.email,
      type: 'deposit',
      amount: cleanAmount,
      status: 'pending',
      coinSymbol,
      networkCode,
      networkName: net.networkName,
      walletAddress: net.depositAddress,
      memo: net.memo,
      txHash: txHash ? txHash.slice(0, 120) : undefined,
      receiptImageUrl,
      reference: `${coinSymbol} Deposit · ${net.networkName}`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(tx);
    notifyUser(db, {
      userId: investor.id,
      title: `$${cleanAmount.toLocaleString()} ${coinSymbol} Deposit Queued`,
      message:
        'Your transfer proof is waiting for Finance Department verification. Your balance will update as soon as it is approved.',
      category: 'transfer',
      actionScreen: 'activity',
    });
    saveDatabase(db);

    sendToUser(investor.id, { type: 'transaction:created', transaction: tx });
    broadcastToStaff({
      type: 'admin:queue_updated',
      notification: `New $${cleanAmount.toLocaleString()} ${coinSymbol} deposit pending review`,
    });

    res.status(201).json({
      investor: sanitizeInvestor(investor),
      transaction: tx,
    });
  });

  // Binance multi-network crypto withdrawal — reserves balance into escrow & awaits Master Admin approval
  app.post('/api/wallet/withdraw', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const coinSymbol = (
      typeof body.coinSymbol === 'string' ? body.coinSymbol : 'USDT'
    ) as BinanceCoinSymbol;
    const networkCode = (
      typeof body.networkCode === 'string' ? body.networkCode : 'TRC20'
    ) as BinanceNetworkCode;
    const amountUsd = Number(body.amountUsd);
    const walletAddress =
      typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
    const memo = typeof body.memo === 'string' ? body.memo.trim() : '';

    const db = loadDatabase();
    const net = getCoinNetworkFromDb(db, coinSymbol, networkCode);
    if (!net) {
      res.status(400).json({ error: 'Select a supported Binance coin and network.' });
      return;
    }

    const investor = db.investors.find((inv) => inv.id === req.investor!.id);
    if (!investor) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    if (investor.kycStatus !== 'verified' && investor.role !== 'master_admin') {
      res.status(403).json({
        error:
          'Identity verification must be approved by the Compliance Department before withdrawing.',
      });
      return;
    }

    const addressError = validateNetworkAddress(networkCode, walletAddress);
    if (addressError) {
      res.status(400).json({ error: addressError });
      return;
    }

    if (networkCode === 'XRPL' && !/^\d{4,12}$/.test(memo)) {
      res.status(400).json({
        error: 'XRP Ledger withdrawals require a numeric Destination Tag / Memo.',
      });
      return;
    }
    if (memo && memo.length > 64) {
      res.status(400).json({ error: 'Destination memo / tag must be 64 characters or fewer.' });
      return;
    }

    if (!Number.isFinite(amountUsd) || amountUsd < net.minWithdrawUsd) {
      res.status(400).json({
        error: `Minimum withdrawal for ${coinSymbol} (${net.networkName}) is $${net.minWithdrawUsd}.`,
      });
      return;
    }
    if (amountUsd > investor.walletBalance) {
      res.status(400).json({
        error: 'Withdrawal amount exceeds your available wallet balance.',
      });
      return;
    }
    if (amountUsd <= net.withdrawFeeUsd) {
      res.status(400).json({
        error: `Withdrawal amount must exceed the $${net.withdrawFeeUsd.toFixed(2)} network fee.`,
      });
      return;
    }

    const cleanAmount = Number(amountUsd.toFixed(2));
    investor.walletBalance = Number((investor.walletBalance - cleanAmount).toFixed(2));
    investor.heldBalance = Number(((investor.heldBalance ?? 0) + cleanAmount).toFixed(2));

    const tx: WalletTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 12)}`,
      investorId: investor.id,
      investorName: investor.fullName,
      investorEmail: investor.email,
      type: 'withdraw',
      amount: cleanAmount,
      status: 'pending',
      coinSymbol,
      networkCode,
      networkName: net.networkName,
      walletAddress,
      memo: memo || undefined,
      reference: `${coinSymbol} Withdrawal · ${net.networkName}`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(tx);
    notifyUser(db, {
      userId: investor.id,
      title: `$${cleanAmount.toLocaleString()} ${coinSymbol} Withdrawal Held in Escrow`,
      message: 'Your payout request is queued for Finance Department settlement approval.',
      category: 'transfer',
      actionScreen: 'activity',
    });
    saveDatabase(db);

    const sanitized = sanitizeInvestor(investor);
    sendToUser(investor.id, {
      type: 'investor:updated',
      investor: sanitized,
      transaction: tx,
    });
    broadcastToStaff({
      type: 'admin:queue_updated',
      notification: `New $${cleanAmount.toLocaleString()} ${coinSymbol} withdrawal pending approval`,
    });

    res.status(201).json({
      investor: sanitized,
      transaction: tx,
    });
  });

  app.post('/api/rentals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const robotId = typeof body.robotId === 'string' ? body.robotId.trim() : '';
    const quantity = Math.floor(Number(body.quantity ?? 1));

    if (!robotId || !Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
      res.status(400).json({ error: 'Select a valid robot unit and quantity (1–50).' });
      return;
    }

    const db = loadDatabase();
    const investor = db.investors.find((inv) => inv.id === req.investor!.id);
    const robot = db.robots.find((r) => r.id === robotId);

    if (!investor) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    if (!robot) {
      res.status(404).json({ error: 'Selected robotic machine was not found.' });
      return;
    }
    if (robot.availableUnits < quantity) {
      res.status(400).json({
        error: `Only ${robot.availableUnits} unit(s) of ${robot.name} are currently available.`,
      });
      return;
    }

    const totalCost = Number((robot.rentalPrice * quantity).toFixed(2));
    if (investor.walletBalance < totalCost) {
      res.status(400).json({
        error: `Insufficient wallet balance ($${investor.walletBalance.toFixed(2)}). Submit a crypto deposit to cover $${totalCost.toFixed(2)}.`,
      });
      return;
    }

    const dailyPayout = Number(((totalCost * robot.dailyReturnRate) / 100).toFixed(2));
    const multiplier = isDoubleYieldActive(investor) && robot.doubleYieldEligible !== false ? 2 : 1;
    const nowIso = new Date().toISOString();

    investor.walletBalance = Number((investor.walletBalance - totalCost).toFixed(2));
    robot.availableUnits -= quantity;

    const rental: MachineRental = {
      id: `rnt_${crypto.randomUUID().slice(0, 12)}`,
      investorId: investor.id,
      robotId: robot.id,
      robotName: robot.name,
      robotModelCode: robot.modelCode,
      robotImageUrl: robot.imageUrl,
      facilityHub: robot.facilityHub,
      quantity,
      unitPrice: robot.rentalPrice,
      totalCost,
      dailyReturnRate: robot.dailyReturnRate,
      dailyPayout,
      yieldMultiplier: multiplier,
      accruedYieldCarry: 0,
      accrualAnchorAt: nowIso,
      cycleDays: robot.cycleDays,
      simulatedDaysElapsed: 0,
      collectedYield: 0,
      status: 'active',
      rentedAt: nowIso,
      lastClaimedAt: null,
    };

    const tx: WalletTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 12)}`,
      investorId: investor.id,
      investorName: investor.fullName,
      investorEmail: investor.email,
      type: 'rental',
      amount: totalCost,
      status: 'completed',
      reference: `Rented ${quantity}x ${robot.name} (${robot.cycleDays}d cycle${multiplier === 2 ? ' · 2x Yield' : ''})`,
      createdAt: nowIso,
    };

    db.rentals.unshift(rental);
    db.transactions.unshift(tx);
    notifyUser(db, {
      userId: investor.id,
      title: `Machine Activated: ${quantity}x ${robot.name}`,
      message: `Earning $${(dailyPayout * multiplier).toFixed(2)}/day across a ${robot.cycleDays}-day operating cycle${multiplier === 2 ? ' with your 2x Referral Boost' : ''}.`,
      category: 'rental',
      actionScreen: 'mine',
    });
    saveDatabase(db);

    broadcastAll({ type: 'fleet:updated', robots: db.robots });
    broadcastToStaff({ type: 'admin:queue_updated' });

    res.status(201).json({
      investor: sanitizeInvestor(investor),
      rental: enrichRental(rental),
      robot,
      transaction: tx,
    });
  });

  app.get('/api/rentals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const list = db.rentals
      .filter((r) => r.investorId === req.investor!.id)
      .map(enrichRental);
    res.json({ rentals: list });
  });

  app.post('/api/rentals/:id/claim', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const investor = db.investors.find((inv) => inv.id === req.investor!.id);
    const rental = db.rentals.find(
      (r) => r.id === req.params.id && r.investorId === req.investor!.id
    );

    if (!investor || !rental) {
      res.status(404).json({ error: 'Rental contract not found.' });
      return;
    }

    const enriched = enrichRental(rental);
    const claimable = Number(enriched.accruedUnclaimedYield.toFixed(2));
    if (claimable < 0.01) {
      res.status(400).json({
        error: 'At least $0.01 of accrued yield is required to collect.',
      });
      return;
    }

    rental.collectedYield = Number((rental.collectedYield + claimable).toFixed(2));
    rental.lastClaimedAt = new Date().toISOString();
    if (enriched.daysElapsed >= rental.cycleDays) {
      rental.status = 'completed';
    }

    investor.walletBalance = Number((investor.walletBalance + claimable).toFixed(2));
    investor.totalYieldCollected = Number((investor.totalYieldCollected + claimable).toFixed(2));

    const tx: WalletTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 12)}`,
      investorId: investor.id,
      investorName: investor.fullName,
      investorEmail: investor.email,
      type: 'yield_payout',
      amount: claimable,
      status: 'completed',
      reference: `Live yield payout · ${rental.robotName}${rental.yieldMultiplier === 2 ? ' (2x Boost)' : ''}`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(tx);
    notifyUser(db, {
      userId: investor.id,
      title: `Collected $${claimable.toFixed(2)} Yield`,
      message: `${rental.robotName} yield payout was credited to your wallet balance.`,
      category: 'rental',
      actionScreen: 'mine',
    });
    saveDatabase(db);

    res.json({
      investor: sanitizeInvestor(investor),
      rental: enrichRental(rental),
      transaction: tx,
    });
  });

  app.get('/api/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const list = db.transactions.filter((tx) => tx.investorId === req.investor!.id);
    res.json({ transactions: list });
  });

  // ============================================================================
  // CORPORATE DEPARTMENTS OPERATIONS API
  // ============================================================================

  app.get(
    '/api/admin/overview',
    requireAuth,
    requireStaff,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const pendingTransactions = db.transactions.filter((t) => t.status === 'pending');
      const pendingDeposits = pendingTransactions.filter((t) => t.type === 'deposit');
      const pendingWithdrawals = pendingTransactions.filter((t) => t.type === 'withdraw');
      const pendingPasswordResets = db.passwordResetRequests.filter(
        (r) => r.status === 'pending'
      );

      res.json({
        summary: {
          totalUsers: db.investors.length,
          pendingDepositsCount: pendingDeposits.length,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          pendingKycCount: db.investors.filter((u) => u.kycStatus === 'pending').length,
          pendingPasswordResetsCount: pendingPasswordResets.length,
          pendingDepositVolume: Number(
            pendingDeposits.reduce((s, t) => s + t.amount, 0).toFixed(2)
          ),
          pendingWithdrawalVolume: Number(
            pendingWithdrawals.reduce((s, t) => s + t.amount, 0).toFixed(2)
          ),
          activeRentalsCount: db.rentals.filter((r) => r.status === 'active').length,
          totalRentalsCount: db.rentals.length,
          totalReferralPayouts: Number(
            db.transactions
              .filter((t) => t.type === 'referral_reward' && t.status === 'completed')
              .reduce((s, t) => s + t.amount, 0)
              .toFixed(2)
          ),
        },
        users: db.investors.map(sanitizeInvestor),
        pendingTransactions,
        allTransactions: db.transactions.slice(0, 120),
        passwordResetRequests: db.passwordResetRequests.slice(0, 100),
        rentals: db.rentals.map(enrichRental),
        robots: db.robots,
        dispatches: db.dispatches,
        cryptoCoins: db.cryptoCoins,
        siteConfig: db.siteConfig,
      });
    }
  );

  // Approve or Reject Deposit / Withdrawal (+ automatic Referral Rewards & 2x Yield Activation on approved deposit)
  app.post(
    '/api/admin/transactions/:id/review',
    requireAuth,
    requireStaff,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : null;
      const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim().slice(0, 240) : '';
      const txHashOverride = typeof body.txHash === 'string' ? body.txHash.trim().slice(0, 120) : '';

      if (!action) {
        res.status(400).json({ error: 'Specify approve or reject action.' });
        return;
      }

      const db = loadDatabase();
      const tx = db.transactions.find((t) => t.id === req.params.id);
      if (!tx) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }
      if (tx.status !== 'pending') {
        res.status(400).json({ error: 'This transaction has already been reviewed.' });
        return;
      }
      if (tx.type !== 'deposit' && tx.type !== 'withdraw') {
        res.status(400).json({ error: 'Only deposits and withdrawals require approval.' });
        return;
      }

      const investor = db.investors.find((inv) => inv.id === tx.investorId);
      if (!investor) {
        res.status(404).json({ error: 'Associated user account not found.' });
        return;
      }

      const reviewerLabel = req.investor!.department || 'Nexora Finance Department';
      const now = new Date().toISOString();

      let referrerUpdated: StoredInvestor | undefined;
      let referralTx: WalletTransaction | undefined;

      if (tx.type === 'deposit') {
        if (action === 'approve') {
          tx.status = 'completed';
          investor.walletBalance = Number((investor.walletBalance + tx.amount).toFixed(2));
          investor.totalDeposited = Number((investor.totalDeposited + tx.amount).toFixed(2));
          investor.hasApprovedDeposit = true;
          if (txHashOverride) tx.txHash = txHashOverride;

          notifyUser(db, {
            userId: investor.id,
            title: `$${tx.amount.toLocaleString()} ${tx.coinSymbol || 'Crypto'} Deposit Approved`,
            message:
              'Approved by Nexora Finance Department. Funds are now available in your wallet to rent AI robotic machines.',
            category: 'transfer',
            actionScreen: 'mine',
          });

          // Referral reward payout when invitee successfully deposits!
          if (investor.referredByUserId) {
            const referrer = db.investors.find((u) => u.id === investor.referredByUserId);
            if (referrer) {
              const rate = db.siteConfig.referralRewardRatePct || 5.5;
              const commissionUsd = Number(((tx.amount * rate) / 100).toFixed(2));
              const boostDays = Math.max(1, db.siteConfig.referralDoubleYieldDays || 7);

              if (commissionUsd > 0) {
                referrer.walletBalance = Number(
                  (referrer.walletBalance + commissionUsd).toFixed(2)
                );
                referrer.referralBonusEarned = Number(
                  ((referrer.referralBonusEarned ?? 0) + commissionUsd).toFixed(2)
                );

                const currentBoostMs = referrer.doubleYieldActiveUntil
                  ? Math.max(Date.now(), new Date(referrer.doubleYieldActiveUntil).getTime())
                  : Date.now();
                referrer.doubleYieldActiveUntil = new Date(
                  currentBoostMs + boostDays * 24 * 60 * 60 * 1000
                ).toISOString();

                // Activate 2x daily yield across referrer's active rentals immediately
                for (const r of db.rentals) {
                  if (r.investorId === referrer.id && r.status === 'active' && r.yieldMultiplier < 2) {
                    syncRentalMultiplier(r, 2);
                  }
                }

                referralTx = {
                  id: `tx_${crypto.randomUUID().slice(0, 12)}`,
                  investorId: referrer.id,
                  investorName: referrer.fullName,
                  investorEmail: referrer.email,
                  type: 'referral_reward',
                  amount: commissionUsd,
                  status: 'completed',
                  reference: `Invite Reward (${rate}%) · ${investor.fullName} $${tx.amount.toLocaleString()} deposit + 2x Yield`,
                  createdAt: now,
                };
                db.transactions.unshift(referralTx);

                notifyUser(db, {
                  userId: referrer.id,
                  title: `+$${commissionUsd.toFixed(2)} Invite Reward & 2x Daily Yield!`,
                  message: `Team member ${investor.fullName} completed a $${tx.amount.toLocaleString()} deposit. You earned $${commissionUsd.toFixed(2)} and unlocked ${boostDays} days of 2x daily yields on your active robots.`,
                  category: 'referral',
                  actionScreen: 'referrals',
                });

                referrerUpdated = referrer;
              }
            }
          }
        } else {
          tx.status = 'rejected';
          notifyUser(db, {
            userId: investor.id,
            title: `$${tx.amount.toLocaleString()} Deposit Declined`,
            message: adminNote || 'Transfer could not be matched. Please verify TXID and resubmit.',
            category: 'transfer',
            actionScreen: 'wallet',
          });
        }
      } else if (tx.type === 'withdraw') {
        const held = investor.heldBalance ?? 0;
        investor.heldBalance = Number(Math.max(0, held - tx.amount).toFixed(2));
        if (action === 'approve') {
          tx.status = 'completed';
          investor.totalWithdrawn = Number((investor.totalWithdrawn + tx.amount).toFixed(2));
          tx.txHash =
            txHashOverride || tx.txHash || `0x${crypto.randomBytes(16).toString('hex')}`;
          notifyUser(db, {
            userId: investor.id,
            title: `$${tx.amount.toLocaleString()} ${tx.coinSymbol || 'Crypto'} Payout Sent`,
            message: `Sent to ${tx.walletAddress || 'your destination wallet'}. TXID: ${tx.txHash}`,
            category: 'transfer',
            actionScreen: 'activity',
          });
        } else {
          tx.status = 'rejected';
          investor.walletBalance = Number((investor.walletBalance + tx.amount).toFixed(2));
          notifyUser(db, {
            userId: investor.id,
            title: `Withdrawal Declined & Refunded`,
            message: `$${tx.amount.toLocaleString()} was returned to your available wallet balance.${adminNote ? ` Reason: ${adminNote}` : ''}`,
            category: 'transfer',
            actionScreen: 'wallet',
          });
        }
      }

      tx.reviewedBy = reviewerLabel;
      tx.reviewedAt = now;
      if (adminNote) {
        tx.adminNote = adminNote;
      }

      saveDatabase(db);

      const sanitized = sanitizeInvestor(investor);
      sendToUser(investor.id, {
        type: 'investor:updated',
        investor: sanitized,
        transaction: tx,
        notification:
          action === 'approve'
            ? `Your $${tx.amount.toLocaleString()} ${tx.type} was approved.`
            : `Your $${tx.amount.toLocaleString()} ${tx.type} was rejected${adminNote ? `: ${adminNote}` : '.'}`,
      });

      if (referrerUpdated) {
        sendToUser(referrerUpdated.id, {
          type: 'investor:updated',
          investor: sanitizeInvestor(referrerUpdated),
          transaction: referralTx,
        });
        sendToUser(referrerUpdated.id, { type: 'rentals:refresh' });
      }

      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ transaction: tx, investor: sanitized });
    }
  );

  // Approve or Reject KYC & Financial Ability Verification
  app.post(
    '/api/admin/users/:id/kyc',
    requireAuth,
    requireStaff,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : null;
      const reviewNote = typeof body.reviewNote === 'string' ? body.reviewNote.trim().slice(0, 240) : '';

      if (!action) {
        res.status(400).json({ error: 'Specify approve or reject action.' });
        return;
      }

      const db = loadDatabase();
      const target = db.investors.find((u) => u.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      target.kycStatus = action === 'approve' ? 'verified' : 'rejected';
      if (target.verification) {
        target.verification.reviewedAt = new Date().toISOString();
        target.verification.reviewedBy = 'Nexora Compliance Department';
        target.verification.reviewNote = reviewNote || undefined;
      }

      notifyUser(db, {
        userId: target.id,
        title: action === 'approve' ? 'Identity Verified' : 'Verification Needs Update',
        message:
          action === 'approve'
            ? 'Your KYC documents were approved by the Compliance Department. Crypto withdrawals are now unlocked.'
            : reviewNote || 'Please upload clearer identity photos and resubmit.',
        category: 'kyc',
        actionScreen: 'verification',
      });

      saveDatabase(db);
      const sanitized = sanitizeInvestor(target);
      sendToUser(target.id, {
        type: 'investor:updated',
        investor: sanitized,
        notification:
          action === 'approve'
            ? 'Your identity verification was approved. Withdrawals are now unlocked.'
            : `Verification declined${reviewNote ? `: ${reviewNote}` : '. Please resubmit documents.'}`,
      });
      broadcastToStaff({ type: 'admin:queue_updated' });

      res.json({ user: sanitized });
    }
  );

  // Technical / Executive Department: Provision a new user account directly
  app.post(
    '/api/admin/users',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '+41 44 580 00 00';
      const country = typeof body.country === 'string' ? body.country.trim() : 'Switzerland';
      const companyName =
        typeof body.companyName === 'string' ? body.companyName.trim() : 'Personal Portfolio';
      const role = typeof body.role === 'string' ? (body.role.trim() as UserRole) : 'investor';
      const departmentRaw =
        typeof body.department === 'string' ? (body.department.trim() as CorporateDepartment) : undefined;
      const department =
        departmentRaw && VALID_DEPARTMENTS.includes(departmentRaw)
          ? departmentRaw
          : departmentForRole(role);
      const walletBalance = Math.max(0, Number(body.walletBalance ?? 0) || 0);
      const kycStatus = VALID_KYC_STATUSES.includes(body.kycStatus as KycStatus)
        ? (body.kycStatus as KycStatus)
        : 'unverified';

      if (fullName.length < 2 || !isValidEmail(email) || password.length < 6) {
        res.status(400).json({ error: 'Provide a valid full name, email, and 6+ char password.' });
        return;
      }
      if (!ASSIGNABLE_ROLES.includes(role)) {
        res.status(400).json({ error: 'Select a valid assignable role.' });
        return;
      }

      const db = loadDatabase();
      if (db.investors.some((u) => u.email === email)) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const usedCodes = new Set(db.investors.map((i) => i.referralCode));
      const { hash, salt } = hashPassword(password);
      const created: StoredInvestor = {
        id: `inv_${crypto.randomUUID().slice(0, 12)}`,
        role,
        department,
        accountStatus: 'active',
        fullName,
        email,
        phone,
        companyName,
        country,
        investorType: 'Individual Investor',
        kycStatus,
        walletBalance: Number(walletBalance.toFixed(2)),
        heldBalance: 0,
        totalDeposited: Number(walletBalance.toFixed(2)),
        totalWithdrawn: 0,
        totalYieldCollected: 0,
        referralCode: generateReferralCode(fullName, usedCodes),
        referralBonusEarned: 0,
        hasApprovedDeposit: walletBalance > 0,
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        passwordSalt: salt,
      };

      db.investors.push(created);
      createNotificationRecord(db, {
        userId: created.id,
        title: `Account Provisioned by Nexora Operations`,
        message: `Your ${db.siteConfig.brandName} account is ready${department ? ` (${department})` : ''}.`,
        category: 'system',
        actionScreen: 'mine',
      });
      saveDatabase(db);
      broadcastToStaff({ type: 'admin:queue_updated' });

      res.status(201).json({ user: sanitizeInvestor(created) });
    }
  );

  // Full CRUD update on user profile, balance, KYC, department role, or status
  app.patch(
    '/api/admin/users/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const db = loadDatabase();
      const target = db.investors.find((u) => u.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      const isTargetMaster = target.role === 'master_admin';

      if (typeof body.fullName === 'string' && body.fullName.trim().length >= 2) {
        target.fullName = body.fullName.trim().slice(0, 100);
      }
      if (typeof body.phone === 'string' && body.phone.trim().length >= 4) {
        target.phone = body.phone.trim().slice(0, 32);
      }
      if (typeof body.companyName === 'string') {
        target.companyName = body.companyName.trim().slice(0, 100) || 'Personal Portfolio';
      }
      if (typeof body.country === 'string' && body.country.trim().length >= 2) {
        target.country = body.country.trim().slice(0, 64);
      }
      if (typeof body.city === 'string') {
        target.city = body.city.trim().slice(0, 64) || undefined;
      }
      if (
        typeof body.investorType === 'string' &&
        VALID_CLASSIFICATIONS.includes(body.investorType as InvestorClassification)
      ) {
        target.investorType = body.investorType as InvestorClassification;
      }
      if (body.walletBalance !== undefined && Number.isFinite(Number(body.walletBalance))) {
        target.walletBalance = Number(Math.max(0, Number(body.walletBalance)).toFixed(2));
      }
      if (body.heldBalance !== undefined && Number.isFinite(Number(body.heldBalance))) {
        target.heldBalance = Number(Math.max(0, Number(body.heldBalance)).toFixed(2));
      }
      if (
        typeof body.kycStatus === 'string' &&
        VALID_KYC_STATUSES.includes(body.kycStatus as KycStatus)
      ) {
        target.kycStatus = body.kycStatus as KycStatus;
      }
      if (typeof body.doubleYieldDays === 'number' && Number.isFinite(body.doubleYieldDays)) {
        if (body.doubleYieldDays <= 0) {
          target.doubleYieldActiveUntil = undefined;
          for (const r of db.rentals) {
            if (r.investorId === target.id && r.status === 'active' && r.yieldMultiplier !== 1) {
              syncRentalMultiplier(r, 1);
            }
          }
        } else {
          target.doubleYieldActiveUntil = new Date(
            Date.now() + body.doubleYieldDays * 24 * 60 * 60 * 1000
          ).toISOString();
          for (const r of db.rentals) {
            if (r.investorId === target.id && r.status === 'active' && r.yieldMultiplier !== 2) {
              syncRentalMultiplier(r, 2);
            }
          }
        }
      }

      if (!isTargetMaster) {
        if (typeof body.role === 'string' && ASSIGNABLE_ROLES.includes(body.role as UserRole)) {
          target.role = body.role as UserRole;
          if (target.role === 'investor') {
            target.department = undefined;
          } else if (!target.department) {
            target.department = departmentForRole(target.role);
          }
        }
        if (
          typeof body.department === 'string' &&
          VALID_DEPARTMENTS.includes(body.department as CorporateDepartment)
        ) {
          target.department =
            target.role === 'investor' ? undefined : (body.department as CorporateDepartment);
        }
        if (body.accountStatus === 'active' || body.accountStatus === 'suspended') {
          target.accountStatus = body.accountStatus;
        }
      }

      notifyUser(db, {
        userId: target.id,
        title: 'Account Updated · Nexora Operations',
        message: 'Your profile, balance, or department status was updated.',
        category: 'admin',
        actionScreen: 'mine',
      });
      saveDatabase(db);

      const sanitized = sanitizeInvestor(target);
      for (const c of clients) {
        if (c.userId === target.id) {
          c.role = target.role;
        }
      }
      sendToUser(target.id, {
        type: 'investor:updated',
        investor: sanitized,
        notification: 'Your account details were updated by Nexora Operations.',
      });
      sendToUser(target.id, { type: 'rentals:refresh' });
      broadcastToStaff({ type: 'admin:queue_updated' });

      res.json({ user: sanitized });
    }
  );

  // Technical Department: Set or reset any user's password directly
  app.post(
    '/api/admin/users/:id/password',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
      const resolutionNote =
        typeof body.resolutionNote === 'string' ? body.resolutionNote.trim().slice(0, 240) : '';

      if (newPassword.length < 6 || newPassword.length > 128) {
        res.status(400).json({ error: 'New password must be between 6 and 128 characters.' });
        return;
      }

      const db = loadDatabase();
      const target = db.investors.find((u) => u.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      if (target.role === 'master_admin' && target.id !== req.investor!.id) {
        res.status(403).json({
          error: 'Executive Operations credentials can only be changed by the account holder.',
        });
        return;
      }

      const { hash, salt } = hashPassword(newPassword);
      target.passwordHash = hash;
      target.passwordSalt = salt;

      const now = new Date().toISOString();
      for (const reqItem of db.passwordResetRequests) {
        if (
          reqItem.status === 'pending' &&
          (reqItem.investorId === target.id || reqItem.email === target.email)
        ) {
          reqItem.status = 'resolved';
          reqItem.resolvedByDepartment = 'Nexora Technical Department';
          reqItem.resolutionNote = resolutionNote || 'Credentials reset by Technical Department.';
          reqItem.resolvedAt = now;
        }
      }

      notifyUser(db, {
        userId: target.id,
        title: 'Password Reset · Nexora Technical Department',
        message:
          resolutionNote ||
          'Your account password has been reset by the Nexora Technical Department.',
        category: 'admin',
        actionScreen: 'account',
      });
      saveDatabase(db);

      sendToUser(target.id, {
        type: 'investor:updated',
        investor: sanitizeInvestor(target),
        notification: 'Technical Department updated your account password.',
      });
      broadcastToStaff({ type: 'admin:queue_updated' });

      res.json({ ok: true, user: sanitizeInvestor(target) });
    }
  );

  app.post(
    '/api/admin/password-requests/:id/dismiss',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const ticket = db.passwordResetRequests.find((r) => r.id === req.params.id);
      if (!ticket) {
        res.status(404).json({ error: 'Password request not found.' });
        return;
      }
      ticket.status = 'dismissed';
      ticket.resolvedByDepartment = 'Nexora Technical Department';
      ticket.resolvedAt = new Date().toISOString();
      saveDatabase(db);
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true });
    }
  );

  // Delete an investor / staff account
  app.delete(
    '/api/admin/users/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const target = db.investors.find((u) => u.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      if (target.role === 'master_admin') {
        res.status(403).json({
          error: 'The primary Executive Operations account cannot be deleted.',
        });
        return;
      }

      db.investors = db.investors.filter((u) => u.id !== target.id);
      db.rentals = db.rentals.filter((r) => r.investorId !== target.id);
      db.transactions = db.transactions.filter((t) => t.investorId !== target.id);
      db.notifications = db.notifications.filter((n) => n.userId !== target.id);
      saveDatabase(db);

      for (const c of clients) {
        if (c.userId === target.id) {
          c.ws.close();
        }
      }
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true });
    }
  );

  // Assign Department Role & Suspend / Restore user accounts
  app.patch(
    '/api/admin/users/:id/role',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const role = typeof body.role === 'string' ? (body.role.trim() as UserRole) : undefined;
      const departmentRaw =
        typeof body.department === 'string' ? (body.department.trim() as CorporateDepartment) : undefined;
      const accountStatus =
        typeof body.accountStatus === 'string'
          ? (body.accountStatus.trim() as AccountStatus)
          : undefined;

      const db = loadDatabase();
      const target = db.investors.find((u) => u.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      if (target.role === 'master_admin') {
        res.status(403).json({
          error: 'Executive Operations director assignment cannot be modified or demoted.',
        });
        return;
      }

      if (role) {
        if (!ASSIGNABLE_ROLES.includes(role)) {
          res.status(400).json({ error: 'Invalid target role.' });
          return;
        }
        target.role = role;
        if (role === 'investor') {
          target.department = undefined;
        } else {
          target.department =
            departmentRaw && VALID_DEPARTMENTS.includes(departmentRaw)
              ? departmentRaw
              : departmentForRole(role);
        }
      } else if (
        departmentRaw &&
        VALID_DEPARTMENTS.includes(departmentRaw) &&
        target.role !== 'investor'
      ) {
        target.department = departmentRaw;
      }

      if (accountStatus) {
        if (accountStatus !== 'active' && accountStatus !== 'suspended') {
          res.status(400).json({ error: 'Invalid account status.' });
          return;
        }
        target.accountStatus = accountStatus;
      }

      const deptLabel = target.department || 'Investor Access';
      notifyUser(db, {
        userId: target.id,
        title: `Department Access Updated · ${deptLabel}`,
        message: `Nexora Operations updated your account assignment to ${deptLabel} (${target.accountStatus}).`,
        category: 'admin',
        actionScreen: target.role === 'investor' ? 'mine' : 'admin',
      });
      saveDatabase(db);
      const sanitized = sanitizeInvestor(target);

      for (const c of clients) {
        if (c.userId === target.id) {
          c.role = target.role;
        }
      }

      sendToUser(target.id, {
        type: 'investor:updated',
        investor: sanitized,
        notification: `Nexora Operations updated your assignment to ${deptLabel} (${target.accountStatus}).`,
      });
      broadcastToStaff({ type: 'admin:queue_updated' });

      res.json({ user: sanitized });
    }
  );

  // Master Admin ONLY: Edit Site Display Content & System Settings (effective system-wide immediately!)
  app.patch(
    '/api/admin/site-config',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const db = loadDatabase();
      const cfg = db.siteConfig;

      const strField = (key: keyof typeof cfg, max = 300) => {
        if (typeof body[key] === 'string') {
          const v = (body[key] as string).trim();
          if (v.length > 0 || key === 'announcementBanner') {
            (cfg[key] as string) = v.slice(0, max);
          }
        }
      };

      strField('brandName', 50);
      strField('brandSubtitle', 50);
      strField('headquartersAddress', 160);
      strField('heroKicker', 60);
      strField('heroTitle', 90);
      strField('heroDescription', 360);
      strField('primaryCtaText', 40);
      strField('secondaryCtaText', 40);
      strField('announcementBanner', 220);
      strField('referralHeadline', 100);
      strField('referralDescription', 360);
      strField('footerNotice', 100);

      const heroImg = validateSafeImageRef(body.heroImageUrl);
      if (heroImg) {
        cfg.heroImageUrl = heroImg;
      }

      if (body.activeHubsCount !== undefined) {
        const hubs = Math.floor(Number(body.activeHubsCount));
        if (Number.isFinite(hubs) && hubs >= 1 && hubs <= 500) {
          cfg.activeHubsCount = hubs;
        }
      }

      if (body.referralRewardRatePct !== undefined) {
        const pct = Number(body.referralRewardRatePct);
        if (Number.isFinite(pct) && pct >= 0.5 && pct <= 50) {
          cfg.referralRewardRatePct = Number(pct.toFixed(2));
        }
      }

      if (body.referralDoubleYieldDays !== undefined) {
        const days = Math.floor(Number(body.referralDoubleYieldDays));
        if (Number.isFinite(days) && days >= 1 && days <= 365) {
          cfg.referralDoubleYieldDays = days;
        }
      }

      if (Array.isArray(body.howItWorksSteps) && body.howItWorksSteps.length >= 1) {
        cfg.howItWorksSteps = body.howItWorksSteps
          .slice(0, 5)
          .map((s: unknown) => {
            const step = s as { title?: unknown; body?: unknown };
            return {
              title: typeof step.title === 'string' ? step.title.trim().slice(0, 80) : '',
              body: typeof step.body === 'string' ? step.body.trim().slice(0, 280) : '',
            };
          })
          .filter((s) => s.title && s.body);
      }

      saveDatabase(db);
      broadcastAll({ type: 'site:updated', siteConfig: db.siteConfig });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ siteConfig: db.siteConfig });
    }
  );

  // Master Admin ONLY: Edit Binance Coin Treasury Deposit Addresses & Network Fees
  app.patch(
    '/api/admin/crypto-coins',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const symbol = typeof body.symbol === 'string' ? body.symbol.trim() : '';
      const networkCode = typeof body.networkCode === 'string' ? body.networkCode.trim() : '';
      const depositAddress =
        typeof body.depositAddress === 'string' ? body.depositAddress.trim() : '';
      const memo = typeof body.memo === 'string' ? body.memo.trim() : undefined;
      const minDepositUsd = Number(body.minDepositUsd);
      const minWithdrawUsd = Number(body.minWithdrawUsd);
      const withdrawFeeUsd = Number(body.withdrawFeeUsd);

      const db = loadDatabase();
      const coin = db.cryptoCoins.find((c) => c.symbol === symbol);
      const net = coin?.networks.find((n) => n.networkCode === networkCode);
      if (!net) {
        res.status(404).json({ error: 'Selected coin or network was not found.' });
        return;
      }

      if (depositAddress) {
        const addrErr = validateNetworkAddress(net.networkCode, depositAddress);
        if (addrErr) {
          res.status(400).json({ error: addrErr });
          return;
        }
        net.depositAddress = depositAddress;
      }
      if (memo !== undefined) {
        net.memo = memo || undefined;
      }
      if (Number.isFinite(minDepositUsd) && minDepositUsd >= 1) {
        net.minDepositUsd = Number(minDepositUsd.toFixed(2));
      }
      if (Number.isFinite(minWithdrawUsd) && minWithdrawUsd >= 1) {
        net.minWithdrawUsd = Number(minWithdrawUsd.toFixed(2));
      }
      if (Number.isFinite(withdrawFeeUsd) && withdrawFeeUsd >= 0) {
        net.withdrawFeeUsd = Number(withdrawFeeUsd.toFixed(2));
      }

      saveDatabase(db);
      broadcastAll({ type: 'coins:updated', cryptoCoins: db.cryptoCoins });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ cryptoCoins: db.cryptoCoins });
    }
  );

  // Master Admin ONLY: Robots Full CRUD (Create / Update / Delete)
  app.post(
    '/api/admin/robots',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const modelCode = typeof body.modelCode === 'string' ? body.modelCode.trim().toUpperCase() : '';
      const category = VALID_ROBOT_CATEGORIES.includes(body.category as RobotCategory)
        ? (body.category as RobotCategory)
        : 'Warehouse & Logistics';
      const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : tagline;
      const facilityHub = typeof body.facilityHub === 'string' ? body.facilityHub.trim() : 'Zurich Robotics Annex';
      const rentalPrice = Number(body.rentalPrice);
      const dailyReturnRate = Number(body.dailyReturnRate);
      const cycleDays = Math.floor(Number(body.cycleDays));
      const totalUnits = Math.floor(Number(body.totalUnits ?? 10));
      const availableUnits = Math.floor(Number(body.availableUnits ?? totalUnits));
      const imageUrl =
        validateSafeImageRef(body.imageUrl) ||
        '/src/assets/images/robot_logistics_amr_1795701350768.jpg';

      if (name.length < 3 || modelCode.length < 3 || tagline.length < 5) {
        res.status(400).json({ error: 'Provide robot name, model code, and tagline.' });
        return;
      }
      if (!Number.isFinite(rentalPrice) || rentalPrice < 50 || !Number.isFinite(dailyReturnRate) || dailyReturnRate <= 0 || cycleDays < 1) {
        res.status(400).json({ error: 'Enter valid price, daily rate %, and cycle days.' });
        return;
      }

      const db = loadDatabase();
      const referralBonusUsd =
        body.referralBonusUsd !== undefined && Number.isFinite(Number(body.referralBonusUsd))
          ? Number(Number(body.referralBonusUsd).toFixed(2))
          : Number(((rentalPrice * db.siteConfig.referralRewardRatePct) / 100).toFixed(2));

      const created: RobotMachine = {
        id: `nx-${crypto.randomUUID().slice(0, 8)}`,
        modelCode,
        name,
        category,
        tagline,
        description,
        imageUrl,
        rentalPrice: Number(rentalPrice.toFixed(2)),
        dailyReturnRate: Number(dailyReturnRate.toFixed(2)),
        cycleDays,
        availableUnits: Math.max(0, availableUnits),
        totalUnits: Math.max(1, totalUnits),
        facilityHub,
        referralBonusUsd,
        doubleYieldEligible: body.doubleYieldEligible !== false,
        specs: {
          neuralCore:
            typeof body.neuralCore === 'string' && body.neuralCore.trim()
              ? body.neuralCore.trim()
              : 'Nexora AI Core V4',
          autonomyLevel:
            typeof body.autonomyLevel === 'string' && body.autonomyLevel.trim()
              ? body.autonomyLevel.trim()
              : 'Level 4 Autonomous',
          payloadCapacity:
            typeof body.payloadCapacity === 'string' && body.payloadCapacity.trim()
              ? body.payloadCapacity.trim()
              : '45 kg continuous',
          uptimeSla: '99.4% verified',
        },
      };

      db.robots.unshift(created);
      saveDatabase(db);
      broadcastAll({ type: 'fleet:updated', robots: db.robots });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.status(201).json({ robot: created });
    }
  );

  app.patch(
    '/api/admin/robots/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const db = loadDatabase();
      const robot = db.robots.find((r) => r.id === req.params.id);
      if (!robot) {
        res.status(404).json({ error: 'Robot machine not found.' });
        return;
      }

      if (typeof body.name === 'string' && body.name.trim().length >= 2) {
        robot.name = body.name.trim();
      }
      if (typeof body.modelCode === 'string' && body.modelCode.trim().length >= 2) {
        robot.modelCode = body.modelCode.trim().toUpperCase();
      }
      if (VALID_ROBOT_CATEGORIES.includes(body.category as RobotCategory)) {
        robot.category = body.category as RobotCategory;
      }
      if (typeof body.tagline === 'string' && body.tagline.trim().length >= 3) {
        robot.tagline = body.tagline.trim();
      }
      if (typeof body.description === 'string' && body.description.trim().length >= 3) {
        robot.description = body.description.trim();
      }
      if (typeof body.facilityHub === 'string' && body.facilityHub.trim().length >= 2) {
        robot.facilityHub = body.facilityHub.trim();
      }
      const nextImg = validateSafeImageRef(body.imageUrl);
      if (nextImg) {
        robot.imageUrl = nextImg;
      }
      if (body.rentalPrice !== undefined && Number(body.rentalPrice) >= 50) {
        robot.rentalPrice = Number(Number(body.rentalPrice).toFixed(2));
      }
      if (body.dailyReturnRate !== undefined && Number(body.dailyReturnRate) > 0) {
        robot.dailyReturnRate = Number(Number(body.dailyReturnRate).toFixed(2));
      }
      if (body.cycleDays !== undefined && Number(body.cycleDays) >= 1) {
        robot.cycleDays = Math.floor(Number(body.cycleDays));
      }
      if (body.availableUnits !== undefined && Number(body.availableUnits) >= 0) {
        robot.availableUnits = Math.floor(Number(body.availableUnits));
      }
      if (body.totalUnits !== undefined && Number(body.totalUnits) >= 1) {
        robot.totalUnits = Math.floor(Number(body.totalUnits));
      }
      if (body.referralBonusUsd !== undefined && Number(body.referralBonusUsd) >= 0) {
        robot.referralBonusUsd = Number(Number(body.referralBonusUsd).toFixed(2));
      }

      saveDatabase(db);
      broadcastAll({ type: 'fleet:updated', robots: db.robots });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ robot });
    }
  );

  app.delete(
    '/api/admin/robots/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const idx = db.robots.findIndex((r) => r.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Robot machine not found.' });
        return;
      }
      db.robots.splice(idx, 1);
      saveDatabase(db);
      broadcastAll({ type: 'fleet:updated', robots: db.robots });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true });
    }
  );

  // Admin / Master Admin: Dispatches / Fleet News Full CRUD
  app.post(
    '/api/admin/dispatches',
    requireAuth,
    requireStaff,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const category = typeof body.category === 'string' ? body.category.trim() : 'Deployment';
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
      const imageUrl = validateSafeImageRef(body.imageUrl);

      if (title.length < 4 || summary.length < 8) {
        res.status(400).json({ error: 'Provide a clear title and summary for the dispatch.' });
        return;
      }

      const db = loadDatabase();
      const dispatch: FleetDispatch = {
        id: `disp-${crypto.randomUUID().slice(0, 6)}`,
        category: category || 'Deployment',
        publishedAt: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          year: 'numeric',
        }).format(new Date()),
        title,
        summary,
        imageUrl: imageUrl || '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
      };
      db.dispatches.unshift(dispatch);
      saveDatabase(db);

      broadcastAll({ type: 'dispatches:updated', dispatches: db.dispatches });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.status(201).json({ dispatch });
    }
  );

  app.patch(
    '/api/admin/dispatches/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const db = loadDatabase();
      const dispatch = db.dispatches.find((d) => d.id === req.params.id);
      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found.' });
        return;
      }
      if (typeof body.category === 'string' && body.category.trim()) {
        dispatch.category = body.category.trim();
      }
      if (typeof body.title === 'string' && body.title.trim().length >= 4) {
        dispatch.title = body.title.trim();
      }
      if (typeof body.summary === 'string' && body.summary.trim().length >= 8) {
        dispatch.summary = body.summary.trim();
      }
      const nextImg = validateSafeImageRef(body.imageUrl);
      if (nextImg) {
        dispatch.imageUrl = nextImg;
      }
      saveDatabase(db);
      broadcastAll({ type: 'dispatches:updated', dispatches: db.dispatches });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ dispatch });
    }
  );

  app.delete(
    '/api/admin/dispatches/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const idx = db.dispatches.findIndex((d) => d.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Dispatch not found.' });
        return;
      }
      db.dispatches.splice(idx, 1);
      saveDatabase(db);
      broadcastAll({ type: 'dispatches:updated', dispatches: db.dispatches });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true });
    }
  );

  // Master Admin ONLY: Edit or Cancel any Rental Contract
  app.patch(
    '/api/admin/rentals/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const db = loadDatabase();
      const rental = db.rentals.find((r) => r.id === req.params.id);
      if (!rental) {
        res.status(404).json({ error: 'Rental contract not found.' });
        return;
      }

      if (body.yieldMultiplier !== undefined) {
        const mult = Number(body.yieldMultiplier);
        if (Number.isFinite(mult) && mult >= 1 && mult <= 5) {
          syncRentalMultiplier(rental, mult);
        }
      }
      if (body.status === 'active' || body.status === 'completed') {
        rental.status = body.status;
      }
      if (body.simulatedDaysAdd !== undefined) {
        const add = Number(body.simulatedDaysAdd);
        if (Number.isFinite(add) && add > 0 && add <= 60) {
          rental.simulatedDaysElapsed += add;
        }
      }

      saveDatabase(db);
      sendToUser(rental.investorId, { type: 'rentals:refresh' });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ rental: enrichRental(rental) });
    }
  );

  app.delete(
    '/api/admin/rentals/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const idx = db.rentals.findIndex((r) => r.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Rental contract not found.' });
        return;
      }
      const [removed] = db.rentals.splice(idx, 1);
      const robot = db.robots.find((r) => r.id === removed.robotId);
      if (robot && removed.status === 'active') {
        robot.availableUnits += removed.quantity;
      }
      saveDatabase(db);
      sendToUser(removed.investorId, { type: 'rentals:refresh' });
      broadcastAll({ type: 'fleet:updated', robots: db.robots });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true });
    }
  );

  // Master Admin ONLY: Delete transaction record
  app.delete(
    '/api/admin/transactions/:id',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const idx = db.transactions.findIndex((t) => t.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }
      db.transactions.splice(idx, 1);
      saveDatabase(db);
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true });
    }
  );

  // Master Admin ONLY: Broadcast live notification to all accounts or targeted user
  app.post(
    '/api/admin/notifications',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const targetUserId = typeof body.userId === 'string' ? body.userId.trim() : 'all';

      if (title.length < 3 || message.length < 5) {
        res.status(400).json({ error: 'Enter a notification title and message.' });
        return;
      }

      const db = loadDatabase();
      const recipients =
        targetUserId === 'all'
          ? db.investors
          : db.investors.filter((u) => u.id === targetUserId);

      if (recipients.length === 0) {
        res.status(404).json({ error: 'Target recipient not found.' });
        return;
      }

      for (const user of recipients) {
        notifyUser(db, {
          userId: user.id,
          title,
          message,
          category: 'admin',
          actionScreen: 'home' as unknown as AppNotification['actionScreen'],
        });
      }
      saveDatabase(db);
      res.status(201).json({ sentCount: recipients.length });
    }
  );

  // Admin / Master Admin: Credit +24h operating cycle to active user rentals
  app.post(
    '/api/admin/rentals/advance-all',
    requireAuth,
    requireMasterAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      let updated = 0;
      for (const r of db.rentals) {
        if (r.status === 'active') {
          const enriched = enrichRental(r);
          if (enriched.daysElapsed < r.cycleDays) {
            r.simulatedDaysElapsed += 1;
            updated += 1;
          }
        }
      }
      saveDatabase(db);
      broadcastAll({ type: 'rentals:refresh' });
      broadcastToStaff({ type: 'admin:queue_updated' });
      res.json({ ok: true, updated });
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '/', 'http://localhost');
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '/', 'http://localhost');
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora AI server & WebSocket engine listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Nexora AI server:', err);
  process.exit(1);
});
