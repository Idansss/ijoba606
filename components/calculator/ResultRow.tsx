'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  delay?: number;
}

export function ResultRow({ label, value, highlight, delay = 0 }: ResultRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'flex justify-between items-center py-4 px-6 rounded-xl',
        highlight
          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200'
          : 'bg-gray-50'
      )}
    >
      <span
        className={cn(
          'font-medium',
          highlight ? 'text-purple-900' : 'text-gray-700'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-bold text-lg',
          highlight ? 'text-purple-600' : 'text-gray-900'
        )}
      >
        {value}
      </span>
    </motion.div>
  );
}


