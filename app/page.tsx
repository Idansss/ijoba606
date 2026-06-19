'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { Icon } from '@/components/ui/Icon';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const { profile } = useAuthStore();

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop md:py-16">
      {/* Hero */}
      <motion.section
        {...fadeUp}
        className="mx-auto mb-16 max-w-4xl text-center md:mb-24"
      >
        <h1 className="mb-6 font-display-lg-mobile text-display-lg-mobile leading-tight text-deep-green md:text-display-lg">
          Tax literacy made simple.
          <br />
          <span className="text-royal-gold">Your wealth made secure.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Navigate the complexities of Nigerian taxation with clarity. Learn
          PAYE, play quizzes, join the forum, and figure your tax wahala with
          modern tools and expert insights. 🇳🇬
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/play"
            className="rounded-full bg-deep-green px-8 py-4 font-label-sm text-label-sm text-on-primary shadow-md transition-all hover:-translate-y-1 hover:bg-forest-green"
          >
            Start learning
          </Link>
          <Link
            href="/calculator"
            className="rounded-full border border-deep-green px-8 py-4 font-label-sm text-label-sm text-deep-green transition-all hover:bg-deep-green/5"
          >
            Figure your tax wahala
          </Link>
        </div>
      </motion.section>

      {/* Bento pillars */}
      <section className="mb-16 grid grid-cols-1 gap-gutter md:mb-24 md:grid-cols-12">
        {/* Quiz (large) */}
        <motion.div {...fadeUp} className="md:col-span-8">
          <Link
            href="/play"
            className="group flex h-full flex-col justify-between rounded-bento glass-panel p-8 transition-shadow hover:shadow-lg md:p-10"
          >
            <div className="mb-12 flex items-start justify-between">
              <div className="rounded-full bg-primary-container/10 p-4 text-deep-green">
                <Icon name="school" className="text-3xl" />
              </div>
              <span className="rounded-full bg-royal-gold/20 px-3 py-1 font-label-sm text-label-sm text-royal-gold">
                Learn
              </span>
            </div>
            <div>
              <h3 className="mb-3 font-headline-md text-headline-md text-deep-green">
                Quiz &amp; Education
              </h3>
              <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
                Answer 3-question rounds, earn badges, maintain streaks, and
                climb the leaderboard as you demystify tax brackets, reliefs,
                and local compliance.
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Calculator (tall) */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="md:col-span-4">
          <Link
            href="/calculator"
            className="group flex h-full flex-col justify-between rounded-bento glass-panel bg-surface-container-low p-8 transition-shadow hover:shadow-lg md:p-10"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="rounded-full bg-primary-container/10 p-4 text-deep-green">
                <Icon name="calculate" className="text-3xl" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-headline-md text-headline-md text-deep-green">
                Calculator
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Figure your PAYE in 60 seconds — monthly or annual, with a clean
                breakdown. (Educational only.)
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Forum */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="md:col-span-6">
          <Link
            href="/forum"
            className="group flex h-full flex-col justify-between rounded-bento glass-panel p-8 transition-shadow hover:shadow-lg md:p-10"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="rounded-full bg-primary-container/10 p-4 text-deep-green">
                <Icon name="forum" className="text-3xl" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-headline-md text-headline-md text-deep-green">
                Community Forum
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                No gist yet? Start one make we learn. Ask questions, share
                knowledge, and get peer advice on navigating tax.
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Marketplace / Consultants (filled green) */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="md:col-span-6">
          <Link
            href="/consultants/browse"
            className="group flex h-full flex-col justify-between rounded-bento bg-brand-fill p-8 text-on-brand-fill shadow-[0px_18px_40px_rgba(0,60,0,0.20)] transition-all hover:-translate-y-1 md:p-10"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="rounded-full bg-white/20 p-4 text-on-brand-fill">
                <Icon name="storefront" className="text-3xl" />
              </div>
              <span className="rounded-full bg-royal-gold px-3 py-1 font-label-sm text-label-sm text-ink-black">
                Pro
              </span>
            </div>
            <div>
              <h3 className="mb-3 font-headline-md text-headline-md text-on-brand-fill">
                Expert Marketplace
              </h3>
              <p className="font-body-md text-body-md text-on-brand-fill/80">
                Connect with verified tax consultants and financial planners to
                secure your prosperity.
              </p>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* Logged-in progress */}
      {profile && (
        <motion.section
          {...fadeUp}
          className="mb-16 rounded-bento glass-panel p-8 md:p-10"
        >
          <h3 className="mb-6 text-center font-headline-md text-headline-md text-deep-green">
            Your Progress
          </h3>
          <div className="grid grid-cols-2 gap-gutter md:grid-cols-4">
            {[
              { value: profile.totalPoints, label: 'Total Points', tone: 'text-deep-green' },
              { value: profile.streakCount, label: 'Current Streak', tone: 'text-forest-green' },
              { value: profile.bestStreak, label: 'Best Streak', tone: 'text-secondary' },
              { value: profile.badges.length, label: 'Badges Earned', tone: 'text-royal-gold' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`mb-2 font-figure-xl text-figure-xl ${stat.tone}`}>
                  {stat.value}
                </div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Stats */}
      <section className="mb-12 flex flex-col justify-center gap-gutter md:flex-row">
        <div className="flex flex-1 flex-col items-center justify-center rounded-bento glass-panel p-8 text-center">
          <span className="mb-2 font-figure-xl text-figure-xl text-royal-gold">
            ₦45,000,000+
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Naira Saved by Users
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-bento glass-panel p-8 text-center">
          <span className="mb-2 font-figure-xl text-figure-xl text-deep-green">124</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Verified Consultants Active
          </span>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="mx-auto max-w-2xl text-center font-body-md text-sm text-on-surface-variant/70">
        🔒 Anonymous + Google sign-in via Firebase; guests can upgrade anytime.
        ⚠️ Educational purposes only — not legal or tax advice.
      </p>
    </div>
  );
}
