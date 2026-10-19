import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Admin-SDK Firestore for trusted server code (the Stripe webhook and the
 * capacity check). It authenticates with the App Hosting service account, so
 * it bypasses security rules, which is why the public client never gets write
 * access to the Grotto register.
 */
export function getAdminFirestore() {
  const app =
    getApps().find((a) => a.name === 'grotto-admin') ??
    initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }, 'grotto-admin');
  return getFirestore(app);
}
