'use client';

import { motion } from 'framer-motion';
import { QuizLevel } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { BadgeCheck, Lock } from 'lucide-react';

interface LevelCardProps {
  level: QuizLevel;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const LEVEL_INFO: Record<
  QuizLevel,
  {
    title: string;
    description: string;
    accent: string;
    emoji: string;
  }
> = {
  1: {
    title: 'Level 1 · Foundations',
    description: 'PAYE basics, allowances & thresholds',
    accent: 'from-emerald-400 via-emerald-500 to-emerald-600',
    emoji: '🌱',
  },
  2: {
    title: 'Level 2 · Calculations',
    description: 'Accurate maths for reliefs & NHF',
    accent: 'from-sky-400 via-blue-500 to-indigo-500',
    emoji: '🧮',
  },
  3: {
    title: 'Level 3 · Scenarios',
    description: 'Advanced real-life payroll edge cases',
    accent: 'from-purple-500 via-fuchsia-500 to-rose-500',
    emoji: '🚀',
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
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
      onClick={isUnlocked ? onSelect : undefined}
      disabled={!isUnlocked}
      className={cn(
        'relative w-full rounded-3xl border px-6 py-6 text-left transition-all',
        isUnlocked
          ? 'border-slate-100 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]'
          : 'border-dashed border-slate-200 bg-white/60 opacity-60'
      )}
    >
      <div
        className={cn(
          'absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r',
          info.accent
        )}
      />
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl text-2xl text-white shadow-lg',
            'bg-gradient-to-br',
            info.accent
          )}
        >
          {info.emoji}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {info.title}
          </h3>
          <p className="text-sm text-slate-500">{info.description}</p>
          {isUnlocked ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {isSelected ? 'Selected' : 'Tap to focus on this level'}
            </p>
          ) : (
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              Unlock by boosting your average
            </p>
          )}
        </div>
        {isSelected && isUnlocked && (
          <BadgeCheck className="h-5 w-5 text-emerald-500" />
        )}
        {!isUnlocked && <Lock className="h-5 w-5 text-slate-400" />}
      </div>
    </motion.button>
  );
}
