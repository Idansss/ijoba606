'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ConsultantCTA() {
  return (
    <div className="rounded-2xl border border-[#97e0b4] bg-[#e6f3ec]/80 p-4 text-sm text-[#002d15]">
      <p>
        Need personalised guidance?{' '}
        <Link
          href="/consultants/request"
          className="inline-flex items-center gap-1 font-semibold text-[#005728] underline transition hover:text-[#00421f]"
        >
          Join the consultant waitlist
          <ArrowRight className="h-4 w-4" />
        </Link>
      </p>
    </div>
  );
}

