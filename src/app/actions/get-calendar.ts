
'use server';

import { startOfWeek, isWithinInterval, subDays, addMonths, format } from 'date-fns';
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
export async function getLiveCalendarEventsAction() {
  try {
    const events = await getHallmasterEvents();

    const now = new Date();
    const rangeStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 14);
    const rangeEnd = addMonths(now, 12);

    const processedEvents: LiveEvent[] = [];

    Object.values(events).forEach((event) => {
      if (event.type === 'VEVENT') {
        const start = new Date(event.start);

        if (isWithinInterval(start, { start: rangeStart, end: rangeEnd })) {
          const rawDescription = event.description || '';

          const cleanedDescription = rawDescription
            .replace(/https:\/\/v2\.hallmaster\.co\.uk\/Scheduler\/ViewBooking\/\S+/g, '')
            .replace(/http[s]?:\/\/\S+/g, '')
            .trim();

          processedEvents.push({
            id: event.uid || Math.random().toString(36),
            summary: event.summary,
            start: start.toISOString(),
            end: new Date(event.end).toISOString(),
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
