'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface OptionCardProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  onSelect: () => void;
  disabled: boolean;
}

export function OptionCard({
  option,
  index,
  isSelected,
  isCorrect,
  isRevealed,
  onSelect,
  disabled,
}: OptionCardProps) {
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onSelect : undefined}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-xl border-2 transition-all text-left',
        {
          'bg-white/80 backdrop-blur-sm border-gray-300 hover:border-purple-400 hover:shadow-md':
            !isSelected && !isRevealed,
          'bg-purple-100 border-purple-500': isSelected && !isRevealed,
          'bg-green-100 border-green-500': isRevealed && isCorrect,
          'bg-red-100 border-red-500': isRevealed && isSelected && !isCorrect,
          'opacity-50': disabled && !isSelected && !isCorrect,
        }
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
            {
              'bg-gray-200 text-gray-700': !isSelected && !isRevealed,
              'bg-purple-500 text-white': isSelected && !isRevealed,
              'bg-green-500 text-white': isRevealed && isCorrect,
              'bg-red-500 text-white': isRevealed && isSelected && !isCorrect,
            }
          )}
        >
          {labels[index]}
        </div>
        <div className="flex-1 pt-1">
          <p className="text-gray-800">{option}</p>
        </div>
        {isRevealed && isCorrect && (
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        {isRevealed && isSelected && !isCorrect && (
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  );
}

