import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
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
  WalletTransaction,
} from '../types.ts';
import { RobotImage } from './RobotImage.tsx';

interface MachinesViewProps {
  robots: RobotMachine[];
  investor: InvestorProfile | null;
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
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">AI Fleet Units</h1>
        </div>

        {investor ? (
          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-mono font-semibold tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
          >
            {formatUsd(investor.walletBalance)}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequireAuth}
            className="px-3.5 py-1.5 rounded-lg bg-[#0B1220] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </header>

      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machine model or hub..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
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
                    ? 'bg-[#0B1220] text-white'
                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A]'
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
                <div className="aspect-[4/4.2] rounded-2xl bg-[#E2E8F0]" />
                <div className="mt-2 h-3 w-3/4 rounded bg-[#E2E8F0]" />
              </div>
            ))}
          </div>
        ) : filteredRobots.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center">
            <p className="text-xs font-semibold text-[#0F172A]">
              No units match your filter
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('All');
                setSearch('');
              }}
              className="mt-2 text-xs font-semibold text-[#1D4ED8] underline cursor-pointer"
            >
              Show all machines
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredRobots.map((robot) => {
              const dailyUsd = (robot.rentalPrice * robot.dailyReturnRate) / 100;
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
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E2E8F0] hover:border-[#94A3B8] bg-white flex flex-col transition-colors"
                >
                  <div className="aspect-[4/4] w-full overflow-hidden bg-[#F1F5F9]">
                    <RobotImage
                      src={robot.imageUrl}
                      alt={robot.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[10px] font-mono text-[#64748B] truncate">
                        {SHORT_CATEGORY[robot.category]} · {robot.availableUnits} open
                      </p>
                      <h2 className="mt-0.5 truncate text-xs font-semibold text-[#0F172A]">
                        {robot.name}
                      </h2>
                      <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-[#475569]">
                        {robot.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono tabular-nums text-xs font-bold text-[#0F172A]">
                          {formatUsd(robot.rentalPrice).replace('.00', '')}
                        </span>
                        <span className="font-mono tabular-nums text-[10.5px] font-semibold text-[#047857]">
                          {robot.dailyReturnRate.toFixed(2)}%
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono tabular-nums text-[10px] text-[#64748B]">
                        {formatUsd(dailyUsd)}/day · {robot.cycleDays}d
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
          className="fixed inset-0 z-50 bg-[#0B1220]/50 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-robot-title"
        >
          <div className="w-full max-w-[430px] max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl p-5 space-y-4">
            <div className="w-10 h-1 rounded-full bg-[#CBD5E1] mx-auto" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Cpu className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span className="font-mono">{selectedRobot.modelCode}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedRobot.facilityHub}</span>
              </div>
              <button
                type="button"
                onClick={closeMachineSheet}
                aria-label="Close"
                className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#475569] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmedRental ? (
              <div className="py-4 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-[#0F172A]">
                  Machine Rental Activated
                </h2>
                <p className="text-xs text-[#475569] leading-relaxed">
                  You rented{' '}
                  <strong>
                    {confirmedRental.quantity}x {confirmedRental.robotName}
                  </strong>
                  . Daily payout of{' '}
                  <strong className="font-mono">
                    {formatUsd(confirmedRental.dailyPayout)}/day
                  </strong>{' '}
                  runs across a {confirmedRental.cycleDays}-day operating cycle.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMachineSheet();
                      onViewPortfolio();
                    }}
                    className="w-full h-11 rounded-xl bg-[#0B1220] text-white text-xs font-semibold cursor-pointer"
                  >
                    Open Portfolio & Track Yield
                  </button>
                  <button
                    type="button"
                    onClick={closeMachineSheet}
                    className="w-full h-11 rounded-xl border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold cursor-pointer"
                  >
                    Back to fleet
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F1F5F9]">
                  <RobotImage
                    src={selectedRobot.imageUrl}
                    alt={selectedRobot.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h2
                    id="sheet-robot-title"
                    className="text-lg font-semibold text-[#0F172A]"
                  >
                    {selectedRobot.name}
                  </h2>
                  <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                    {selectedRobot.description}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 text-xs">
                  <div>
                    <dt className="text-[10.5px] text-[#64748B]">Neural Core</dt>
                    <dd className="font-medium text-[#0F172A] mt-0.5">
                      {selectedRobot.specs.neuralCore}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-[#64748B]">Autonomy</dt>
                    <dd className="font-medium text-[#0F172A] mt-0.5">
                      {selectedRobot.specs.autonomyLevel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-[#64748B]">Payload</dt>
                    <dd className="font-medium text-[#0F172A] mt-0.5">
                      {selectedRobot.specs.payloadCapacity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-[#64748B]">Uptime SLA</dt>
                    <dd className="font-medium text-[#0F172A] mt-0.5">
                      {selectedRobot.specs.uptimeSla}
                    </dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">Units to rent</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedRobot.availableUnits} of {selectedRobot.totalUnits} open
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono text-sm font-semibold tabular-nums">
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
                      className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(() => {
                  const totalCost = selectedRobot.rentalPrice * quantity;
                  const dailyPayout =
                    (totalCost * selectedRobot.dailyReturnRate) / 100;
                  const projected = dailyPayout * selectedRobot.cycleDays;
                  const shortfall = investor
                    ? Math.max(0, totalCost - investor.walletBalance)
                    : 0;

                  return (
                    <>
                      <dl className="rounded-xl border border-[#E2E8F0] p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Rental Allocation</dt>
                          <dd className="font-mono font-semibold tabular-nums text-[#0F172A]">
                            {formatUsd(totalCost)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">
                            Daily Yield ({selectedRobot.dailyReturnRate.toFixed(2)}%)
                          </dt>
                          <dd className="font-mono font-semibold tabular-nums text-[#047857]">
                            {formatUsd(dailyPayout)} / day
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">
                            Total {selectedRobot.cycleDays}d Return
                          </dt>
                          <dd className="font-mono font-semibold tabular-nums text-[#0F172A]">
                            {formatUsd(projected)}
                          </dd>
                        </div>
                        {investor && (
                          <div className="pt-2 border-t border-[#F1F5F9] flex justify-between">
                            <dt className="inline-flex items-center gap-1.5 text-[#64748B]">
                              <Wallet className="w-3.5 h-3.5 text-[#1D4ED8]" />
                              Wallet Balance
                            </dt>
                            <dd className="font-mono font-semibold tabular-nums text-[#0F172A]">
                              {formatUsd(investor.walletBalance)}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {rentalError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
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
                          className="w-full h-12 rounded-xl bg-[#0B1220] text-white text-xs font-semibold cursor-pointer"
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
