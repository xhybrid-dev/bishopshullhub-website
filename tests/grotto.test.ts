/**
 * Santa Grotto register tests: Stripe signature checking, metadata parsing and
 * the age-ordered register. Run with: npm run test:grotto
 */
import { createHmac } from 'crypto';
import { verifyStripeSignature } from '../src/lib/stripe-signature';
import { parseChildMeta, childrenFromMetadata } from '../src/lib/santa-grotto';
import { buildRegisterRows, registerToCsv } from '../src/lib/grotto-register';
import { buildGrottoConfirmationEmail } from '../src/lib/grotto-email';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, cond: unknown, detail = '') => results.push([!!cond, name, detail]);

// --- webhook signature
const secret = 'whsec_test';
const body = '{"type":"checkout.session.completed"}';
const now = 1_800_000_000;
const sign = (t: number, b = body, s = secret) => `t=${t},v1=${createHmac('sha256', s).update(`${t}.${b}`).digest('hex')}`;
check('valid signature accepted', verifyStripeSignature(body, sign(now), secret, 300, now));
check('tampered body rejected', !verifyStripeSignature(body + ' ', sign(now), secret, 300, now));
check('wrong secret rejected', !verifyStripeSignature(body, sign(now, body, 'other'), secret, 300, now));
check('stale timestamp rejected', !verifyStripeSignature(body, sign(now - 1000), secret, 300, now));
check('missing header rejected', !verifyStripeSignature(body, null, secret, 300, now));
check('garbage signature rejected', !verifyStripeSignature(body, `t=${now},v1=zz`, secret, 300, now));

// --- metadata parsing
check('parses a child', JSON.stringify(parseChildMeta('Ava | age 5 | Girl')) === JSON.stringify({ name: 'Ava', age: 5, gender: 'Girl' }));
check('name containing a pipe survives', parseChildMeta('A | B | age 7 | Boy').name === 'A | B');
check('unparseable value keeps the text', parseChildMeta('mystery').name === 'mystery' && parseChildMeta('mystery').age === null);
const kids = childrenFromMetadata({ parent_name: 'P', child_10: 'Z | age 1 | Boy', child_2: 'B | age 2 | Girl', child_1: 'A | age 3 | Boy' });
check('children ordered numerically', kids.map((k) => k.name).join() === 'A,B,Z');

// --- register ordering and CSV
const rows = buildRegisterRows([
  { id: 'sess_aaaaaaaa1', parentName: 'Pat', parentPhone: '1', parentEmail: 'p@x.co', children: [{ name: 'Zed', age: 6, gender: 'Boy' }, { name: 'Amy', age: 2, gender: 'Girl' }] },
  { id: 'sess_bbbbbbbb2', parentName: 'Sam', parentPhone: '2', parentEmail: 's@x.co', children: [{ name: 'Bob', age: 6, gender: 'Boy' }, { name: 'Unk', age: null, gender: '' }] },
]);
check('youngest first, ties by name, unknown last', rows.map((r) => r.name).join() === 'Amy,Bob,Zed,Unk', rows.map((r) => r.name).join());
const csv = registerToCsv(buildRegisterRows([{ id: 'sess_x', children: [{ name: '=HYPERLINK("evil")', age: 4, gender: 'Boy' }] }]));
check('CSV neutralises formulas', csv.includes(`"'=HYPERLINK(""evil"")"`), csv);
check('CSV has a UTF-8 BOM and header', csv.startsWith('﻿"Age","Child name"'));

// --- parent confirmation email
const em = buildGrottoConfirmationEmail({ parentName: 'Jo <script>x</script> Bloggs', children: [{ name: '<img src=x onerror=1>', age: 5 }, { name: 'Max', age: null }], amountPence: 1000, ref: 'AB12CD34' });
check('email tells parents to arrive for 10am', em.html.includes('10 o’clock') && em.text.includes('PLEASE ARRIVE FOR 10AM'));
check('email asks for requirements by replying', em.html.includes('simply reply to this email') && em.text.includes('simply reply to this email'));
check('email lists the children and ref', em.html.includes('Max') && em.html.includes('AB12CD34') && em.text.includes('AB12CD34'));
check('email escapes names (no HTML injection)', !em.html.includes('<img src=x') && !em.html.includes('<script>x') && em.html.includes('&lt;img'));
check('email mailto goes to the trustees inbox', em.html.includes('mailto:trustees@bishopshullhub.co.uk?subject='));
check('single ticket wording', buildGrottoConfirmationEmail({ parentName: 'A', children: [{ name: 'K', age: 4 }], amountPence: 500, ref: 'X' }).text.includes('Your 1 ticket for'));

let failed = 0;
for (const [ok, name, detail] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`); }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
