'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/lib/store/quiz';
import { useAuthStore } from '@/lib/store/auth';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { OptionCard } from '@/components/quiz/OptionCard';
import { arraysEqual } from '@/lib/utils/scoring';
import { useToastStore } from '@/lib/store/toast';

export default function RoundPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    submitAnswer,
  } = useQuizStore();
  const { addToast } = useToastStore();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (questions.length === 0) {
      router.push('/play');
    }
  }, [questions, router]);

  useEffect(() => {
    setSelectedOptions([]);
    setIsRevealed(false);
  }, [currentQuestionIndex]);

  if (questions.length === 0 || !firebaseUser) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isMultiSelect = currentQuestion.type === 'multi';
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleOptionSelect = (index: number) => {
    if (isRevealed) return;

    if (isMultiSelect) {
      setSelectedOptions((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setSelectedOptions([index]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      addToast({ type: 'warning', message: 'Please select an answer first.' });
      return;
    }

    const isCorrect = arraysEqual(
      [...selectedOptions].sort(),
      [...currentQuestion.correct].sort()
    );

    submitAnswer(currentQuestion.id, selectedOptions, isCorrect);
    setIsRevealed(true);

    if (isCorrect) {
      addToast({
        type: 'success',
        message: 'Correct! +10 points.',
      });
    } else {
      addToast({
        type: 'info',
        message: 'Attempt recorded. +2 points for trying.',
      });
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      router.push('/results');
      return;
    }
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        <QuizProgress
          currentQuestion={currentQuestionIndex}
          totalQuestions={questions.length}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="mt-8 rounded-bento border border-deep-green/10 bg-surface-container-lowest p-8 shadow-[0px_20px_40px_rgba(0,100,0,0.08)] md:p-12"
          >
            {isMultiSelect && (
              <span className="inline-flex items-center rounded-full border border-primary-fixed/50 bg-primary-fixed/20 px-3 py-1 font-label-sm text-xs font-semibold uppercase tracking-wider text-forest-green">
                Multi select
              </span>
            )}
            <h2 className="mt-4 text-2xl font-bold leading-tight text-ink-black md:text-3xl">
              {currentQuestion.prompt}
            </h2>
            <p className="mt-2 font-body-md text-sm text-on-surface-variant">
              {currentQuestion.topic}
            </p>

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option, index) => (
                <OptionCard
                  key={index}
                  option={option}
                  index={index}
                  isSelected={selectedOptions.includes(index)}
                  isCorrect={currentQuestion.correct.includes(index)}
                  isRevealed={isRevealed}
                  onSelect={() => handleOptionSelect(index)}
                  disabled={isRevealed}
                />
              ))}
            </div>

            {isRevealed && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-input border border-secondary-container bg-primary-fixed/15 p-4"
              >
                <p className="text-sm text-on-secondary-fixed">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}

            <div className="mt-8">
              {!isRevealed ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOptions.length === 0}
                  className="w-full rounded-full bg-deep-green px-6 py-4 font-label-sm text-base font-semibold text-on-primary shadow-md transition hover:bg-forest-green disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full rounded-full bg-forest-green px-6 py-4 font-label-sm text-base font-semibold text-on-primary shadow-md transition hover:bg-deep-green"
                >
                  {isLastQuestion ? 'View results' : 'Next question'}
                </button>
              )}
              <p className="mt-3 text-center text-xs text-on-surface-variant/70">
                {isMultiSelect
                  ? 'Multiple answers may be correct.'
                  : 'Only one answer is correct.'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
