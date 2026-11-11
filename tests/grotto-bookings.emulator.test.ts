/**
 * Capacity + register integration test against the Firestore emulator.
 * Run with: npm run test:grotto-emulator
 */
import { getAdminFirestore } from '../src/lib/firestore-admin';
import { getAvailability, getCapacity, recordPaidBooking, releaseHold, reservePlaces, SoldOutError } from '../src/lib/grotto-bookings';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, cond: unknown, detail = '') => results.push([!!cond, name, detail]);

const session = (id: string, n: number, hold?: string) => ({
  id, payment_status: 'paid', amount_total: 250 * n, payment_intent: 'pi_' + id, customer_email: `${id}@x.co`,
  metadata: {
    parent_name: 'Parent ' + id, parent_phone: '07000', ...(hold ? { hold_id: hold } : {}),
    ...Object.fromEntries(Array.from({ length: n }, (_, i) => [`child_${i + 1}`, `Kid${i + 1} | age ${3 + i} | Girl`])),
  },
});

(async () => {
  check('starts with all 60 places free', (await getAvailability()).remaining === 60);

  const h1 = await reservePlaces(6);
  check('a hold reduces availability', (await getAvailability()).remaining === 54);

  const rec = await recordPaidBooking(session('s1', 3, h1.holdId));
  check('paid booking recorded', rec.created && rec.booking.children.length === 3 && rec.booking.parentName === 'Parent s1');
  check('hold released, 3 sold', (await getAvailability()).remaining === 57);

  const again = await recordPaidBooking(session('s1', 3));
  check('duplicate webhook is ignored', !again.created && (await getAvailability()).remaining === 57);

  // fill up: 57 left → 9 holds of 6 = 54, then 3 more
  for (let i = 0; i < 9; i++) await reservePlaces(6);
  await reservePlaces(3);
  check('fully held', (await getAvailability()).remaining === 0);
  let err: unknown;
  await reservePlaces(1).catch((e) => (err = e));
  check('61st place refused', err instanceof SoldOutError && (err as SoldOutError).remaining === 0);

  // concurrent race for the last places
  const h = await reservePlaces(0 + 1).catch(() => null);
  check('no place left to race for', h === null);

  const hx = await getAdminFirestore().collection('grotto_holds').limit(1).get();
  await releaseHold(hx.docs[0].id);
  const race = await Promise.allSettled([reservePlaces(5), reservePlaces(5), reservePlaces(5)]);
  const won = race.filter((r) => r.status === 'fulfilled').length;
  check('concurrent reservations cannot oversell the last 6', won === 1, `won=${won}`);

  for (let i = 0; i < 9; i++) await recordPaidBooking(session('fill' + i, 6)); // 3 + 54 = 57 sold
  const over = await recordPaidBooking(session('s2', 6)); // 63 > 60
  check('a late paid booking past capacity is still recorded but flagged', over.created && over.overCapacity);

  // --- admin-set capacity overrides the default ---
  check('default capacity is 60 when nothing is saved', (await getCapacity()) === 60);
  const settings = getAdminFirestore().doc('grotto_meta/settings');
  await settings.set({ capacity: 500 });
  const a100 = await getAvailability();
  const sold = (await getAdminFirestore().doc('grotto_meta/stats').get()).data()?.childrenSold as number;
  const holdDocs = await getAdminFirestore().collection('grotto_holds').get();
  const held = holdDocs.docs.reduce((n, d) => n + (d.data().children as number), 0);
  check('raising the capacity opens places', a100.capacity === 500 && a100.remaining > 0, JSON.stringify(a100));
  check('remaining = capacity - sold - held', a100.remaining === Math.max(0, 500 - sold - held), JSON.stringify({ a100, sold, held }));
  const grabbed = await reservePlaces(1).catch((e) => e);
  check('a place can now be reserved', !(grabbed instanceof Error), String(grabbed));
  await settings.set({ capacity: 10 });
  check('lowering below sold shows 0 left', (await getAvailability()).remaining === 0);
  let lowErr: unknown;
  await reservePlaces(1).catch((e) => (lowErr = e));
  check('lowered capacity refuses new holds', lowErr instanceof SoldOutError);
  const flagged = await recordPaidBooking(session('s3', 1));
  check('over-capacity check uses the saved capacity', flagged.created && flagged.overCapacity && flagged.capacity === 10);
  await settings.set({ capacity: -5 });
  check('an invalid saved capacity falls back to the default', (await getCapacity()) === 60);
  await settings.delete();
  check('deleting the setting restores the default', (await getCapacity()) === 60);

  let failed = 0;
  for (const [ok, name, detail] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`); }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
