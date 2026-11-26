import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { formatDateTime, formatUsd } from '../lib/api.ts';
import type {
  InvestorProfile,
  ReferralSummary,
  RobotMachine,
  SiteConfig,
} from '../types.ts';

interface ReferralsViewProps {
  investor: InvestorProfile;
  summary: ReferralSummary | null;
  robots: RobotMachine[];
  siteConfig?: SiteConfig;
  loading: boolean;
  onBack: () => void;
  onBrowseRobots: () => void;
}

export function ReferralsView({
  investor,
  summary,
  robots,
  siteConfig,
  loading,
  onBack,
  onBrowseRobots,
}: ReferralsViewProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const code = summary?.referralCode || investor.referralCode;
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(code)}`
      : `https://nexora.ai/?ref=${encodeURIComponent(code)}`;

  const rewardRate = summary?.rewardRatePct ?? siteConfig?.referralRewardRatePct ?? 5.5;
  const boostDays =
    summary?.doubleYieldDaysPerInvite ?? siteConfig?.referralDoubleYieldDays ?? 7;

  const copyText = async (which: 'code' | 'link', val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${siteConfig?.brandName || 'Nexora AI'} Invite`,
          text: `Join ${siteConfig?.brandName || 'Nexora AI'} with invite code ${code} to rent live AI robots.`,
          url: inviteLink,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await copyText('link', inviteLink);
  };

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
            Team & Invite Rewards
          </h1>
          <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
            {rewardRate}% cash bonus + 2x daily yields on invitee deposit
          </p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {/* Hero Referral Card */}
        <section className="rounded-2xl bg-[#111827] dark:bg-[#0F172A] border border-[#1F2937] dark:border-[#1E293B] text-white p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10.5px] font-mono uppercase tracking-wider text-[#60A5FA]">
                Partner Referral Program
              </p>
              <h2 className="mt-1 font-display text-base font-bold leading-snug">
                {siteConfig?.referralHeadline || 'Invite Investors & Earn 2x Daily Yields'}
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-[#34D399] flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            {siteConfig?.referralDescription ||
              `When your invitee registers and completes an approved deposit, you receive ${rewardRate}% instant cash (e.g. $143 on a $2,600 Veridian A7 allocation) plus ${boostDays} days of 2x daily yields on your rented robots.`}
          </p>

          {/* Invite Code & Share Controls */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                  Your Invite Code
                </p>
                <p className="font-mono text-base font-bold tracking-wide text-white">
                  {code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText('code', code)}
                className="px-3 py-1.5 rounded-lg bg-white text-[#111827] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {copied === 'code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyText('link', inviteLink)}
                className="h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied === 'link' ? (
                  <Check className="w-3.5 h-3.5 text-[#34D399]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied === 'link' ? 'Link Copied' : 'Copy Invite Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="h-9 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>
            </div>
          </div>
        </section>

        {/* Team & 2x Boost Stats */}
        <div className="grid grid-cols-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl divide-x divide-[#E5E7EB] dark:divide-[#1E293B]">
          <div className="p-3">
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">Team Size</p>
            <p className="mt-1 font-mono text-base font-bold tabular-nums text-[#111827] dark:text-[#F8FAFC]">
              {summary?.totalTeamMembers ?? 0}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
              {summary?.qualifyingDepositors ?? 0} funded
            </p>
          </div>
          <div className="p-3">
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">Cash Earned</p>
            <p className="mt-1 font-mono text-base font-bold tabular-nums text-[#059669] dark:text-[#34D399]">
              {formatUsd(summary?.totalReferralEarned ?? investor.referralBonusEarned)}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Paid to wallet</p>
          </div>
          <div className="p-3">
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">Daily Boost</p>
            <p
              className={`mt-1 font-mono text-base font-bold ${
                summary?.doubleYieldActive
                  ? 'text-[#059669] dark:text-[#34D399]'
                  : 'text-[#111827] dark:text-[#F8FAFC]'
              }`}
            >
              {summary?.doubleYieldActive ? '2.0x ON' : '1.0x'}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
              {summary?.doubleYieldActive ? 'Double yield' : 'Invite to unlock'}
            </p>
          </div>
        </div>

        {summary?.doubleYieldActive && summary.doubleYieldActiveUntil && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                  2x Double Daily Yield Active
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 truncate">
                  Active until {formatDateTime(summary.doubleYieldActiveUntil)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBrowseRobots}
              className="px-3 py-1.5 rounded-lg bg-[#059669] text-white text-[11px] font-semibold whitespace-nowrap cursor-pointer"
            >
              Rent 2x Unit
            </button>
          </div>
        )}

        {/* Reward Schedule Across All Machines */}
        <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                Reward Tiers by Machine Value
              </h3>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                Paid the day your invitee&apos;s deposit is approved
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>

          <div className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
            {robots.map((robot) => {
              const rewardUsd =
                typeof robot.referralBonusUsd === 'number'
                  ? robot.referralBonusUsd
                  : Number(((robot.rentalPrice * rewardRate) / 100).toFixed(2));
              const normalDaily = (robot.rentalPrice * robot.dailyReturnRate) / 100;
              const doubleDaily = normalDaily * 2;
              return (
                <div
                  key={robot.id}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                      {robot.name}
                    </p>
                    <p className="text-[10.5px] font-mono text-[#6B7280] dark:text-[#94A3B8]">
                      Lease {formatUsd(robot.rentalPrice).replace('.00', '')} · 2x yield{' '}
                      {formatUsd(doubleDaily)}/d
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-[#059669] dark:text-[#34D399]">
                      +{formatUsd(rewardUsd)}
                    </p>
                    <p className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-semibold">
                      +{boostDays}d 2x yield
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Team Members List */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
              Your Team Members ({summary?.teamMembers.length ?? 0})
            </h3>
            <Users className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
          </div>

          {loading && !summary ? (
            <div className="h-24 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] animate-pulse" />
          ) : (summary?.teamMembers.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-5 py-8 text-center">
              <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                No team members yet
              </p>
              <p className="mt-1 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                Share your invite code <strong>{code}</strong> to earn {rewardRate}% cash bonuses
                and double daily yields.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
              {summary!.teamMembers.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#111827] dark:bg-[#1E293B] text-white overflow-hidden flex items-center justify-center shrink-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {m.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                        {m.fullName}
                      </p>
                      <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                        {m.hasDeposited
                          ? `Deposited ${formatUsd(m.totalDeposited)} · ${m.activeRentalsCount} unit(s)`
                          : 'Joined · Awaiting first deposit'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono text-xs font-bold ${
                        m.hasDeposited
                          ? 'text-[#059669] dark:text-[#34D399]'
                          : 'text-[#D97706]'
                      }`}
                    >
                      {m.hasDeposited ? `+${formatUsd(m.rewardGeneratedUsd)}` : 'Pending'}
                    </p>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                      {m.hasDeposited ? 'Reward paid' : 'On deposit'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
