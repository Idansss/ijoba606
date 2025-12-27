'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Check, X } from 'lucide-react';

interface OptionCardProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  onSelect: () => void;
  disabled: boolean;
}

const labels = ['A', 'B', 'C', 'D', 'E'];

export function OptionCard({
  option,
  index,
  isSelected,
  isCorrect,
  isRevealed,
  onSelect,
  disabled,
}: OptionCardProps) {
  const isWrongSelection = isRevealed && isSelected && !isCorrect;

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={!disabled ? onSelect : undefined}
      disabled={disabled}
      className={cn(
        'w-full rounded-2xl border px-4 py-4 text-left transition-all',
        'bg-white/85',
        isSelected && !isRevealed && 'border-purple-400 shadow-lg shadow-purple-200',
        !isSelected && !isRevealed && 'border-slate-100 hover:border-purple-200',
        isRevealed && isCorrect && 'border-emerald-200 bg-emerald-50',
        isWrongSelection && 'border-rose-200 bg-rose-50',
        disabled && !isSelected && !isCorrect && 'opacity-70'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold',
            'border',
            isSelected && !isRevealed && 'border-purple-200 bg-purple-50 text-purple-700',
            !isSelected && !isRevealed && 'border-slate-200 text-slate-500 bg-white',
            isRevealed && isCorrect && 'border-emerald-200 bg-emerald-100 text-emerald-700',
            isWrongSelection && 'border-rose-200 bg-rose-100 text-rose-700'
          )}
        >
          {labels[index] ?? '?'}
        </div>
        <div className="flex-1 text-slate-800">{option}</div>
        {isRevealed && (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
            {isCorrect ? (
              <Check className="h-5 w-5 text-emerald-500" />
            ) : isWrongSelection ? (
              <X className="h-5 w-5 text-rose-500" />
            ) : null}
          </div>
        )}
      </div>
    </motion.button>
  );
}
