'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserCheck, Users, Clock, CheckCircle2 } from 'lucide-react';
import { ComingSoonBadge } from '@/components/consultants/ComingSoonBadge';

export default function ConsultantsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
            Talk to a Tax Consultant
          </h1>
          <ComingSoonBadge />
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
          We're onboarding verified PAYE & Personal Income Tax experts. Join early and we'll notify you when sessions open.
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
          className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/30 hover:brightness-110 transition text-center"
        >
          Browse Consultants
        </Link>
        <Link
          href="/consultants/apply"
          className="rounded-full border-2 border-purple-600 px-8 py-4 text-lg font-semibold text-purple-600 hover:bg-purple-50 transition text-center"
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
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-100">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Tell us what you need</h3>
            <p className="text-gray-600">
              Share your tax question or situation. We'll understand your needs.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">2. We match you with a verified consultant</h3>
            <p className="text-gray-600">
              Our team reviews and matches you with the right expert for your situation.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-100">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">3. You book a session when booking opens</h3>
            <p className="text-gray-600">
              Once booking is live, you'll be notified and can schedule your consultation.
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
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100">
            <summary className="font-semibold text-gray-800 cursor-pointer">
              When will booking open?
            </summary>
            <p className="mt-3 text-gray-600">
              We're currently onboarding verified consultants. Booking will open once we have a qualified network of experts. Join the waitlist to be notified when sessions become available.
            </p>
          </details>
          <details className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100">
            <summary className="font-semibold text-gray-800 cursor-pointer">
              How are consultants verified?
            </summary>
            <p className="mt-3 text-gray-600">
              All consultants go through a verification process where we review their credentials, experience, and expertise in PAYE and Personal Income Tax matters. We only onboard verified professionals.
            </p>
          </details>
          <details className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100">
            <summary className="font-semibold text-gray-800 cursor-pointer">
              Is this legal/tax advice?
            </summary>
            <p className="mt-3 text-gray-600">
              This platform provides educational guidance only. For official tax advice or legal matters, please consult with qualified tax professionals or legal advisors. Users should confirm all information with professionals before making decisions.
            </p>
          </details>
        </div>
      </motion.section>
    </div>
  );
}

