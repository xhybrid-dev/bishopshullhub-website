import { NextRequest, NextResponse } from 'next/server';
import {
  GROTTO_EVENT_LABEL,
  GROTTO_TICKET_PRICE_PENCE,
  validateGrottoBooking,
} from '@/lib/santa-grotto';

// Light per-instance throttle: the endpoint is public and creates Stripe
// sessions. (App Hosting runs a single instance, so in-memory is exact.)
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 15;

function throttled(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_HITS;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Payments are not set up yet.' }, { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  const v = validateGrottoBooking(body);
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 400 });

  const siteUrl = (process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin).replace(/\/$/, '');
  const childMeta = v.children.map((c, i) => [`child_${i + 1}`, `${c.name} | age ${c.age} | ${c.gender}`] as const);

  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('customer_email', v.parent.email);
  p.set('success_url', `${siteUrl}/christmas2026/thank-you?session_id={CHECKOUT_SESSION_ID}`);
  p.set('cancel_url', `${siteUrl}/christmas2026`);
  p.set('line_items[0][quantity]', String(v.children.length));
  p.set('line_items[0][price_data][currency]', 'gbp');
  p.set('line_items[0][price_data][unit_amount]', String(GROTTO_TICKET_PRICE_PENCE));
  p.set('line_items[0][price_data][product_data][name]', 'Meet Santa - Bishops Hull Hub Santa Grotto');
  p.set(
    'line_items[0][price_data][product_data][description]',
    'Saturday 12th December 2026, 10am-12pm. Arrive before 11am to see Santa. One ticket per child.',
  );
  for (const prefix of ['metadata', 'payment_intent_data[metadata]']) {
    p.set(`${prefix}[event]`, GROTTO_EVENT_LABEL);
    p.set(`${prefix}[parent_name]`, v.parent.name);
    if (prefix === 'metadata') p.set(`${prefix}[parent_phone]`, v.parent.phone);
    childMeta.forEach(([k, val]) => p.set(`${prefix}[${k}]`, val));
  }

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: p,
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Stripe error', data.error);
      return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 502 });
    }
    return NextResponse.json({ url: data.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not reach the payment provider.' }, { status: 502 });
  }
}
