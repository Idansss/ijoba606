'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { moderateContent } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';

interface ModeratorBarProps {
  targetKind: 'thread' | 'post';
  targetId: string;
  isHidden?: boolean;
  isLocked?: boolean;
  isPinned?: boolean;
  onUpdate?: () => void;
}

export function ModeratorBar({
  targetKind,
  targetId,
  isHidden = false,
  isLocked = false,
  isPinned = false,
  onUpdate,
}: ModeratorBarProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const isModerator = user?.role === 'moderator' || user?.role === 'admin';

  if (!isModerator) return null;

  const handleAction = async (
    action: 'hide' | 'unhide' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'accept_answer'
  ) => {
    setLoading(true);
    try {
      await moderateContent({
        targetKind,
        targetId,
        action,
      });

      addToast({ type: 'success', message: `Action completed: ${action}` });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Moderation error:', error);
      addToast({ type: 'error', message: 'Failed to perform action. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-bold text-purple-900">Moderator Actions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Hide/Unhide */}
        <button
          onClick={() => handleAction(isHidden ? 'unhide' : 'hide')}
          disabled={loading}
          className="px-3 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all disabled:opacity-50"
        >
          {isHidden ? '👁️ Unhide' : '🚫 Hide'}
        </button>

        {/* Lock/Unlock (threads only) */}
        {targetKind === 'thread' && (
          <button
            onClick={() => handleAction(isLocked ? 'unlock' : 'lock')}
            disabled={loading}
            className="px-3 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all disabled:opacity-50"
          >
            {isLocked ? '🔓 Unlock' : '🔒 Lock'}
          </button>
        )}

        {/* Pin/Unpin (threads only) */}
        {targetKind === 'thread' && (
          <button
            onClick={() => handleAction(isPinned ? 'unpin' : 'pin')}
            disabled={loading}
            className="px-3 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all disabled:opacity-50"
          >
            {isPinned ? '📍 Unpin' : '📌 Pin'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

