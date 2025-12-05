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
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CalcRun } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/calculator';

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
        message: 'Account upgraded! Your progress is now saved.',
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
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.15)]">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-blue-500 text-3xl font-semibold text-white shadow-lg">
              {user.handle[0]?.toUpperCase() || '?'}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">
              {user.handle}
            </h1>
            {user.anon && (
              <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
                Guest account
              </p>
            )}
          </div>

          {user.anon && (
            <div className="mt-6 rounded-3xl border border-slate-100 bg-white/95 p-6 text-center shadow-inner">
              <p className="text-lg font-semibold text-slate-900">
                Upgrade to keep your streak forever
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Link your Google account to sync stats and calculator history.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="mt-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              >
                {upgrading ? 'Upgrading...' : 'Upgrade to Google'}
              </button>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Total points', value: profile.totalPoints },
              { label: 'Level unlocked', value: profile.levelUnlocked },
              { label: 'Badges earned', value: profile.badges.length },
              { label: 'Best streak', value: profile.bestStreak },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-slate-100 bg-white/90 p-4 text-center shadow-sm"
              >
                <p className="text-3xl font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <StreakPill
              streakCount={profile.streakCount}
              bestStreak={profile.bestStreak}
            />
          </div>

          <div className="mt-8 rounded-3xl border border-slate-100 bg-white/90 p-8">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Badge shelf
            </h2>
            <div className="mt-4">
              <BadgeStrip badges={profile.badges} />
            </div>
          </div>

          {calcRuns.length > 0 && (
            <div className="mt-8 rounded-3xl border border-slate-100 bg-white/90 p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Saved tax calculations
              </h2>
              <div className="mt-4 space-y-3">
                {calcRuns.map((run) => (
                  <Link
                    key={run.id}
                    href={`/calculator/result?id=${run.id}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-purple-200 hover:text-slate-900"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {run.inputs.period === 'monthly' ? 'Monthly' : 'Annual'} run
                      </p>
                      <p className="text-xs text-slate-400">
                        Tax: {formatCurrency(run.outputs.monthlyTax)}/month
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      {run.createdAt &&
                        new Date(run.createdAt.seconds * 1000).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href="/play"
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-center text-sm font-semibold text-white shadow-xl"
            >
              Play quiz
            </Link>
            <Link
              href="/calculator"
              className="rounded-full border border-slate-200 px-6 py-4 text-center text-sm font-semibold text-slate-700 hover:border-purple-200 hover:text-slate-900"
            >
              Calculate PAYE
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
