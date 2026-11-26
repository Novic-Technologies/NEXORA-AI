import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Gift,
  Minus,
  Plus,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { formatUsd, rentRobotMachine } from '../lib/api.ts';
import type {
  EnrichedMachineRental,
  InvestorProfile,
  RobotCategory,
  RobotMachine,
  SiteConfig,
  WalletTransaction,
} from '../types.ts';
import { RobotImage } from './RobotImage.tsx';

interface MachinesViewProps {
  robots: RobotMachine[];
  investor: InvestorProfile | null;
  siteConfig?: SiteConfig;
  loading: boolean;
  preselectedRobot?: RobotMachine | null;
  onClearPreselected?: () => void;
  onRentalComplete: (payload: {
    investor: InvestorProfile;
    rental: EnrichedMachineRental;
    robot: RobotMachine;
    transaction: WalletTransaction;
  }) => void;
  onOpenDeposit: (suggestedAmount?: number) => void;
  onRequireAuth: () => void;
  onViewPortfolio: () => void;
}

const CATEGORIES: Array<'All' | RobotCategory> = [
  'All',
  'Warehouse & Logistics',
  'Humanoid AI',
  'Precision Assembly',
  'Autonomous Inspection',
  'Service & Agri',
];

const SHORT_CATEGORY: Record<'All' | RobotCategory, string> = {
  All: 'All',
  'Warehouse & Logistics': 'Logistics',
  'Humanoid AI': 'Humanoid',
  'Precision Assembly': 'Assembly',
  'Autonomous Inspection': 'Inspection',
  'Service & Agri': 'Service & Agri',
};

