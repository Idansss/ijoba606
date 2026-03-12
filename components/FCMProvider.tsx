'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { registerFCMToken, isPushSupported } from '@/lib/firebase/messaging';

/**
 * Registers FCM token for push notifications when user is signed in.
 * Mount once in the app layout.
 */
export function FCMProvider() {
  const { firebaseUser } = useAuthStore();
  const registered = useRef(false);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      registered.current = false;
      return;
    }

    const init = async () => {
      const supported = await isPushSupported();
      if (!supported) return;

      if (registered.current) return;
      registered.current = true;

      try {
        await registerFCMToken(firebaseUser.uid);
      } catch (err) {
        console.warn('FCM registration failed:', err);
        registered.current = false;
      }
    };

    init();
  }, [firebaseUser?.uid]);

  return null;
}
