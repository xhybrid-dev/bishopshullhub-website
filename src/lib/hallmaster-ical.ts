import ical from 'node-ical';

const ICAL_URL = 'https://v2.hallmaster.co.uk/api/ical/GetICalStream?HallId=10228';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedFeed: { data: Record<string, ical.CalendarComponent>; fetchedAt: number } | null = null;

export async function getHallmasterEvents(
  options: { force?: boolean } = {},
): Promise<Record<string, ical.CalendarComponent>> {
  const now = Date.now();
  if (!options.force && cachedFeed && now - cachedFeed.fetchedAt < CACHE_TTL_MS) {
    return cachedFeed.data;
  }
  const data = await ical.async.fromURL(ICAL_URL);
  cachedFeed = { data, fetchedAt: now };
  return data;
}
