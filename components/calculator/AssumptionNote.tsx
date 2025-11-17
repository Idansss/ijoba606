'use client';

import { motion } from 'framer-motion';

interface AssumptionNoteProps {
  note: string;
}

export function AssumptionNote({ note }: AssumptionNoteProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="font-bold text-yellow-900 mb-1">Important Note</h4>
          <p className="text-sm text-yellow-800">{note}</p>
        </div>
      </div>
    </motion.div>
  );
}


