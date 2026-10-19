/**
 * Santa Grotto register tests: Stripe signature checking, metadata parsing and
 * the age-ordered register. Run with: npm run test:grotto
 */
import { createHmac } from 'crypto';
import { verifyStripeSignature } from '../src/lib/stripe-signature';
import { parseChildMeta, childrenFromMetadata } from '../src/lib/santa-grotto';
import { buildRegisterRows, registerToCsv } from '../src/lib/grotto-register';

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

let failed = 0;
for (const [ok, name, detail] of results) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`); }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
