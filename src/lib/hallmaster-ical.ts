import ical from 'node-ical';

const ICAL_URL = 'https://v2.hallmaster.co.uk/api/ical/GetICalStream?HallId=10228';
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
/** How long a stale cache may still be served when Hallmaster is unreachable. */
const STALE_GRACE_MS = 60 * 60 * 1000;

type Feed = Record<string, ical.CalendarComponent>;

let cachedFeed: { data: Feed; fetchedAt: number } | null = null;
/** Shared across concurrent callers so one refresh serves them all. */
let inFlight: Promise<Feed> | null = null;

async function fetchFeed(): Promise<Feed> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(ICAL_URL, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Hallmaster iCal responded ${res.status}`);
    }
    return ical.async.parseICS(await res.text());
  } finally {
    clearTimeout(timer);
  }
}

export async function getHallmasterEvents(
  options: { force?: boolean } = {},
): Promise<Feed> {
  const now = Date.now();
  if (!options.force && cachedFeed && now - cachedFeed.fetchedAt < CACHE_TTL_MS) {
    return cachedFeed.data;
  }

  // Without this, a burst of visitors on a cold cache each open their own
  // request to Hallmaster.
  if (!inFlight) {
    inFlight = fetchFeed()
      .then((data) => {
        cachedFeed = { data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  try {
    return await inFlight;
  } catch (err) {
    // Prefer slightly stale bookings over failing the availability check
    // outright — but only for an hour, after which "unknown" is the honest answer.
    if (cachedFeed && Date.now() - cachedFeed.fetchedAt < STALE_GRACE_MS) {
      console.warn('[hallmaster-ical] refresh failed, serving stale feed:', err);
      return cachedFeed.data;
    }
    throw err;
  }
}
