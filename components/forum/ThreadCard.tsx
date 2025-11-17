'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ForumThread } from '@/lib/types';
import { TagChip } from './TagChip';
import { formatDistanceToNow } from 'date-fns';

interface ThreadCardProps {
  thread: ForumThread;
  delay?: number;
}

export function ThreadCard({ thread, delay = 0 }: ThreadCardProps) {
  const timeAgo = thread.createdAt
    ? formatDistanceToNow(new Date(thread.createdAt.seconds * 1000), {
        addSuffix: true,
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={`/forum/thread/${thread.id}`}
        className="block bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all"
      >
        <div className="flex items-start gap-4">
          {/* Vote Count */}
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className="text-2xl font-bold text-gray-700">{thread.votes}</div>
            <div className="text-xs text-gray-500">votes</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              {thread.isPinned && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  📌 Pinned
                </span>
              )}
              {thread.isLocked && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                  🔒 Locked
                </span>
              )}
              {thread.acceptedPostId && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  ✓ Solved
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-purple-600 transition-colors line-clamp-2">
              {thread.title}
            </h3>

            {/* Body Preview */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {thread.bodyMD.substring(0, 150)}...
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {thread.tags.map((tag) => (
                <TagChip key={tag} tag={tag} size="sm" />
              ))}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{timeAgo}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                💬 {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

