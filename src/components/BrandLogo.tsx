interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  darkText?: boolean;
  brandName?: string;
  subtitle?: string;
}

export function BrandLogo({
  size = 'md',
  showText = true,
  darkText = true,
  brandName = 'Nexora AI',
  subtitle,
}: BrandLogoProps) {
  const emblemBoxClass =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl p-1.5'
      : size === 'lg'
        ? 'w-12 h-12 rounded-2xl p-2'
        : 'w-10 h-10 rounded-xl p-1.5';

  return (
    <div className="inline-flex items-center gap-2.5 min-w-0 select-none">
      <div
        className={`${emblemBoxClass} bg-white ring-1 ring-[#E2E8F0] dark:ring-white/15 shadow-[0_1px_4px_rgba(15,23,42,0.08)] flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <img
          src="/assets/aistudio/lllll_1800fdd7.PNG"
          alt={`${brandName} Emblem`}
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className="min-w-0 flex flex-col justify-center">
          <span
            className={`block font-display font-bold tracking-[-0.025em] leading-none truncate ${
              size === 'lg' ? 'text-[19px]' : size === 'md' ? 'text-[16px]' : 'text-[15px]'
            } ${darkText ? 'text-[#0F172A] dark:text-[#F8FAFC]' : 'text-white'}`}
          >
            {brandName}
          </span>
          {subtitle && (
            <span
              className={`block mt-1 text-[9.5px] font-mono uppercase tracking-[0.1em] leading-none truncate ${
                darkText ? 'text-[#64748B] dark:text-[#94A3B8]' : 'text-[#94A3B8]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
