import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  Cpu,
  Gift,
  MapPin,
  Megaphone,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { formatUsd, type OverviewResponse } from '../lib/api.ts';
import type { InvestorProfile, RobotMachine } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { RobotImage } from './RobotImage.tsx';

interface OverviewViewProps {
  overview: OverviewResponse | null;
  investor: InvestorProfile | null;
  unreadNotifications: number;
  onExploreFleet: () => void;
  onSelectMachine: (robot: RobotMachine) => void;
  onOpenAuth: (mode: 'signin' | 'register') => void;
  onOpenDeposit: () => void;
  onOpenNews: (articleId?: string) => void;
  onOpenVerification: () => void;
  onOpenNotifications: () => void;
  onOpenReferrals: () => void;
}

const DISPATCH_IMAGES: Record<string, string> = {
  'disp-01': '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
  'disp-02': '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
  'disp-03': '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
};

export function OverviewView({
  overview,
  investor,
  unreadNotifications,
  onExploreFleet,
  onSelectMachine,
  onOpenAuth,
  onOpenDeposit,
  onOpenNews,
  onOpenVerification,
  onOpenNotifications,
  onOpenReferrals,
}: OverviewViewProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const stats = overview?.stats;
  const site = overview?.siteConfig;
  const featured = overview?.featuredRobots ?? [];
  const dispatches = overview?.dispatches ?? [];

  const brandName = site?.brandName || 'Nexora AI';
  const brandSubtitle = site?.brandSubtitle || 'Robotics Fleet';
  const rewardPct = site?.referralRewardRatePct ?? 5.5;
  const boostDays = site?.referralDoubleYieldDays ?? 7;

  return (
    <div className="space-y-5 pb-6">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between gap-2">
        <BrandLogo size="sm" brandName={brandName} subtitle={brandSubtitle} />

        {investor ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Notifications"
              className="relative w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] shrink-0 cursor-pointer"
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
              onClick={onOpenDeposit}
              className="px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 border border-[#BFDBFE] dark:border-[#3B82F6]/40 text-[#1D4ED8] dark:text-[#93C5FD] text-xs font-mono font-semibold tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
            >
              {formatUsd(investor.walletBalance)}
            </button>
            {investor.avatarUrl ? (
              <img
                src={investor.avatarUrl}
                alt={investor.fullName}
                className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB] dark:border-[#334155]"
              />
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="px-3.5 py-1.5 rounded-lg bg-[#111827] dark:bg-[#2563EB] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign in
            </button>
          </div>
        )}
      </header>

      <div className="px-4 space-y-4">
        {site?.announcementBanner && (
          <div className="rounded-xl border border-[#BFDBFE] dark:border-[#1E3A8A] bg-[#EFF6FF] dark:bg-[#0F172A] px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-medium text-[#1E3A8A] dark:text-[#93C5FD]">
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-snug">{site.announcementBanner}</span>
          </div>
        )}

        {/* Editorial Hero Showcase */}
        <section className="rounded-2xl overflow-hidden bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] shadow-2xs">
          <div className="relative aspect-[16/9] bg-[#111827]">
            <RobotImage
              src={site?.heroImageUrl || '/src/assets/images/hero_robotics_floor_1795701351020.jpg'}
              alt={`${brandName} active robotics deployment floor`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/95 via-[#0B1120]/35 to-transparent" />
            <div className="absolute bottom-3.5 left-4 right-4 text-white">
              <p className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#93C5FD]">
                {site?.heroKicker ||
                  (stats
                    ? `${stats.availableFleetUnits} units open for lease`
                    : '6 European Facilities')}
              </p>
              <h1 className="mt-1 font-display text-xl font-bold leading-snug">
                {site?.heroTitle || 'Industrial AI Robotics Leasing'}
              </h1>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            <p className="text-xs text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
              {site?.heroDescription ||
                'Select active Nexora AI robots operating across verified hubs. Fund leases via Binance-supported coins with Finance Department settlement oversight.'}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExploreFleet}
                className="h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{site?.primaryCtaText || 'Browse Robots'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="h-10 rounded-xl border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] text-xs font-semibold transition-colors cursor-pointer"
              >
                {site?.secondaryCtaText || 'How it works'}
              </button>
            </div>
          </div>
        </section>

        {/* Key Fleet Metrics Strip */}
        <section className="grid grid-cols-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl divide-x divide-[#E5E7EB] dark:divide-[#1E293B]">
          <div className="p-3.5">
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">Total Fleet</p>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC]">
              {stats ? stats.totalFleetUnits : '—'}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Deployed units</p>
          </div>
          <div className="p-3.5">
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">Daily Return</p>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#059669] dark:text-[#34D399]">
              {stats ? stats.dailyRateRange : '—'}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Accrues live</p>
          </div>
          <div className="p-3.5">
            <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">Crypto Assets</p>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC]">
              {stats ? `${stats.supportedCoins} Coins` : '—'}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Binance chains</p>
          </div>
        </section>

        {/* Invite & Earn 2x Yield Banner */}
        <button
          type="button"
          onClick={() => (investor ? onOpenReferrals() : onOpenAuth('register'))}
          className="w-full text-left rounded-2xl bg-[#111827] dark:bg-[#0F172A] border border-[#1F2937] dark:border-[#334155] text-white p-4 flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {site?.referralHeadline || 'Invite Investors & Earn 2x Daily Yields'}
              </p>
              <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                Earn {rewardPct}% instant bonus ($143 on $2,600) + {boostDays}d double yields
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
        </button>

        <PWAInstallButton variant="banner" />

        {/* Contextual Action Strip */}
        {investor ? (
          investor.kycStatus !== 'verified' ? (
            <button
              type="button"
              onClick={onOpenVerification}
              className="w-full text-left rounded-2xl bg-white dark:bg-[#111827] border border-[#FDE68A] dark:border-amber-800 hover:border-[#F59E0B] p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                    {investor.kycStatus === 'pending'
                      ? 'Verification pending Compliance review'
                      : 'Complete photo & ID verification'}
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate mt-0.5">
                    {investor.kycStatus === 'pending'
                      ? 'Your documents are queued for compliance approval'
                      : 'Upload photo, ID & optional financial proof to unlock payouts'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenDeposit}
              className="w-full text-left rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                    Fund wallet via Binance coins
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate mt-0.5">
                    USDT, USDC, BNB, BTC, ETH, SOL, XRP & TRX
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth('register')}
            className="w-full text-left rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                  Open an investor profile
                </p>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate mt-0.5">
                  Upload photo, verify ID & start leasing active AI units
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          </button>
        )}

        {/* Featured Robots Horizontal Carousel */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Active Fleet Units
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                Live robotic hardware available for leasing
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreFleet}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] inline-flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {featured.map((robot) => {
              const dailyUsd = (robot.rentalPrice * robot.dailyReturnRate) / 100;
              return (
                <div
                  key={robot.id}
                  onClick={() => onSelectMachine(robot)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMachine(robot);
                    }
                  }}
                  className="w-[198px] shrink-0 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#9CA3AF] dark:hover:border-[#334155] rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-colors"
                >
                  <div className="aspect-[4/3] bg-[#F3F4F6] dark:bg-[#1E293B] overflow-hidden relative">
                    <RobotImage
                      src={robot.imageUrl}
                      alt={robot.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <p className="text-[10px] font-mono text-[#6B7280] dark:text-[#94A3B8] truncate">
                        {robot.modelCode} · {robot.availableUnits} open
                      </p>
                      <h3 className="mt-0.5 text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                        {robot.name}
                      </h3>
                      <p className="mt-0.5 text-[10.5px] text-[#4B5563] dark:text-[#CBD5E1] line-clamp-2 leading-snug">
                        {robot.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B] flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC]">
                          {formatUsd(robot.rentalPrice).replace('.00', '')}
                        </p>
                        <p className="text-[10px] font-mono tabular-nums text-[#059669] dark:text-[#34D399] font-semibold">
                          {robot.dailyReturnRate.toFixed(2)}% · {formatUsd(dailyUsd)}/d
                        </p>
                      </div>
                      <span className="w-8 h-8 rounded-lg bg-[#111827] dark:bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fleet Dispatches */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Operations Feed
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                Facility deployments & settlement notices
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNews()}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] inline-flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
            >
              <span>All updates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <ul className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
            {dispatches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenNews(item.id)}
                  className="w-full text-left flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F3F4F6] dark:bg-[#1E293B] shrink-0">
                    <RobotImage
                      src={
                        item.imageUrl ||
                        DISPATCH_IMAGES[item.id] ||
                        '/src/assets/images/hero_robotics_floor_1795701351020.jpg'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
                      {item.category} · {item.publishedAt}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <footer className="pt-3.5 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-2.5 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
          <div className="flex items-start gap-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] p-3">
            <MapPin className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold text-[#111827] dark:text-[#F8FAFC]">
                {brandName} Global Headquarters
              </p>
              <p className="text-[10.5px] leading-snug">
                {site?.headquartersAddress ||
                  'Technoparkstrasse 1, Tower A, 8005 Zurich, Switzerland'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <BrandLogo size="sm" brandName={brandName} />
            <p className="text-[10.5px] text-right">
              {site?.footerNotice || '© 2026 Nexora AI Robotics'}
            </p>
          </div>
        </footer>
      </div>

      {/* How It Works Sheet */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[430px] bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl p-5 space-y-4">
            <div className="w-10 h-1 rounded-full bg-[#D1D5DB] dark:bg-[#334155] mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                How {brandName} works
              </h3>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="w-9 h-9 rounded-full border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#4B5563] dark:text-[#CBD5E1] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-[#4B5563] dark:text-[#CBD5E1]">
              {(site?.howItWorksSteps ?? [
                {
                  title: '01. Register, upload photo & verify ID',
                  body: 'Create your account, add your profile photo, and submit your government ID (and optional proof of financial ability) for Compliance Department verification.',
                },
                {
                  title: '02. Deposit crypto with Finance Dept review',
                  body: 'Choose any of the Binance-supported coins, scan or copy the treasury address, and submit your TXID/screenshot. Funds credit as soon as the Finance Department confirms.',
                },
                {
                  title: '03. Lease AI robots, invite team & earn 2x',
                  body: 'Lease active robots, collect live accrued daily yield, and invite team members to unlock referral cash rewards plus 2x daily yields.',
                },
              ]).map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-3.5"
                >
                  <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                    {idx === 0 && <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />}
                    <span>{step.title}</span>
                  </p>
                  <p className="mt-1 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowHowItWorks(false);
                if (investor) {
                  onExploreFleet();
                } else {
                  onOpenAuth('register');
                }
              }}
              className="w-full h-11 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              {investor ? 'Browse robotic machines' : 'Create investor account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
