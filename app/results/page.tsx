'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuizStore } from '@/lib/store/quiz';
import { useAuthStore } from '@/lib/store/auth';
import { ScoreMeter } from '@/components/quiz/ScoreMeter';
import { ShareSheet } from '@/components/quiz/ShareSheet';
import { calculateScore } from '@/lib/utils/scoring';
import { submitRound } from '@/lib/firebase/functions';
import { useToastStore } from '@/lib/store/toast';
import { BADGES } from '@/lib/utils/badges';

export default function ResultsPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const { questions, answers, currentLevel, resetRound } = useQuizStore();
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    // Redirect if no data
    if (questions.length === 0 || answers.length === 0) {
      router.push('/play');
      return;
    }

    // Auto-submit results
    handleSubmitResults();
  }, []);

  const handleSubmitResults = async () => {
    if (submitting || submitted || !firebaseUser) return;

    setSubmitting(true);
    try {
      const questionIds = questions.map((q) => q.id) as [string, string, string];
      const response = await submitRound({
        level: currentLevel,
        questionIds,
        answers,
      });

      setNewBadges(response.newBadges);
      setStreakCount(response.streakCount);
      setSubmitted(true);

      if (response.newBadges.length > 0) {
        addToast({
          type: 'success',
          message: `New badge${response.newBadges.length > 1 ? 's' : ''} unlocked! 🎉`,
        });
      }
    } catch (error) {
      console.error('Error submitting round:', error);
      addToast({
        type: 'error',
        message: 'Failed to submit results. Try again.',
      });
      setSubmitted(true); // Prevent infinite retry
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAgain = () => {
    resetRound();
    router.push('/play');
  };

  if (questions.length === 0 || !firebaseUser) {
    return null;
  }

  const { correctCount, totalScore } = calculateScore(answers);
  const maxScore = 30; // 3 questions × 10 points

  const shareData = {
    title: 'IJBoba 606 Quiz Results',
    text: `I just scored ${totalScore}/30 on IJBoba 606. Fit top am?`,
    url: typeof window !== 'undefined' ? window.location.origin : '',
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Results Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200 mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Round Complete!
          </h1>
          {submitting && (
            <p className="text-center text-gray-600 mb-8">
              Submitting results...
            </p>
          )}

          {/* Score Meter */}
          <div className="mb-8">
            <ScoreMeter score={totalScore} maxScore={maxScore} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">
                {correctCount}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {answers.length}
              </div>
              <div className="text-sm text-gray-600">Attempted</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">
                {totalScore}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>

          {/* New Badges */}
          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200"
            >
              <h3 className="text-xl font-bold text-center mb-4 text-purple-900">
                🎉 New Badge{newBadges.length > 1 ? 's' : ''} Unlocked!
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {newBadges.map((badgeId) => {
                  const badge = BADGES[badgeId as keyof typeof BADGES];
                  return (
                    <div
                      key={badgeId}
                      className="bg-white rounded-full px-4 py-2 border-2 border-purple-300 flex items-center gap-2"
                    >
                      <span className="text-2xl">{badge.emoji}</span>
                      <span className="text-sm font-semibold">
                        {badge.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Streak Update */}
          {submitted && streakCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl text-center"
            >
              <p className="text-orange-900">
                🔥 Streak: <span className="font-bold">{streakCount}</span> day
                {streakCount !== 1 ? 's' : ''}!
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handlePlayAgain}
              className="py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Play Again
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all"
            >
              Share Result
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/leaderboard"
              className="block text-center py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              View Leaderboard
            </Link>
            <Link
              href="/profile"
              className="block text-center py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Question Review
          </h2>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = answers.find((a) => a.questionId === question.id);
              return (
                <div
                  key={question.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        answer?.isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p className="flex-1 font-medium text-gray-800">
                      {question.prompt}
                    </p>
                    <div className="text-2xl">
                      {answer?.isCorrect ? '✓' : '✗'}
                    </div>
                  </div>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 ml-11">
                      💡 {question.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Share Sheet */}
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={shareData}
      />
    </div>
  );
}


