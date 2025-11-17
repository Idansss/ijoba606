import { Badge, BadgeType } from '@/lib/types';

export const BADGES: Record<BadgeType, Badge> = {
  tax_rookie: {
    id: 'tax_rookie',
    name: 'Tax Rookie',
    description: 'Completed your first round',
    emoji: '🎓',
  },
  paye_pro: {
    id: 'paye_pro',
    name: 'PAYE Pro',
    description: 'Scored 24+ in a round',
    emoji: '💼',
  },
  relief_ranger: {
    id: 'relief_ranger',
    name: 'Relief Ranger',
    description: 'Answered 3 relief questions correctly (lifetime)',
    emoji: '🎯',
  },
  streak_starter: {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintained a 3-day streak',
    emoji: '🔥',
  },
  hot_streak: {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Maintained a 7-day streak',
    emoji: '⚡',
  },
  boss_level: {
    id: 'boss_level',
    name: 'Boss Level',
    description: 'Scored 26+ on Level 3',
    emoji: '👑',
  },
};

/**
 * Evaluate which new badges should be awarded based on current state
 */
export function evaluateNewBadges(
  currentBadges: string[],
  data: {
    roundsCompleted: number;
    lastRoundScore: number;
    lastRoundLevel: number;
    reliefQuestionsCorrect: number;
    currentStreak: number;
  }
): BadgeType[] {
  const newBadges: BadgeType[] = [];

  // Tax Rookie: first round
  if (data.roundsCompleted === 1 && !currentBadges.includes('tax_rookie')) {
    newBadges.push('tax_rookie');
  }

  // PAYE Pro: score 24+ in a round
  if (data.lastRoundScore >= 24 && !currentBadges.includes('paye_pro')) {
    newBadges.push('paye_pro');
  }

  // Relief Ranger: 3 relief questions correct lifetime
  if (data.reliefQuestionsCorrect >= 3 && !currentBadges.includes('relief_ranger')) {
    newBadges.push('relief_ranger');
  }

  // Streak Starter: 3-day streak
  if (data.currentStreak >= 3 && !currentBadges.includes('streak_starter')) {
    newBadges.push('streak_starter');
  }

  // Hot Streak: 7-day streak
  if (data.currentStreak >= 7 && !currentBadges.includes('hot_streak')) {
    newBadges.push('hot_streak');
  }

  // Boss Level: L3 with 26+
  if (
    data.lastRoundLevel === 3 &&
    data.lastRoundScore >= 26 &&
    !currentBadges.includes('boss_level')
  ) {
    newBadges.push('boss_level');
  }

  return newBadges;
}

