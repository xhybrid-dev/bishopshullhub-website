/**
 * Copies the site's Firestore data from the old Firebase project to the new
 * one, keeping every document ID — the links already emailed to hirers and
 * the security team contain enquiry IDs, so they keep working after cutover.
 *
 * Signs in to BOTH projects with an admin account and runs under the normal
 * security rules, so no service-account keys are needed. Reads from the
 * source are never modified.
 *
 * Usage (dry run — compares the two projects, writes nothing):
 *   SOURCE_API_KEY=... SOURCE_PROJECT_ID=... SOURCE_AUTH_DOMAIN=... \
 *   TARGET_API_KEY=... TARGET_PROJECT_ID=... TARGET_AUTH_DOMAIN=... \
 *   ADMIN_EMAIL=bishopshullhub@gmail.com \
 *   SOURCE_ADMIN_PASSWORD=... TARGET_ADMIN_PASSWORD=... \
 *   node scripts/copy-firestore.mjs
 *
 *   --apply      copy documents that are missing from the target
 *   --overwrite  with --apply, also replace documents that already exist in
 *                the target. Only use this BEFORE cutover: afterwards the
 *                target holds the live data and overwriting would undo work
 *                done on the new site.
 *
 * Safe to re-run: without --overwrite it only ever adds what is missing, which
 * is how stragglers submitted to the old site during DNS changeover get across.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Every collection in firestore.rules. `private` sits under each enquiry and
// holds bank details + signature, so it is copied alongside its parent.
const COLLECTIONS = [
  'admins',
  'security_team',
  'faqs',
  'booking_enquiries',
  'community_initiatives',
  'gallery_images',
  'page_contents',
];
const SUBCOLLECTIONS = { booking_enquiries: ['private'] };

const apply = process.argv.includes('--apply');
const overwrite = process.argv.includes('--overwrite');

const required = [
  'SOURCE_API_KEY', 'SOURCE_PROJECT_ID', 'SOURCE_AUTH_DOMAIN', 'SOURCE_ADMIN_PASSWORD',
  'TARGET_API_KEY', 'TARGET_PROJECT_ID', 'TARGET_AUTH_DOMAIN', 'TARGET_ADMIN_PASSWORD',
  'ADMIN_EMAIL',
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (overwrite && !apply) {
  console.error('--overwrite only makes sense with --apply.');
  process.exit(1);
}
if (process.env.SOURCE_PROJECT_ID === process.env.TARGET_PROJECT_ID) {
  console.error('SOURCE_PROJECT_ID and TARGET_PROJECT_ID are the same project.');
  process.exit(1);
}

async function connect(prefix, name) {
  const app = initializeApp({
    apiKey: process.env[`${prefix}_API_KEY`],
    projectId: process.env[`${prefix}_PROJECT_ID`],
    authDomain: process.env[`${prefix}_AUTH_DOMAIN`],
  }, name);
  try {
    await signInWithEmailAndPassword(getAuth(app), process.env.ADMIN_EMAIL, process.env[`${prefix}_ADMIN_PASSWORD`]);
  } catch (err) {
    console.error(`Could not sign in to ${process.env[`${prefix}_PROJECT_ID`]} as ${process.env.ADMIN_EMAIL}: ${err.message}`);
    process.exit(1);
  }
  return getFirestore(app);
}

const source = await connect('SOURCE', 'source');
const target = await connect('TARGET', 'target');

console.log(
  `${process.env.SOURCE_PROJECT_ID} → ${process.env.TARGET_PROJECT_ID}\n` +
  (!apply ? 'DRY RUN — nothing will be written. Re-run with --apply.\n'
    : overwrite ? 'Copying ALL documents, replacing any already in the target.\n'
    : 'Copying documents missing from the target.\n')
);

const totals = { copied: 0, present: 0, failed: 0 };

/** Copies one collection (by path segments) and returns the source docs. */
async function copyCollection(segments, label) {
  const [srcSnap, tgtSnap] = await Promise.all([
    getDocs(collection(source, ...segments)),
    getDocs(collection(target, ...segments)),
  ]);
  const inTarget = new Set(tgtSnap.docs.map((d) => d.id));
  let copied = 0;
  let present = 0;
  let failed = 0;

  for (const d of srcSnap.docs) {
    const exists = inTarget.has(d.id);
    if (exists && !overwrite) { present++; continue; }
    if (!apply) { copied++; continue; }
    try {
      await setDoc(doc(target, ...segments, d.id), d.data());
      copied++;
    } catch (err) {
      console.error(`  FAILED ${[...segments, d.id].join('/')} — ${err.message}`);
      failed++;
    }
  }

  if (label) {
    console.log(
      `${label ?? segments.join('/')}: ${srcSnap.size} in source, ` +
      `${apply ? 'copied' : 'would copy'} ${copied}, already in target ${present}` +
      (failed ? `, FAILED ${failed}` : '')
    );
  }
  totals.copied += copied;
  totals.present += present;
  totals.failed += failed;
  return srcSnap.docs;
}

for (const name of COLLECTIONS) {
  const docs = await copyCollection([name], name);
  for (const sub of SUBCOLLECTIONS[name] ?? []) {
    const before = { ...totals };
    for (const parent of docs) {
      await copyCollection([name, parent.id, sub], null);
    }
    console.log(
      `  └ ${name}/*/${sub}: ${apply ? 'copied' : 'would copy'} ${totals.copied - before.copied}, ` +
      `already in target ${totals.present - before.present}` +
      (totals.failed > before.failed ? `, FAILED ${totals.failed - before.failed}` : '')
    );
  }
}

console.log(
  `\n${apply ? 'Copied' : 'Would copy'}: ${totals.copied}   Already in target: ${totals.present}   Failed: ${totals.failed}`
);
process.exit(totals.failed ? 1 : 0);
