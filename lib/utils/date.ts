import { parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const LAGOS_TZ = 'Africa/Lagos';

/**
 * Get current date in Lagos timezone as YYYY-MM-DD string
 */
export function getCurrentLagosDate(): string {
  const now = new Date();
  return formatInTimeZone(now, LAGOS_TZ, 'yyyy-MM-dd');
}

/**
 * Get Lagos timezone date object
 */
export function getLagosDate(date: Date = new Date()): Date {
  return toZonedTime(date, LAGOS_TZ);
}

/**
 * Format date to Lagos timezone
 */
export function formatLagosDate(date: Date, formatStr: string): string {
  return formatInTimeZone(date, LAGOS_TZ, formatStr);
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Check if two YYYY-MM-DD strings are consecutive days
 */
export function isNextDay(prevDate: string, currentDate: string): boolean {
  const prev = parseISO(prevDate);
  const curr = parseISO(currentDate);
  const diffTime = curr.getTime() - prev.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

/**
 * Check if currentDate is after prevDate (not same day)
 */
export function isAfterDate(prevDate: string, currentDate: string): boolean {
  return currentDate > prevDate;
}

