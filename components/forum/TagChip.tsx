'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface TagChipProps {
  tag: string;
  size?: 'sm' | 'md';
  clickable?: boolean;
}

const palette: Record<string, string> = {
  pension: 'bg-secondary-container/40 text-secondary border-secondary-container',
  reliefs: 'bg-primary-fixed/30 text-on-secondary-fixed border-primary-fixed/40',
  beginners: 'bg-tertiary-container/20 text-tertiary border-tertiary-container/30',
  calculations: 'bg-forest-green/10 text-forest-green border-forest-green/20',
  'self-employed': 'bg-royal-gold/15 text-tertiary border-royal-gold/30',
  default: 'bg-surface-container-low text-on-surface-variant border-surface-variant',
};

export function TagChip({
  tag,
  size = 'md',
  clickable = true,
}: TagChipProps) {
  const classes = cn(
    'inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.3em]',
    palette[tag.toLowerCase()] || palette.default,
    size === 'sm' ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-[11px]',
    clickable && 'transition hover:translate-y-[1px]'
  );

  const content = <span>{tag}</span>;

  if (!clickable) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={`/forum/tag/${encodeURIComponent(tag)}`} className={classes}>
      {content}
    </Link>
  );
}