export function MachinesView({
  robots,
  investor,
  siteConfig,
  loading,
  preselectedRobot,
  onClearPreselected,
  onRentalComplete,
  onOpenDeposit,
  onRequireAuth,
  onViewPortfolio,
}: MachinesViewProps) {
  const [category, setCategory] = useState<'All' | RobotCategory>('All');
  const [search, setSearch] = useState('');
  const [selectedRobot, setSelectedRobot] = useState<RobotMachine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [rentalError, setRentalError] = useState<string | null>(null);
  const [confirmedRental, setConfirmedRental] = useState<EnrichedMachineRental | null>(
    null
  );

  const rewardPct = siteConfig?.referralRewardRatePct ?? 5.5;
  const isDoubleActive = Boolean(
    investor?.doubleYieldActiveUntil &&
      new Date(investor.doubleYieldActiveUntil).getTime() > Date.now()
  );

  useEffect(() => {
    if (preselectedRobot) {
      setSelectedRobot(preselectedRobot);
      setQuantity(1);
      setRentalError(null);
      setConfirmedRental(null);
      onClearPreselected?.();
    }
  }, [preselectedRobot, onClearPreselected]);

  const filteredRobots = useMemo(() => {
    const q = search.trim().toLowerCase();
    return robots.filter((r) => {
      const catMatch = category === 'All' || r.category === category;
      const qMatch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.modelCode.toLowerCase().includes(q) ||
        r.facilityHub.toLowerCase().includes(q) ||
        r.tagline.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [robots, category, search]);

  const openMachineSheet = (robot: RobotMachine) => {
    setSelectedRobot(robot);
    setQuantity(1);
    setRentalError(null);
    setConfirmedRental(null);
  };

  const closeMachineSheet = () => {
    setSelectedRobot(null);
    setRentalError(null);
    setConfirmedRental(null);
  };

  const handleRentSubmit = async () => {
    if (!investor) {
      closeMachineSheet();
      onRequireAuth();
      return;
    }
    if (!selectedRobot || submitting) return;
    setRentalError(null);
    setSubmitting(true);
    try {
      const result = await rentRobotMachine({
        robotId: selectedRobot.id,
        quantity,
      });
      onRentalComplete(result);
      setSelectedRobot(result.robot);
      setConfirmedRental(result.rental);
    } catch (err) {
      setRentalError(err instanceof Error ? err.message : 'Unable to complete rental.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
            AI Fleet Units
          </h1>
          {isDoubleActive && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399] font-mono text-[10px] font-bold">
              2x YIELD ON
            </span>
          )}
        </div>

        {investor ? (
          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 border border-[#BFDBFE] dark:border-[#3B82F6]/40 text-[#1D4ED8] dark:text-[#93C5FD] text-xs font-mono font-semibold tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
          >
            {formatUsd(investor.walletBalance)}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequireAuth}
            className="px-3.5 py-1.5 rounded-lg bg-[#0B1220] dark:bg-[#2563EB] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </header>

      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machine model or hub..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0B1220] dark:bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {SHORT_CATEGORY[cat]}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="animate-pulse">
                <div className="aspect-[4/4.2] rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B]" />
                <div className="mt-2 h-3 w-3/4 rounded bg-[#E2E8F0] dark:bg-[#1E293B]" />
              </div>
            ))}
          </div>
        ) : filteredRobots.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-4 py-10 text-center">
            <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              No units match your filter
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('All');
                setSearch('');
              }}
              className="mt-2 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] underline cursor-pointer"
            >
              Show all machines
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredRobots.map((robot) => {
              const baseDailyUsd = (robot.rentalPrice * robot.dailyReturnRate) / 100;
              const effectiveDaily = isDoubleActive ? baseDailyUsd * 2 : baseDailyUsd;
              const refBonus =
                typeof robot.referralBonusUsd === 'number'
                  ? robot.referralBonusUsd
                  : Number(((robot.rentalPrice * rewardPct) / 100).toFixed(2));
              return (
                <article
                  key={robot.id}
                  onClick={() => openMachineSheet(robot)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openMachineSheet(robot);
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#94A3B8] dark:hover:border-[#334155] bg-white dark:bg-[#111827] flex flex-col transition-colors"
                >
                  <div className="aspect-[4/4] w-full overflow-hidden bg-[#F1F5F9] dark:bg-[#1E293B]">
                    <RobotImage
                      src={robot.imageUrl}
                      alt={robot.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] truncate">
                        {SHORT_CATEGORY[robot.category]} · {robot.availableUnits} open
                      </p>
                      <h2 className="mt-0.5 truncate text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {robot.name}
                      </h2>
                      <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-[#475569] dark:text-[#CBD5E1]">
                        {robot.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono tabular-nums text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {formatUsd(robot.rentalPrice).replace('.00', '')}
                        </span>
                        <span className="font-mono tabular-nums text-[10.5px] font-semibold text-[#047857] dark:text-[#34D399]">
                          {isDoubleActive
                            ? `${(robot.dailyReturnRate * 2).toFixed(2)}% (2x)`
                            : `${robot.dailyReturnRate.toFixed(2)}%`}
                        </span>
                      </div>
                      <p className="font-mono tabular-nums text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        {formatUsd(effectiveDaily)}/day · {robot.cycleDays}d
                      </p>
                      <p className="font-mono tabular-nums text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-semibold truncate">
                        Invite: +{formatUsd(refBonus)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Sheet for Inspect & Rent Machine */}
      {selectedRobot && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1220]/70 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-robot-title"
        >
          <div className="w-full max-w-[430px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#111827] border-t border-[#E2E8F0] dark:border-[#1E293B] rounded-t-3xl p-5 space-y-4">
            <div className="w-10 h-1 rounded-full bg-[#CBD5E1] dark:bg-[#334155] mx-auto" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <Cpu className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" />
                <span className="font-mono">{selectedRobot.modelCode}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedRobot.facilityHub}</span>
              </div>
              <button
                type="button"
                onClick={closeMachineSheet}
                aria-label="Close"
                className="w-9 h-9 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#475569] dark:text-[#CBD5E1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmedRental ? (
              <div className="py-4 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-900 text-[#047857] dark:text-[#34D399] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Machine Rental Activated
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                  You rented{' '}
                  <strong>
                    {confirmedRental.quantity}x {confirmedRental.robotName}
                  </strong>
                  . Daily payout of{' '}
                  <strong className="font-mono">
                    {formatUsd(confirmedRental.effectiveDailyPayout)}/day
                  </strong>{' '}
                  {confirmedRental.yieldMultiplier > 1 ? '(2x Boost Active) ' : ''}
                  runs across a {confirmedRental.cycleDays}-day operating cycle.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMachineSheet();
                      onViewPortfolio();
                    }}
                    className="w-full h-11 rounded-xl bg-[#0B1220] dark:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                  >
                    Open Portfolio & Track Yield
                  </button>
                  <button
                    type="button"
                    onClick={closeMachineSheet}
                    className="w-full h-11 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-semibold cursor-pointer"
                  >
                    Back to fleet
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F1F5F9] dark:bg-[#1E293B]">
                  <RobotImage
                    src={selectedRobot.imageUrl}
                    alt={selectedRobot.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h2
                    id="sheet-robot-title"
                    className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    {selectedRobot.name}
                  </h2>
                  <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                    {selectedRobot.description}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] p-3.5 text-xs">
                  <div>
                    <dt className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8]">
                      Neural Core
                    </dt>
                    <dd className="font-medium text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                      {selectedRobot.specs.neuralCore}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8]">
                      Autonomy
                    </dt>
                    <dd className="font-medium text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                      {selectedRobot.specs.autonomyLevel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8]">
                      Payload
                    </dt>
                    <dd className="font-medium text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                      {selectedRobot.specs.payloadCapacity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8]">
                      Uptime SLA
                    </dt>
                    <dd className="font-medium text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                      {selectedRobot.specs.uptimeSla}
                    </dd>
                  </div>
                </dl>

                {/* Referral Incentive Box */}
                <div className="rounded-xl border border-[#BFDBFE] dark:border-[#1E3A8A] bg-[#EFF6FF] dark:bg-[#0F172A] p-3 flex items-center gap-2.5 text-xs">
                  <Gift className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                  <p className="text-[11px] text-[#1E3A8A] dark:text-[#93C5FD] leading-snug">
                    Team invite bonus:{' '}
                    <strong>
                      +
                      {formatUsd(
                        typeof selectedRobot.referralBonusUsd === 'number'
                          ? selectedRobot.referralBonusUsd
                          : (selectedRobot.rentalPrice * rewardPct) / 100
                      )}
                    </strong>{' '}
                    cash + <strong>2x daily yields</strong> when your invitee deposits.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      Units to rent
                    </p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      {selectedRobot.availableUnits} of {selectedRobot.totalUnits} open
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono text-sm font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={quantity >= selectedRobot.availableUnits}
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(selectedRobot.availableUnits, q + 1)
                        )
                      }
                      className="w-9 h-9 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(() => {
                  const totalCost = selectedRobot.rentalPrice * quantity;
                  const baseDaily =
                    (totalCost * selectedRobot.dailyReturnRate) / 100;
                  const dailyPayout = isDoubleActive ? baseDaily * 2 : baseDaily;
                  const projected = baseDaily * selectedRobot.cycleDays;
                  const shortfall = investor
                    ? Math.max(0, totalCost - investor.walletBalance)
                    : 0;

                  return (
                    <>
                      <dl className="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-[#64748B] dark:text-[#94A3B8]">
                            Rental Allocation
                          </dt>
                          <dd className="font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                            {formatUsd(totalCost)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B] dark:text-[#94A3B8]">
                            Daily Yield ({selectedRobot.dailyReturnRate.toFixed(2)}%
                            {isDoubleActive ? ' × 2x' : ''})
                          </dt>
                          <dd className="font-mono font-semibold tabular-nums text-[#047857] dark:text-[#34D399]">
                            {formatUsd(dailyPayout)} / day
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B] dark:text-[#94A3B8]">
                            Base {selectedRobot.cycleDays}d Return
                          </dt>
                          <dd className="font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                            {formatUsd(projected)}
                          </dd>
                        </div>
                        {investor && (
                          <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] flex justify-between">
                            <dt className="inline-flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                              <Wallet className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" />
                              Wallet Balance
                            </dt>
                            <dd className="font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                              {formatUsd(investor.walletBalance)}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {rentalError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
                        >
                          {rentalError}
                        </div>
                      )}

                      {!investor ? (
                        <button
                          type="button"
                          onClick={() => {
                            closeMachineSheet();
                            onRequireAuth();
                          }}
                          className="w-full h-12 rounded-xl bg-[#0B1220] dark:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                        >
                          Sign in or Create Account to Rent
                        </button>
                      ) : shortfall > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            closeMachineSheet();
                            onOpenDeposit(shortfall);
                          }}
                          className="w-full h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer"
                        >
                          Deposit Crypto ({formatUsd(shortfall)} needed)
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting || selectedRobot.availableUnits === 0}
                          onClick={handleRentSubmit}
                          className="w-full h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {submitting
                            ? 'Activating rental...'
                            : `Confirm Rental · ${formatUsd(totalCost)}`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
