'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { voteThread, votePost } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Icon } from '@/components/ui/Icon';

interface VoteBarProps {
  targetId: string;
  targetKind: 'thread' | 'post';
  currentVotes: number;
  layout?: 'vertical' | 'horizontal';
}

export function VoteBar({
  targetId,
  targetKind,
  currentVotes,
  layout = 'vertical',
}: VoteBarProps) {
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [votes, setVotes] = useState(currentVotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user's current vote
    if (!firebaseUser) return;

    const fetchUserVote = async () => {
      if (!db) return;
      try {
        const voteRef = doc(
          db,
          `forumVotes/${targetKind}/${targetId}/userVotes/${firebaseUser.uid}`
        );
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
          setUserVote(voteSnap.data().value);
        }
      } catch (error) {
        console.error('Error fetching user vote:', error);
      }
    };

    fetchUserVote();
  }, [firebaseUser, targetId, targetKind]);

  const handleVote = async (value: 1 | -1) => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Sign in to vote' });
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      // Toggle vote (clicking same button removes vote)
      const newVote = userVote === value ? 0 : value;

      // Optimistic update
      const voteDiff = newVote - userVote;
      setVotes(votes + voteDiff);
      setUserVote(newVote);

      // Call API
      const voteFunc = targetKind === 'thread' ? voteThread : votePost;
      const response = await voteFunc({ targetId, value: newVote });

      // Update with server value
      setVotes(response.newVoteCount);
    } catch (error) {
      console.error('Vote error:', error);
      // Revert optimistic update
      setVotes(currentVotes);
      setUserVote(userVote);
      addToast({ type: 'error', message: 'Failed to vote. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isVertical = layout === 'vertical';

  return (
    <div
      className={cn(
        'flex gap-2',
        isVertical ? 'flex-col items-center' : 'flex-row items-center'
      )}
    >
      {/* Upvote */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(1)}
        disabled={loading}
        className={cn(
          'rounded-input p-1.5 transition-all disabled:opacity-50',
          userVote === 1
            ? 'bg-royal-gold text-on-primary'
            : 'bg-surface-container text-on-surface-variant hover:bg-tertiary-fixed/40 hover:text-tertiary'
        )}
      >
        <Icon name="keyboard_arrow_up" className="text-[22px] leading-none" />
      </motion.button>

      {/* Vote Count */}
      <div
        className={cn(
          'font-figure-md text-lg font-bold',
          votes > 0
            ? 'text-tertiary'
            : votes < 0
            ? 'text-secondary'
            : 'text-on-surface-variant'
        )}
      >
        {votes}
      </div>

      {/* Downvote */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={cn(
          'rounded-input p-1.5 transition-all disabled:opacity-50',
          userVote === -1
            ? 'bg-secondary text-on-primary'
            : 'bg-surface-container text-on-surface-variant hover:bg-secondary-container/60 hover:text-secondary'
        )}
      >
        <Icon name="keyboard_arrow_down" className="text-[22px] leading-none" />
      </motion.button>
    </div>
  );
}

