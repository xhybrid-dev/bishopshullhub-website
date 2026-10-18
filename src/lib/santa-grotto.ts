// Shared by the /christmas2026 booking form (client) and the Stripe checkout
// route (server), so both enforce the same limits.
export const GROTTO_TICKET_PRICE_PENCE = 500;
export const GROTTO_MAX_CHILDREN = 6;
export const GROTTO_GENDERS = ['Girl', 'Boy', 'Prefer not to say'] as const;
export const GROTTO_EVENT_LABEL = 'Santa Grotto 2026-12-12';
// Saturday 12 Dec 2026, 10:00 UK time (GMT in December).
export const GROTTO_START_ISO = '2026-12-12T10:00:00Z';

const clean = (s: unknown, max: number) =>
  String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);

export interface GrottoBooking {
  parent: { name: string; email: string; phone: string };
  children: Array<{ name: string; age: number; gender: (typeof GROTTO_GENDERS)[number] }>;
}

export function validateGrottoBooking(b: any): { error: string } | GrottoBooking {
  const parent = {
    name: clean(b?.parent?.name, 80),
    email: clean(b?.parent?.email, 120),
    phone: clean(b?.parent?.phone, 30),
  };
  if (!parent.name) return { error: 'Please tell us the grown-up’s name.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parent.email)) return { error: 'Please enter a valid email address.' };
  if (!parent.phone) return { error: 'Please add a contact phone number.' };
  if (!Array.isArray(b?.children) || b.children.length < 1 || b.children.length > GROTTO_MAX_CHILDREN)
    return { error: `Please add between 1 and ${GROTTO_MAX_CHILDREN} children.` };
  const children: GrottoBooking['children'] = [];
  for (const c of b.children) {
    const name = clean(c?.name, 60);
    const age = parseInt(c?.age, 10);
    const gender = clean(c?.gender, 30) as (typeof GROTTO_GENDERS)[number];
    if (!name) return { error: 'Every child needs a name.' };
    if (!(age >= 0 && age <= 17)) return { error: `Please enter a valid age for ${name}.` };
    if (!GROTTO_GENDERS.includes(gender)) return { error: `Please choose a gender for ${name}.` };
    children.push({ name, age, gender });
  }
  return { parent, children };
}
