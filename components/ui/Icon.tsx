import { cn } from '@/lib/utils/cn';

type IconProps = {
  /** Material Symbols Outlined ligature name, e.g. "calculate", "forum" */
  name: string;
  className?: string;
  /** Fill 0 (outlined) or 1 (filled) */
  filled?: boolean;
  style?: React.CSSProperties;
};

/** Material Symbols Outlined icon, matching the Stitch design language. */
export function Icon({ name, className, filled = false, style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-outlined', className)}
      style={{
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
        ...style,
      }}
    >
      {name}
    </span>
  );
}
