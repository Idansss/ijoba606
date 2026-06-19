'use client';

import { motion } from 'framer-motion';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
}: QuizProgressProps) {
  const percentage = Math.round(
    ((currentQuestion + 1) / totalQuestions) * 100
  );

  return (
    <div className="rounded-2xl border border-[#efefe2] bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm text-[#707a6a]">
        <span className="font-semibold text-[#404a3b]">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <span>{percentage}% complete</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#efefe2]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-[#006400] via-[#109a48] to-emerald-400"
        />
      </div>
    </div>
  );
}
