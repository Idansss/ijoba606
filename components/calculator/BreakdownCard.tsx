'use client';

import { motion } from 'framer-motion';
import { CalcLineItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/calculator';

interface BreakdownCardProps {
  lineItems: CalcLineItem[];
}

export function BreakdownCard({ lineItems }: BreakdownCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-inner">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Breakdown
      </p>
      <div className="mt-4 space-y-3">
        {lineItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-slate-600">{item.label}</span>
            <span
              className={`font-semibold ${
                item.isDeduction ? 'text-rose-500' : 'text-slate-900'
              }`}
            >
              {item.isDeduction ? '− ' : ''}
              {formatCurrency(item.amount)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
