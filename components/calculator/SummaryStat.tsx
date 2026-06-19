'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';

interface SummaryStatProps {
  label: string;
  value: string;
  icon?: ReactNode;
  color?: 'purple' | 'blue' | 'green' | 'orange';
  delay?: number;
}

const colorClasses = {
  purple: 'from-[#0b7a3b] to-[#006400]',
  blue: 'from-[#109a48] to-[#006d33]',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-[#c59f00] to-[#c59f00]',
};

export function SummaryStat({
  label,
  value,
  icon,
  color = 'purple',
  delay = 0,
}: SummaryStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="rounded-3xl border border-[#efefe2] bg-white/95 p-5 shadow-sm"
    >
      <div className="flex items-center gap-3 text-sm text-[#707a6a]">
        {icon && (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#efefe2] text-lg">
            {icon}
          </span>
        )}
        {label}
      </div>
      <div
        className={cn(
          'mt-4 text-3xl font-semibold text-transparent',
          'bg-gradient-to-r bg-clip-text',
          colorClasses[color]
        )}
      >
        {value}
      </div>
    </motion.div>
  );
}
