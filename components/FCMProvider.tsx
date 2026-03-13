'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';

/**
 * Registers FCM token for push notifications when user is signed in.
 * Uses dynamic import to avoid SSR errors (firebase/messaging requires browser APIs).
 */
export function FCMProvider() {
  const { firebaseUser } = useAuthStore();
  const registered = useRef(false);

  useEffect(() => {
    if (!firebaseUser?.uid || typeof window === 'undefined') {
      registered.current = false;
      return;
    }

    const init = async () => {
      try {
        const { isPushSupported, registerFCMToken } = await import('@/lib/firebase/messaging');
        const supported = await isPushSupported();
        if (!supported) return;

        if (registered.current) return;
        registered.current = true;

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
