interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  darkText?: boolean;
  subtitle?: string;
}

export function BrandLogo({
  size = 'md',
  showText = true,
  darkText = true,
  subtitle,
}: BrandLogoProps) {
  const boxClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg p-1'
      : size === 'lg'
        ? 'w-11 h-11 rounded-xl p-1.5'
        : 'w-9 h-9 rounded-xl p-1';

  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className={`${boxClass} bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <img
          src="/assets/aistudio/lllll_1800fdd7.PNG"
          alt="Nexora AI Logo"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className="min-w-0 leading-tight">
          <span
            className={`block font-display font-bold tracking-tight ${
              size === 'lg' ? 'text-lg' : 'text-[15px]'
            } ${darkText ? 'text-[#111827]' : 'text-white'}`}
          >
            Nexora AI
          </span>
          {subtitle && (
            <span
              className={`block text-[10px] font-medium ${
                darkText ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
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
