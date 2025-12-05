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
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span className="font-semibold text-slate-700">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <span>{percentage}% complete</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400"
        />
      </div>
    </div>
  );
}
