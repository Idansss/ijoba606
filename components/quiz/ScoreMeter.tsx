'use client';

import { motion } from 'framer-motion';

interface ScoreMeterProps {
  score: number;
  maxScore: number;
}

export function ScoreMeter({ score, maxScore }: ScoreMeterProps) {
  const percentage = Math.min(100, Math.round((score / maxScore) * 100));

  const message =
    percentage >= 90
      ? 'Elite! You just schooled PAYE.'
      : percentage >= 80
      ? 'Fire! Almost perfect.'
      : percentage >= 60
      ? 'Solid work. A few tweaks left.'
      : percentage >= 40
      ? 'Momentum is building, keep going.'
      : 'No pressure — review and try again.';

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative mx-auto h-48 w-48"
      >
        <svg viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="16"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 80}
            strokeDashoffset={2 * Math.PI * 80 * (1 - percentage / 100)}
            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - percentage / 100) }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            transform="rotate(-90 100 100)"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-5xl font-bold text-slate-900">{score}</p>
          <p className="text-sm text-slate-500">/ {maxScore}</p>
        </div>
      </motion.div>
      <p className="mt-4 text-base font-semibold text-slate-700 md:text-lg">
        {message}
      </p>
      <p className="text-sm text-slate-500">
        {percentage}% accuracy this round
      </p>
    </div>
  );
}
