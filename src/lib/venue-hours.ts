// Venue closing-time policy for Bishops Hull Hub bookings.
//
// All hires must END no later than:
//   - 23:00 on Monday to Thursday
//   - midnight on Friday to Sunday
//
// This module is the single source of truth for that rule — change the
// values in closingMinutesForDow to change the policy everywhere (booking
// form, chatbot, availability checks, admin edits).

const MINUTES_PER_DAY = 24 * 60;

/** Latest permitted end, in minutes after midnight, for a day of week (0=Sun..6=Sat). */
export function closingMinutesForDow(dow: number): number {
  return dow >= 1 && dow <= 4 ? 23 * 60 : MINUTES_PER_DAY;
}

export function closingMinutesForDate(date: Date): number {
  return closingMinutesForDow(date.getDay());
}

/** "HH:mm" → minutes after midnight. NaN for malformed input. */
export function timeToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Human label for a day's closing time: "23:00" or "midnight". */
export function closingLabelForDate(date: Date): string {
  return closingMinutesForDate(date) === MINUTES_PER_DAY ? 'midnight' : '23:00';
}

export const CLOSING_RULE_TEXT =
  'Bookings must end by 23:00 (11pm) Monday to Thursday, and by midnight Friday to Sunday.';

/**
 * True when an end time ("HH:mm") on the given date ("YYYY-MM-DD") respects
 * the closing time. An end of "00:00" is treated as midnight at the END of
 * that day. Malformed inputs return true so the dedicated date/time
 * validations report the error instead.
 */
export function endsByClosing(dateStr: string, endTime: string): boolean {
  const date = new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return true;
  let endMin = timeToMinutes(endTime);
  if (isNaN(endMin)) return true;
  if (endMin === 0) endMin = MINUTES_PER_DAY;
  return endMin <= closingMinutesForDate(date);
}
