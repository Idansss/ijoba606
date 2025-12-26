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
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-16 max-w-2xl rounded-[32px] border border-white/80 bg-white/80 p-10 text-center shadow-[0_45px_120px_rgba(87,93,170,0.2)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
            Learn & play
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">
            3 questions per round, rewards that stick.
          </h1>
          <p className="mt-4 text-slate-600">
            Sign in anonymously to earn streaks, badges, and climb the leaderboard.
            Upgrade to Google later if you want to save everything.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleSignInAndPlay}
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/30"
            >
              Try a demo round
            </button>
            <Link
              href="/calculator"
              className="rounded-full border border-slate-200 px-8 py-3 text-base font-semibold text-slate-700 hover:border-purple-300 hover:text-slate-900"
            >
              Explore calculator
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-[0_35px_110px_rgba(15,23,42,0.15)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
                Round builder
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Learn PAYE in snackable sprints.
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Each round is 3 questions. +10 for correct, +2 for giving it a shot.
              </p>
            </div>
            <Link
              href="/leaderboard"
              className="rounded-full border border-purple-200 px-6 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
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
              <div className="rounded-3xl border border-slate-100 bg-white/80 p-6">
                <h2 className="text-center text-lg font-semibold text-slate-900">
                  Your badge shelf
                </h2>
                <div className="mt-4">
                  <BadgeStrip badges={profile.badges} />
                </div>
              </div>
            </div>
          )}

          {lastScore !== null && (
            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-center text-blue-900">
              Last round score: <span className="font-semibold">{lastScore}/30</span>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-slate-900">
              Choose a level
            </h2>
            <p className="text-sm text-slate-500">
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
            className="mt-8 w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/30 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading round...' : 'Start round'}
          </motion.button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Tip: Daily play keeps your streak alive and unlocks rare badges faster.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
