'use client';

import { motion } from 'framer-motion';
import { QuizLevel } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface LevelCardProps {
  level: QuizLevel;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const LEVEL_INFO: Record<
  QuizLevel,
  { name: string; description: string; color: string; emoji: string }
> = {
  1: {
    name: 'Level 1: Basics',
    description: 'Understanding PAYE fundamentals',
    color: 'from-green-400 to-green-600',
    emoji: '🌱',
  },
  2: {
    name: 'Level 2: Calculations',
    description: 'Computing tax and reliefs',
    color: 'from-blue-400 to-blue-600',
    emoji: '🧮',
  },
  3: {
    name: 'Level 3: Scenarios',
    description: 'Real-world tax situations',
    color: 'from-purple-400 to-purple-600',
    emoji: '👑',
  },
};

export function LevelCard({
  level,
  isUnlocked,
  isSelected,
  onSelect,
}: LevelCardProps) {
  const info = LEVEL_INFO[level];

  return (
    <motion.button
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      onClick={isUnlocked ? onSelect : undefined}
      disabled={!isUnlocked}
      className={cn(
        'relative w-full p-6 rounded-2xl border-2 transition-all',
        {
          'bg-white/80 backdrop-blur-sm border-gray-300 opacity-50 cursor-not-allowed':
            !isUnlocked,
          'bg-white/80 backdrop-blur-sm border-gray-300 hover:border-gray-400 hover:shadow-lg':
            isUnlocked && !isSelected,
          'bg-gradient-to-br shadow-xl border-transparent':
            isUnlocked && isSelected,
        }
      )}
    >
      {!isUnlocked && (
        <div className="absolute top-4 right-4">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">{info.emoji}</span>
        <div className="text-left flex-1">
          <h3
            className={cn('text-xl font-bold', {
              'text-gray-800': !isSelected || !isUnlocked,
              'text-white': isSelected && isUnlocked,
            })}
          >
            {info.name}
          </h3>
          <p
            className={cn('text-sm', {
              'text-gray-600': !isSelected || !isUnlocked,
              'text-white/90': isSelected && isUnlocked,
            })}
          >
            {info.description}
          </p>
        </div>
      </div>

      {isSelected && isUnlocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}

      {!isUnlocked && (
        <p className="text-xs text-gray-500 mt-2">
          {level === 2
            ? 'Unlock: Avg 18+ in last 2 rounds'
            : 'Unlock: Avg 22+ in last 3 rounds'}
        </p>
      )}
    </motion.button>
  );
}

