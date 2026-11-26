import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCheck,
  Cpu,
  Crown,
  Gift,
  Wallet,
} from 'lucide-react';
import { formatDateTime } from '../lib/api.ts';
import type { AppNotification, NotificationCategory } from '../types.ts';

interface NotificationsViewProps {
  notifications: AppNotification[];
  loading: boolean;
  onBack: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onNavigateAction: (screen?: AppNotification['actionScreen']) => void;
}

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  transfer: Wallet,
  kyc: BadgeCheck,
  referral: Gift,
  rental: Cpu,
  admin: Crown,
  system: Bell,
};

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  transfer: 'Transfers',
  kyc: 'Verification',
  referral: 'Team & Rewards',
  rental: 'Machines',
  admin: 'Admin Notice',
  system: 'System',
};

export function NotificationsView({
  notifications,
  loading,
  onBack,
  onMarkRead,
  onMarkAllRead,
  onNavigateAction,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'transfer' | 'referral' | 'system'>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.read;
      if (filter === 'transfer') return n.category === 'transfer';
      if (filter === 'referral') return n.category === 'referral';
      if (filter === 'system') {
        return n.category === 'system' || n.category === 'admin' || n.category === 'kyc' || n.category === 'rental';
      }
      return true;
    });
  }, [notifications, filter]);

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
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
              Notifications
            </h1>
            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void onMarkAllRead()}
            className="px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#93C5FD] text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </header>

      <div className="px-4 space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ['all', `All (${notifications.length})`],
              ['unread', `Unread (${unreadCount})`],
              ['transfer', 'Transfers'],
              ['referral', 'Team & Rewards'],
              ['system', 'System'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                filter === key
                  ? 'bg-[#111827] dark:bg-[#2563EB] text-white'
                  : 'bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] text-[#4B5563] dark:text-[#94A3B8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="h-20 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-5 py-10 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
              No notifications in this view
            </p>
            <p className="mt-1 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
              Deposit approvals, referral bonuses, KYC updates, and announcements arrive here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => {
              const Icon = CATEGORY_ICON[item.category] ?? Bell;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.read) {
                      void onMarkRead(item.id);
                    }
                    if (item.actionScreen) {
                      onNavigateAction(item.actionScreen);
                    }
                  }}
                  className={`w-full text-left rounded-2xl border p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    item.read
                      ? 'bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B]'
                      : 'bg-[#EFF6FF]/60 dark:bg-[#1E293B] border-[#BFDBFE] dark:border-[#3B82F6]/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.category === 'referral'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399]'
                        : item.category === 'admin'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4338CA] dark:text-[#A5B4FC]'
                          : 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#60A5FA]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
                        {CATEGORY_LABEL[item.category]} · {formatDateTime(item.createdAt)}
                      </span>
                      {!item.read && (
                        <span className="text-[10px] font-bold text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
