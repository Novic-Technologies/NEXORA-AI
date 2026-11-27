import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  Gift,
  Headphones,
  Layers,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  claimRentalYield,
  formatDateTime,
  formatUsd,
} from '../lib/api.ts';
import type {
  EnrichedMachineRental,
  InvestorProfile,
  WalletTransaction,
} from '../types.ts';
import { RobotImage } from './RobotImage.tsx';

interface PortfolioViewProps {
  investor: InvestorProfile;
  rentals: EnrichedMachineRental[];
  transactions: WalletTransaction[];
  unreadNotifications: number;
  openSupportTicketsCount?: number;
  loading: boolean;
  onRentalUpdated: (
    rental: EnrichedMachineRental,
    investor?: InvestorProfile,
    tx?: WalletTransaction
  ) => void;
  onBrowseMachines: () => void;
  onOpenWallet: (tab: 'deposit' | 'withdraw') => void;
  onOpenActivity: () => void;
  onOpenAccount: () => void;
  onOpenVerification: () => void;
  onOpenNotifications: () => void;
  onOpenReferrals: () => void;
  onOpenSupport: () => void;
  onOpenAdmin?: () => void;
  onSignOut: () => void;
}

export function PortfolioView({
  investor,
  rentals,
  transactions,
  unreadNotifications,
  openSupportTicketsCount = 0,
  loading,
  onRentalUpdated,
  onBrowseMachines,
  onOpenWallet,
  onOpenActivity,
  onOpenAccount,
  onOpenVerification,
  onOpenNotifications,
  onOpenReferrals,
  onOpenSupport,
  onOpenAdmin,
  onSignOut,
}: PortfolioViewProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);

  const activeRentals = rentals.filter((r) => r.status === 'active');
  const completedRentals = rentals.filter((r) => r.status === 'completed');
  const capitalDeployed = activeRentals.reduce((sum, r) => sum + r.totalCost, 0);
  const dailyYieldToday = activeRentals.reduce(
    (sum, r) => sum + (r.effectiveDailyPayout ?? r.dailyPayout),
    0
  );
  const pendingTransfers = transactions.filter((t) => t.status === 'pending');
  const recentTx = transactions.slice(0, 4);

  const initial = investor.fullName.trim().charAt(0).toUpperCase() || 'I';
  const isStaff =
    investor.role === 'master_admin' ||
    investor.role === 'admin' ||
    investor.role === 'moderator';

  const doubleBoostActive = Boolean(
    investor.doubleYieldActiveUntil &&
      new Date(investor.doubleYieldActiveUntil).getTime() > Date.now()
  );

  const handleClaimYield = async (rental: EnrichedMachineRental) => {
    setActionError(null);
    setActionInfo(null);
    const claimable = Number(rental.accruedUnclaimedYield.toFixed(2));
    if (claimable < 0.01) {
      setActionInfo(
        `${rental.robotName} has accrued ${formatUsd(rental.accruedUnclaimedYield, 4)} so far. Instant collection unlocks automatically once live accrual reaches $0.01.`
      );
      return;
    }
    setBusyId(rental.id);
    try {
      const res = await claimRentalYield(rental.id);
      onRentalUpdated(res.rental, res.investor, res.transaction);
      setActionInfo(`Collected ${formatUsd(res.transaction.amount)} yield into your wallet.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to collect yield.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pb-6 space-y-5">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between gap-2">
        <h1 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
          Investor Portfolio
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[9.5px] font-bold flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenAccount}
            className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
          >
            Settings
          </button>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {/* Investor Identity Card */}
        <button
          type="button"
          onClick={onOpenAccount}
          className="w-full text-left rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] dark:hover:border-[#334155] bg-white dark:bg-[#111827] p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#111827] dark:bg-[#1E293B] text-white font-semibold overflow-hidden flex items-center justify-center shrink-0 border border-[#E5E7EB] dark:border-[#334155]">
              {investor.avatarUrl ? (
                <img
                  src={investor.avatarUrl}
                  alt={investor.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                  {investor.fullName}
                </p>
                {investor.kycStatus === 'verified' && (
                  <BadgeCheck className="w-4 h-4 text-[#059669] dark:text-[#34D399] shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                {investor.email} · {investor.companyName}
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
              investor.role === 'master_admin'
                ? 'bg-[#1E1B4B] text-white'
                : investor.role === 'admin'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA]'
                  : investor.kycStatus === 'verified'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399]'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-[#D97706] dark:text-[#FBBF24]'
            }`}
          >
            {investor.role === 'master_admin'
              ? 'EXEC OPS'
              : investor.role === 'admin'
                ? investor.department
                  ? investor.department.toUpperCase()
                  : 'CORP OPS'
                : investor.role === 'moderator'
                  ? 'COMPLIANCE'
                  : investor.kycStatus.toUpperCase()}
          </span>
        </button>

        {/* 2x Double Yield & Team Referral Banner */}
        <button
          type="button"
          onClick={onOpenReferrals}
          className={`w-full text-left rounded-2xl border p-3.5 flex items-center justify-between gap-3 cursor-pointer ${
            doubleBoostActive
              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40'
              : 'border-[#BFDBFE] dark:border-[#1E3A8A] bg-[#EFF6FF]/70 dark:bg-[#0F172A]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 ${
                doubleBoostActive ? 'bg-[#059669]' : 'bg-[#2563EB]'
              }`}
            >
              <Gift className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                {doubleBoostActive
                  ? '2x Double Daily Yield Active!'
                  : 'Team & Referral Rewards'}
              </p>
              <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] truncate">
                {doubleBoostActive
                  ? `Boosted payouts until ${formatDateTime(investor.doubleYieldActiveUntil!)}`
                  : `Code ${investor.referralCode} · Earned ${formatUsd(investor.referralBonusEarned)}`}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] shrink-0" />
        </button>

        {/* Verification Action Banner when not yet verified */}
        {investor.kycStatus !== 'verified' && (
          <button
            type="button"
            onClick={onOpenVerification}
            className="w-full text-left rounded-2xl border border-[#FDE68A] dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 p-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
                {investor.kycStatus === 'pending'
                  ? 'KYC Verification Under Review'
                  : investor.kycStatus === 'rejected'
                    ? 'Verification Declined — Update Records'
                    : 'Verify Identity & Profile Photo'}
              </p>
              <p className="text-[11px] text-amber-900 dark:text-amber-200 mt-0.5">
                {investor.kycStatus === 'pending'
                  ? 'Waiting for Compliance Department sign-off on your uploaded ID.'
                  : 'Submit photo, ID & optional financial proof to unlock withdrawals.'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-800 dark:text-amber-300 shrink-0" />
          </button>
        )}

        {/* Corporate Department Console Entry */}
        {isStaff && onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full rounded-2xl bg-[#1E1B4B] text-white p-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {investor.role === 'master_admin' ? (
                  <Building2 className="w-4 h-4 text-[#93C5FD]" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#93C5FD]" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">
                  Open Corporate Department Console
                </p>
                <p className="text-[10.5px] text-[#C7D2FE]">
                  Finance, Compliance, Technical, Support &amp; Fleet Operations
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C7D2FE]" />
          </button>
        )}

        {/* Wallet Card */}
        <div className="rounded-2xl bg-[#111827] dark:bg-[#0F172A] border border-[#1F2937] dark:border-[#1E293B] text-white p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-[0.12em] uppercase text-[#9CA3AF]">
                Available Wallet Balance
              </p>
              <p className="mt-1 text-3xl font-bold font-mono tabular-nums">
                {formatUsd(investor.walletBalance)}
              </p>
              {investor.heldBalance > 0 && (
                <p className="mt-1 text-[11px] font-mono text-[#FBBF24]">
                  Held in Pending Withdrawal: {formatUsd(investor.heldBalance)}
                </p>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-[#93C5FD] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onOpenWallet('deposit')}
              className="h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenWallet('withdraw')}
              className="h-11 rounded-xl border border-[#374151] hover:border-[#6B7280] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>

          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[9.5px] tracking-[0.12em] uppercase text-[#9CA3AF]">
                In Active Units
              </p>
              <p className="mt-0.5 font-mono font-semibold tabular-nums">
                {formatUsd(capitalDeployed)}
              </p>
            </div>
            <div>
              <p className="text-[9.5px] tracking-[0.12em] uppercase text-[#9CA3AF]">
                Daily Yield Rate
              </p>
              <p className="mt-0.5 font-mono font-semibold tabular-nums text-[#34D399]">
                {formatUsd(dailyYieldToday)}/d{doubleBoostActive ? ' (2x)' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Mini Stat Cards */}
        <div className="grid grid-cols-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl divide-x divide-[#E5E7EB] dark:divide-[#1E293B] overflow-hidden">
          <button
            type="button"
            onClick={onBrowseMachines}
            className="p-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[#6B7280] dark:text-[#94A3B8] text-[10.5px]">
              <Layers className="w-3 h-3" />
              <span>Active</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC]">
              {activeRentals.reduce((s, r) => s + r.quantity, 0)}
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenActivity}
            className="p-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[#6B7280] dark:text-[#94A3B8] text-[10.5px]">
              <TrendingUp className="w-3 h-3 text-[#059669] dark:text-[#34D399]" />
              <span>Paid out</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#059669] dark:text-[#34D399]">
              {formatUsd(investor.totalYieldCollected)}
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenActivity}
            className="p-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[#6B7280] dark:text-[#94A3B8] text-[10.5px]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Settled</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC]">
              {completedRentals.length}
            </p>
          </button>
        </div>

        {/* Pending Approvals Notice */}
        {pendingTransfers.length > 0 && (
          <button
            type="button"
            onClick={onOpenActivity}
            className="w-full text-left rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3.5 space-y-2 cursor-pointer"
          >
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D97706] dark:text-[#FBBF24]" />
              <span>
                {pendingTransfers.length} Transfer{pendingTransfers.length > 1 ? 's' : ''} Pending Finance Dept Approval
              </span>
            </p>
            {pendingTransfers.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-[11px] bg-white dark:bg-[#111827] rounded-xl px-3 py-2 border border-amber-100 dark:border-amber-900/50"
              >
                <span className="font-medium text-[#111827] dark:text-[#F8FAFC] truncate">
                  {tx.reference}
                </span>
                <span className="font-mono font-bold text-[#D97706] dark:text-[#FBBF24] shrink-0">
                  {formatUsd(tx.amount)}
                </span>
              </div>
            ))}
          </button>
        )}

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
          >
            {actionError}
          </div>
        )}
        {actionInfo && (
          <div className="rounded-xl border border-[#BFDBFE] dark:border-[#1E3A8A] bg-[#EFF6FF] dark:bg-[#0F172A] px-3.5 py-2.5 text-xs font-medium text-[#1E3A8A] dark:text-[#93C5FD]">
            {actionInfo}
          </div>
        )}

        {/* Active Rented Machines */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Rented machines
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                {rentals.length === 0
                  ? 'No active contracts yet'
                  : `${rentals.length} active unit contract${rentals.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseMachines}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
            >
              + Rent unit
            </button>
          </div>

          {loading ? (
            <div className="h-32 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] animate-pulse" />
          ) : rentals.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-5 py-8 text-center">
              <div className="w-11 h-11 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                No units yet
              </p>
              <p className="mt-1 text-xs text-[#6B7280] dark:text-[#94A3B8] max-w-[260px] mx-auto leading-relaxed">
                Lease a Nexora AI machine from the fleet catalog to start earning live
                daily returns.
              </p>
              <button
                type="button"
                onClick={onBrowseMachines}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Browse the fleet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rentals.map((rental) => {
                const isBusy = busyId === rental.id;
                const claimable = Number(rental.accruedUnclaimedYield.toFixed(2));
                const canClaim = claimable >= 0.01;
                const effectiveDaily = rental.effectiveDailyPayout ?? rental.dailyPayout;
                return (
                  <div
                    key={rental.id}
                    className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-3.5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F3F4F6] dark:bg-[#1E293B] shrink-0">
                        <RobotImage
                          src={rental.robotImageUrl}
                          alt={rental.robotName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10.5px] font-mono text-[#6B7280] dark:text-[#94A3B8] truncate">
                            {rental.robotModelCode} · {rental.facilityHub}
                          </p>
                          {rental.yieldMultiplier > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399] font-mono text-[9.5px] font-bold shrink-0">
                              {rental.yieldMultiplier}x YIELD
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {rental.quantity}x {rental.robotName}
                        </h3>
                        <p className="text-[11px] font-mono tabular-nums text-[#059669] dark:text-[#34D399] mt-0.5 font-semibold">
                          {formatUsd(effectiveDaily)}/day · {rental.status}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-[#6B7280] dark:text-[#94A3B8]">
                          Live Accrued:{' '}
                          <strong className="font-mono text-[#059669] dark:text-[#34D399]">
                            {formatUsd(rental.accruedUnclaimedYield, 4)}
                          </strong>
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          Day {rental.daysElapsed} / {rental.cycleDays}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] dark:bg-[#1E293B] overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] transition-all duration-500"
                          style={{ width: `${Math.max(2, rental.progressPercent)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleClaimYield(rental)}
                      className={`w-full h-10 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        canClaim
                          ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                          : 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#1D4ED8] dark:text-[#93C5FD]'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {isBusy
                          ? 'Collecting yield...'
                          : canClaim
                            ? `Collect ${formatUsd(claimable)} to Wallet`
                            : `Accruing live (${formatUsd(rental.accruedUnclaimedYield, 4)} · $0.01 min)`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
              Recent activity
            </h2>
            <button
              type="button"
              onClick={onOpenActivity}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTx.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-4 py-5 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Wallet activity will appear here.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
              {recentTx.map((tx) => {
                const inbound =
                  tx.type === 'deposit' ||
                  tx.type === 'yield_payout' ||
                  tx.type === 'referral_reward';
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={onOpenActivity}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                        {tx.reference}
                      </p>
                      <p className="text-[10.5px] font-mono text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                        {tx.status.toUpperCase()} · {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                        tx.status === 'rejected'
                          ? 'text-red-600 dark:text-red-400 line-through'
                          : tx.status === 'pending'
                            ? 'text-[#D97706] dark:text-[#FBBF24]'
                            : inbound
                              ? 'text-[#059669] dark:text-[#34D399]'
                              : 'text-[#111827] dark:text-[#F8FAFC]'
                      }`}
                    >
                      {inbound ? '+' : '-'}
                      {formatUsd(tx.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Account Menu */}
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
          <button
            type="button"
            onClick={onOpenReferrals}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Gift className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>Team & Referral Rewards</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>
                Notifications Inbox{unreadNotifications > 0 ? ` (${unreadNotifications} new)` : ''}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenVerification}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <BadgeCheck className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
              <span>Identity Verification & Financial Proof</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => onOpenWallet('deposit')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <ArrowDownLeft className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>Deposit crypto (Binance coins)</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenActivity}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
              <span>Transaction history</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenSupport}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Headphones className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>
                Support Desk &amp; Help Tickets
                {openSupportTicketsCount > 0 ? ` (${openSupportTicketsCount} active)` : ''}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Settings className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
              <span>Profile photo, theme &amp; app install</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-red-700 dark:text-red-400 cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    </div>
  );
}
