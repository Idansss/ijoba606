'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

function ConsultantThanksPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  const isApplication = type === 'apply';
  const title = isApplication ? 'Application Submitted!' : 'You\'re on the Waitlist!';
  const message = isApplication
    ? 'Thank you for your interest in joining our consultant network. We\'ll review your application and get back to you soon.'
    : 'Thank you for joining the waitlist! We\'ll notify you when consultant sessions become available.';

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-green-200"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 mb-8">{message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/consultants"
            className="inline-flex items-center gap-2 rounded-full border-2 border-purple-600 px-6 py-3 text-lg font-semibold text-purple-600 hover:bg-purple-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Consultants
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:brightness-110 transition"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConsultantThanksPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-green-200">
          <div className="animate-pulse">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
          </div>
        </div>
      </div>
    }>
      <ConsultantThanksPageContent />
    </Suspense>
  );
}

