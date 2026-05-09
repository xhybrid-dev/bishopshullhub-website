import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const APP_NAME = 'server';

export function getServerFirestore() {
  const existing = getApps().find((a) => a.name === APP_NAME);
  const app = existing ?? initializeApp(firebaseConfig, APP_NAME);
  return getFirestore(app);
}
