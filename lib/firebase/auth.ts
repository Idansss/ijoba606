import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { auth as firebaseAuth, db as firestoreDb } from './config';
import { User } from '@/lib/types';

const googleProvider = new GoogleAuthProvider();

function requireFirebase() {
  if (!firebaseAuth || !firestoreDb) {
    const error = new Error(
      'Firebase auth is disabled. Add NEXT_PUBLIC_FIREBASE_* env vars to enable authentication.'
    );
    console.error(error.message);
    throw error;
  }

  return {
    auth: firebaseAuth as Auth,
    db: firestoreDb as Firestore,
  };
}

/**
 * Sign in anonymously
 */
export async function signInAnon() {
  try {
    const { auth } = requireFirebase();
    const result = await signInAnonymously(auth);
    await ensureUserDoc(result.user, true);
    return result.user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    if (error instanceof Error && error.message.includes('Firebase auth is disabled')) {
      throw new Error('Authentication is not configured. Please check your Firebase settings.');
    }
    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const { auth } = requireFirebase();
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user, false);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/popup-closed-by-user') {
      // User closed the popup, don't show error
      throw new Error('Sign-in cancelled');
    }
    if (error instanceof Error && error.message.includes('Firebase auth is disabled')) {
      throw new Error('Authentication is not configured. Please check your Firebase settings.');
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    }
    throw error;
  }
}

/**
 * Upgrade anonymous account to Google account
 */
export async function upgradeAnonymousToGoogle() {
  const { auth, db } = requireFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.isAnonymous) {
    throw new Error('Not an anonymous user');
  }

  const result = await linkWithPopup(currentUser, googleProvider);
  
  // Update user doc to mark as no longer anonymous
  const userRef = doc(db, 'users', result.user.uid);
  await setDoc(
    userRef,
    {
      anon: false,
      handle: generateHandle(result.user),
    },
    { merge: true }
  );

  return result.user;
}

/**
 * Sign out
 */
export async function signOut() {
  const { auth } = requireFirebase();
  await auth.signOut();
}

/**
 * Ensure user document exists in Firestore
 */
async function ensureUserDoc(user: FirebaseUser, isAnon: boolean) {
  const { db } = requireFirebase();
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create user doc
    const userData: User = {
      uid: user.uid,
      handle: generateHandle(user),
      anon: isAnon,
      role: 'user',
      createdAt: Timestamp.now(),
    };
    await setDoc(userRef, userData);

    // Create profile doc
    const profileRef = doc(db, 'profiles', user.uid);
    await setDoc(profileRef, {
      uid: user.uid,
      streakCount: 0,
      bestStreak: 0,
      lastPlayedLagosDate: '',
      totalPoints: 0,
      levelUnlocked: 1,
      badges: [],
    });
  }
}

/**
 * Generate a handle for the user
 */
function generateHandle(user: FirebaseUser): string {
  if (user.displayName) {
    return user.displayName.replace(/\s+/g, '_').toLowerCase();
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  // Anonymous user
  return `user_${user.uid.slice(0, 8)}`;
}

/**
 * Get current user
 */
export function getCurrentUser(): FirebaseUser | null {
  return firebaseAuth?.currentUser ?? null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!firebaseAuth?.currentUser;
}

