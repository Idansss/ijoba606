'use client';

import { motion } from 'framer-motion';
import { CalcLineItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/calculator';

interface BreakdownCardProps {
  lineItems: CalcLineItem[];
}

export function BreakdownCard({ lineItems }: BreakdownCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Tax Breakdown</h3>
      <div className="space-y-3">
        {lineItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex justify-between items-center py-2 ${
              item.isDeduction
                ? 'text-red-600'
                : index === lineItems.length - 1
                ? 'font-bold text-gray-900 border-t-2 border-gray-300 pt-3'
                : 'text-gray-700'
            }`}
          >
            <span className="text-sm">{item.label}</span>
            <span className={item.isDeduction ? 'text-sm' : 'text-sm font-semibold'}>
              {item.isDeduction && '- '}
              {formatCurrency(item.amount)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


