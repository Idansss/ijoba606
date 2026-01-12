'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ConsultantCTA() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900">
      <p>
        Need personalised guidance?{' '}
        <Link
          href="/consultants/request"
          className="inline-flex items-center gap-1 font-semibold text-blue-700 underline transition hover:text-blue-800"
        >
          Join the consultant waitlist
          <ArrowRight className="h-4 w-4" />
        </Link>
      </p>
    </div>
  );
}

