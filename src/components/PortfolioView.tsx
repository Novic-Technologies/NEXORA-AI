import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  FileText,
  Layers,
  LogOut,
  Settings,
  Shield,
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
  onOpenAdmin?: () => void;
  onSignOut: () => void;
}

export function PortfolioView({
  investor,
  rentals,
  transactions,
  loading,
  onRentalUpdated,
  onBrowseMachines,
  onOpenWallet,
  onOpenActivity,
  onOpenAccount,
  onOpenVerification,
  onOpenAdmin,
  onSignOut,
}: PortfolioViewProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeRentals = rentals.filter((r) => r.status === 'active');
  const completedRentals = rentals.filter((r) => r.status === 'completed');
  const capitalDeployed = activeRentals.reduce((sum, r) => sum + r.totalCost, 0);
  const dailyYieldToday = activeRentals.reduce((sum, r) => sum + r.dailyPayout, 0);
  const pendingTransfers = transactions.filter((t) => t.status === 'pending');
  const recentTx = transactions.slice(0, 4);

  const initial = investor.fullName.trim().charAt(0).toUpperCase() || 'I';
  const isStaff =
    investor.role === 'master_admin' ||
    investor.role === 'admin' ||
    investor.role === 'moderator';

  const handleClaimYield = async (rentalId: string) => {
    setActionError(null);
    setBusyId(rentalId);
    try {
      const res = await claimRentalYield(rentalId);
      onRentalUpdated(res.rental, res.investor, res.transaction);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to collect yield.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pb-6 space-y-5">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between">
        <h1 className="font-display text-base font-bold text-[#111827]">
          Investor Portfolio
        </h1>
        <button
          type="button"
          onClick={onOpenAccount}
          className="text-xs font-semibold text-[#2563EB] cursor-pointer"
        >
          Account
        </button>
      </header>

      <div className="px-4 space-y-4">
        {/* Investor Identity Card with Real Profile Photo */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#111827] text-white font-semibold overflow-hidden flex items-center justify-center shrink-0 border border-[#E5E7EB]">
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
                <p className="text-sm font-bold text-[#111827] truncate">
                  {investor.fullName}
                </p>
                {investor.kycStatus === 'verified' && (
                  <BadgeCheck className="w-4 h-4 text-[#059669] shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-[#6B7280] truncate">
                {investor.email} · {investor.companyName}
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
              investor.role === 'master_admin'
                ? 'bg-[#1E1B4B] text-white'
                : investor.role === 'admin'
                  ? 'bg-blue-50 text-[#2563EB]'
                  : investor.kycStatus === 'verified'
                    ? 'bg-emerald-50 text-[#059669]'
                    : 'bg-amber-50 text-[#D97706]'
            }`}
          >
            {investor.role === 'master_admin'
              ? 'MASTER'
              : investor.role === 'admin'
                ? 'ADMIN'
                : investor.kycStatus.toUpperCase()}
          </span>
        </div>

        {/* Verification Action Banner when not yet verified */}
        {investor.kycStatus !== 'verified' && (
          <button
            type="button"
            onClick={onOpenVerification}
            className="w-full text-left rounded-2xl border border-[#FDE68A] bg-amber-50/70 p-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-950">
                {investor.kycStatus === 'pending'
                  ? 'KYC Verification Under Review'
                  : investor.kycStatus === 'rejected'
                    ? 'Verification Declined — Update Records'
                    : 'Verify Identity & Profile Photo'}
              </p>
              <p className="text-[11px] text-amber-900 mt-0.5">
                {investor.kycStatus === 'pending'
                  ? 'Waiting for Master Admin sign-off on your uploaded ID.'
                  : 'Submit photo, ID & optional financial proof to unlock withdrawals.'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-800 shrink-0" />
          </button>
        )}

        {/* Staff Console Entry for Master Admin / Promoted Admins */}
        {isStaff && onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full rounded-2xl bg-[#1E1B4B] text-white p-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {investor.role === 'master_admin' ? (
                  <Crown className="w-4 h-4 text-[#FBBF24]" />
                ) : (
                  <Shield className="w-4 h-4 text-[#93C5FD]" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">
                  {investor.role === 'master_admin'
                    ? 'Open Master Admin Console'
                    : 'Open Staff Operations Console'}
                </p>
                <p className="text-[10.5px] text-[#C7D2FE]">
                  Approve deposits/withdrawals, review KYC & manage roles
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C7D2FE]" />
          </button>
        )}

        {/* Wallet Card */}
        <div className="rounded-2xl bg-[#111827] text-white p-5 space-y-4">
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
                {formatUsd(dailyYieldToday)}/d
              </p>
            </div>
          </div>
        </div>

        {/* 3 Mini Stat Cards */}
        <div className="grid grid-cols-3 bg-white border border-[#E5E7EB] rounded-2xl divide-x divide-[#E5E7EB]">
          <div className="p-3">
            <div className="flex items-center gap-1 text-[#6B7280] text-[10.5px]">
              <Layers className="w-3 h-3" />
              <span>Active</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827]">
              {activeRentals.reduce((s, r) => s + r.quantity, 0)}
            </p>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1 text-[#6B7280] text-[10.5px]">
              <TrendingUp className="w-3 h-3 text-[#059669]" />
              <span>Paid out</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#059669]">
              {formatUsd(investor.totalYieldCollected)}
            </p>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-1 text-[#6B7280] text-[10.5px]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Settled</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827]">
              {completedRentals.length}
            </p>
          </div>
        </div>

        {/* Pending Approvals Notice */}
        {pendingTransfers.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 space-y-2">
            <p className="text-xs font-bold text-amber-950 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
              <span>
                {pendingTransfers.length} Transfer{pendingTransfers.length > 1 ? 's' : ''} Pending Master Admin Approval
              </span>
            </p>
            {pendingTransfers.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-[11px] bg-white rounded-xl px-3 py-2 border border-amber-100"
              >
                <span className="font-medium text-[#111827] truncate">
                  {tx.reference}
                </span>
                <span className="font-mono font-bold text-[#D97706] shrink-0">
                  {formatUsd(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
          >
            {actionError}
          </div>
        )}

        {/* Active Rented Machines with Live Server-Synced Yield */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#111827]">
                Rented machines
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                {rentals.length === 0
                  ? 'No active contracts yet'
                  : `${rentals.length} active unit contract${rentals.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseMachines}
              className="text-xs font-semibold text-[#2563EB] cursor-pointer"
            >
              + Rent unit
            </button>
          </div>

          {loading ? (
            <div className="h-32 rounded-2xl border border-[#E5E7EB] bg-white animate-pulse" />
          ) : rentals.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-8 text-center">
              <div className="w-11 h-11 rounded-xl bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#111827]">No units yet</p>
              <p className="mt-1 text-xs text-[#6B7280] max-w-[260px] mx-auto leading-relaxed">
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
                return (
                  <div
                    key={rental.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-3.5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0">
                        <RobotImage
                          src={rental.robotImageUrl}
                          alt={rental.robotName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-mono text-[#6B7280]">
                          {rental.robotModelCode} · {rental.facilityHub}
                        </p>
                        <h3 className="text-xs font-bold text-[#111827] truncate">
                          {rental.quantity}x {rental.robotName}
                        </h3>
                        <p className="text-[11px] font-mono tabular-nums text-[#059669] mt-0.5 font-semibold">
                          {formatUsd(rental.dailyPayout)}/day · {rental.status}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-[#6B7280]">
                          Live Accrued:{' '}
                          <strong className="font-mono text-[#059669]">
                            {formatUsd(rental.accruedUnclaimedYield, 4)}
                          </strong>
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[#111827]">
                          Day {rental.daysElapsed} / {rental.cycleDays}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] transition-all duration-500"
                          style={{ width: `${Math.max(2, rental.progressPercent)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy || !canClaim}
                      onClick={() => handleClaimYield(rental.id)}
                      className="w-full h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-45 transition-colors cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {canClaim
                          ? `Collect ${formatUsd(claimable)} to Wallet`
                          : 'Accruing live yield ($0.01 min to collect)'}
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
            <h2 className="font-display text-base font-bold text-[#111827]">
              Recent activity
            </h2>
            <button
              type="button"
              onClick={onOpenActivity}
              className="text-xs font-semibold text-[#2563EB] inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTx.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-5 text-center text-xs text-[#6B7280]">
              Wallet activity will appear here.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white divide-y divide-[#F3F4F6]">
              {recentTx.map((tx) => {
                const inbound = tx.type === 'deposit' || tx.type === 'yield_payout';
                return (
                  <div
                    key={tx.id}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111827] truncate">
                        {tx.reference}
                      </p>
                      <p className="text-[10.5px] font-mono text-[#6B7280] mt-0.5">
                        {tx.status.toUpperCase()} · {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                        tx.status === 'rejected'
                          ? 'text-red-600 line-through'
                          : tx.status === 'pending'
                            ? 'text-[#D97706]'
                            : inbound
                              ? 'text-[#059669]'
                              : 'text-[#111827]'
                      }`}
                    >
                      {inbound ? '+' : '-'}
                      {formatUsd(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Account Menu */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white divide-y divide-[#F3F4F6]">
          <button
            type="button"
            onClick={onOpenVerification}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <BadgeCheck className="w-4 h-4 text-[#059669]" />
              <span>Identity Verification & Financial Proof</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => onOpenWallet('deposit')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <ArrowDownLeft className="w-4 h-4 text-[#2563EB]" />
              <span>Deposit crypto (Binance coins)</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenActivity}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#6B7280]" />
              <span>Transaction history</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#111827] cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Settings className="w-4 h-4 text-[#6B7280]" />
              <span>Profile photo & details</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-red-700 cursor-pointer"
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
