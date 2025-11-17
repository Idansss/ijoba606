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
      <div className="text-center py-4 text-gray-500 text-sm">
        No badges yet. Keep playing to earn them! 🎯
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {badges.map((badgeId, index) => {
        const badge = BADGES[badgeId as BadgeType];
        if (!badge) return null;

        return (
          <motion.div
            key={badgeId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border-2 border-purple-200 flex items-center gap-2 hover:border-purple-400 transition-all cursor-help">
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-sm font-semibold text-gray-800">
                {badge.name}
              </span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {badge.description}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

