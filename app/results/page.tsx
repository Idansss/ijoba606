'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
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

  const handleSubmitResults = useCallback(async () => {
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
          message: `New badge${response.newBadges.length > 1 ? 's' : ''} unlocked!`,
        });
      }
    } catch (error) {
      console.error('Error submitting round:', error);
      addToast({
        type: 'error',
        message: 'Failed to submit results. Try again.',
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    submitted,
    firebaseUser,
    questions,
    answers,
    currentLevel,
    addToast,
  ]);

  useEffect(() => {
    if (questions.length === 0 || answers.length === 0) {
      router.push('/play');
      return;
    }
    handleSubmitResults();
  }, [questions.length, answers.length, router, handleSubmitResults]);

  const handlePlayAgain = () => {
    resetRound();
    router.push('/play');
  };

  if (questions.length === 0 || !firebaseUser) {
    return null;
  }

  const { correctCount, totalScore } = calculateScore(answers);
  const maxScore = 30;

  const shareData = {
    title: 'ijoba 606 Quiz Results',
    text: `I just scored ${totalScore}/30 on ijoba 606. Think you can top it?`,
    url: typeof window !== 'undefined' ? window.location.origin : '',
  };

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.15)]">
          <h1 className="text-center text-4xl font-semibold text-slate-900">
            Round complete
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Level {currentLevel} · 3-question sprint
          </p>
          {submitting && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Saving your progress...
            </p>
          )}

          <div className="mt-8">
            <ScoreMeter score={totalScore} maxScore={maxScore} />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-semibold text-emerald-700">
                {correctCount}
              </p>
              <p className="text-sm text-emerald-800">Correct answers</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-center">
              <p className="text-3xl font-semibold text-sky-700">
                {answers.length}
              </p>
              <p className="text-sm text-sky-800">Attempted</p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-center">
              <p className="text-3xl font-semibold text-purple-700">
                {totalScore}
              </p>
              <p className="text-sm text-purple-800">Total points</p>
            </div>
          </div>

          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50 via-blue-50 to-white p-6"
            >
              <p className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-purple-500">
                New badges unlocked
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {newBadges.map((badgeId) => {
                  const badge = BADGES[badgeId as keyof typeof BADGES];
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow"
                    >
                      <span className="text-2xl">{badge.emoji}</span>
                      {badge.name}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {submitted && streakCount > 0 && (
            <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center text-orange-900">
              🔥 Streak updated: {streakCount} day
              {streakCount !== 1 ? 's' : ''} strong.
            </div>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <button
              onClick={handlePlayAgain}
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-lg font-semibold text-white shadow-xl"
            >
              Play another round
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-full border border-slate-200 px-6 py-4 text-lg font-semibold text-slate-700 hover:border-purple-200 hover:text-slate-900"
            >
              Share my score
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Need a breather? Jump to the{' '}
            <Link href="/forum" className="text-purple-600 underline">
              community forum
            </Link>{' '}
            for explanations.
          </p>
        </div>
      </motion.div>

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={shareData}
      />
    </div>
  );
}
