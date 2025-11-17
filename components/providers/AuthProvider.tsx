'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { User, Profile } from '@/lib/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Subscribe to user doc
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUser(snap.data() as User);
          }
        });

        // Subscribe to profile doc
        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        const unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as Profile);
          }
        });

        setLoading(false);

        return () => {
          unsubUser();
          unsubProfile();
        };
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setUser, setProfile, setLoading]);

  return <>{children}</>;
}

