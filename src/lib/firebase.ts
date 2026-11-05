import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import { createAuth } from '@/lib/create-auth';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigured) {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = createAuth(app);
  try {
    // React Native cannot hold Firestore's default streaming connection reliably.
    db = initializeFirestore(app, Platform.OS === 'web' ? {} : { experimentalForceLongPolling: true });
  } catch {
    db = getFirestore(app);
  }
}

export { auth, db };
