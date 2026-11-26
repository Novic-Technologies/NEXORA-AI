import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Search } from 'lucide-react';
import { formatDateTime, formatUsd, truncateAddress } from '../lib/api.ts';
import type { TransactionType, WalletTransaction } from '../types.ts';

interface ActivityViewProps {
  transactions: WalletTransaction[];
  loading: boolean;
  onBack: () => void;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Crypto Deposit',
  withdraw: 'Crypto Withdraw',
  rental: 'Machine Rental',
  yield_payout: 'Daily Yield',
};

export function ActivityView({
  transactions,
  loading,
  onBack,
}: ActivityViewProps) {
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const typeOk = filter === 'all' || tx.type === filter;
      const qOk =
        !q ||
        tx.reference.toLowerCase().includes(q) ||
        (tx.walletAddress ?? '').toLowerCase().includes(q) ||
        (tx.txHash ?? '').toLowerCase().includes(q) ||
        (tx.coinSymbol ?? '').toLowerCase().includes(q) ||
        (tx.networkCode ?? '').toLowerCase().includes(q);
      return typeOk && qOk;
    });
  }, [transactions, filter, search]);

  const copyValue = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#0F172A] shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold text-[#0F172A] truncate">
            Transaction Ledger
          </h1>
          <p className="text-[11px] text-[#64748B] truncate">
            Crypto deposits, withdrawals, rentals & yield
          </p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coin, network, address, or reference..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#CBD5E1] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ['all', 'All'],
              ['deposit', 'Deposits'],
              ['withdraw', 'Withdrawals'],
              ['rental', 'Rentals'],
              ['yield_payout', 'Yields'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                filter === key
                  ? 'bg-[#0B1220] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="h-16 rounded-xl border border-[#E2E8F0] bg-white animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-10 text-center">
            <p className="text-xs font-semibold text-[#0F172A]">No activity found</p>
            <p className="mt-1 text-[11px] text-[#64748B]">
              Crypto transfers and robot rental activity appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white divide-y divide-[#F1F5F9]">
            {filtered.map((tx) => {
              const inbound = tx.type === 'deposit' || tx.type === 'yield_payout';
              const hashOrAddress = tx.walletAddress || tx.txHash || '';
              return (
                <div key={tx.id} className="p-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-[#64748B]">
                      <span className="font-semibold text-[#475569]">
                        {TYPE_LABELS[tx.type]}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold uppercase text-[9.5px] ${
                          tx.status === 'completed'
                            ? 'bg-emerald-50 text-[#059669]'
                            : tx.status === 'pending'
                              ? 'bg-amber-50 text-[#D97706]'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                      {tx.coinSymbol && (
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#0F172A] font-mono text-[10px] font-semibold">
                          {tx.coinSymbol}
                          {tx.networkCode ? ` · ${tx.networkCode}` : ''}
                        </span>
                      )}
                      <span>· {formatDateTime(tx.createdAt)}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#0F172A] truncate">
                      {tx.reference}
                    </p>
                    {tx.adminNote && (
                      <p className="text-[10.5px] text-[#64748B] italic">
                        Admin note: {tx.adminNote}
                      </p>
                    )}
                    {hashOrAddress && (
                      <button
                        type="button"
                        onClick={() => copyValue(tx.id, hashOrAddress)}
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#64748B] hover:text-[#1D4ED8] cursor-pointer"
                      >
                        <span>{truncateAddress(hashOrAddress)}</span>
                        {copiedId === tx.id ? (
                          <Check className="w-3 h-3 text-[#047857]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <span
                    className={`font-mono tabular-nums text-xs font-bold shrink-0 ${
                      tx.status === 'rejected'
                        ? 'text-red-600 line-through'
                        : tx.status === 'pending'
                          ? 'text-[#D97706]'
                          : inbound
                            ? 'text-[#047857]'
                            : 'text-[#0F172A]'
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
      </div>
    </div>
  );
}
