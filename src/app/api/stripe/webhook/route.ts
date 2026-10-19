import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyStripeSignature } from '@/lib/stripe-signature';
import { recordPaidBooking, releaseHold, type StripeCheckoutSession } from '@/lib/grotto-bookings';
import { GROTTO_CAPACITY } from '@/lib/santa-grotto';

const resend = new Resend(process.env.RESEND_API_KEY || 're_your_api_key_here');
const ADMIN_EMAIL = 'booking@bishopshullhub.co.uk';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function notifyAdmin(rec: Awaited<ReturnType<typeof recordPaidBooking>>) {
  const b = rec.booking;
  const kids = b.children.map((c) => `${c.name} (${c.age ?? '?'}, ${c.gender || '—'})`).join(', ');
  const subject = `Santa Grotto booking: ${b.parentName} (${b.children.length} child${b.children.length === 1 ? '' : 'ren'})`;
  const text = `New Santa Grotto booking\n\nParent: ${b.parentName}\nEmail: ${b.parentEmail}\nPhone: ${b.parentPhone}\nChildren: ${kids}\nPaid: £${(b.amountPence / 100).toFixed(2)}` +
    (rec.overCapacity ? `\n\nWARNING: this takes the grotto over its ${GROTTO_CAPACITY}-child capacity. Check the register.` : '');
  if (!process.env.RESEND_API_KEY) { console.log(`[grotto] (email simulated)\n${subject}\n${text}`); return; }
  await resend.emails.send({
    from: 'Bishops Hull Hub <noreply@bishopshullhub.co.uk>',
    to: ADMIN_EMAIL,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2>New Santa Grotto booking</h2>
      <p><strong>Parent:</strong> ${esc(b.parentName)}<br><strong>Email:</strong> ${esc(b.parentEmail)}<br><strong>Phone:</strong> ${esc(b.parentPhone)}</p>
      <p><strong>Children:</strong> ${esc(kids)}</p><p><strong>Paid:</strong> £${(b.amountPence / 100).toFixed(2)}</p>
      ${rec.overCapacity ? `<p style="color:#b00020"><strong>Over capacity (${GROTTO_CAPACITY}). Check the register.</strong></p>` : ''}</div>`,
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });

  // The signature covers the exact bytes Stripe sent, so read the raw text.
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  let event: { type: string; data: { object: StripeCheckoutSession } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Bad payload.' }, { status: 400 });
  }
  const session = event.data?.object;

  try {
    if (event.type === 'checkout.session.completed' && session?.payment_status === 'paid') {
      // Only this event writes the register; a failure returns 500 so Stripe retries.
      const rec = await recordPaidBooking(session);
      if (rec.created) await notifyAdmin(rec).catch((e) => console.error('Grotto admin email failed', e));
    } else if (event.type === 'checkout.session.expired') {
      await releaseHold(session?.metadata?.hold_id);
    }
  } catch (e) {
    console.error('Stripe webhook failed', e);
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
