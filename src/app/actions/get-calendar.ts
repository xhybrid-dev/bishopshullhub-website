
'use server';

import { startOfWeek, subDays, addMonths, format } from 'date-fns';
import { getHallmasterEvents } from '@/lib/hallmaster-ical';

export type LiveEvent = {
  id: string;
  summary: string;
  start: string; // ISO string
  end: string;   // ISO string
  description?: string;
  location?: string;
  dayOfWeek: string;
};

/**
 * Fetches and parses the Hallmaster iCal stream.
 * Returns a window of events to support week/month navigation
 * (2 weeks back, 12 months forward).
 */
export async function getLiveCalendarEventsAction(options: { force?: boolean } = {}) {
  try {
    const events = await getHallmasterEvents({ force: options.force });

    const now = new Date();
    const rangeStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 14);
    const rangeEnd = addMonths(now, 12);

    const processedEvents: LiveEvent[] = [];

    Object.values(events).forEach((event) => {
      if (event.type === 'VEVENT') {
        if (event.status?.toUpperCase() === 'CANCELLED') return;

        const start = new Date(event.start);
        const end = new Date(event.end);

        // Keep any event overlapping the window, so multi-day events that
        // started before the window still appear on the days they cover.
        if (start <= rangeEnd && end >= rangeStart) {
          const rawDescription = event.description || '';

          const cleanedDescription = rawDescription
            .replace(/https:\/\/v2\.hallmaster\.co\.uk\/Scheduler\/ViewBooking\/\S+/g, '')
            .replace(/http[s]?:\/\/\S+/g, '')
            .trim();

          processedEvents.push({
            id: event.uid || Math.random().toString(36),
            summary: event.summary,
            start: start.toISOString(),
            end: end.toISOString(),
            description: cleanedDescription,
            location: event.location || '',
            dayOfWeek: format(start, 'EEEE'),
          });
        }
      }
    });

    return {
      success: true,
      events: processedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    };
  } catch (error) {
    console.error('Failed to fetch iCal feed:', error);
    return { success: false, error: 'Failed to sync with live hall calendar' };
  }
}
