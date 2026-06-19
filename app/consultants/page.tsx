'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserCheck, Users, CheckCircle2 } from 'lucide-react';

export default function ConsultantsPage() {
  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-deep-green md:text-display-lg">
            Talk to a Tax Consultant
          </h1>
        </div>
        <p className="mt-4 max-w-3xl mx-auto font-body-lg text-body-lg text-on-surface-variant">
          Connect with verified PAYE & Personal Income Tax experts for personalized guidance.
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
      >
        <Link
          href="/consultants/browse"
          className="rounded-full bg-deep-green px-8 py-4 font-label-sm text-base font-semibold text-on-primary shadow-md transition hover:bg-forest-green text-center"
        >
          Browse Consultants
        </Link>
        <Link
          href="/consultants/apply"
          className="rounded-full border border-deep-green px-8 py-4 font-label-sm text-base font-semibold text-deep-green transition hover:bg-deep-green/5 text-center"
        >
          Become a Consultant
        </Link>
      </motion.div>

      {/* How it Works */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-16"
      >
        <h2 className="font-headline-md text-headline-md text-deep-green mb-8 text-center md:text-3xl">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-bento glass-panel p-8">
            <div className="w-12 h-12 rounded-full bg-forest-green/10 flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-deep-green" />
            </div>
            <h3 className="font-headline-md text-xl font-semibold text-deep-green mb-2">1. Tell us what you need</h3>
            <p className="text-on-surface-variant">
              Share your tax question or situation. We'll understand your needs.
            </p>
          </div>
          <div className="rounded-bento glass-panel p-8">
            <div className="w-12 h-12 rounded-full bg-forest-green/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-deep-green" />
            </div>
            <h3 className="font-headline-md text-xl font-semibold text-deep-green mb-2">2. We match you with a verified consultant</h3>
            <p className="text-on-surface-variant">
              Our team reviews and matches you with the right expert for your situation.
            </p>
          </div>
          <div className="rounded-bento glass-panel p-8">
            <div className="w-12 h-12 rounded-full bg-forest-green/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-deep-green" />
            </div>
            <h3 className="font-headline-md text-xl font-semibold text-deep-green mb-2">3. You book a session with confidence</h3>
            <p className="text-on-surface-variant">
              Choose a consultant, discuss scope, and get started right away.
            </p>
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="font-headline-md text-headline-md text-deep-green mb-8 text-center md:text-3xl">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="rounded-input border border-outline-variant/30 bg-surface-container-lowest p-6">
            <summary className="font-semibold text-on-surface cursor-pointer">
              How do I get started?
            </summary>
            <p className="mt-3 text-on-surface-variant">
              Browse consultants, start a chat, and agree on the scope of work. Your consultant can send an invoice when you're ready.
            </p>
          </details>
          <details className="rounded-input border border-outline-variant/30 bg-surface-container-lowest p-6">
            <summary className="font-semibold text-on-surface cursor-pointer">
              How are consultants verified?
            </summary>
            <p className="mt-3 text-on-surface-variant">
              All consultants go through a verification process where we review their credentials, experience, and expertise in PAYE and Personal Income Tax matters. We only onboard verified professionals.
            </p>
          </details>
          <details className="rounded-input border border-outline-variant/30 bg-surface-container-lowest p-6">
            <summary className="font-semibold text-on-surface cursor-pointer">
              Is this legal/tax advice?
            </summary>
            <p className="mt-3 text-on-surface-variant">
              This platform provides educational guidance only. For official tax advice or legal matters, please consult with qualified tax professionals or legal advisors. Users should confirm all information with professionals before making decisions.
            </p>
          </details>
        </div>
      </motion.section>
    </div>
  );
}

