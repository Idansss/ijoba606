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
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';
import { Icon } from '@/components/ui/Icon';

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
      if (!db) return;
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

  const levelProgress = Math.min(100, (profile.levelUnlocked / 3) * 100);

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl space-y-6"
      >
        {/* Identity header */}
        <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-bento bg-gradient-to-br from-deep-green to-forest-green text-3xl font-semibold text-on-primary shadow-md">
            {user.handle[0]?.toUpperCase() || '?'}
          </div>
          <h1 className="mt-4 font-display-lg-mobile text-display-lg-mobile text-deep-green">
            {formatHandleForDisplay(user.handle)}
          </h1>
          {user.anon && (
            <p className="font-label-sm text-sm uppercase tracking-widest text-on-surface-variant">
              Guest account
            </p>
          )}
        </div>

        {user.anon && (
          <div className="rounded-bento border border-tertiary-container/40 bg-tertiary-container/10 p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-lg font-semibold text-on-surface">
              <Icon name="lock_open" className="text-[22px] text-tertiary" filled />
              Upgrade to keep your streak forever
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Link your Google account to sync stats and calculator history.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-4 rounded-full bg-gradient-to-r from-deep-green to-royal-gold px-6 py-3 text-sm font-semibold text-on-primary shadow-md transition hover:opacity-90 disabled:opacity-50"
            >
              {upgrading ? 'Upgrading...' : 'Upgrade to Google'}
            </button>
          </div>
        )}

        {/* Stat tiles */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total points', value: profile.totalPoints, icon: 'stars', color: 'text-royal-gold' },
            { label: 'Level unlocked', value: profile.levelUnlocked, icon: 'military_tech', color: 'text-deep-green' },
            { label: 'Badges earned', value: profile.badges.length, icon: 'workspace_premium', color: 'text-secondary' },
            { label: 'Best streak', value: profile.bestStreak, icon: 'local_fire_department', color: 'text-tertiary' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-5 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.04)] backdrop-blur-sm"
            >
              <Icon name={stat.icon} className={`text-[28px] ${stat.color}`} filled />
              <p className="mt-2 font-figure-xl text-figure-xl text-on-surface">
                {stat.value}
              </p>
              <p className="mt-1 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Streak + level progress */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md text-deep-green">
              <Icon name="local_fire_department" className="text-tertiary" filled />
              Your streak
            </h2>
            <StreakPill
              streakCount={profile.streakCount}
              bestStreak={profile.bestStreak}
            />
          </div>

          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md text-deep-green">
              <Icon name="trending_up" className="text-forest-green" />
              Level progress
            </h2>
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>Level {profile.levelUnlocked} of 3</span>
              <span className="font-figure-md text-deep-green">{Math.round(levelProgress)}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-gradient-to-r from-deep-green to-royal-gold transition-all"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              {profile.levelUnlocked < 3
                ? 'Keep playing to unlock the next difficulty tier.'
                : 'All levels unlocked — you are a PAYE pro!'}
            </p>
          </div>
        </div>

        {/* Badge shelf */}
        <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-8">
          <h2 className="flex items-center justify-center gap-2 text-center font-headline-md text-headline-md text-deep-green">
            <Icon name="workspace_premium" className="text-royal-gold" filled />
            Badge shelf
          </h2>
          <div className="mt-4">
            <BadgeStrip badges={profile.badges} />
          </div>
        </div>

        {calcRuns.length > 0 && (
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <h2 className="font-headline-md text-headline-md text-deep-green">
              Saved tax calculations
            </h2>
            <div className="mt-4 space-y-3">
              {calcRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/calculator/result?id=${run.id}`}
                  className="flex items-center justify-between rounded-input border border-deep-green/5 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant transition hover:border-forest-green/40 hover:text-on-surface"
                >
                  <div>
                    <p className="font-semibold text-on-surface">
                      {run.inputs.period === 'monthly' ? 'Monthly' : 'Annual'} run
                    </p>
                    <p className="text-xs text-outline">
                      Tax: {formatCurrency(run.outputs.monthlyTax)}/month
                    </p>
                  </div>
                  <div className="text-xs text-outline">
                    {run.createdAt &&
                      new Date(run.createdAt.seconds * 1000).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/play"
            className="rounded-full bg-gradient-to-r from-deep-green to-royal-gold px-6 py-4 text-center text-sm font-semibold text-on-primary shadow-md transition hover:opacity-90"
          >
            Play quiz
          </Link>
          <Link
            href="/calculator"
            className="rounded-full border border-outline-variant px-6 py-4 text-center text-sm font-semibold text-on-surface-variant transition hover:border-forest-green hover:text-deep-green"
          >
            Calculate Tax
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
