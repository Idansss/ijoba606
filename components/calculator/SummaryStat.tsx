'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface SummaryStatProps {
  label: string;
  value: string;
  icon?: string;
  color?: 'purple' | 'blue' | 'green' | 'orange';
  delay?: number;
}

export function SummaryStat({
  label,
  value,
  icon,
  color = 'purple',
  delay = 0,
}: SummaryStatProps) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200"
    >
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div
        className={cn(
          'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
          colorClasses[color]
        )}
      >
        {value}
      </div>
    </motion.div>
  );
}


