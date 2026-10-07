/**
 * Compares a booking enquiry with the live Hallmaster feed.
 *
 * Once the bookings secretary has entered a booking on Hallmaster, the feed
 * contains an event at the same time as the enquiry — which a plain overlap
 * check reports as a clash with itself. This module tells the two apart:
 *
 *  - An overlapping event whose title carries the hirer's name (or their
 *    organisation) is the enquiry's own Hallmaster entry: "on Hallmaster",
 *    never a clash.
 *  - Clashes only matter before the booking is entered — that is the
 *    Enquiry Received check. Once the provisional booking is signed off (or
 *    the card has moved on), any remaining overlap is the secretary's own
 *    entry under a different title, so it is reported as "likely on
 *    Hallmaster" rather than as a clash.
 */
import { ukDateTimeToInstant } from './uk-time';

export type HallmasterEvent = { summary: string; start: string; end: string };

export type HallmasterCheck =
  /** A feed event overlaps and carries the hirer's name. */
  | { state: 'on-hallmaster'; event: HallmasterEvent; clashes: HallmasterEvent[] }
  /** Past Enquiry Received; something is booked then, but under another title. */
  | { state: 'likely-on-hallmaster'; events: HallmasterEvent[] }
  /** Past Enquiry Received and nothing on Hallmaster at that time. */
  | { state: 'not-found' }
  /** Still at Enquiry Received: genuine clashes, if any. */
  | { state: 'unbooked'; clashes: HallmasterEvent[] };

const normalise = (s: unknown) =>
  ` ${String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

/**
 * Whether a Hallmaster event title refers to this hirer. Matches the full
 * name, the surname, or the organisation as whole words — a first name alone
 * is too common to trust ("John" would match "John's Yoga").
 */
export function titleMatchesHirer(summary: string, enquiry: any): boolean {
  const title = normalise(summary);
  if (title.trim() === '') return false;

  const candidates: string[] = [];
  const name = normalise(enquiry?.name).trim();
  if (name) {
    candidates.push(name);
    const parts = name.split(' ');
    if (parts.length > 1) candidates.push(parts[parts.length - 1]);
  }
  const org = normalise(enquiry?.confirmation?.organisation ?? enquiry?.organisation).trim();
  if (org) candidates.push(org);

  return candidates.some(c => c.length >= 3 && title.includes(` ${c} `));
}

/**
 * @param bookedOnHallmaster true once the secretary has signed off the
 *   provisional booking or the enquiry has moved beyond Enquiry Received.
 */
export function checkAgainstHallmaster(
  enquiry: any,
  liveEvents: HallmasterEvent[],
  bookedOnHallmaster: boolean,
): HallmasterCheck | null {
  if (!enquiry?.dateRequired || !enquiry.startTime || !enquiry.endTime) return null;
  // Resolve in Europe/London rather than the admin's local zone so this
  // matches what check-availability decides on the server.
  const reqStart = ukDateTimeToInstant(enquiry.dateRequired, enquiry.startTime);
  const reqEnd = ukDateTimeToInstant(enquiry.dateRequired, enquiry.endTime);
  if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) return null;

  const overlapping = liveEvents.filter(ev => {
    const evStart = new Date(ev.start);
    const evEnd = new Date(ev.end);
    return reqStart < evEnd && reqEnd > evStart;
  });

  // Prefer an exact-time match when the hirer has more than one entry nearby.
  const named = overlapping.filter(ev => titleMatchesHirer(ev.summary, enquiry));
  const own =
    named.find(ev => new Date(ev.start).getTime() === reqStart.getTime()
      && new Date(ev.end).getTime() === reqEnd.getTime()) ?? named[0];

  if (own) {
    // Other events at the same time are still worth flagging while the
    // booking is being set up; after that, the first-stage check has done its job.
    const clashes = bookedOnHallmaster ? [] : overlapping.filter(ev => ev !== own && !named.includes(ev));
    return { state: 'on-hallmaster', event: own, clashes };
  }
  if (!bookedOnHallmaster) return { state: 'unbooked', clashes: overlapping };
  if (overlapping.length > 0) return { state: 'likely-on-hallmaster', events: overlapping };
  return { state: 'not-found' };
}
