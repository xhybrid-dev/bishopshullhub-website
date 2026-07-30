/**
 * Security rules regression tests.
 *
 * The property that matters here: bank details and the signature image are
 * readable only by admins, while an unauthenticated hirer following their
 * emailed confirmation link can still write them once.
 *
 * Run with: npm run test:rules   (requires the Firestore emulator + Java)
 */
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const ENQ = 'abc12345';
const results = [];
const t = async (name, fn) => {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' :: ' + (e.message || e)]); }
};

const env = await initializeTestEnvironment({
  projectId: 'bhh-rules-test',
  firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

const admin = env.authenticatedContext('admin1', { email: 'bishopshullhub@gmail.com' }).firestore();
const hirer = env.authenticatedContext('anon1', {}).firestore();     // anonymous, like a site visitor
const attacker = env.authenticatedContext('anon2', {}).firestore();
const guest = env.unauthenticatedContext().firestore(); // confirm page does not sign in
const paymentPath = (db) => doc(db, 'booking_enquiries', ENQ, 'private', 'payment');
const enquiryPath = (db) => doc(db, 'booking_enquiries', ENQ);

// Seed: an enquiry that the admin has invited to confirm (confirmationStatus 'Sent')
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'booking_enquiries', ENQ), {
    id: ENQ, name: 'Jo Bloggs', emailAddress: 'jo@example.com',
    dateRequired: '2026-09-01', startTime: '10:00', endTime: '14:00',
    status: 'Pending', confirmationStatus: 'Sent',
  });
});

const BANK = { bankName: 'Barclays', accountNumber: '12345678', sortCode: '204567', accountName: 'J Bloggs' };

// --- the hirer's happy path (UNAUTHENTICATED: the confirm page never signs in) ---
await t('UNAUTHENTICATED hirer can write bank details while invited', () =>
  assertSucceeds(setDoc(paymentPath(guest), { ...BANK, signatureDataUrl: 'data:image/png;base64,AAA' })));

await t('UNAUTHENTICATED hirer cannot read them back', () =>
  assertFails(getDoc(paymentPath(guest))));

await t('UNAUTHENTICATED hirer can flip enquiry to Submitted', () =>
  assertSucceeds(updateDoc(enquiryPath(guest), {
    confirmationStatus: 'Submitted',
    confirmation: { yourName: 'Jo', organisation: '', confirmedAt: '2026-08-01' },
  })));

await env.withSecurityRulesDisabled(async (ctx) => {
  await updateDoc(doc(ctx.firestore(), 'booking_enquiries', ENQ), { confirmationStatus: 'Sent' });
});

await t('hirer can write bank details to private/payment while invited', () =>
  assertSucceeds(setDoc(paymentPath(hirer), { ...BANK, signatureDataUrl: 'data:image/png;base64,AAA' })));

await t('hirer can retry the payment write (idempotent) while still Sent', () =>
  assertSucceeds(setDoc(paymentPath(hirer), { ...BANK, signatureDataUrl: 'data:image/png;base64,BBB' })));

// --- the core fix ---
await t('PUBLIC CANNOT READ bank details', () =>
  assertFails(getDoc(paymentPath(attacker))));

await t('public still cannot read them via a different anon session', () =>
  assertFails(getDoc(paymentPath(hirer))));

await t('ADMIN CAN READ bank details', () =>
  assertSucceeds(getDoc(paymentPath(admin))));

// --- enquiry doc must not become a side channel ---
await t('public update rejected if it smuggles bank fields onto the enquiry', () =>
  assertFails(updateDoc(enquiryPath(hirer), {
    confirmationStatus: 'Submitted',
    confirmation: { yourName: 'Jo', accountNumber: '12345678' },
  })));

await t('public update accepted when confirmation carries no payment fields', () =>
  assertSucceeds(updateDoc(enquiryPath(hirer), {
    confirmationStatus: 'Submitted',
    confirmation: { yourName: 'Jo', organisation: '', confirmedAt: '2026-08-01' },
  })));

// --- write window closes once submitted ---
await t('hirer can no longer overwrite payment once enquiry is Submitted', () =>
  assertFails(setDoc(paymentPath(attacker), { ...BANK, accountNumber: '99999999' })));

await t('admin can still write payment after submission (migration path)', () =>
  assertSucceeds(setDoc(paymentPath(admin), { ...BANK, savedAt: 'x' })));

// --- an enquiry that was never invited ---
const ENQ2 = 'def67890';
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'booking_enquiries', ENQ2), {
    id: ENQ2, name: 'Sam', emailAddress: 's@example.com', status: 'Pending',
  });
});
await t('public cannot seed payment on an enquiry with no invite sent', () =>
  assertFails(setDoc(doc(hirer, 'booking_enquiries', ENQ2, 'private', 'payment'), BANK)));

// --- enquiry doc itself is still publicly gettable (confirm/review links) ---
await t('enquiry doc remains publicly gettable', () =>
  assertSucceeds(getDoc(enquiryPath(attacker))));

await env.cleanup();

console.log('');
for (const [s, n] of results) console.log(`${s === 'PASS' ? 'ok  ' : 'FAIL'} ${n}`);
const failed = results.filter(r => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
