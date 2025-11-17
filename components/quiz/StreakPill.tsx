'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface StreakPillProps {
  streakCount: number;
  bestStreak: number;
}

export function StreakPill({ streakCount, bestStreak }: StreakPillProps) {
  const getStreakColor = (count: number) => {
    if (count >= 7) return 'from-orange-500 to-red-500';
    if (count >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakEmoji = (count: number) => {
    if (count >= 7) return '⚡';
    if (count >= 3) return '🔥';
    return '📅';
  };

  return (
    <div className="flex items-center gap-4 justify-center">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={cn(
          'px-6 py-3 rounded-full bg-gradient-to-r text-white font-bold shadow-lg',
          getStreakColor(streakCount)
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStreakEmoji(streakCount)}</span>
          <div>
            <div className="text-2xl">{streakCount}</div>
            <div className="text-xs opacity-90">Day Streak</div>
          </div>
        </div>
      </motion.div>

      {bestStreak > streakCount && (
        <div className="text-center">
          <div className="text-sm text-gray-500">Best Streak</div>
          <div className="text-xl font-bold text-gray-700">{bestStreak}</div>
        </div>
      )}
    </div>
  );
}

