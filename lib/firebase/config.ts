import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasRuntimeConfig =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId &&
  !String(firebaseConfig.apiKey).includes('your_api_key_here');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (hasRuntimeConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  try {
    auth = getAuth(app);
  } catch (error) {
    console.error(
      'Firebase Auth could not be initialised. Check NEXT_PUBLIC_FIREBASE_* values.',
      error
    );
    // Don't throw in production to prevent build failures
    // Auth will be null and UI should handle gracefully
  }

  try {
    db = getFirestore(app);
  } catch (error) {
    console.error(
      'Firestore could not be initialised. Check NEXT_PUBLIC_FIREBASE_* values.',
      error
    );
    // Don't throw in production to prevent build failures
    // DB will be null and UI should handle gracefully
  }
} else if (process.env.NODE_ENV !== 'production') {
  console.info(
    'Firebase is disabled for this run (missing NEXT_PUBLIC_FIREBASE_* env vars). UI will run in offline/demo mode.'
  );
}

export { app, auth, db };

