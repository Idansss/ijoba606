'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';

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
        <BrandLogo
          className="mb-6 justify-center"
          markClassName="h-16 w-16"
          textClassName="text-2xl md:text-3xl"
          taglineClassName="text-[0.72rem] md:text-xs"
        />
        <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tight leading-[1.05] text-[#006400]">
          Tax literacy<br />
          <span className="text-[#c59f00]">made simple.</span>
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-[#1a1c15] mb-4 max-w-3xl mx-auto">
          Learn PAYE • Play Quizzes • Join Forum • Calculate Tax
        </p>
        <p className="text-lg text-[#404a3b] max-w-2xl mx-auto">
          Make tax literacy engaging with short challenges, community
          conversations, and a practical calculator. 🇳🇬
        </p>
      </motion.div>

      {/* CTA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/play"
            className="group block rounded-[28px] border border-[#0064001a] bg-white/80 backdrop-blur-sm p-8 shadow-[0_10px_30px_rgba(0,50,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,50,0,0.10)]"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0064001a] text-3xl transition-transform group-hover:scale-110">
              🎓
            </div>
            <h2 className="text-2xl font-bold text-[#1a1c15] mb-3">
              Learn & Play
            </h2>
            <p className="text-[#404a3b] mb-4">
              Answer 3-question rounds, earn badges, maintain streaks, and
              climb the leaderboard!
            </p>
            <div className="inline-flex items-center gap-2 text-[#006400] font-semibold">
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
            className="group block rounded-[28px] border border-[#0064001a] bg-white/80 backdrop-blur-sm p-8 shadow-[0_10px_30px_rgba(0,50,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,50,0,0.10)]"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0064001a] text-3xl transition-transform group-hover:scale-110">
              🧮
            </div>
            <h2 className="text-2xl font-bold text-[#1a1c15] mb-3">
              Tax Calculator
            </h2>
            <p className="text-[#404a3b] mb-4">
              Figure your tax wahala in 60 seconds. Monthly or annual, with
              clean breakdown. (Educational only)
            </p>
            <div className="inline-flex items-center gap-2 text-[#006400] font-semibold">
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
            className="group block rounded-[28px] border border-[#0064001a] bg-white/80 backdrop-blur-sm p-8 shadow-[0_10px_30px_rgba(0,50,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,50,0,0.10)]"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0064001a] text-3xl transition-transform group-hover:scale-110">
              💬
            </div>
            <h2 className="text-2xl font-bold text-[#1a1c15] mb-3">
              Community Forum
            </h2>
            <p className="text-[#404a3b] mb-4">
              No gist yet? Start one make we learn. Ask questions, share
              knowledge, help others.
            </p>
            <div className="inline-flex items-center gap-2 text-[#006400] font-semibold">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/consultants/browse"
            className="group relative block overflow-hidden rounded-[28px] bg-[#006400] p-8 text-white shadow-[0_18px_40px_rgba(0,60,0,0.20)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(0,60,0,0.28)]"
          >
            <span className="absolute right-6 top-6 rounded-full bg-[#c59f00] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0a0a0a]">
              Pro
            </span>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl transition-transform group-hover:scale-110">
              💼
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Talk to a Consultant
            </h2>
            <p className="text-white/80 mb-4">
              Get 1-on-1 clarity for your own situation. Connect with verified tax experts.
            </p>
            <div className="inline-flex items-center gap-2 font-semibold text-[#ffe085]">
              Find a Consultant
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
          className="rounded-[28px] border border-[#0064001a] bg-white/80 backdrop-blur-sm p-8 shadow-[0_10px_30px_rgba(0,50,0,0.05)] mb-8"
        >
          <h3 className="text-2xl font-bold text-[#1a1c15] mb-6 text-center">
            Your Progress
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-[#006400] mb-2">
                {profile.totalPoints}
              </div>
              <div className="text-sm text-[#404a3b]">Total Points</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-[#0b7a3b] mb-2">
                {profile.streakCount}
              </div>
              <div className="text-sm text-[#404a3b]">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-[#006d33] mb-2">
                {profile.bestStreak}
              </div>
              <div className="text-sm text-[#404a3b]">Best Streak</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-[#c59f00] mb-2">
                {profile.badges.length}
              </div>
              <div className="text-sm text-[#404a3b]">Badges Earned</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Privacy Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-[#404a3b]/80 max-w-2xl mx-auto"
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
