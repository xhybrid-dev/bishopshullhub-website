/**
 * Capacity + register integration test against the Firestore emulator.
 * Run with: npm run test:grotto-emulator
 */
import { getAdminFirestore } from '../src/lib/firestore-admin';
import { getAvailability, recordPaidBooking, releaseHold, reservePlaces, SoldOutError } from '../src/lib/grotto-bookings';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, cond: unknown, detail = '') => results.push([!!cond, name, detail]);

const session = (id: string, n: number, hold?: string) => ({
  id, payment_status: 'paid', amount_total: 500 * n, payment_intent: 'pi_' + id, customer_email: `${id}@x.co`,
  metadata: {
    parent_name: 'Parent ' + id, parent_phone: '07000', ...(hold ? { hold_id: hold } : {}),
    ...Object.fromEntries(Array.from({ length: n }, (_, i) => [`child_${i + 1}`, `Kid${i + 1} | age ${3 + i} | Girl`])),
  },
});

(async () => {
  check('starts with all 80 places free', (await getAvailability()).remaining === 80);

  const h1 = await reservePlaces(6);
  check('a hold reduces availability', (await getAvailability()).remaining === 74);

  const rec = await recordPaidBooking(session('s1', 3, h1.holdId));
  check('paid booking recorded', rec.created && rec.booking.children.length === 3 && rec.booking.parentName === 'Parent s1');
  check('hold released, 3 sold', (await getAvailability()).remaining === 77);

  const again = await recordPaidBooking(session('s1', 3));
  check('duplicate webhook is ignored', !again.created && (await getAvailability()).remaining === 77);

  // fill up: 77 left → 12 holds of 6 = 72, then 5 more
  for (let i = 0; i < 12; i++) await reservePlaces(6);
  await reservePlaces(5);
  check('fully held', (await getAvailability()).remaining === 0);
  let err: unknown;
  await reservePlaces(1).catch((e) => (err = e));
  check('81st place refused', err instanceof SoldOutError && (err as SoldOutError).remaining === 0);

  // concurrent race for the last places
  const h = await reservePlaces(0 + 1).catch(() => null);
  check('no place left to race for', h === null);

  const hx = await getAdminFirestore().collection('grotto_holds').limit(1).get();
  await releaseHold(hx.docs[0].id);
  const race = await Promise.allSettled([reservePlaces(5), reservePlaces(5), reservePlaces(5)]);
  const won = race.filter((r) => r.status === 'fulfilled').length;
  check('concurrent reservations cannot oversell the last 6', won === 1, `won=${won}`);

  for (let i = 0; i < 12; i++) await recordPaidBooking(session('fill' + i, 6)); // 3 + 72 = 75 sold
  const over = await recordPaidBooking(session('s2', 6)); // 81 > 80
  check('a late paid booking past capacity is still recorded but flagged', over.created && over.overCapacity);

  let failed = 0;
  for (const [ok, name, detail] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`); }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
