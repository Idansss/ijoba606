'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';

export default function Home() {
  const { profile } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
          ijoba 606
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto">
          Learn PAYE • Play Quizzes • Join Forum • Calculate Tax
        </p>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Make tax literacy engaging with short challenges, community
          conversations, and a practical calculator. 🇳🇬
        </p>
      </motion.div>

      {/* CTA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/play"
            className="group block bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              🎓
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Learn & Play
            </h2>
            <p className="text-gray-600 mb-4">
              Answer 3-question rounds, earn badges, maintain streaks, and
              climb the leaderboard!
            </p>
            <div className="inline-flex items-center gap-2 text-purple-600 font-semibold">
              Start Learning
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/calculator"
            className="group block bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              🧮
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Tax Calculator
            </h2>
            <p className="text-gray-600 mb-4">
              Figure your tax wahala in 60 seconds. Monthly or annual, with
              clean breakdown. (Educational only)
            </p>
            <div className="inline-flex items-center gap-2 text-blue-600 font-semibold">
              Calculate Now
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/forum"
            className="group block bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              💬
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Community Forum
            </h2>
            <p className="text-gray-600 mb-4">
              No gist yet? Start one make we learn. Ask questions, share
              knowledge, help others.
            </p>
            <div className="inline-flex items-center gap-2 text-green-600 font-semibold">
              Join Discussion
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Stats Preview (if logged in) */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200 mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Your Progress
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {profile.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {profile.streakCount}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {profile.bestStreak}
              </div>
              <div className="text-sm text-gray-600">Best Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {profile.badges.length}
              </div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Privacy Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500 max-w-2xl mx-auto"
      >
        <p>
          🔒 Your privacy matters. We use Firebase Auth with anonymous + Google
          sign-in. Guest accounts can upgrade anytime.
        </p>
        <p className="mt-2">
          ⚠️ Educational purposes only. Not legal or tax advice. Consult a
          professional for your specific situation.
        </p>
      </motion.div>
    </div>
  );
}
