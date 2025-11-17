'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ScoreMeterProps {
  score: number;
  maxScore: number;
}

export function ScoreMeter({ score, maxScore }: ScoreMeterProps) {
  const percentage = (score / maxScore) * 100;

  const getColor = (pct: number) => {
    if (pct >= 80) return 'from-green-500 to-green-600';
    if (pct >= 60) return 'from-blue-500 to-blue-600';
    if (pct >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getMessage = (pct: number) => {
    if (pct >= 90) return 'You dey burst my brain! 👏';
    if (pct >= 80) return 'Correct! Well done! 🎉';
    if (pct >= 60) return 'Not bad at all! 💪';
    if (pct >= 40) return 'Keep pushing! 📚';
    return 'No wahala — try again! 💙';
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative inline-block"
      >
        <svg className="w-48 h-48" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 80}`}
            strokeDashoffset={2 * Math.PI * 80 * (1 - percentage / 100)}
            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 80 * (1 - percentage / 100),
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform="rotate(-90 100 100)"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-gray-800"
          >
            {score}
          </motion.div>
          <div className="text-sm text-gray-600">/ {maxScore}</div>
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={cn(
          'mt-4 text-xl font-semibold bg-gradient-to-r bg-clip-text text-transparent',
          getColor(percentage)
        )}
      >
        {getMessage(percentage)}
      </motion.p>
    </div>
  );
}

