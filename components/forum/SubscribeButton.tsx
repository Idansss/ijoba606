'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Timestamp } from 'firebase/firestore';

interface SubscribeButtonProps {
  threadId: string;
}

export function SubscribeButton({ threadId }: SubscribeButtonProps) {
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;

    const checkSubscription = async () => {
      try {
        const subRef = doc(
          db,
          `forumSubscriptions/${threadId}/subscribers/${firebaseUser.uid}`
        );
        const subSnap = await getDoc(subRef);
        setIsSubscribed(subSnap.exists());
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [firebaseUser, threadId]);

  const handleToggle = async () => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Sign in to subscribe' });
      return;
    }

    setLoading(true);
    try {
      const subRef = doc(
        db,
        `forumSubscriptions/${threadId}/subscribers/${firebaseUser.uid}`
      );

      if (isSubscribed) {
        await deleteDoc(subRef);
        setIsSubscribed(false);
        addToast({ type: 'info', message: 'Unsubscribed from thread' });
      } else {
        await setDoc(subRef, {
          tid: threadId,
          uid: firebaseUser.uid,
          createdAt: Timestamp.now(),
        });
        setIsSubscribed(true);
        addToast({
          type: 'success',
          message: "You'll be notified of new replies",
        });
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      addToast({
        type: 'error',
        message: 'Failed to update subscription. Try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 ${
        isSubscribed
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
      {loading ? 'Loading...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
    </motion.button>
  );
}

