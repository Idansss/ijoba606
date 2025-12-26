'use client';

import { motion } from 'framer-motion';
import { BADGES } from '@/lib/utils/badges';
import { BadgeType } from '@/lib/types';

interface BadgeStripProps {
  badges: string[];
}

export function BadgeStrip({ badges }: BadgeStripProps) {
  if (badges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
        No badges yet. Finish more rounds to unlock your very first sticker.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {badges.map((badgeId, index) => {
        const badge = BADGES[badgeId as BadgeType];
        if (!badge) return null;

        return (
          <motion.div
            key={badgeId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative"
          >
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-4 py-2 pr-6 shadow-sm transition hover:border-purple-300">
              <span className="text-2xl">{badge.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {badge.name}
                </p>
                <p className="text-xs text-slate-500">{badge.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
