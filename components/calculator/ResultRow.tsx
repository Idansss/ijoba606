'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  delay?: number;
}

export function ResultRow({
  label,
  value,
  highlight,
  delay = 0,
}: ResultRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
        highlight
          ? 'border-purple-200 bg-purple-50 text-purple-800'
          : 'border-slate-100 bg-white text-slate-700'
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-base font-bold text-slate-900">{value}</span>
    </motion.div>
  );
}
