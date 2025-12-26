'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface TagChipProps {
  tag: string;
  size?: 'sm' | 'md';
  clickable?: boolean;
}

const palette: Record<string, string> = {
  pension: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  reliefs: 'bg-purple-50 text-purple-700 border-purple-100',
  beginners: 'bg-amber-50 text-amber-700 border-amber-100',
  calculations: 'bg-sky-50 text-sky-700 border-sky-100',
  'self-employed': 'bg-pink-50 text-pink-700 border-pink-100',
  default: 'bg-slate-50 text-slate-600 border-slate-200',
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
