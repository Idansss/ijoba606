import { cn } from '@/lib/utils/cn';

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  taglineClassName?: string;
  showTagline?: boolean;
};

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  taglineClassName,
  showTagline = true,
}: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className={cn('h-11 w-11 shrink-0 drop-shadow-sm', markClassName)}
      >
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="18"
          fill="#083F2D"
        />
        <path
          d="M32 10.5 48.5 17v13.2c0 11.6-6.6 19.6-16.5 23.3-9.9-3.7-16.5-11.7-16.5-23.3V17L32 10.5Z"
          fill="#0B663F"
          stroke="#D5B24A"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M22.5 24.5h19M22.5 31.5h19M22.5 43h19"
          stroke="#F3D879"
          strokeWidth="2.1"
          strokeLinecap="round"
          opacity="0.95"
        />
        <text
          x="32"
          y="39.2"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="var(--font-geist-sans), Arial, sans-serif"
          fontSize="14.8"
          fontWeight="850"
        >
          606
        </text>
        <path
          d="M46 13.5 52 9.8M50 19.5l6.5-1.7M18 50.5l-6 3.7"
          stroke="#D5B24A"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      <div className="min-w-0">
        <p
          className={cn(
            'text-lg font-black uppercase leading-none text-[var(--foreground)]',
            textClassName
          )}
        >
          ijoba 606
        </p>
        {showTagline && (
          <p
            className={cn(
              'mt-1 text-[0.68rem] font-semibold uppercase leading-none tracking-[0.18em] text-muted-foreground',
              taglineClassName
            )}
          >
            PAYE learning and tax tools
          </p>
        )}
      </div>
    </div>
  );
}
