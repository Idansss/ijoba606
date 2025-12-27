'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { voteThread, votePost } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
          'p-2 rounded-lg transition-all disabled:opacity-50',
          userVote === 1
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
        )}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      </motion.button>

      {/* Vote Count */}
      <div
        className={cn(
          'font-bold text-lg',
          votes > 0
            ? 'text-orange-600'
            : votes < 0
            ? 'text-blue-600'
            : 'text-gray-700'
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
          'p-2 rounded-lg transition-all disabled:opacity-50',
          userVote === -1
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
        )}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </motion.button>
    </div>
  );
}

