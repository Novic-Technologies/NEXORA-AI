import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { formatUsd, type OverviewResponse } from '../lib/api.ts';
import type { InvestorProfile, RobotMachine } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { RobotImage } from './RobotImage.tsx';

interface OverviewViewProps {
  overview: OverviewResponse | null;
  investor: InvestorProfile | null;
  onExploreFleet: () => void;
  onSelectMachine: (robot: RobotMachine) => void;
  onOpenAuth: (mode: 'signin' | 'register') => void;
  onOpenDeposit: () => void;
  onOpenNews: (articleId?: string) => void;
  onOpenVerification: () => void;
}

const DISPATCH_IMAGES: Record<string, string> = {
  'disp-01': '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
  'disp-02': '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
  'disp-03': '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
};

export function OverviewView({
  overview,
  investor,
  onExploreFleet,
  onSelectMachine,
  onOpenAuth,
  onOpenDeposit,
  onOpenNews,
  onOpenVerification,
}: OverviewViewProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const stats = overview?.stats;
  const featured = overview?.featuredRobots ?? [];
  const dispatches = overview?.dispatches ?? [];

  return (
    <div className="space-y-5 pb-6">
      {/* Crisp Top App Bar with User's Uploaded Logo */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between gap-3">
        <BrandLogo size="sm" subtitle="Robotics Fleet" />

        {investor ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDeposit}
              className="px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-mono font-semibold tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
            >
              {formatUsd(investor.walletBalance)}
            </button>
            {investor.avatarUrl ? (
              <img
                src={investor.avatarUrl}
                alt={investor.fullName}
                className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
              />
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth('signin')}
            className="px-3.5 py-1.5 rounded-lg bg-[#111827] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </header>

      <div className="px-4 space-y-5">
        {/* Photographic Hero Showcase (Realistic Editorial App Card) */}
        <section className="rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-2xs">
          <div className="relative aspect-[16/9] bg-[#111827]">
            <RobotImage
              src="/src/assets/images/hero_robotics_floor_1795701351020.jpg"
              alt="Nexora AI active robotics deployment floor"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/90 via-[#111827]/35 to-transparent" />
            <div className="absolute bottom-3.5 left-4 right-4 text-white">
              <p className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#93C5FD]">
                {stats ? `${stats.availableFleetUnits} units open for lease` : '6 European Facilities'}
              </p>
              <h1 className="mt-1 font-display text-xl font-bold leading-snug">
                Industrial AI Robotics Leasing
              </h1>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Select active Nexora AI robots operating in Munich, Zurich, Eindhoven, and
              Rotterdam. Fund leases via Binance-supported coins with Master Admin settlement
              oversight.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExploreFleet}
                className="h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Browse Robots</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="h-10 rounded-xl border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-xs font-semibold transition-colors cursor-pointer"
              >
                How it works
              </button>
            </div>
          </div>
        </section>

        {/* Key Fleet Metrics Strip */}
        <section className="grid grid-cols-3 bg-white border border-[#E5E7EB] rounded-2xl divide-x divide-[#E5E7EB]">
          <div className="p-3.5">
            <p className="text-[10.5px] text-[#6B7280]">Total Fleet</p>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827]">
              {stats ? stats.totalFleetUnits : 122}
            </p>
            <p className="text-[10px] text-[#6B7280]">Deployed units</p>
          </div>
          <div className="p-3.5">
            <p className="text-[10.5px] text-[#6B7280]">Daily Return</p>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#059669]">
              {stats ? stats.dailyRateRange : '1.42–1.95%'}
            </p>
            <p className="text-[10px] text-[#6B7280]">Accrues live</p>
          </div>
          <div className="p-3.5">
            <p className="text-[10.5px] text-[#6B7280]">Crypto Assets</p>
            <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#111827]">
              {stats ? stats.supportedCoins : 8} Coins
            </p>
            <p className="text-[10px] text-[#6B7280]">Binance chains</p>
          </div>
        </section>

        {/* Contextual Action Strip (KYC or Deposit or Register) */}
        {investor ? (
          investor.kycStatus !== 'verified' ? (
            <button
              type="button"
              onClick={onOpenVerification}
              className="w-full text-left rounded-2xl bg-white border border-[#FDE68A] hover:border-[#F59E0B] p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111827] truncate">
                    {investor.kycStatus === 'pending'
                      ? 'Verification pending Master Admin review'
                      : 'Complete photo & ID verification'}
                  </p>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
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
              className="w-full text-left rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111827] truncate">
                    Fund wallet via Binance coins
                  </p>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
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
            className="w-full text-left rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111827] truncate">
                  Open an investor profile
                </p>
                <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
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
              <h2 className="font-display text-base font-bold text-[#111827]">
                Active Fleet Units
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Live robotic hardware available for leasing
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreFleet}
              className="text-xs font-semibold text-[#2563EB] inline-flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
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
                  className="w-[198px] shrink-0 bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-colors"
                >
                  <div className="aspect-[4/3] bg-[#F3F4F6] overflow-hidden relative">
                    <RobotImage
                      src={robot.imageUrl}
                      alt={robot.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <p className="text-[10px] font-mono text-[#6B7280] truncate">
                        {robot.modelCode} · {robot.availableUnits} open
                      </p>
                      <h3 className="mt-0.5 text-xs font-bold text-[#111827] truncate">
                        {robot.name}
                      </h3>
                      <p className="mt-0.5 text-[10.5px] text-[#4B5563] line-clamp-2 leading-snug">
                        {robot.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold font-mono tabular-nums text-[#111827]">
                          {formatUsd(robot.rentalPrice).replace('.00', '')}
                        </p>
                        <p className="text-[10px] font-mono tabular-nums text-[#059669] font-semibold">
                          {robot.dailyReturnRate.toFixed(2)}% · {formatUsd(dailyUsd)}/d
                        </p>
                      </div>
                      <span className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center shrink-0">
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
              <h2 className="font-display text-base font-bold text-[#111827]">
                Operations Feed
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Facility deployments & settlement notices
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNews()}
              className="text-xs font-semibold text-[#2563EB] inline-flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
            >
              <span>All updates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <ul className="bg-white border border-[#E5E7EB] rounded-2xl divide-y divide-[#F3F4F6]">
            {dispatches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenNews(item.id)}
                  className="w-full text-left flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0">
                    <RobotImage
                      src={
                        DISPATCH_IMAGES[item.id] ??
                        '/src/assets/images/hero_robotics_floor_1795701351020.jpg'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] text-[#6B7280]">
                      {item.category} · {item.publishedAt}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#111827] line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <footer className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
          <BrandLogo size="sm" />
          <p className="text-[10.5px]">© 2026 Nexora AI Robotics</p>
        </footer>
      </div>

      {/* How It Works Sheet */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 space-y-4">
            <div className="w-10 h-1 rounded-full bg-[#D1D5DB] mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111827]">
                How Nexora AI works
              </h3>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-[#4B5563]">
              <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3.5">
                <p className="font-semibold text-[#111827] inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>01. Register, upload photo & verify ID</span>
                </p>
                <p className="mt-1 leading-relaxed">
                  Create your account, add your profile photo, submit your government ID (and
                  optional proof of financial ability) for Master Admin approval.
                </p>
              </div>
              <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3.5">
                <p className="font-semibold text-[#111827]">
                  02. Deposit crypto with Master Admin review
                </p>
                <p className="mt-1 leading-relaxed">
                  Choose any of the 8 Binance-supported coins, scan or copy the deposit address,
                  and submit your TXID/screenshot. Funds credit as soon as the Master Admin
                  approves.
                </p>
              </div>
              <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3.5">
                <p className="font-semibold text-[#111827]">
                  03. Lease AI robots & withdraw yields
                </p>
                <p className="mt-1 leading-relaxed">
                  Lease active robots, collect live accrued daily yield into your balance, and
                  submit verified crypto withdrawals.
                </p>
              </div>
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
