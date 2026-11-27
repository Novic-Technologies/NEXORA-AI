import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Building2,
  Cpu,
  Gift,
  Home,
  Newspaper,
  Plus,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { AccountView } from './components/AccountView.tsx';
import { ActivityView } from './components/ActivityView.tsx';
import { AdminView } from './components/AdminView.tsx';
import { AuthView } from './components/AuthView.tsx';
import { BrandLogo } from './components/BrandLogo.tsx';
import { CryptoWalletView } from './components/CryptoWalletView.tsx';
import { MachinesView } from './components/MachinesView.tsx';
import { NewsView } from './components/NewsView.tsx';
import { NotificationsView } from './components/NotificationsView.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { PortfolioView } from './components/PortfolioView.tsx';
import { OfflineIndicator } from './components/PWAInstallButton.tsx';
import { ReferralsView } from './components/ReferralsView.tsx';
import { VerificationView } from './components/VerificationView.tsx';
import {
  fetchAdminOverview,
  fetchCurrentInvestor,
  fetchNotifications,
  fetchOverview,
  fetchReferrals,
  fetchRentals,
  fetchRobots,
  fetchTransactions,
  getAuthToken,
  logoutInvestor,
  markAllNotificationsRead,
  markNotificationRead,
  type OverviewResponse,
} from './lib/api.ts';
import { useTheme } from './lib/useTheme.ts';
import type {
  AdminOverviewData,
  AppNotification,
  BinanceCoinConfig,
  EnrichedMachineRental,
  FleetDispatch,
  InvestorProfile,
  ReferralSummary,
  RobotMachine,
  SiteConfig,
  WalletTransaction,
} from './types.ts';

type AppScreen =
  | 'home'
  | 'rent'
  | 'news'
  | 'mine'
  | 'wallet'
  | 'activity'
  | 'account'
  | 'verification'
  | 'notifications'
  | 'referrals'
  | 'admin'
  | 'auth';

