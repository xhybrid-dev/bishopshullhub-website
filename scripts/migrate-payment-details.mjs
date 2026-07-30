/**
 * One-off migration: move bank details and signature images off the publicly
 * readable enquiry document and into `booking_enquiries/{id}/private/payment`.
 *
 * Enquiries confirmed before the split still carry these fields inline, where
 * anyone holding the enquiry id can read them. This moves them and clears the
 * originals. The admin UI reads either location, so the site keeps working
 * whether or not this has run.
 *
 * Usage (dry run — reports what it would change, writes nothing):
 *   NEXT_PUBLIC_FIREBASE_API_KEY=... NEXT_PUBLIC_FIREBASE_PROJECT_ID=... \
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=... NEXT_PUBLIC_FIREBASE_APP_ID=... \
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... \
 *   node scripts/migrate-payment-details.mjs
 *
 * To actually write, add --apply.
 *
 * Signs in with an admin account so it runs under the same security rules as
 * the dashboard — no service-account key needed.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PAYMENT_FIELDS = ['bankName', 'accountNumber', 'sortCode', 'accountName', 'signatureDataUrl'];
const apply = process.argv.includes('--apply');

const required = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
});

await signInWithEmailAndPassword(getAuth(app), process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
const db = getFirestore(app);

console.log(apply ? 'Applying migration…\n' : 'DRY RUN — nothing will be written. Re-run with --apply.\n');

const snap = await getDocs(collection(db, 'booking_enquiries'));
let moved = 0;
let skipped = 0;
let failed = 0;

for (const d of snap.docs) {
  const data = d.data();
  const confirmation = data.confirmation;
  if (!confirmation) { skipped++; continue; }

  const present = PAYMENT_FIELDS.filter((f) => confirmation[f]);
  if (present.length === 0) { skipped++; continue; }

  const label = `${d.id} (${data.name ?? 'unknown'}, ${data.dateRequired ?? 'no date'})`;

  if (!apply) {
    console.log(`would move: ${label} — fields: ${present.join(', ')}`);
    moved++;
    continue;
  }

  try {
    // Don't clobber details the hirer already wrote to the new location.
    const paymentRef = doc(db, 'booking_enquiries', d.id, 'private', 'payment');
    const existing = await getDoc(paymentRef);
    if (!existing.exists()) {
      await setDoc(paymentRef, {
        bankName: confirmation.bankName ?? '',
        accountNumber: confirmation.accountNumber ?? '',
        sortCode: confirmation.sortCode ?? '',
        accountName: confirmation.accountName ?? '',
        ...(confirmation.signatureDataUrl ? { signatureDataUrl: confirmation.signatureDataUrl } : {}),
        savedAt: data.confirmationSubmittedAt ?? new Date().toISOString(),
        migratedAt: new Date().toISOString(),
      });
    }

    const cleaned = { ...confirmation };
    for (const f of PAYMENT_FIELDS) delete cleaned[f];
    await updateDoc(doc(db, 'booking_enquiries', d.id), { confirmation: cleaned });

    console.log(`moved: ${label}`);
    moved++;
  } catch (err) {
    console.error(`FAILED: ${label} — ${err.message}`);
    failed++;
  }
}

console.log(`\n${apply ? 'Moved' : 'Would move'}: ${moved}   Skipped (nothing to move): ${skipped}   Failed: ${failed}`);
process.exit(failed ? 1 : 0);
