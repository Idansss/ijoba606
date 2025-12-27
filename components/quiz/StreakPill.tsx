'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StreakPillProps {
  streakCount: number;
  bestStreak: number;
}

export function StreakPill({ streakCount, bestStreak }: StreakPillProps) {
  const getGradient = () => {
    if (streakCount >= 7) return 'from-orange-500 via-rose-500 to-pink-500';
    if (streakCount >= 3) return 'from-amber-400 via-orange-400 to-pink-400';
    return 'from-slate-400 via-slate-500 to-slate-600';
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-center md:text-left">
      <motion.div
        initial={{ opacity: 0.8, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'flex items-center gap-4 rounded-full px-6 py-4 text-white shadow-xl shadow-orange-200/40',
          'bg-gradient-to-r',
          getGradient()
        )}
      >
        <div className="rounded-2xl bg-white/20 p-3">
          <Flame className="h-6 w-6" />
        </div>
        <div className="text-left">
          <p className="text-xs uppercase tracking-[0.4em] opacity-70">
            Current streak
          </p>
          <p className="text-3xl font-semibold">{streakCount} days</p>
        </div>
      </motion.div>

      {bestStreak > streakCount && (
        <div className="rounded-2xl border border-slate-100 bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Best streak
          </p>
          <p className="text-xl font-semibold text-slate-800">{bestStreak}</p>
        </div>
      )}
    </div>
  );
}
