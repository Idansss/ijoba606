'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { moderateContent } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Icon } from '@/components/ui/Icon';

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
      className="mb-6 rounded-input border border-primary-fixed/40 bg-primary-fixed/15 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon name="shield_person" className="text-[20px] text-deep-green" filled />
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-secondary-fixed">Moderator Actions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Hide/Unhide */}
        <button
          type="button"
          onClick={() => handleAction(isHidden ? 'unhide' : 'hide')}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-input border border-secondary-container bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-secondary-fixed transition-all hover:bg-secondary-container/40 disabled:opacity-50"
        >
          <Icon name={isHidden ? 'visibility' : 'visibility_off'} className="text-[18px]" />
          {isHidden ? 'Unhide' : 'Hide'}
        </button>

        {/* Lock/Unlock (threads only) */}
        {targetKind === 'thread' && (
          <button
            type="button"
            onClick={() => handleAction(isLocked ? 'unlock' : 'lock')}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-input border border-secondary-container bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-secondary-fixed transition-all hover:bg-secondary-container/40 disabled:opacity-50"
          >
            <Icon name={isLocked ? 'lock_open' : 'lock'} className="text-[18px]" />
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
        )}

        {/* Pin/Unpin (threads only) */}
        {targetKind === 'thread' && (
          <button
            type="button"
            onClick={() => handleAction(isPinned ? 'unpin' : 'pin')}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-input border border-secondary-container bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-secondary-fixed transition-all hover:bg-secondary-container/40 disabled:opacity-50"
          >
            <Icon name="push_pin" className="text-[18px]" filled={isPinned} />
            {isPinned ? 'Unpin' : 'Pin'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

