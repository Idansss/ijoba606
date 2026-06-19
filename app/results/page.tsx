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
import { Icon } from '@/components/ui/Icon';

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
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_20px_40px_rgba(0,50,0,0.08)] backdrop-blur-sm sm:p-10">
          <p className="text-center font-label-sm text-sm font-semibold uppercase tracking-widest text-forest-green">
            Level {currentLevel} · 3-question sprint
          </p>
          <h1 className="mt-2 text-center font-display-lg-mobile text-display-lg-mobile text-deep-green">
            Round complete
          </h1>
          {submitting && (
            <p className="mt-4 text-center text-sm text-on-surface-variant">
              Saving your progress...
            </p>
          )}

          <div className="mt-8">
            <ScoreMeter score={totalScore} maxScore={maxScore} />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-input border border-secondary-container/60 bg-secondary-container/30 p-4 text-center">
              <p className="font-figure-xl text-figure-xl text-secondary">
                {correctCount}
              </p>
              <p className="text-sm text-on-secondary-fixed">Correct answers</p>
            </div>
            <div className="rounded-input border border-forest-green/20 bg-forest-green/10 p-4 text-center">
              <p className="font-figure-xl text-figure-xl text-forest-green">
                {answers.length}
              </p>
              <p className="text-sm text-on-surface-variant">Attempted</p>
            </div>
            <div className="rounded-input border border-primary-fixed/40 bg-primary-fixed/20 p-4 text-center">
              <p className="font-figure-xl text-figure-xl text-deep-green">
                {totalScore}
              </p>
              <p className="text-sm text-on-secondary-fixed">Total points</p>
            </div>
          </div>

          {/* Per-question recap */}
          <div className="mt-10">
            <h2 className="mb-4 font-headline-md text-headline-md text-deep-green">Question recap</h2>
            <div className="space-y-4">
              {questions.map((question, idx) => {
                const answer = answers.find((a) => a.questionId === question.id);
                const isCorrect = answer?.isCorrect ?? false;
                return (
                  <div
                    key={question.id}
                    className={`rounded-input border p-4 ${
                      isCorrect
                        ? 'border-secondary-container/60 bg-secondary-container/20'
                        : 'border-error/30 bg-error-container/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        name={isCorrect ? 'check_circle' : 'cancel'}
                        className={`mt-0.5 shrink-0 text-[22px] ${isCorrect ? 'text-secondary' : 'text-error'}`}
                        filled
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-on-surface">
                          <span className="text-on-surface-variant">Q{idx + 1}. </span>
                          {question.prompt}
                        </p>
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optIdx) => {
                            const isAnswerCorrect = question.correct.includes(optIdx);
                            const wasSelected = answer?.selectedOptions.includes(optIdx);
                            return (
                              <p
                                key={optIdx}
                                className={`flex items-center gap-2 text-sm ${
                                  isAnswerCorrect
                                    ? 'font-semibold text-secondary'
                                    : wasSelected
                                    ? 'text-error line-through'
                                    : 'text-on-surface-variant'
                                }`}
                              >
                                {isAnswerCorrect && <Icon name="check" className="text-[16px]" />}
                                {!isAnswerCorrect && wasSelected && <Icon name="close" className="text-[16px]" />}
                                {option}
                              </p>
                            );
                          })}
                        </div>
                        {question.explanation && (
                          <p className="mt-2 rounded-input bg-surface-container-low p-3 text-sm text-on-surface-variant">
                            <span className="font-semibold text-deep-green">Why: </span>
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-bento border border-primary-fixed/40 bg-gradient-to-r from-primary-fixed/20 via-secondary-container/20 to-surface-container-lowest p-6"
            >
              <p className="text-center font-label-sm text-sm font-semibold uppercase tracking-widest text-forest-green">
                New badges unlocked
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {newBadges.map((badgeId) => {
                  const badge = BADGES[badgeId as keyof typeof BADGES];
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="flex items-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface shadow-sm"
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
            <div className="mt-8 flex items-center justify-center gap-2 rounded-input border border-tertiary-container/40 bg-tertiary-container/10 p-4 text-center text-on-tertiary-container">
              <Icon name="local_fire_department" className="text-[22px] text-tertiary" filled />
              Streak updated: {streakCount} day
              {streakCount !== 1 ? 's' : ''} strong.
            </div>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <button
              onClick={handlePlayAgain}
              className="rounded-full bg-gradient-to-r from-deep-green to-royal-gold px-6 py-4 text-lg font-semibold text-on-primary shadow-md transition hover:opacity-90"
            >
              Play another round
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-full border border-outline-variant px-6 py-4 text-lg font-semibold text-on-surface-variant transition hover:border-forest-green hover:text-deep-green"
            >
              Share my score
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/leaderboard" className="inline-flex items-center gap-1 font-semibold text-deep-green hover:text-forest-green">
              <Icon name="leaderboard" className="text-[18px]" />
              View leaderboard
            </Link>
            <span className="text-outline">·</span>
            <Link href="/forum" className="inline-flex items-center gap-1 font-semibold text-deep-green hover:text-forest-green">
              <Icon name="forum" className="text-[18px]" />
              Discuss in the forum
            </Link>
          </div>
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
