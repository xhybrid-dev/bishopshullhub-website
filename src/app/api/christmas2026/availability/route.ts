import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/grotto-bookings';
import { GROTTO_CAPACITY } from '@/lib/santa-grotto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getAvailability());
  } catch (e) {
    // If the register is unreachable, don't block the page; checkout re-checks.
    console.error('Availability lookup failed', e);
    return NextResponse.json({ capacity: GROTTO_CAPACITY, remaining: null });
  }
}
