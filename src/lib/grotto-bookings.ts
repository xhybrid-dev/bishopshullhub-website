import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firestore-admin';
import { childrenFromMetadata, GROTTO_CAPACITY, GROTTO_HOLD_MINUTES } from '@/lib/santa-grotto';

// Collections (the register itself is `grotto_bookings`, read by admins in the
// portal; the other two are server-only bookkeeping):
//   grotto_bookings/{stripeSessionId}  one paid booking
//   grotto_holds/{id}                  places reserved while someone is on the Stripe page
//   grotto_meta/stats                  { childrenSold } running total
const BOOKINGS = 'grotto_bookings';
const HOLDS = 'grotto_holds';
const STATS = 'grotto_meta/stats';

export class SoldOutError extends Error {
  constructor(public remaining: number) {
    super(remaining > 0 ? `Only ${remaining} place${remaining === 1 ? '' : 's'} left.` : 'Sorry, the grotto is fully booked.');
  }
}

export async function getAvailability() {
  const db = getAdminFirestore();
  const [stats, holds] = await Promise.all([
    db.doc(STATS).get(),
    db.collection(HOLDS).where('expiresAt', '>', Timestamp.now()).get(),
  ]);
  const sold = (stats.data()?.childrenSold as number | undefined) ?? 0;
  const held = holds.docs.reduce((n, d) => n + ((d.data().children as number) ?? 0), 0);
  return { capacity: GROTTO_CAPACITY, remaining: Math.max(0, GROTTO_CAPACITY - sold - held) };
}

/**
 * Reserves `count` places for the length of a Stripe Checkout Session, in a
 * transaction so two people can't both take the last places.
 */
export async function reservePlaces(count: number): Promise<{ holdId: string; expiresAtSeconds: number }> {
  const db = getAdminFirestore();
  const holdRef = db.collection(HOLDS).doc();
  const expires = Date.now() + (GROTTO_HOLD_MINUTES + 1) * 60_000;
  await db.runTransaction(async (tx) => {
    const [stats, holds] = await Promise.all([
      tx.get(db.doc(STATS)),
      tx.get(db.collection(HOLDS).where('expiresAt', '>', Timestamp.now())),
    ]);
    const sold = (stats.data()?.childrenSold as number | undefined) ?? 0;
    const held = holds.docs.reduce((n, d) => n + ((d.data().children as number) ?? 0), 0);
    const remaining = GROTTO_CAPACITY - sold - held;
    if (count > remaining) throw new SoldOutError(Math.max(0, remaining));
    tx.set(holdRef, { children: count, expiresAt: Timestamp.fromMillis(expires), createdAt: Timestamp.now() });
  });
  return { holdId: holdRef.id, expiresAtSeconds: Math.floor(Date.now() / 1000) + GROTTO_HOLD_MINUTES * 60 };
}

export async function releaseHold(holdId: string | undefined | null) {
  if (!holdId) return;
  await getAdminFirestore().collection(HOLDS).doc(holdId).delete().catch(() => {});
}

export interface StripeCheckoutSession {
  id: string;
  payment_status?: string;
  amount_total?: number | null;
  payment_intent?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
}

export interface RecordedBooking {
  created: boolean;
  overCapacity: boolean;
  booking: {
    parentName: string; parentEmail: string; parentPhone: string;
    children: Array<{ name: string; age: number | null; gender: string; arrived: boolean }>;
    amountPence: number;
  };
}

/** Writes a paid session into the register. Safe to call twice for the same session. */
export async function recordPaidBooking(session: StripeCheckoutSession): Promise<RecordedBooking> {
  const meta = session.metadata ?? {};
  const children = childrenFromMetadata(meta).map((c) => ({ ...c, arrived: false }));
  const booking = {
    parentName: meta.parent_name ?? '',
    parentEmail: session.customer_email ?? session.customer_details?.email ?? '',
    parentPhone: meta.parent_phone ?? '',
    children,
    amountPence: session.amount_total ?? 0,
  };

  const db = getAdminFirestore();
  const bookingRef = db.collection(BOOKINGS).doc(session.id);
  const statsRef = db.doc(STATS);
  const result = await db.runTransaction(async (tx) => {
    const [existing, stats] = await Promise.all([tx.get(bookingRef), tx.get(statsRef)]);
    if (existing.exists) return { created: false, overCapacity: false };
    const sold = (stats.data()?.childrenSold as number | undefined) ?? 0;
    const overCapacity = sold + children.length > GROTTO_CAPACITY;
    tx.set(bookingRef, {
      ...booking,
      childCount: children.length,
      paymentIntent: session.payment_intent ?? null,
      overCapacity,
      createdAt: Timestamp.now(),
    });
    tx.set(statsRef, { childrenSold: sold + children.length }, { merge: true });
    if (meta.hold_id) tx.delete(db.collection(HOLDS).doc(meta.hold_id));
    return { created: true, overCapacity };
  });
  return { ...result, booking };
}
