/**
 * Helpers for turning the "YYYY-MM-DD" + "HH:mm" values the booking form and
 * chatbot collect into real instants.
 *
 * Those values are always UK wall-clock times — that is what the hirer typed
 * and what Hallmaster shows. `new Date("2026-08-01T15:00:00")` resolves them
 * against the *runtime's* zone, which is UTC on Firebase App Hosting, so every
 * comparison against the live calendar was an hour out for the whole of BST.
 */

const UK_ZONE = 'Europe/London';

const ukParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: UK_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Milliseconds Europe/London is ahead of UTC at the given instant (0 or +1h). */
function ukOffsetAt(instant: number): number {
  const parts = ukParts.formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    // Some ICU builds render midnight as "24" under hour12:false.
    get('hour') % 24,
    get('minute'),
    get('second')
  );
  return asIfUtc - instant;
}

/**
 * Converts a UK wall-clock date + time to the instant it refers to.
 * Returns an Invalid Date if either part is malformed.
 */
export function ukDateTimeToInstant(date: string, time: string): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  if (!dateMatch || !timeMatch) return new Date(NaN);

  const [, y, mo, d] = dateMatch.map(Number);
  const [, h, mi] = timeMatch.map(Number);
  if (h > 23 || mi > 59) return new Date(NaN);

  const naive = Date.UTC(y, mo - 1, d, h, mi, 0);

  // Subtracting the offset shifts us to a different instant, which — twice a
  // year — sits on the other side of a DST transition. Re-reading the offset at
  // the corrected instant settles it.
  const firstPass = naive - ukOffsetAt(naive);
  const settled = naive - ukOffsetAt(firstPass);
  return new Date(settled);
}

/** Midnight UK time at the start of the given "YYYY-MM-DD". */
export function ukDateToInstant(date: string): Date {
  return ukDateTimeToInstant(date, '00:00');
}

/** Midnight UK time at the start of today. */
export function ukStartOfToday(now: Date = new Date()): Date {
  const parts = ukParts.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return ukDateToInstant(`${get('year')}-${get('month')}-${get('day')}`);
}
