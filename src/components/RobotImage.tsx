import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

interface RobotImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function RobotImage({ src, alt, className = '' }: RobotImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F1F5F9] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Bot className="w-8 h-8 text-[#475569] dark:text-[#94A3B8] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-center text-[#475569] dark:text-[#94A3B8] line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
