'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { BadgeStrip } from '@/components/quiz/BadgeStrip';
import { StreakPill } from '@/components/quiz/StreakPill';
import { upgradeAnonymousToGoogle } from '@/lib/firebase/auth';
import { useToastStore } from '@/lib/store/toast';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CalcRun } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, user, profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [upgrading, setUpgrading] = useState(false);
  const [calcRuns, setCalcRuns] = useState<CalcRun[]>([]);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/');
      return;
    }

    // Fetch saved calculator runs
    const fetchCalcRuns = async () => {
      const runsRef = collection(db, 'calcRuns');
      const q = query(
        runsRef,
        where('uid', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const runs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CalcRun[];
      setCalcRuns(runs);
    };

    fetchCalcRuns();
  }, [firebaseUser, router]);

  const handleUpgrade = async () => {
    if (!firebaseUser?.isAnonymous) return;

    setUpgrading(true);
    try {
      await upgradeAnonymousToGoogle();
      addToast({
        type: 'success',
        message: 'Account upgraded! Your progress is now saved. 🎉',
      });
    } catch (error) {
      console.error('Upgrade error:', error);
      addToast({
        type: 'error',
        message: 'Failed to upgrade account. Try again.',
      });
    } finally {
      setUpgrading(false);
    }
  };

  if (!firebaseUser || !user || !profile) {
    return null;
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
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
            {user.handle[0]?.toUpperCase() || '?'}
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {user.handle}
          </h1>
          {user.anon && (
            <p className="text-sm text-gray-500 mb-4">Guest Account</p>
          )}
        </div>

        {/* Upgrade Banner */}
        {user.anon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl"
          >
            <h3 className="text-xl font-bold text-purple-900 mb-2">
              Upgrade Your Account
            </h3>
            <p className="text-purple-800 mb-4">
              Link your Google account to save your progress permanently and
              never lose your data!
            </p>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all disabled:opacity-50"
            >
              {upgrading ? 'Upgrading...' : 'Upgrade to Google'}
            </button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {profile.totalPoints}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {profile.levelUnlocked}
            </div>
            <div className="text-sm text-gray-600">Level Unlocked</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {profile.badges.length}
            </div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {profile.bestStreak}
            </div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
        </div>

        {/* Streak */}
        <div className="mb-8">
          <StreakPill
            streakCount={profile.streakCount}
            bestStreak={profile.bestStreak}
          />
        </div>

        {/* Badges */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Your Badges
          </h2>
          <BadgeStrip badges={profile.badges} />
        </div>

        {/* Saved Calculator Runs */}
        {calcRuns.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Saved Tax Calculations
            </h2>
            <div className="space-y-4">
              {calcRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/calculator/result?id=${run.id}`}
                  className="block p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {run.inputs.period === 'monthly'
                          ? 'Monthly'
                          : 'Annual'}{' '}
                        Calculation
                      </div>
                      <div className="text-sm text-gray-600">
                        Tax: ₦
                        {run.outputs.monthlyTax.toLocaleString()}/month
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {run.createdAt &&
                        new Date(
                          run.createdAt.seconds * 1000
                        ).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/play"
            className="block text-center py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Play Quiz
          </Link>
          <Link
            href="/calculator"
            className="block text-center py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all"
          >
            Calculate Tax
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


