import { CalendarReminder } from '../types';
import { parseEventDateTime } from './date';

/**
 * Creates a Google Calendar Web Intent URL
 */
export function createGoogleCalendarUrl(reminder: CalendarReminder, durationMinutes: number = 45): string {
  const eventDate = parseEventDateTime(reminder.date, reminder.time);
  const endDate = new Date(eventDate.getTime() + durationMinutes * 60 * 1000);

  const formatGCalDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const datesParam = `${formatGCalDate(eventDate)}/${formatGCalDate(endDate)}`;
  const title = encodeURIComponent(reminder.title);
  const details = encodeURIComponent(
    `${reminder.description || 'HabitFlow Reminder'}\n\nLead time alert: ${reminder.leadTimeMinutes} min before event.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}`;
}

/**
 * Generates and downloads a standard .ics iCalendar file with standard VALARM trigger
 */
export function downloadIcsFile(reminder: CalendarReminder, durationMinutes: number = 45): void {
  const startDate = parseEventDateTime(reminder.date, reminder.time);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatIcsDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };

  // Build VALARM trigger string (e.g. -PT15M or -PT1H or -P1D)
  let triggerStr = '-PT0M';
  if (reminder.leadTimeMinutes > 0) {
    if (reminder.leadTimeMinutes >= 1440) {
      triggerStr = `-P${Math.round(reminder.leadTimeMinutes / 1440)}D`;
    } else if (reminder.leadTimeMinutes >= 60 && reminder.leadTimeMinutes % 60 === 0) {
      triggerStr = `-PT${reminder.leadTimeMinutes / 60}H`;
    } else {
      triggerStr = `-PT${reminder.leadTimeMinutes}M`;
    }
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HabitFlow//Habit Tracker App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:habitflow-${reminder.id}@habitflow.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${reminder.title}`,
    `DESCRIPTION:${reminder.description || 'Reminder from HabitFlow'}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${reminder.title}`,
    `TRIGGER:${triggerStr}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${reminder.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_reminder.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
