import { getCurrentLagosDate, isNextDay, isAfterDate } from './date';

/**
 * Update streak based on last played date and current Lagos date
 */
export function updateStreak(
  lastPlayedDate: string | null,
  currentStreak: number
): { newStreak: number; today: string } {
  const today = getCurrentLagosDate();

  // First time playing
  if (!lastPlayedDate) {
    return { newStreak: 1, today };
  }

  // Already played today
  if (lastPlayedDate === today) {
    return { newStreak: currentStreak, today };
  }

  // Played yesterday - increment streak
  if (isNextDay(lastPlayedDate, today)) {
    return { newStreak: currentStreak + 1, today };
  }

  // Streak broken - reset to 1
  if (isAfterDate(lastPlayedDate, today)) {
    return { newStreak: 1, today };
  }

  // Shouldn't happen (future date?), but reset
  return { newStreak: 1, today };
}

