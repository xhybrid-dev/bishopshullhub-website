import { startOfDay, addDays, subMilliseconds, eachDayOfInterval, isSameDay, max } from 'date-fns';

// Events occupy the half-open interval [start, end): a booking that ends
// exactly at midnight does not spill onto the following day.

export function eventOverlapsDay(start: Date, end: Date, day: Date): boolean {
  const dayStart = startOfDay(day);
  return start < addDays(dayStart, 1) && end > dayStart;
}

/** Every calendar day an event touches. */
export function eachEventDay(start: Date, end: Date): Date[] {
  const lastMoment = max([start, subMilliseconds(end, 1)]);
  return eachDayOfInterval({ start, end: lastMoment });
}

export function isMultiDayEvent(start: Date, end: Date): boolean {
  return !isSameDay(start, max([start, subMilliseconds(end, 1)]));
}
