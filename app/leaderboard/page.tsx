'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LeaderboardEntry } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { Trophy } from 'lucide-react';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';

type TabType = 'weekly' | 'alltime';

const tabConfig: Record<TabType, string> = {
  weekly: 'Weekly sprint',
  alltime: 'All-time legends',
};

export default function LeaderboardPage() {
  const { firebaseUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [weeklyEntries, setWeeklyEntries] = useState<LeaderboardEntry[]>([]);
  const [alltimeEntries, setAlltimeEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      if (!db) {
        setWeeklyEntries([]);
        setAlltimeEntries([]);
        setLoading(false);
        return;
      }
      const weeklyRef = collection(db, 'leaderboards/weekly/entries');
      const weeklyQuery = query(
        weeklyRef,
        orderBy('totalPoints', 'desc'),
        limit(50)
      );
      const weeklySnapshot = await getDocs(weeklyQuery);
      const weeklyData = weeklySnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        rank: index + 1,
      })) as LeaderboardEntry[];
      setWeeklyEntries(weeklyData);

      const alltimeRef = collection(db, 'leaderboards/alltime/entries');
      const alltimeQuery = query(
        alltimeRef,
        orderBy('totalPoints', 'desc'),
        limit(50)
      );
      const alltimeSnapshot = await getDocs(alltimeQuery);
      const alltimeData = alltimeSnapshot.docs.map((doc, index) => ({
        ...doc.data(),
        rank: index + 1,
      })) as LeaderboardEntry[];
      setAlltimeEntries(alltimeData);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const entries = activeTab === 'weekly' ? weeklyEntries : alltimeEntries;
  // Enable leaderboard by default (remove environment variable check)
  const isEnabled = true; // process.env.NEXT_PUBLIC_LEADERBOARD_ENABLED === 'true';

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (!isEnabled) {
    return (
      <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="mx-auto mt-16 max-w-3xl rounded-bento border border-deep-green/10 bg-surface-container-lowest p-6 sm:p-12 text-center shadow-[0px_20px_40px_rgba(0,100,0,0.08)]">
          <Trophy className="mx-auto h-12 w-12 text-royal-gold" />
          <h1 className="mt-6 font-display-lg-mobile text-display-lg-mobile text-deep-green">
            Leaderboard coming soon
          </h1>
          <p className="mt-4 text-on-surface-variant">
            This feature is currently disabled. Keep earning points so you&apos;re
            ready when it goes live.
          </p>
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
        <div className="rounded-bento border border-deep-green/10 bg-surface-container-lowest p-6 sm:p-10 shadow-[0px_20px_40px_rgba(0,100,0,0.08)]">
          <div className="flex flex-col gap-3 text-center">
            <p className="font-label-sm text-sm font-semibold uppercase tracking-widest text-forest-green">
              Friendly competition
            </p>
            <h1 className="font-display-lg-mobile text-display-lg-mobile text-deep-green">
              Leaderboard
            </h1>
            <p className="text-sm text-on-surface-variant">
              Top 50 players who keep their streaks and scores blazing.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-sm rounded-full border border-outline-variant/30 bg-surface-container-low p-1">
            {(Object.keys(tabConfig) as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-deep-green to-royal-gold text-on-primary shadow'
                    : 'text-on-surface-variant hover:text-deep-green'
                }`}
              >
                {tabConfig[tab]}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-input border border-outline-variant/30 bg-surface-container-lowest">
            {loading ? (
              <div className="py-12 text-center text-on-surface-variant">
                Loading leaderboard...
              </div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                No entries yet. Be the first to play today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant/60">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Player</th>
                      <th className="px-6 py-4 text-right">Points</th>
                      <th className="px-6 py-4 text-right">Best streak</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {entries.map((entry) => {
                      const isCurrentUser = entry.uid === firebaseUser?.uid;
                      const medal = getMedal(entry.rank || 0);
                      return (
                        <tr
                          key={entry.uid}
                          className={`border-t border-outline-variant/20 text-on-surface-variant transition hover:bg-surface-container-low ${
                            isCurrentUser ? 'bg-primary-fixed/15' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-on-surface">
                            <div className="flex items-center gap-2">
                              {medal && <span className="text-xl">{medal}</span>}
                              #{entry.rank}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-green text-sm font-bold text-on-primary">
                                {entry.handle?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${
                                    isCurrentUser
                                      ? 'text-deep-green'
                                      : 'text-on-surface'
                                  }`}
                                >
                                  {entry.handle ? formatHandleForDisplay(entry.handle) : 'Anonymous'}
                                  {isCurrentUser && (
                                    <span className="ml-2 rounded-full bg-primary-fixed/30 px-2 py-0.5 text-xs text-deep-green">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant/60">
                                  Streak: {entry.bestStreak}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-figure-md text-on-surface">
                            {entry.totalPoints.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-on-surface-variant">
                            {entry.bestStreak}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-input border border-tertiary-fixed/40 bg-tertiary-fixed/20 p-4 text-sm text-on-tertiary-fixed-variant">
            Leaderboard resets every Monday at 00:05 Africa/Lagos time. The all-time
            board keeps every point.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
