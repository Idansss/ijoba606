'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
}: QuizProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <span className="text-xs text-gray-500">
          {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}% complete
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500'
          )}
        />
      </div>
    </div>
  );
}

