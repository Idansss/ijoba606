'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Timestamp } from 'firebase/firestore';
import { Icon } from '@/components/ui/Icon';

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
      if (!db) return;
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

    if (!db) {
      addToast({ type: 'error', message: 'Database not available' });
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
      className={`flex items-center gap-2 rounded-input px-4 py-2 font-semibold transition-all disabled:opacity-50 ${
        isSubscribed
          ? 'bg-primary-fixed/40 text-on-secondary-fixed hover:bg-primary-fixed/60'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      <Icon name={isSubscribed ? 'notifications_active' : 'notifications'} className="text-[20px]" filled={isSubscribed} />
      {loading ? 'Loading...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
    </motion.button>
  );
}

