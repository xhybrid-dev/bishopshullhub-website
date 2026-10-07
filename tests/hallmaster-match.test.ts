/**
 * Hallmaster matching tests: a booking's own Hallmaster entry must never
 * read as a clash, and clash detection stops once the booking is entered.
 * Run with: npm run test:hallmaster
 */
import { checkAgainstHallmaster, titleMatchesHirer } from '../src/lib/hallmaster-match';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, got: unknown, want: unknown) =>
  results.push([got === want, name, `got=${got} want=${want}`]);

// 14 Nov 2026 is GMT, so UK wall-clock 18:00 is 18:00Z.
const enquiry = { name: 'Jane Smith', dateRequired: '2026-11-14', startTime: '18:00', endTime: '22:00' };
const own = { summary: 'Smith - 50th Birthday', start: '2026-11-14T18:00:00.000Z', end: '2026-11-14T22:00:00.000Z' };
const other = { summary: 'Yoga Club', start: '2026-11-14T19:00:00.000Z', end: '2026-11-14T20:00:00.000Z' };
const renamed = { summary: 'Birthday party', start: '2026-11-14T17:30:00.000Z', end: '2026-11-14T22:00:00.000Z' };

// --- title matching ---
check('surname matches', titleMatchesHirer('Smith - 50th Birthday', enquiry), true);
check('full name matches', titleMatchesHirer('Party (Jane Smith)', enquiry), true);
check('first name alone does not', titleMatchesHirer("Jane's Yoga", enquiry), false);
check('surname must be a whole word', titleMatchesHirer('Smithson Wedding', enquiry), false);
check('organisation matches',
  titleMatchesHirer('Taunton Scouts AGM', { name: 'Bob Lee', confirmation: { organisation: 'Taunton Scouts' } }), true);

// --- Enquiry Received (not yet entered) ---
check('free slot → unbooked, no clashes',
  checkAgainstHallmaster(enquiry, [], false)?.state, 'unbooked');
const clash = checkAgainstHallmaster(enquiry, [other], false);
check('other booking is a clash', clash?.state === 'unbooked' && clash.clashes.length, 1);
const entered = checkAgainstHallmaster(enquiry, [own], false);
check('own entry is on-hallmaster, not a clash',
  entered?.state === 'on-hallmaster' && entered.clashes.length, 0);
const both = checkAgainstHallmaster(enquiry, [own, other], false);
check('own entry plus another booking still flags the other',
  both?.state === 'on-hallmaster' && both.clashes.length, 1);

// --- after the provisional booking is signed off ---
const later = checkAgainstHallmaster(enquiry, [own, other], true);
check('later stage: no clashes reported',
  later?.state === 'on-hallmaster' && later.clashes.length, 0);
check('later stage, title differs → likely on Hallmaster',
  checkAgainstHallmaster(enquiry, [renamed], true)?.state, 'likely-on-hallmaster');
check('later stage, nothing at that time → not found',
  checkAgainstHallmaster(enquiry, [], true)?.state, 'not-found');
check('adjacent event is not an overlap',
  checkAgainstHallmaster(enquiry, [{ summary: 'Smith', start: '2026-11-14T22:00:00.000Z', end: '2026-11-14T23:00:00.000Z' }], true)?.state,
  'not-found');

// --- BST: 14 Jul 2026 18:00 UK is 17:00Z ---
check('BST entry still matches',
  checkAgainstHallmaster({ ...enquiry, dateRequired: '2026-07-14' },
    [{ summary: 'Smith', start: '2026-07-14T17:00:00.000Z', end: '2026-07-14T21:00:00.000Z' }], true)?.state,
  'on-hallmaster');

let failed = 0;
for (const [ok, name, detail] of results) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (${detail})`}`);
  if (!ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
