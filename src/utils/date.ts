/**
 * Date utility helpers for HabitFlow
 */

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(isoString: string): Date {
  const [y, m, d] = isoString.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatFriendlyDate(isoString: string): string {
  const date = parseISODate(isoString);
  const today = new Date();
  const todayStr = formatDateToISO(today);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDateToISO(tomorrow);

  if (isoString === todayStr) return 'Today';
  if (isoString === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDayOfWeek(isoString: string): string {
  const date = parseISODate(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatDayNumber(isoString: string): number {
  const date = parseISODate(isoString);
  return date.getDate();
}

export function formatMonthName(isoString: string): string {
  const date = parseISODate(isoString);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Returns an array of 14 consecutive ISO date strings starting today (the next 2 weeks)
 */
export function getNext14Days(startDate: Date = new Date()): string[] {
  const days: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(formatDateToISO(d));
  }
  return days;
}

/**
 * Parses "YYYY-MM-DD" and "HH:mm" into a JavaScript Date object
 */
export function parseEventDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

/**
 * Formats lead time in minutes into user-friendly text
 */
export function formatLeadTimeText(minutes: number): string {
  if (minutes === 0) return 'At time of event';
  if (minutes < 60) return `${minutes} min before`;
  if (minutes === 60) return '1 hour before';
  if (minutes === 120) return '2 hours before';
  if (minutes === 1440) return '1 day before';
  return `${Math.round(minutes / 60)} hours before`;
}
