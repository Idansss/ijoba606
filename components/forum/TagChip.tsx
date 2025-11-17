'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface TagChipProps {
  tag: string;
  size?: 'sm' | 'md';
  clickable?: boolean;
}

const TAG_COLORS: Record<string, string> = {
  pension: 'bg-blue-100 text-blue-700 border-blue-300',
  reliefs: 'bg-green-100 text-green-700 border-green-300',
  beginners: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  calculations: 'bg-purple-100 text-purple-700 border-purple-300',
  'tax-codes': 'bg-orange-100 text-orange-700 border-orange-300',
  'self-employed': 'bg-pink-100 text-pink-700 border-pink-300',
  default: 'bg-gray-100 text-gray-700 border-gray-300',
};

export function TagChip({ tag, size = 'md', clickable = true }: TagChipProps) {
  const colorClass = TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  const className = cn(
    'inline-block rounded-full font-semibold border transition-all',
    colorClass,
    sizeClass,
    clickable && 'hover:scale-105 cursor-pointer'
  );

  if (clickable) {
    return (
      <Link href={`/forum/tag/${encodeURIComponent(tag)}`} className={className}>
        {tag}
      </Link>
    );
  }

  return <span className={className}>{tag}</span>;
}

