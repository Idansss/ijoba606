import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/lib/types';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in anonymously
 */
export async function signInAnon() {
  const result = await signInAnonymously(auth);
  await ensureUserDoc(result.user, true);
  return result.user;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user, false);
  return result.user;
}

/**
 * Upgrade anonymous account to Google account
 */
export async function upgradeAnonymousToGoogle() {
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
  await auth.signOut();
}

/**
 * Ensure user document exists in Firestore
 */
async function ensureUserDoc(user: FirebaseUser, isAnon: boolean) {
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
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

