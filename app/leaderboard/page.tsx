'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LeaderboardEntry } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';

type TabType = 'weekly' | 'alltime';

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
      // Fetch weekly leaderboard
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

      // Fetch all-time leaderboard
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

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const isEnabled = process.env.NEXT_PUBLIC_LEADERBOARD_ENABLED === 'true';

  if (!isEnabled) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">
            Leaderboard Coming Soon
          </h1>
          <p className="text-gray-600">
            The leaderboard feature is currently disabled. Check back later!
          </p>
        </div>
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
            Leaderboard
          </h1>
          <p className="text-gray-600">Top 50 players who dey push hard!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab('alltime')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'alltime'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All-Time
          </button>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No entries yet. Be the first to play!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Player
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Points
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => {
                    const isCurrentUser = entry.uid === firebaseUser?.uid;
                    const medal = getRankMedal(entry.rank || 0);

                    return (
                      <motion.tr
                        key={entry.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-gray-50 transition-colors ${
                          isCurrentUser ? 'bg-purple-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {medal && (
                              <span className="text-2xl">{medal}</span>
                            )}
                            <span
                              className={`font-bold ${
                                isCurrentUser
                                  ? 'text-purple-600'
                                  : 'text-gray-700'
                              }`}
                            >
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {entry.handle?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span
                              className={`font-medium ${
                                isCurrentUser
                                  ? 'text-purple-600'
                                  : 'text-gray-800'
                              }`}
                            >
                              {entry.handle || 'Anonymous'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-purple-600">
                                  (You)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-gray-800">
                            {entry.totalPoints.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                            🔥 {entry.bestStreak}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            💡 Weekly leaderboard resets every Monday at 00:05 Africa/Lagos
            time
          </p>
        </div>
      </motion.div>
    </div>
  );
}


