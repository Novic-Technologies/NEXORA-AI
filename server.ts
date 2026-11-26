import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import {
  getBinanceNetwork,
  BINANCE_COINS,
  validateNetworkAddress,
} from './src/lib/cryptoCoins.ts';
import type {
  AccountStatus,
  BinanceCoinSymbol,
  BinanceNetworkCode,
  FleetDispatch,
  IdentityDocType,
  InvestorClassification,
  MachineRental,
  UserRole,
  WalletTransaction,
} from './src/types.ts';
import {
  DEMO_INVESTOR_EMAIL,
  enrichRental,
  hasMasterAdmin,
  hashPassword,
  loadDatabase,
  sanitizeInvestor,
  saveDatabase,
  verifyPassword,
} from './server/store.ts';
import type { StoredInvestor } from './server/store.ts';

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

const ASSIGNABLE_ROLES: UserRole[] = ['investor', 'moderator', 'admin'];

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
  if (/^\/src\/assets\/images\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length <= maxBytes) {
      return trimmed;
    }
  }
  return undefined;
}

function syncEnvMasterAdmin(): void {
  const envEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.MASTER_ADMIN_PASSWORD;
  if (!envEmail || !envPassword) return;

  const db = loadDatabase();
  const existing = db.investors.find((inv) => inv.email === envEmail);
  const { hash, salt } = hashPassword(envPassword);
  if (existing) {
    existing.role = 'master_admin';
    existing.accountStatus = 'active';
    existing.kycStatus = 'verified';
    existing.passwordHash = hash;
    existing.passwordSalt = salt;
    saveDatabase(db);
  } else {
    db.investors.unshift({
      id: `inv_master_${crypto.randomUUID().slice(0, 8)}`,
      role: 'master_admin',
      accountStatus: 'active',
      fullName: 'Nexora Master Admin',
      email: envEmail,
      phone: '+41 44 580 1200',
      companyName: 'Nexora AI Executive Treasury',
      country: 'Switzerland',
      city: 'Zurich',
      investorType: 'Institutional Fund',
      kycStatus: 'verified',
      walletBalance: 25000,
      heldBalance: 0,
      totalDeposited: 25000,
      totalWithdrawn: 0,
      totalYieldCollected: 0,
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
      error: 'This account has been suspended by the Master Admin.',
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
    res.status(403).json({ error: 'Admin privileges required.' });
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
    res.status(403).json({ error: 'Only the Master Admin can perform this action.' });
    return;
  }
  next();
}

async function startServer() {
  syncEnvMasterAdmin();

  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '5mb' }));

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
    const minRate = Math.min(...db.robots.map((r) => r.dailyReturnRate));
    const maxRate = Math.max(...db.robots.map((r) => r.dailyReturnRate));

    res.json({
      masterAdminClaimed: hasMasterAdmin(db),
      stats: {
        totalFleetUnits: totalUnits,
        availableFleetUnits: availableUnits,
        activeHubs: 6,
        dailyRateRange: `${minRate.toFixed(2)}%–${maxRate.toFixed(2)}%`,
        supportedCoins: BINANCE_COINS.length,
        verifiedInvestors: db.investors.filter((i) => i.kycStatus === 'verified').length,
      },
      featuredRobots: db.robots.slice(0, 3),
      dispatches: db.dispatches,
    });
  });

  // First-run Master Admin claim (locks permanently once claimed or when env var is set)
  app.post('/api/auth/claim-master-admin', (req: Request, res: Response) => {
    const db = loadDatabase();
    if (hasMasterAdmin(db)) {
      res.status(403).json({ error: 'Master Admin account is already claimed.' });
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
      res.status(400).json({ error: 'Enter a valid full name for Master Admin.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Enter a valid Master Admin email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Master Admin password must be at least 8 characters.' });
      return;
    }
    if (db.investors.some((inv) => inv.email === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const masterAdmin: StoredInvestor = {
      id: `inv_master_${crypto.randomUUID().slice(0, 8)}`,
      role: 'master_admin',
      accountStatus: 'active',
      fullName,
      email,
      phone: phone || '+41 44 580 1200',
      companyName: 'Nexora AI Executive Treasury',
      country: country || 'Switzerland',
      city: 'Zurich',
      avatarUrl,
      investorType: 'Institutional Fund',
      kycStatus: 'verified',
      walletBalance: 25000,
      heldBalance: 0,
      totalDeposited: 25000,
      totalWithdrawn: 0,
      totalYieldCollected: 0,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.investors.unshift(masterAdmin);
    saveDatabase(db);

    const token = signSessionToken(masterAdmin.id);
    setSessionCookie(req, res, token);
    res.status(201).json({
      token,
      investor: sanitizeInvestor(masterAdmin),
    });
  });

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
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.investors.push(newInvestor);
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
    if (!investor || investor.isDemoAccount) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!verifyPassword(password, investor.passwordHash, investor.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (investor.accountStatus === 'suspended') {
      res.status(403).json({
        error: 'This account is suspended. Contact the Master Admin.',
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

  // Passwordless sandbox demo investor entry for testing investor workflows
  app.post('/api/auth/demo-investor', (req: Request, res: Response) => {
    const db = loadDatabase();
    const demo = db.investors.find((inv) => inv.email === DEMO_INVESTOR_EMAIL);
    if (!demo) {
      res.status(404).json({ error: 'Sandbox investor is unavailable.' });
      return;
    }
    if (demo.accountStatus === 'suspended') {
      res.status(403).json({ error: 'Sandbox investor account is currently suspended.' });
      return;
    }
    const token = signSessionToken(demo.id);
    setSessionCookie(req, res, token);
    res.json({
      token,
      investor: sanitizeInvestor(demo),
    });
  });

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

      saveDatabase(db);
      const sanitized = sanitizeInvestor(target);
      sendToUser(target.id, { type: 'investor:updated', investor: sanitized });
      broadcastToStaff({ type: 'admin:queue_updated', notification: `${target.fullName} submitted KYC verification` });

      res.json({ investor: sanitized });
    }
  );

  app.get('/api/robots', (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({ robots: db.robots });
  });

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

    const net = getBinanceNetwork(coinSymbol, networkCode);
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

    const db = loadDatabase();
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

    const net = getBinanceNetwork(coinSymbol, networkCode);
    if (!net) {
      res.status(400).json({ error: 'Select a supported Binance coin and network.' });
      return;
    }

    const db = loadDatabase();
    const investor = db.investors.find((inv) => inv.id === req.investor!.id);
    if (!investor) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    if (investor.kycStatus !== 'verified' && investor.role !== 'master_admin') {
      res.status(403).json({
        error: 'Identity verification must be approved by the Master Admin before withdrawing.',
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
      cycleDays: robot.cycleDays,
      simulatedDaysElapsed: 0,
      collectedYield: 0,
      status: 'active',
      rentedAt: new Date().toISOString(),
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
      reference: `Rented ${quantity}x ${robot.name} (${robot.cycleDays}d cycle)`,
      createdAt: new Date().toISOString(),
    };

    db.rentals.unshift(rental);
    db.transactions.unshift(tx);
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
      reference: `Live yield payout · ${rental.robotName}`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(tx);
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
  // MASTER ADMIN & STAFF OPERATIONS API
  // ============================================================================

  app.get(
    '/api/admin/overview',
    requireAuth,
    requireStaff,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = loadDatabase();
      const pendingTransactions = db.transactions.filter((t) => t.status === 'pending');
      const recentReviewedTransactions = db.transactions
        .filter((t) => (t.type === 'deposit' || t.type === 'withdraw') && t.status !== 'pending')
        .slice(0, 20);

      const pendingDeposits = pendingTransactions.filter((t) => t.type === 'deposit');
      const pendingWithdrawals = pendingTransactions.filter((t) => t.type === 'withdraw');

      res.json({
        summary: {
          totalUsers: db.investors.length,
          pendingDepositsCount: pendingDeposits.length,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          pendingKycCount: db.investors.filter((u) => u.kycStatus === 'pending').length,
          pendingDepositVolume: Number(
            pendingDeposits.reduce((s, t) => s + t.amount, 0).toFixed(2)
          ),
          pendingWithdrawalVolume: Number(
            pendingWithdrawals.reduce((s, t) => s + t.amount, 0).toFixed(2)
          ),
          activeRentalsCount: db.rentals.filter((r) => r.status === 'active').length,
        },
        users: db.investors.map(sanitizeInvestor),
        pendingTransactions,
        recentReviewedTransactions,
        robots: db.robots,
      });
    }
  );

  // Approve or Reject Deposit / Withdrawal
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

      const reviewerLabel = `${req.investor!.fullName} (${
        req.investor!.role === 'master_admin' ? 'Master Admin' : 'Admin'
      })`;
      const now = new Date().toISOString();

      if (tx.type === 'deposit') {
        if (action === 'approve') {
          tx.status = 'completed';
          investor.walletBalance = Number((investor.walletBalance + tx.amount).toFixed(2));
          investor.totalDeposited = Number((investor.totalDeposited + tx.amount).toFixed(2));
          if (txHashOverride) tx.txHash = txHashOverride;
        } else {
          tx.status = 'rejected';
        }
      } else if (tx.type === 'withdraw') {
        const held = investor.heldBalance ?? 0;
        investor.heldBalance = Number(Math.max(0, held - tx.amount).toFixed(2));
        if (action === 'approve') {
          tx.status = 'completed';
          investor.totalWithdrawn = Number((investor.totalWithdrawn + tx.amount).toFixed(2));
          tx.txHash =
            txHashOverride || tx.txHash || `0x${crypto.randomBytes(16).toString('hex')}`;
        } else {
          tx.status = 'rejected';
          investor.walletBalance = Number((investor.walletBalance + tx.amount).toFixed(2));
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
        target.verification.reviewedBy = req.investor!.fullName;
        target.verification.reviewNote = reviewNote || undefined;
      }

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

  // Master Admin ONLY: Promote / Demote roles & Suspend / Restore user accounts
  app.patch(
    '/api/admin/users/:id/role',
    requireAuth,
    requireMasterAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const role = typeof body.role === 'string' ? (body.role.trim() as UserRole) : undefined;
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
        res.status(403).json({ error: 'The Master Admin role cannot be modified or demoted.' });
        return;
      }

      if (role) {
        if (!ASSIGNABLE_ROLES.includes(role)) {
          res.status(400).json({ error: 'Invalid target role.' });
          return;
        }
        target.role = role;
      }

      if (accountStatus) {
        if (accountStatus !== 'active' && accountStatus !== 'suspended') {
          res.status(400).json({ error: 'Invalid account status.' });
          return;
        }
        target.accountStatus = accountStatus;
      }

      saveDatabase(db);
      const sanitized = sanitizeInvestor(target);

      // Update active WS role metadata immediately
      for (const c of clients) {
        if (c.userId === target.id) {
          c.role = target.role;
        }
      }

      sendToUser(target.id, {
        type: 'investor:updated',
        investor: sanitized,
        notification: `Master Admin updated your role to ${target.role.toUpperCase()} (${target.accountStatus}).`,
      });
      broadcastToStaff({ type: 'admin:queue_updated' });

      res.json({ user: sanitized });
    }
  );

  // Admin / Master Admin: Publish live fleet dispatch
  app.post(
    '/api/admin/dispatches',
    requireAuth,
    requireStaff,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const category = typeof body.category === 'string' ? body.category.trim() : 'Deployment';
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const summary = typeof body.summary === 'string' ? body.summary.trim() : '';

      if (title.length < 6 || summary.length < 10) {
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
      };
      db.dispatches.unshift(dispatch);
      saveDatabase(db);

      broadcastAll({ type: 'dispatches:updated', dispatches: db.dispatches });
      res.status(201).json({ dispatch });
    }
  );

  // Admin / Master Admin: Credit +24h operating cycle to active user rentals for live testing
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
