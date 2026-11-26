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
  const boxClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg p-1'
      : size === 'lg'
        ? 'w-11 h-11 rounded-xl p-1.5'
        : 'w-9 h-9 rounded-xl p-1';

  return (
    <div className="inline-flex items-center gap-2.5 min-w-0">
      <div
        className={`${boxClass} bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] shadow-2xs flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <img
          src="/assets/aistudio/lllll_1800fdd7.PNG"
          alt={`${brandName} Logo`}
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className="min-w-0 leading-tight">
          <span
            className={`block font-display font-bold tracking-tight truncate ${
              size === 'lg' ? 'text-lg' : 'text-[15px]'
            } ${darkText ? 'text-[#111827] dark:text-[#F8FAFC]' : 'text-white'}`}
          >
            {brandName}
          </span>
          {subtitle && (
            <span
              className={`block text-[10px] font-medium truncate ${
                darkText ? 'text-[#6B7280] dark:text-[#94A3B8]' : 'text-[#9CA3AF]'
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
