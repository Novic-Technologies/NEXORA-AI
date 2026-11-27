import { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../lib/usePWAInstall.ts';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'banner';
}

export function PWAInstallButton({ variant = 'compact' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!showGuide) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showGuide]);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className="rounded-2xl border border-[#BFDBFE] dark:border-[#1E3A8A] bg-[#EFF6FF] dark:bg-[#0F172A] p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                Install Nexora AI App
              </p>
              <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] truncate">
                Add to home screen for instant standalone access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install Nexora AI app"
          className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
          <span>Install</span>
        </button>
      )}

      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] p-5 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                {isIOS ? 'Install on iPhone / iPad' : 'Install Nexora AI App'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#374151] flex items-center justify-center text-[#6B7280] dark:text-[#9CA3AF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <p className="text-xs text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
                1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
                <br />
                3. Tap <strong>Add</strong> to launch Nexora AI as a standalone app.
              </p>
            ) : (
              <p className="text-xs text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
                Open your browser menu (<strong>⋮</strong> or address bar install icon) and
                select <strong>Install App</strong> or <strong>Add to Home Screen</strong> to run
                Nexora AI natively in standalone mode.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full h-10 rounded-xl bg-[#111827] dark:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Cached fleet view active</span>
    </div>
  );
}
