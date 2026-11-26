import { useState, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarPlus,
  Check,
  Crown,
  FileCheck2,
  Megaphone,
  Shield,
  Users,
  X,
} from 'lucide-react';
import {
  advanceAllRentalsCycle,
  formatDateTime,
  formatUsd,
  publishFleetDispatch,
  reviewAdminTransaction,
  reviewUserKyc,
  truncateAddress,
  updateUserRole,
} from '../lib/api.ts';
import type {
  AdminOverviewData,
  InvestorProfile,
  UserRole,
} from '../types.ts';

interface AdminViewProps {
  currentUser: InvestorProfile;
  data: AdminOverviewData | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const ROLE_LABELS: Record<UserRole, string> = {
  master_admin: 'Master Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  investor: 'Investor',
};

export function AdminView({
  currentUser,
  data,
  loading,
  onRefresh,
}: AdminViewProps) {
  const [tab, setTab] = useState<'transfers' | 'kyc' | 'users' | 'fleet'>('transfers');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [previewImg, setPreviewImg] = useState<{ title: string; url: string } | null>(
    null
  );

  // Dispatch form
  const [dispCategory, setDispCategory] = useState('Deployment');
  const [dispTitle, setDispTitle] = useState('');
  const [dispSummary, setDispSummary] = useState('');

  const isMaster = currentUser.role === 'master_admin';

  const handleTxReview = async (txId: string, action: 'approve' | 'reject') => {
    setBusyId(txId);
    setError(null);
    setFeedback(null);
    try {
      await reviewAdminTransaction(txId, {
        action,
        adminNote: noteById[txId]?.trim() || undefined,
      });
      await onRefresh();
      setFeedback(
        action === 'approve'
          ? 'Transaction approved and investor balance updated live.'
          : 'Transaction rejected and any held balance returned.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review transaction.');
    } finally {
      setBusyId(null);
    }
  };

  const handleKycReview = async (userId: string, action: 'approve' | 'reject') => {
    setBusyId(userId);
    setError(null);
    setFeedback(null);
    try {
      await reviewUserKyc(userId, {
        action,
        reviewNote: noteById[userId]?.trim() || undefined,
      });
      await onRefresh();
      setFeedback(
        action === 'approve'
          ? 'Identity verification approved.'
          : 'Identity verification declined.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update verification.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleUpdate = async (userId: string, role: UserRole) => {
    setBusyId(userId);
    setError(null);
    setFeedback(null);
    try {
      await updateUserRole(userId, { role });
      await onRefresh();
      setFeedback(`Role updated to ${ROLE_LABELS[role]}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user role.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusToggle = async (
    userId: string,
    nextStatus: 'active' | 'suspended'
  ) => {
    setBusyId(userId);
    setError(null);
    setFeedback(null);
    try {
      await updateUserRole(userId, { accountStatus: nextStatus });
      await onRefresh();
      setFeedback(`Account status set to ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update account status.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublishDispatch = async (e: FormEvent) => {
    e.preventDefault();
    setBusyId('dispatch');
    setError(null);
    setFeedback(null);
    try {
      await publishFleetDispatch({
        category: dispCategory,
        title: dispTitle.trim(),
        summary: dispSummary.trim(),
      });
      setDispTitle('');
      setDispSummary('');
      await onRefresh();
      setFeedback('Live dispatch published to all connected users.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish dispatch.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvanceCycles = async () => {
    setBusyId('advance');
    setError(null);
    setFeedback(null);
    try {
      const res = await advanceAllRentalsCycle();
      await onRefresh();
      setFeedback(`Credited +24h operating cycle across ${res.updated} active rental(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to advance cycle.');
    } finally {
      setBusyId(null);
    }
  };

  const summary = data?.summary;
  const pendingTx = data?.pendingTransactions ?? [];
  const kycUsers = (data?.users ?? []).filter(
    (u) => u.kycStatus === 'pending' || u.verification
  );
  const allUsers = data?.users ?? [];

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1E1B4B] text-white flex items-center justify-center shrink-0">
            {isMaster ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-[#111827] truncate">
              {isMaster ? 'Master Admin Console' : 'Operations Admin'}
            </h1>
            <p className="text-[10.5px] text-[#6B7280] truncate">
              Live approvals, KYC & role authority
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRefresh()}
          className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold text-[#111827] cursor-pointer"
        >
          Refresh
        </button>
      </header>

      <div className="px-4 space-y-4">
        {/* Live Queue Summary Strip */}
        <div className="grid grid-cols-3 bg-white border border-[#E5E7EB] rounded-2xl divide-x divide-[#E5E7EB]">
          <div className="p-3">
            <p className="text-[10px] font-medium text-[#6B7280]">Pending Deposits</p>
            <p className="mt-1 font-mono text-base font-bold text-[#D97706]">
              {summary?.pendingDepositsCount ?? 0}
            </p>
            <p className="text-[10px] font-mono text-[#6B7280]">
              {formatUsd(summary?.pendingDepositVolume ?? 0)}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-medium text-[#6B7280]">Pending Withdraw</p>
            <p className="mt-1 font-mono text-base font-bold text-[#2563EB]">
              {summary?.pendingWithdrawalsCount ?? 0}
            </p>
            <p className="text-[10px] font-mono text-[#6B7280]">
              {formatUsd(summary?.pendingWithdrawalVolume ?? 0)}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-medium text-[#6B7280]">Pending KYC</p>
            <p className="mt-1 font-mono text-base font-bold text-[#111827]">
              {summary?.pendingKycCount ?? 0}
            </p>
            <p className="text-[10px] text-[#6B7280]">
              {summary?.totalUsers ?? 0} accounts
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#E5E7EB]/70 p-1 rounded-xl">
          {(
            [
              ['transfers', `Transfers (${pendingTx.length})`],
              ['kyc', `KYC (${summary?.pendingKycCount ?? 0})`],
              ['users', 'Roles'],
              ['fleet', 'Fleet'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`py-2 px-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer truncate ${
                tab === key
                  ? 'bg-white text-[#111827] shadow-2xs'
                  : 'text-[#6B7280]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
          >
            {error}
          </div>
        )}
        {feedback && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
            {feedback}
          </div>
        )}

        {loading && !data ? (
          <div className="h-32 rounded-2xl border border-[#E5E7EB] bg-white animate-pulse" />
        ) : tab === 'transfers' ? (
          <div className="space-y-3">
            {pendingTx.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8 text-center">
                <p className="text-xs font-semibold text-[#111827]">
                  All crypto deposits & withdrawals reviewed
                </p>
                <p className="mt-1 text-[11px] text-[#6B7280]">
                  New investor deposit and withdrawal submissions appear here immediately.
                </p>
              </div>
            ) : (
              pendingTx.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                const busy = busyId === tx.id;
                return (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isDeposit
                              ? 'bg-emerald-50 text-[#059669]'
                              : 'bg-blue-50 text-[#2563EB]'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111827] truncate">
                            {isDeposit ? 'Deposit Request' : 'Withdrawal Request'} ·{' '}
                            {tx.coinSymbol} ({tx.networkCode})
                          </p>
                          <p className="text-[11px] text-[#6B7280] truncate">
                            {tx.investorName} · {tx.investorEmail}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#111827] shrink-0">
                        {formatUsd(tx.amount)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-2.5 space-y-1 text-[10.5px]">
                      <p className="text-[#6B7280]">
                        Submitted: <span className="text-[#111827]">{formatDateTime(tx.createdAt)}</span>
                      </p>
                      {tx.walletAddress && (
                        <p className="font-mono text-[#111827] break-all">
                          {isDeposit ? 'Treasury:' : 'Recipient:'} {tx.walletAddress}
                        </p>
                      )}
                      {tx.memo && (
                        <p className="font-mono text-[#111827]">Memo/Tag: {tx.memo}</p>
                      )}
                      {tx.txHash && (
                        <p className="font-mono text-[#374151] break-all">
                          TXID: {tx.txHash}
                        </p>
                      )}
                      {tx.receiptImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImg({
                              title: `${tx.coinSymbol} Receipt`,
                              url: tx.receiptImageUrl!,
                            })
                          }
                          className="text-[#2563EB] font-semibold underline cursor-pointer"
                        >
                          Inspect transfer screenshot →
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={noteById[tx.id] ?? ''}
                      onChange={(e) =>
                        setNoteById((prev) => ({ ...prev, [tx.id]: e.target.value }))
                      }
                      placeholder="Optional approval note or rejection reason..."
                      className="w-full h-9 px-3 rounded-xl border border-[#D1D5DB] text-xs text-[#111827]"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTxReview(tx.id, 'reject')}
                        className="h-10 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTxReview(tx.id, 'approve')}
                        className="h-10 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {(data?.recentReviewedTransactions.length ?? 0) > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Recent Reviewed Transfers
                </h2>
                <div className="rounded-2xl border border-[#E5E7EB] bg-white divide-y divide-[#F3F4F6]">
                  {data!.recentReviewedTransactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111827] truncate">
                          {tx.investorName || truncateAddress(tx.investorId)} · {tx.reference}
                        </p>
                        <p className="text-[10.5px] text-[#6B7280]">
                          {tx.status.toUpperCase()} · {tx.reviewedBy || 'Staff'}
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-[#111827]">
                        {formatUsd(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : tab === 'kyc' ? (
          <div className="space-y-3">
            {kycUsers.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8 text-center">
                <p className="text-xs font-semibold text-[#111827]">
                  No KYC records submitted yet
                </p>
              </div>
            ) : (
              kycUsers.map((u) => {
                const v = u.verification;
                const busy = busyId === u.id;
                return (
                  <div
                    key={u.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#E5E7EB] overflow-hidden flex items-center justify-center shrink-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[#374151]">
                              {u.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111827] truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[10.5px] text-[#6B7280] truncate">
                            {u.email} · {u.country}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          u.kycStatus === 'verified'
                            ? 'bg-emerald-50 text-[#059669]'
                            : u.kycStatus === 'pending'
                              ? 'bg-amber-50 text-[#D97706]'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.kycStatus}
                      </span>
                    </div>

                    {v && (
                      <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3 space-y-2 text-[11px]">
                        <p className="font-semibold text-[#111827]">
                          {v.documentType} · <span className="font-mono">{v.documentNumber}</span>
                        </p>
                        {(v.sourceOfFunds || v.annualCapacity) && (
                          <p className="text-[#4B5563]">
                            Financial Ability: {v.sourceOfFunds || '—'} ·{' '}
                            {v.annualCapacity || '—'}
                          </p>
                        )}
                        {v.financialProofNote && (
                          <p className="text-[#6B7280] italic">“{v.financialProofNote}”</p>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImg({
                                title: `${u.fullName} — ID Front`,
                                url: v.frontImageUrl,
                              })
                            }
                            className="rounded-lg border border-[#E5E7EB] bg-white p-1.5 text-[10px] font-semibold text-[#2563EB] cursor-pointer"
                          >
                            View ID Front
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImg({
                                title: `${u.fullName} — Back/Selfie`,
                                url: v.backOrSelfieUrl,
                              })
                            }
                            className="rounded-lg border border-[#E5E7EB] bg-white p-1.5 text-[10px] font-semibold text-[#2563EB] cursor-pointer"
                          >
                            View Selfie/Back
                          </button>
                          {v.financialProofUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImg({
                                  title: `${u.fullName} — Financial Proof`,
                                  url: v.financialProofUrl!,
                                })
                              }
                              className="rounded-lg border border-[#E5E7EB] bg-white p-1.5 text-[10px] font-semibold text-[#059669] cursor-pointer"
                            >
                              Financial Proof
                            </button>
                          ) : (
                            <span className="rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] p-1.5 text-[10px] text-[#9CA3AF] text-center">
                              No Fin. Doc
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      value={noteById[u.id] ?? ''}
                      onChange={(e) =>
                        setNoteById((prev) => ({ ...prev, [u.id]: e.target.value }))
                      }
                      placeholder="Reviewer note (optional)..."
                      className="w-full h-9 px-3 rounded-xl border border-[#D1D5DB] text-xs text-[#111827]"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleKycReview(u.id, 'reject')}
                        className="h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Decline KYC
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleKycReview(u.id, 'approve')}
                        className="h-9 rounded-xl bg-[#059669] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>Verify Investor</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === 'users' ? (
          <div className="space-y-3">
            {!isMaster && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                Only the <strong>Master Admin</strong> can promote, demote, or suspend user
                roles system-wide.
              </div>
            )}

            {allUsers.map((u) => {
              const busy = busyId === u.id;
              const isTargetMaster = u.role === 'master_admin';
              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#111827] text-white overflow-hidden flex items-center justify-center shrink-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {u.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111827] truncate">
                          {u.fullName}
                        </p>
                        <p className="text-[10.5px] text-[#6B7280] truncate">{u.email}</p>
                        <p className="text-[10.5px] font-mono text-[#374151] mt-0.5">
                          Bal: {formatUsd(u.walletBalance)} · KYC: {u.kycStatus}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        isTargetMaster
                          ? 'bg-[#1E1B4B] text-white'
                          : u.role === 'admin'
                            ? 'bg-blue-50 text-[#2563EB]'
                            : u.role === 'moderator'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-[#F3F4F6] text-[#374151]'
                      }`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>

                  {isMaster && !isTargetMaster && (
                    <div className="pt-2 border-t border-[#F3F4F6] flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                        <Users className="w-3.5 h-3.5 text-[#6B7280]" />
                        <select
                          aria-label={`Role for ${u.fullName}`}
                          disabled={busy}
                          value={u.role}
                          onChange={(e) =>
                            handleRoleUpdate(u.id, e.target.value as UserRole)
                          }
                          className="flex-1 h-9 px-2 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] text-xs font-semibold text-[#111827]"
                        >
                          <option value="investor">Investor (Standard)</option>
                          <option value="moderator">Moderator (KYC & Updates)</option>
                          <option value="admin">Admin (Approvals & Fleet)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          handleStatusToggle(
                            u.id,
                            u.accountStatus === 'active' ? 'suspended' : 'active'
                          )
                        }
                        className={`h-9 px-3 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          u.accountStatus === 'active'
                            ? 'border border-red-200 text-red-700 bg-red-50'
                            : 'bg-[#059669] text-white'
                        }`}
                      >
                        {u.accountStatus === 'active' ? 'Suspend' : 'Restore'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {isMaster && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-2.5">
                <p className="text-xs font-bold text-[#111827]">
                  Fleet Yield Cycle Settlement
                </p>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  Credit +24h of operational output across active machine rentals immediately
                  for contract testing.
                </p>
                <button
                  type="button"
                  disabled={busyId === 'advance'}
                  onClick={handleAdvanceCycles}
                  className="w-full h-10 rounded-xl bg-[#111827] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Settle +24h Yield Across Active Rentals</span>
                </button>
              </div>
            )}

            <form
              onSubmit={handlePublishDispatch}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3"
            >
              <p className="text-xs font-bold text-[#111827] inline-flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-[#2563EB]" />
                <span>Publish Live Fleet Dispatch</span>
              </p>

              <select
                value={dispCategory}
                onChange={(e) => setDispCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] text-xs text-[#111827]"
              >
                <option value="Deployment">Deployment</option>
                <option value="Hardware">Hardware</option>
                <option value="Settlement">Settlement</option>
              </select>

              <input
                type="text"
                required
                value={dispTitle}
                onChange={(e) => setDispTitle(e.target.value)}
                placeholder="Headline (e.g. 12 Kestrel H2 units live in Zurich)"
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] text-xs text-[#111827]"
              />

              <textarea
                rows={3}
                required
                value={dispSummary}
                onChange={(e) => setDispSummary(e.target.value)}
                placeholder="Write operational summary..."
                className="w-full p-3 rounded-xl border border-[#D1D5DB] text-xs text-[#111827]"
              />

              <button
                type="submit"
                disabled={busyId === 'dispatch'}
                className="w-full h-10 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Broadcast Live Update</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Document / Screenshot Lightbox */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[400px] bg-white rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <p className="text-xs font-bold text-[#111827] truncate">
                {previewImg.title}
              </p>
              <button
                type="button"
                onClick={() => setPreviewImg(null)}
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#374151] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-[#F3F4F6]">
              <img
                src={previewImg.url}
                alt={previewImg.title}
                className="w-full max-h-[65dvh] object-contain rounded-xl bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
