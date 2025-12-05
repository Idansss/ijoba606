'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ForumThread } from '@/lib/types';
import { TagChip } from './TagChip';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, Lock, CheckCircle } from 'lucide-react';

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
        className="group block rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-purple-600">
                <Bookmark className="h-3 w-3" /> Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-rose-600">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
            {thread.acceptedPostId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                <CheckCircle className="h-3 w-3" /> Solved
              </span>
            )}
            <span>{timeAgo}</span>
          </div>

          <h3 className="text-xl font-semibold text-slate-900 transition group-hover:text-purple-600">
            {thread.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2">{thread.bodyMD}</p>

          <div className="flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <TagChip key={tag} tag={tag} size="sm" />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{thread.votes} votes</span>
            <span>{thread.replyCount} repl{thread.replyCount === 1 ? 'y' : 'ies'}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
