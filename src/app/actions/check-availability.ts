'use server';

import { getHallmasterEvents } from '@/lib/hallmaster-ical';
import { ukDateTimeToInstant } from '@/lib/uk-time';
import { endsByClosing, closingLabelForDate, CLOSING_RULE_TEXT } from '@/lib/venue-hours';

export type ClashingEvent = {
  summary: string;
  start: string; // ISO string
  end: string;   // ISO string
};

export type AvailabilityResult =
  | { status: 'available' }
  | { status: 'buffer-warning'; adjacent: ClashingEvent[] }
  | { status: 'clash'; clashes: ClashingEvent[] }
  | { status: 'after-hours'; message: string }
  | { status: 'error'; message: string };

const BUFFER_MINUTES = 15;
const BUFFER_MS = BUFFER_MINUTES * 60 * 1000;

/**
 * Warms the iCal cache without returning any data.
 * Call this on page load so the feed is ready before the user needs it.
 */
export async function prefetchAvailabilityCache(): Promise<void> {
  try {
    await getHallmasterEvents();
  } catch {
    // Silently ignore — the real check will handle any error
  }
}

/**
 * Checks a requested date + time window against the live Hallmaster iCal feed.
 * Returns whether the slot is free, sits within 15 minutes of another booking,
 * clashes outright, or whether the check failed.
 *
 * Overlap rule: two intervals clash when requestedStart < existingEnd AND requestedEnd > existingStart.
 * Buffer rule: a non-clashing event whose end is within 15 minutes of requestedStart, or whose
 * start is within 15 minutes of requestedEnd, triggers a buffer warning.
 */
export async function checkAvailabilityAction(
  date: string,       // "YYYY-MM-DD"
  startTime: string,  // "HH:mm"
  endTime: string     // "HH:mm"
): Promise<AvailabilityResult> {
  try {
    // The hirer's date/time are UK wall-clock values; the feed gives absolute
    // instants. Resolving them in Europe/London keeps the comparison honest
    // year-round rather than only during GMT.
    const requestedStart = ukDateTimeToInstant(date, startTime);
    const requestedEnd   = ukDateTimeToInstant(date, endTime);

    if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
      return { status: 'error', message: 'That date or time could not be read. Please re-enter them and try again.' };
    }
    // Closing-time policy: reject requests ending after the venue's closing
    // time for that day before touching the live calendar.
    if (!endsByClosing(date, endTime)) {
      const day = new Date(`${date}T00:00:00`);
      const weekday = day.toLocaleDateString('en-GB', { weekday: 'long' });
      return {
        status: 'after-hours',
        message: `Bookings on a ${weekday} must end by ${closingLabelForDate(day)}. ${CLOSING_RULE_TEXT}`,
      };
    }

    const events = await getHallmasterEvents();

    const clashes: ClashingEvent[] = [];
    const adjacent: ClashingEvent[] = [];

    Object.values(events).forEach((event) => {
      if (event.type !== 'VEVENT') return;
      // A cancelled booking doesn't hold the slot — the calendar view already
      // skips these, so the availability check has to as well.
      if (event.status?.toUpperCase() === 'CANCELLED') return;

      const eventStart = new Date(event.start);
      const eventEnd   = new Date(event.end);

      const entry: ClashingEvent = {
        summary: event.summary || 'Existing booking',
        start: eventStart.toISOString(),
        end: eventEnd.toISOString(),
      };

      if (requestedStart < eventEnd && requestedEnd > eventStart) {
        clashes.push(entry);
        return;
      }

      // Non-clashing — check the 15-minute buffer.
      const gapBefore = requestedStart.getTime() - eventEnd.getTime();   // existing ends before us
      const gapAfter  = eventStart.getTime() - requestedEnd.getTime();   // existing starts after us
      if ((gapBefore >= 0 && gapBefore < BUFFER_MS) || (gapAfter >= 0 && gapAfter < BUFFER_MS)) {
        adjacent.push(entry);
      }
    });

    if (clashes.length > 0) {
      return { status: 'clash', clashes };
    }

    if (adjacent.length > 0) {
      return { status: 'buffer-warning', adjacent };
    }

    return { status: 'available' };
  } catch {
    return { status: 'error', message: 'Could not reach the live calendar. Please check the availability calendar in Step 1.' };
  }
}