export default function App() {
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();

  const [initialRefCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('ref') || '').trim().toUpperCase();
  });

  const [screen, setScreen] = useState<AppScreen>('home');
  const [pendingScreen, setPendingScreen] = useState<AppScreen | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<
    'signin' | 'register' | 'claim_admin'
  >(initialRefCode ? 'register' : 'signin');
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [suggestedDepositUsd, setSuggestedDepositUsd] = useState<number | undefined>(
    undefined
  );
  const [preselectedRobot, setPreselectedRobot] = useState<RobotMachine | null>(null);
  const [initialNewsId, setInitialNewsId] = useState<string | null>(null);
  const [showQuickSheet, setShowQuickSheet] = useState(false);

  const [investor, setInvestor] = useState<InvestorProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [robots, setRobots] = useState<RobotMachine[]>([]);
  const [rentals, setRentals] = useState<EnrichedMachineRental[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [adminData, setAdminData] = useState<AdminOverviewData | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const investorRef = useRef<InvestorProfile | null>(null);
  investorRef.current = investor;

  const showToast = useCallback((msg: string) => {
    setLiveToast(msg);
    window.setTimeout(() => {
      setLiveToast((current) => (current === msg ? null : current));
    }, 5500);
  }, []);

  const refreshAdminData = useCallback(async () => {
    const u = investorRef.current;
    if (!u || (u.role !== 'master_admin' && u.role !== 'admin' && u.role !== 'moderator')) {
      return;
    }
    setAdminLoading(true);
    try {
      const data = await fetchAdminOverview();
      setAdminData(data);
    } catch {
      // Ignore transient errors
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    setWorkspaceLoading(true);
    setGlobalError(null);
    try {
      const [robotsRes, rentalsRes, txRes, notifRes, refRes] = await Promise.all([
        fetchRobots(),
        fetchRentals(),
        fetchTransactions(),
        fetchNotifications(),
        fetchReferrals(),
      ]);
      setRobots(robotsRes.robots);
      setRentals(rentalsRes.rentals);
      setTransactions(txRes.transactions);
      setNotifications(notifRes.notifications);
      setUnreadNotifications(notifRes.unreadCount);
      setReferralSummary(refRes);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : 'Unable to refresh app data.'
      );
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = getAuthToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws${qs}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type?: string;
          investor?: InvestorProfile;
          transaction?: WalletTransaction;
          rentals?: EnrichedMachineRental[];
          robots?: RobotMachine[];
          dispatches?: FleetDispatch[];
          siteConfig?: SiteConfig;
          cryptoCoins?: BinanceCoinConfig[];
          appNotification?: AppNotification;
          notification?: string;
        };

        if (msg.type === 'rentals:tick' && Array.isArray(msg.rentals)) {
          setRentals(msg.rentals);
        } else if (msg.type === 'rentals:refresh') {
          fetchRentals()
            .then((r) => setRentals(r.rentals))
            .catch(() => {});
        } else if (msg.type === 'fleet:updated' && Array.isArray(msg.robots)) {
          setRobots(msg.robots);
          setOverview((prev) =>
            prev ? { ...prev, featuredRobots: msg.robots!.slice(0, 6) } : prev
          );
        } else if (msg.type === 'dispatches:updated' && Array.isArray(msg.dispatches)) {
          setOverview((prev) =>
            prev ? { ...prev, dispatches: msg.dispatches! } : prev
          );
        } else if (msg.type === 'site:updated' && msg.siteConfig) {
          setOverview((prev) =>
            prev ? { ...prev, siteConfig: msg.siteConfig! } : prev
          );
        } else if (msg.type === 'coins:updated' && Array.isArray(msg.cryptoCoins)) {
          setOverview((prev) =>
            prev ? { ...prev, cryptoCoins: msg.cryptoCoins! } : prev
          );
        } else if (msg.type === 'notification:new' && msg.appNotification) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === msg.appNotification!.id)) return prev;
            return [msg.appNotification!, ...prev];
          });
          setUnreadNotifications((c) => c + 1);
          showToast(msg.appNotification.title);
        } else if (msg.type === 'investor:updated' && msg.investor) {
          setInvestor(msg.investor);
          if (msg.transaction) {
            setTransactions((prev) => {
              const exists = prev.some((t) => t.id === msg.transaction!.id);
              if (exists) {
                return prev.map((t) =>
                  t.id === msg.transaction!.id ? msg.transaction! : t
                );
              }
              return [msg.transaction!, ...prev];
            });
          }
          if (msg.notification) {
            showToast(msg.notification);
          }
          fetchReferrals()
            .then((r) => setReferralSummary(r))
            .catch(() => {});
          if (
            msg.investor.role === 'master_admin' ||
            msg.investor.role === 'admin' ||
            msg.investor.role === 'moderator'
          ) {
            void refreshAdminData();
          }
        } else if (msg.type === 'transaction:created' && msg.transaction) {
          setTransactions((prev) => {
            if (prev.some((t) => t.id === msg.transaction!.id)) return prev;
            return [msg.transaction!, ...prev];
          });
        } else if (msg.type === 'admin:queue_updated') {
          if (msg.notification) {
            showToast(msg.notification);
          }
          void refreshAdminData();
        }
      } catch {
        // Ignore malformed payloads
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [refreshAdminData, showToast]);

  useEffect(() => {
    fetchOverview()
      .then((data) => {
        setOverview(data);
        if (data.siteConfig?.brandName) {
          document.title = `${data.siteConfig.brandName} — ${data.siteConfig.brandSubtitle}`;
        }
      })
      .catch(() => {});

    fetchRobots()
      .then((res) => setRobots(res.robots))
      .catch(() => {});

    fetchCurrentInvestor()
      .then(async (res) => {
        setInvestor(res.investor);
        await loadWorkspaceData();
        if (
          res.investor.role === 'master_admin' ||
          res.investor.role === 'admin' ||
          res.investor.role === 'moderator'
        ) {
          fetchAdminOverview()
            .then((d) => setAdminData(d))
            .catch(() => {});
        }
      })
      .catch(() => {
        setInvestor(null);
      })
      .finally(() => {
        setAuthChecking(false);
        connectWebSocket();
      });

    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket, loadWorkspaceData]);

  const navigateTo = (
    next: AppScreen,
    opts?: {
      authMode?: 'signin' | 'register' | 'claim_admin';
      walletMode?: 'deposit' | 'withdraw';
      suggestedDeposit?: number;
      robot?: RobotMachine;
      newsId?: string;
    }
  ) => {
    setGlobalError(null);
    setShowQuickSheet(false);
    if (opts?.authMode) setAuthInitialMode(opts.authMode);
    if (opts?.walletMode) setWalletTab(opts.walletMode);
    setSuggestedDepositUsd(opts?.suggestedDeposit);
    if (opts?.robot) setPreselectedRobot(opts.robot);
    setInitialNewsId(opts?.newsId ?? null);

    const requiresAuth =
      next === 'mine' ||
      next === 'wallet' ||
      next === 'activity' ||
      next === 'account' ||
      next === 'verification' ||
      next === 'notifications' ||
      next === 'referrals' ||
      next === 'admin';

    if (requiresAuth && !investor) {
      setPendingScreen(next);
      setScreen('auth');
      return;
    }

    if (next === 'admin') {
      void refreshAdminData();
    } else if (next === 'notifications' && investor) {
      fetchNotifications()
        .then((res) => {
          setNotifications(res.notifications);
          setUnreadNotifications(res.unreadCount);
        })
        .catch(() => {});
    } else if (next === 'referrals' && investor) {
      fetchReferrals()
        .then((res) => setReferralSummary(res))
        .catch(() => {});
    }

    setPendingScreen(null);
    setScreen(next);
    window.scrollTo(0, 0);
  };

  const handleAuthenticated = async (loggedInInvestor: InvestorProfile) => {
    setInvestor(loggedInInvestor);
    connectWebSocket();
    await loadWorkspaceData();
    fetchOverview()
      .then((data) => setOverview(data))
      .catch(() => {});

    const isStaff =
      loggedInInvestor.role === 'master_admin' ||
      loggedInInvestor.role === 'admin' ||
      loggedInInvestor.role === 'moderator';

    if (isStaff) {
      await fetchAdminOverview()
        .then((d) => setAdminData(d))
        .catch(() => {});
    }

    const target = pendingScreen ?? (isStaff ? 'admin' : 'mine');
    setPendingScreen(null);
    setScreen(target);
    window.scrollTo(0, 0);
  };

  const handleSignOut = async () => {
    await logoutInvestor();
    setInvestor(null);
    setRentals([]);
    setTransactions([]);
    setNotifications([]);
    setUnreadNotifications(0);
    setReferralSummary(null);
    setAdminData(null);
    connectWebSocket();
    setScreen('home');
  };

  const handleInvestorUpdate = (
    updatedInvestor: InvestorProfile,
    newTx?: WalletTransaction
  ) => {
    setInvestor(updatedInvestor);
    if (newTx) {
      setTransactions((prev) => {
        if (prev.some((t) => t.id === newTx.id)) return prev;
        return [newTx, ...prev];
      });
    }
  };

  const handleRentalComplete = (payload: {
    investor: InvestorProfile;
    rental: EnrichedMachineRental;
    robot: RobotMachine;
    transaction: WalletTransaction;
  }) => {
    setInvestor(payload.investor);
    setRentals((prev) => [payload.rental, ...prev]);
    setRobots((prev) =>
      prev.map((r) => (r.id === payload.robot.id ? payload.robot : r))
    );
    setTransactions((prev) => [payload.transaction, ...prev]);
    fetchOverview()
      .then((data) => setOverview(data))
      .catch(() => {});
  };

  const handleRentalUpdated = (
    updatedRental: EnrichedMachineRental,
    updatedInvestor?: InvestorProfile,
    newTx?: WalletTransaction
  ) => {
    setRentals((prev) =>
      prev.map((r) => (r.id === updatedRental.id ? updatedRental : r))
    );
    if (updatedInvestor) {
      setInvestor(updatedInvestor);
    }
    if (newTx) {
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadNotifications((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifications(0);
  };

  const isStaff =
    investor?.role === 'master_admin' ||
    investor?.role === 'admin' ||
    investor?.role === 'moderator';

  const brandName = overview?.siteConfig?.brandName || 'Nexora AI';
  const showBottomBar = screen !== 'auth';

  return (
    <div className="min-h-[100dvh] w-full bg-[#E5E7EB] dark:bg-[#030712]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-[#F4F6F9] dark:bg-[#0B1120] sm:border-x sm:border-[#D1D5DB] dark:sm:border-[#1E293B] relative shadow-sm">
        {liveToast && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[398px]">
            <div className="rounded-xl bg-[#111827] dark:bg-[#1E293B] text-white px-3.5 py-2.5 shadow-lg border border-[#374151] dark:border-[#334155] flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <span className="font-medium leading-snug">{liveToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                className="text-[#9CA3AF] hover:text-white cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <OfflineIndicator />

        <main className={`flex-1 ${showBottomBar ? 'pb-24' : ''}`}>
          {globalError && (
            <div className="mx-4 mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200">
              {globalError}
            </div>
          )}

          {authChecking ? (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3">
              <BrandLogo size="lg" brandName={brandName} />
              <p className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
                Connecting to live fleet...
              </p>
            </div>
          ) : screen === 'auth' ? (
            <AuthView
              initialMode={authInitialMode}
              initialReferralCode={initialRefCode}
              masterAdminClaimed={
                overview?.corporateInitialized ?? overview?.masterAdminClaimed ?? true
              }
              brandName={brandName}
              redirectLabel={
                pendingScreen === 'wallet'
                  ? 'your crypto wallet'
                  : pendingScreen === 'verification'
                    ? 'identity verification'
                    : pendingScreen === 'referrals'
                      ? 'team rewards'
                      : pendingScreen === 'notifications'
                        ? 'your notifications'
                        : pendingScreen === 'mine'
                          ? 'your portfolio'
                          : undefined
              }
              onBack={() => {
                setPendingScreen(null);
                setScreen('home');
              }}
              onAuthenticated={handleAuthenticated}
            />
          ) : screen === 'home' ? (
            <OverviewView
              overview={overview}
              investor={investor}
              unreadNotifications={unreadNotifications}
              onExploreFleet={() => navigateTo('rent')}
              onSelectMachine={(robot) => navigateTo('rent', { robot })}
              onOpenAuth={(mode) => navigateTo('auth', { authMode: mode })}
              onOpenDeposit={() => navigateTo('wallet', { walletMode: 'deposit' })}
              onOpenNews={(articleId) => navigateTo('news', { newsId: articleId })}
              onOpenVerification={() => navigateTo('verification')}
              onOpenNotifications={() => navigateTo('notifications')}
              onOpenReferrals={() => navigateTo('referrals')}
            />
          ) : screen === 'rent' ? (
            <MachinesView
              robots={robots}
              investor={investor}
              siteConfig={overview?.siteConfig}
              loading={workspaceLoading}
              preselectedRobot={preselectedRobot}
              onClearPreselected={() => setPreselectedRobot(null)}
              onRentalComplete={handleRentalComplete}
              onOpenDeposit={(suggested) =>
                navigateTo('wallet', {
                  walletMode: 'deposit',
                  suggestedDeposit: suggested,
                })
              }
              onRequireAuth={() => navigateTo('auth', { authMode: 'register' })}
              onViewPortfolio={() => navigateTo('mine')}
            />
          ) : screen === 'news' ? (
            <NewsView
              dispatches={overview?.dispatches ?? []}
              initialArticleId={initialNewsId}
            />
          ) : screen === 'wallet' && investor ? (
            <CryptoWalletView
              key={`${walletTab}-${suggestedDepositUsd ?? 'none'}`}
              investor={investor}
              cryptoCoins={overview?.cryptoCoins}
              initialTab={walletTab}
              suggestedDepositUsd={suggestedDepositUsd}
              onBack={() => navigateTo('mine')}
              onInvestorUpdate={handleInvestorUpdate}
              onOpenVerification={() => navigateTo('verification')}
            />
          ) : screen === 'verification' && investor ? (
            <VerificationView
              investor={investor}
              onBack={() => navigateTo('mine')}
              onUpdated={(updated) => setInvestor(updated)}
            />
          ) : screen === 'notifications' && investor ? (
            <NotificationsView
              notifications={notifications}
              loading={workspaceLoading}
              onBack={() => navigateTo('mine')}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllRead}
              onNavigateAction={(target) => {
                if (target) navigateTo(target);
              }}
            />
          ) : screen === 'referrals' && investor ? (
            <ReferralsView
              investor={investor}
              summary={referralSummary}
              robots={robots}
              siteConfig={overview?.siteConfig}
              loading={workspaceLoading}
              onBack={() => navigateTo('mine')}
              onBrowseRobots={() => navigateTo('rent')}
            />
          ) : screen === 'admin' && investor && isStaff ? (
            <AdminView
              currentUser={investor}
              data={adminData}
              loading={adminLoading}
              onRefresh={refreshAdminData}
            />
          ) : screen === 'activity' && investor ? (
            <ActivityView
              transactions={transactions}
              loading={workspaceLoading}
              onBack={() => navigateTo('mine')}
            />
          ) : screen === 'account' && investor ? (
            <AccountView
              investor={investor}
              themePreference={themePreference}
              onChangeTheme={setThemePreference}
              onBack={() => navigateTo('mine')}
              onUpdated={(updated) => setInvestor(updated)}
              onOpenVerification={() => navigateTo('verification')}
              onOpenReferrals={() => navigateTo('referrals')}
              onSignOut={handleSignOut}
            />
          ) : investor ? (
            <PortfolioView
              investor={investor}
              rentals={rentals}
              transactions={transactions}
              unreadNotifications={unreadNotifications}
              loading={workspaceLoading}
              onRentalUpdated={handleRentalUpdated}
              onBrowseMachines={() => navigateTo('rent')}
              onOpenWallet={(mode) => navigateTo('wallet', { walletMode: mode })}
              onOpenActivity={() => navigateTo('activity')}
              onOpenAccount={() => navigateTo('account')}
              onOpenVerification={() => navigateTo('verification')}
              onOpenNotifications={() => navigateTo('notifications')}
              onOpenReferrals={() => navigateTo('referrals')}
              onOpenAdmin={isStaff ? () => navigateTo('admin') : undefined}
              onSignOut={handleSignOut}
            />
          ) : (
            <AuthView
              initialMode="signin"
              initialReferralCode={initialRefCode}
              masterAdminClaimed={
                overview?.corporateInitialized ?? overview?.masterAdminClaimed ?? true
              }
              brandName={brandName}
              onBack={() => setScreen('home')}
              onAuthenticated={handleAuthenticated}
            />
          )}
        </main>

        {/* Floating App Bottom Navigation */}
        {showBottomBar && (
          <nav
            aria-label="App navigation"
            className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[406px] z-40"
          >
            <div className="rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#1E293B] px-2 py-1.5 shadow-md grid grid-cols-5 items-center">
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer"
              >
                <span
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    screen === 'home'
                      ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  <Home className="w-4 h-4" />
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    screen === 'home'
                      ? 'text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  Home
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('rent')}
                className="flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer"
              >
                <span
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    screen === 'rent'
                      ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    screen === 'rent'
                      ? 'text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  Machines
                </span>
              </button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowQuickSheet(true)}
                  aria-label="Quick actions"
                  className="w-12 h-12 -mt-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md flex items-center justify-center border-4 border-[#F4F6F9] dark:border-[#0B1120] transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {isStaff ? (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer"
                >
                  <span
                    className={`px-3 py-1 rounded-lg transition-colors relative ${
                      screen === 'admin'
                        ? 'bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4338CA] dark:text-indigo-300'
                        : 'text-[#6B7280] dark:text-[#94A3B8]'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {(adminData?.summary.pendingDepositsCount ?? 0) +
                      (adminData?.summary.pendingWithdrawalsCount ?? 0) +
                      (adminData?.summary.pendingKycCount ?? 0) +
                      (adminData?.summary.pendingPasswordResetsCount ?? 0) >
                      0 && (
                      <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-[#D97706]" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      screen === 'admin'
                        ? 'text-[#4338CA] dark:text-indigo-300'
                        : 'text-[#6B7280] dark:text-[#94A3B8]'
                    }`}
                  >
                    Departments
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('news')}
                  className="flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer"
                >
                  <span
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      screen === 'news'
                        ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA]'
                        : 'text-[#6B7280] dark:text-[#94A3B8]'
                    }`}
                  >
                    <Newspaper className="w-4 h-4" />
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      screen === 'news'
                        ? 'text-[#2563EB] dark:text-[#60A5FA]'
                        : 'text-[#6B7280] dark:text-[#94A3B8]'
                    }`}
                  >
                    Updates
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateTo('mine')}
                className="flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer"
              >
                <span
                  className={`px-3 py-1 rounded-lg transition-colors relative ${
                    screen === 'mine' ||
                    screen === 'wallet' ||
                    screen === 'activity' ||
                    screen === 'account' ||
                    screen === 'verification' ||
                    screen === 'notifications' ||
                    screen === 'referrals'
                      ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB]" />
                  )}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    screen === 'mine' ||
                    screen === 'wallet' ||
                    screen === 'activity' ||
                    screen === 'account' ||
                    screen === 'verification' ||
                    screen === 'notifications' ||
                    screen === 'referrals'
                      ? 'text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  Portfolio
                </span>
              </button>
            </div>
          </nav>
        )}

        {/* Center "+" Quick Action Sheet */}
        {showQuickSheet && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-[430px] bg-white dark:bg-[#111827] rounded-t-2xl border-t border-[#E5E7EB] dark:border-[#1E293B] p-5 space-y-3">
              <div className="w-10 h-1 rounded-full bg-[#D1D5DB] dark:bg-[#334155] mx-auto" />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Quick Actions
                </h2>
                <button
                  type="button"
                  onClick={() => setShowQuickSheet(false)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#4B5563] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigateTo('rent')}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#111827] dark:bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Rent a robotic machine
                    </p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Browse AI fleet units and start earning daily yield
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('wallet', { walletMode: 'deposit' })}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Submit crypto deposit
                    </p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Choose Binance coin & network, send & submit TXID
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('referrals')}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399] flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Invite & earn 2x daily yields
                    </p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Share invite link for cash rewards + double yields
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('wallet', { walletMode: 'withdraw' })}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Request crypto withdrawal
                    </p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Verified accounts can request payout to external wallet
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
