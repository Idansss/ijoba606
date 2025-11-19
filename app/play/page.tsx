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
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function PlayPage() {
  const router = useRouter();
  const { firebaseUser, profile } = useAuthStore();
  const { setCurrentLevel } = useQuizStore();
  const { addToast } = useToastStore();
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>(1);
  const [loading, setLoading] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    // Fetch last round score
    if (firebaseUser) {
      const fetchLastScore = async () => {
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
    }
  }, [firebaseUser]);

  const handleSignInAndPlay = async () => {
    try {
      await signInAnon();
      addToast({ type: 'success', message: 'Welcome! Let\'s play 🎮' });
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      addToast({ type: 'error', message: 'Failed to sign in. Try again.' });
    }
  };

  const handleStartRound = async () => {
    if (!firebaseUser) {
      await handleSignInAndPlay();
      return;
    }

    setLoading(true);
    try {
      // Fetch 3 random questions for the selected level
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('level', '==', selectedLevel));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty || snapshot.size < 3) {
        addToast({
          type: 'error',
          message: 'Not enough questions for this level. Contact admin.',
        });
        setLoading(false);
        return;
      }

      // Randomly select 3 questions
      const allQuestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, 3);

      // Set in store
      setCurrentLevel(selectedLevel);
      useQuizStore.getState().setQuestions(selectedQuestions as Question[]);
      useQuizStore.getState().startRound();

      // Navigate to round
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
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="text-6xl mb-6">🎓</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Ready to Learn?
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to start playing quizzes, earn badges, and track your
            progress!
          </p>
          <button
            onClick={handleSignInAndPlay}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Sign In & Play
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Learn & Play
          </h1>
          <p className="text-gray-600">
            Answer 3 questions per round. Get +10 for correct, +2 for trying!
          </p>
        </div>

        {/* Streak & Badges */}
        {profile && (
          <div className="mb-8 space-y-6">
            <StreakPill
              streakCount={profile.streakCount}
              bestStreak={profile.bestStreak}
            />
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                Your Badges
              </h2>
              <BadgeStrip badges={profile.badges} />
            </div>
          </div>
        )}

        {/* Last Score */}
        {lastScore !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8 text-center"
          >
            <p className="text-blue-800">
              Last round: <span className="font-bold">{lastScore}/30</span>{' '}
              points 🎯
            </p>
          </motion.div>
        )}

        {/* Level Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Choose Your Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartRound}
          disabled={loading || !isLevelUnlocked(selectedLevel)}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Start Round'}
        </motion.button>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            💡 Tip: Play daily to maintain your streak and unlock new badges!
          </p>
        </div>
      </motion.div>
    </div>
  );
}


