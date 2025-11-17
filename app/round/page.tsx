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
  const { questions, currentQuestionIndex, setCurrentQuestionIndex, submitAnswer, answers } = useQuizStore();
  const { addToast } = useToastStore();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Redirect if no questions
    if (questions.length === 0) {
      router.push('/play');
    }
  }, [questions, router]);

  useEffect(() => {
    // Reset state when question changes
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
      // Toggle selection for multi-select
      setSelectedOptions((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      // Single select
      setSelectedOptions([index]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      addToast({ type: 'warning', message: 'Please select an answer!' });
      return;
    }

    // Check if correct
    const isCorrect = arraysEqual(
      selectedOptions.sort(),
      currentQuestion.correct.sort()
    );

    // Submit answer
    submitAnswer(currentQuestion.id, selectedOptions, isCorrect);

    // Reveal answer
    setIsRevealed(true);

    // Show feedback
    if (isCorrect) {
      addToast({
        type: 'success',
        message: 'Correct! +10 points. You dey burst my brain 👏',
      });
    } else {
      addToast({
        type: 'info',
        message: 'No wahala — attempt don add +2. Push again!',
      });
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Navigate to results
      router.push('/results');
    } else {
      // Next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Progress */}
        <div className="mb-8">
          <QuizProgress
            currentQuestion={currentQuestionIndex}
            totalQuestions={questions.length}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200 mb-8"
          >
            {/* Question Type Badge */}
            {isMultiSelect && (
              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-4">
                Select All That Apply
              </div>
            )}

            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {currentQuestion.prompt}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-6">
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

            {/* Explanation */}
            {isRevealed && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">
                      Explanation
                    </h3>
                    <p className="text-blue-800 text-sm">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <div className="mt-8">
              {!isRevealed ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOptions.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
                >
                  {isLastQuestion ? 'View Results' : 'Next Question'}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Helper Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {isMultiSelect
              ? '🎯 Multiple answers may be correct'
              : '🎯 Select one answer'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}


