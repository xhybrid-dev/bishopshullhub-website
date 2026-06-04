'use server';

import { isSameDay } from 'date-fns';
import { getHallmasterEvents } from '@/lib/hallmaster-ical';

export type ClashingEvent = {
  summary: string;
  start: string; // ISO string
  end: string;   // ISO string
};

export type AvailabilityResult =
  | { status: 'available' }
  | { status: 'buffer-warning'; adjacent: ClashingEvent[] }
  | { status: 'clash'; clashes: ClashingEvent[] }
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
    const requestedStart = new Date(`${date}T${startTime}:00`);
    const requestedEnd   = new Date(`${date}T${endTime}:00`);

    const events = await getHallmasterEvents();

    const clashes: ClashingEvent[] = [];
    const adjacent: ClashingEvent[] = [];

    Object.values(events).forEach((event) => {
      if (event.type !== 'VEVENT') return;

      const eventStart = new Date(event.start);
      const eventEnd   = new Date(event.end);

      if (!isSameDay(eventStart, requestedStart)) return;

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
