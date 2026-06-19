import Image from 'next/image';
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
      <Image
        src="/ijoba606-logo-v2-icon.png"
        alt=""
        aria-hidden="true"
        width={512}
        height={512}
        priority
        className={cn('h-12 w-12 shrink-0 object-contain drop-shadow-sm', markClassName)}
      />

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
