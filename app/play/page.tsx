'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useQuizStore } from '@/lib/store/quiz';
import { LevelCard } from '@/components/quiz/LevelCard';
import { StreakPill } from '@/components/quiz/StreakPill';
import { BadgeStrip } from '@/components/quiz/BadgeStrip';
import { signInAnon } from '@/lib/firebase/auth';
import { useToastStore } from '@/lib/store/toast';
import { QuizLevel, Question } from '@/lib/types';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function PlayPage() {
  const router = useRouter();
  const { firebaseUser, profile } = useAuthStore();
  const { setCurrentLevel } = useQuizStore();
  const { addToast } = useToastStore();
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>(1);
  const [loading, setLoading] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    if (!firebaseUser || !db) return;
    const fetchLastScore = async () => {
      if (!db) return;
      const roundsRef = collection(db, 'rounds');
      const q = query(
        roundsRef,
        where('uid', '==', firebaseUser.uid),
        orderBy('finishedAt', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastRound = snapshot.docs[0].data();
        setLastScore(lastRound.totalScore);
      }
    };
    fetchLastScore();
  }, [firebaseUser]);

  const handleSignInAndPlay = async () => {
    try {
      await signInAnon();
      addToast({ type: 'success', message: "You're in! Let's learn." });
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      addToast({ type: 'error', message: 'Failed to sign in. Try again.' });
    }
  };

  const handleStartRound = async () => {
    if (!db) {
      addToast({
        type: 'error',
        message:
          'Quiz rounds are disabled in this local demo because Firebase is not configured yet.',
      });
      return;
    }
    if (!firebaseUser) {
      await handleSignInAndPlay();
      return;
    }

    setLoading(true);
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('level', '==', selectedLevel));
      const snapshot = await getDocs(q);

      if (snapshot.empty || snapshot.size < 3) {
        addToast({
          type: 'error',
          message: 'Not enough questions for this level. Contact an admin.',
        });
        setLoading(false);
        return;
      }

      const allQuestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, 3);

      setCurrentLevel(selectedLevel);
      useQuizStore.getState().setQuestions(selectedQuestions as Question[]);
      useQuizStore.getState().startRound();

      router.push('/round');
    } catch (error) {
      console.error('Error starting round:', error);
      addToast({ type: 'error', message: 'Failed to start round. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isLevelUnlocked = (level: QuizLevel): boolean => {
    if (!profile) return level === 1;
    return level <= profile.levelUnlocked;
  };

  if (!firebaseUser) {
    return (
      <div className="relative overflow-hidden">
        {/* Ambient float blobs */}
        <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 animate-float rounded-full bg-primary-fixed/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 animate-float-delayed rounded-full bg-tertiary-fixed/20 blur-3xl" />

        <div className="mx-auto max-w-container-max px-margin-mobile py-16 md:px-margin-desktop md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mx-auto max-w-2xl rounded-bento border border-deep-green/5 bg-surface-container-lowest/80 p-10 text-center shadow-[0px_20px_40px_rgba(0,100,0,0.08)] backdrop-blur-xl md:p-12"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed/20 text-royal-gold">
              <Icon name="sports_esports" filled className="text-3xl" />
            </div>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-forest-green">
              Learn &amp; Play
            </p>
            <h1 className="mt-4 font-display-lg-mobile text-display-lg-mobile leading-tight text-ink-black">
              3 questions per round, rewards that stick.
            </h1>
            <p className="mx-auto mt-4 max-w-md font-body-lg text-body-lg text-on-surface-variant">
              Sign in anonymously to earn streaks, badges, and climb the
              leaderboard. Upgrade to Google later if you want to save everything.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleSignInAndPlay}
                className="flex items-center justify-center gap-2 rounded-full bg-deep-green px-8 py-4 font-label-sm text-label-sm text-on-primary shadow-md transition-all hover:-translate-y-1 hover:bg-forest-green"
              >
                Try a demo round
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
              <Link
                href="/calculator"
                className="rounded-full border border-deep-green px-8 py-4 font-label-sm text-label-sm text-deep-green transition-all hover:bg-deep-green/5"
              >
                Explore calculator
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="rounded-bento border border-deep-green/10 bg-surface-container-lowest p-8 shadow-[0px_20px_40px_rgba(0,100,0,0.08)] md:p-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-forest-green">
                Round builder
              </p>
              <h1 className="mt-2 font-headline-md text-headline-md text-deep-green">
                Learn PAYE in snackable sprints.
              </h1>
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                Each round is 3 questions. +10 for correct, +2 for giving it a shot.
              </p>
            </div>
            <Link
              href="/leaderboard"
              className="rounded-full border border-deep-green px-6 py-2 font-label-sm text-label-sm text-deep-green transition-colors hover:bg-deep-green/5"
            >
              View leaderboard
            </Link>
          </div>

          {profile && (
            <div className="mt-8 space-y-6">
              <StreakPill
                streakCount={profile.streakCount}
                bestStreak={profile.bestStreak}
              />
              <div className="rounded-input border border-outline-variant/30 bg-surface-container-low p-6">
                <h2 className="text-center font-headline-md text-lg font-semibold text-deep-green">
                  Your badge shelf
                </h2>
                <div className="mt-4">
                  <BadgeStrip badges={profile.badges} />
                </div>
              </div>
            </div>
          )}

          {lastScore !== null && (
            <div className="mt-6 rounded-input border border-secondary-container bg-primary-fixed/15 p-4 text-center text-on-secondary-fixed">
              Last round score: <span className="font-semibold">{lastScore}/30</span>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-headline-md text-headline-md text-deep-green">
              Choose a level
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              New content drops weekly. Unlock higher levels by maintaining stronger averages.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {([1, 2, 3] as QuizLevel[]).map((level) => (
                <LevelCard
                  key={level}
                  level={level}
                  isUnlocked={isLevelUnlocked(level)}
                  isSelected={selectedLevel === level}
                  onSelect={() => setSelectedLevel(level)}
                />
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStartRound}
            disabled={loading || !isLevelUnlocked(selectedLevel)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-deep-green px-6 py-4 font-label-sm text-base font-semibold text-on-primary shadow-md transition hover:bg-forest-green disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading round...' : 'Start round'}
            {!loading && <Icon name="arrow_forward" className="text-[18px]" />}
          </motion.button>

          <p className="mt-4 text-center font-body-md text-xs text-on-surface-variant/70">
            Tip: Daily play keeps your streak alive and unlocks rare badges faster.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
