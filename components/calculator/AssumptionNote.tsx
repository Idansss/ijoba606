'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface AssumptionNoteProps {
  note: string;
}

export function AssumptionNote({ note }: AssumptionNoteProps) {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      className="rounded-3xl border border-yellow-100 bg-yellow-50 p-5 text-sm text-yellow-900"
    >
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5" />
        <div>
          <p className="font-semibold uppercase tracking-[0.3em] text-yellow-600">
            Important assumption
          </p>
          <p className="mt-1">{note}</p>
        </div>
      </div>
    </motion.div>
  );
}
