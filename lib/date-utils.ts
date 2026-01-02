import { format, startOfWeek, endOfWeek, addDays, subDays, differenceInDays } from 'date-fns';

export interface WeekRange {
  start: Date;
  end: Date;
}

/**
 * Get the start and end dates of the current week
 * @param weekStartsOn 0 = Sunday, 1 = Monday
 */
export function getCurrentWeek(weekStartsOn: number = 0): WeekRange {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: weekStartsOn as 0 | 1 });
  const end = endOfWeek(today, { weekStartsOn: weekStartsOn as 0 | 1 });
  
  return { start, end };
}

/**
 * Get the start and end dates for a week containing the given date
 */
export function getWeekForDate(date: Date, weekStartsOn: number = 0): WeekRange {
  const start = startOfWeek(date, { weekStartsOn: weekStartsOn as 0 | 1 });
  const end = endOfWeek(date, { weekStartsOn: weekStartsOn as 0 | 1 });
  
  return { start, end };
}

/**
 * Format a date as YYYY-MM-DD for database storage
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get an array of all dates in a week
 */
export function getDatesInWeek(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  return dates;
}

/**
 * Format a week range for display
 */
export function formatWeekRange(start: Date, end: Date): string {
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayString(): string {
  return formatDateForDB(new Date());
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  return Math.abs(differenceInDays(date1, date2));
}
