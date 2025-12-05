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
  const isEnabled = process.env.NEXT_PUBLIC_LEADERBOARD_ENABLED === 'true';

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (!isEnabled) {
    return (
      <div className="container mx-auto px-4">
        <div className="mx-auto mt-16 max-w-3xl rounded-[32px] border border-white/70 bg-white/80 p-12 text-center shadow-[0_45px_120px_rgba(87,93,170,0.2)]">
          <Trophy className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-6 text-4xl font-semibold text-slate-900">
            Leaderboard coming soon
          </h1>
          <p className="mt-4 text-slate-500">
            This feature is currently disabled. Keep earning points so you&apos;re
            ready when it goes live.
          </p>
        </div>
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
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.15)]">
          <div className="flex flex-col gap-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
              Friendly competition
            </p>
            <h1 className="text-4xl font-semibold text-slate-900">
              Leaderboard
            </h1>
            <p className="text-sm text-slate-500">
              Top 50 players who keep their streaks and scores blazing.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-sm rounded-full border border-slate-100 bg-white/80 p-1">
            {(Object.keys(tabConfig) as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tabConfig[tab]}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-100 bg-white/95 shadow-inner">
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                Loading leaderboard...
              </div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No entries yet. Be the first to play today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.4em] text-slate-400">
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
                          className={`border-t border-slate-100 text-slate-600 transition hover:bg-slate-50 ${
                            isCurrentUser ? 'bg-purple-50/60' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                              {medal && <span className="text-xl">{medal}</span>}
                              #{entry.rank}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white">
                                {entry.handle?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${
                                    isCurrentUser
                                      ? 'text-purple-700'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {entry.handle || 'Anonymous'}
                                  {isCurrentUser && (
                                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                  Streak: {entry.bestStreak}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-800">
                            {entry.totalPoints.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-700">
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

          <div className="mt-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-800">
            Leaderboard resets every Monday at 00:05 Africa/Lagos time. The all-time
            board keeps every point.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
