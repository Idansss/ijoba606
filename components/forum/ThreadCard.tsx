'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ForumThread } from '@/lib/types';
import { TagChip } from './TagChip';
import { formatDistanceToNow } from 'date-fns';
import { Icon } from '@/components/ui/Icon';

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
        className="group flex flex-col items-start gap-6 rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.02)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_15px_40px_rgba(0,50,0,0.08)] sm:flex-row"
      >
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-surface-container-highest bg-primary-container font-display-lg text-on-primary">
          <Icon name="forum" className="text-[22px]" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-fixed/30 px-2 py-1 font-label-sm text-[10px] text-on-secondary-fixed">
                <Icon name="push_pin" className="text-[12px]" filled /> Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-md bg-error-container px-2 py-1 font-label-sm text-[10px] text-on-error-container">
                <Icon name="lock" className="text-[12px]" filled /> Locked
              </span>
            )}
            {thread.acceptedPostId && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary-container/60 px-2 py-1 font-label-sm text-[10px] text-secondary">
                <Icon name="check_circle" className="text-[12px]" filled /> Solved
              </span>
            )}
            <span className="text-xs text-on-surface-variant">{timeAgo}</span>
          </div>

          <h3 className="mb-2 font-headline-md text-headline-md text-primary transition-colors group-hover:text-royal-gold">
            {thread.title}
          </h3>
          <p className="mb-3 line-clamp-2 font-body-md text-body-md text-on-surface-variant">
            {thread.bodyMD}
          </p>

          <div className="flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <TagChip key={tag} tag={tag} size="sm" clickable={false} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-2 flex shrink-0 items-center justify-center gap-4 sm:mt-0 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex items-center gap-1 text-primary">
            <Icon name="thumb_up" className="text-[20px]" filled={thread.votes > 0} />
            <span className="font-figure-md text-figure-md">{thread.votes}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <Icon name="chat_bubble" className="text-[20px]" />
            <span className="font-figure-md text-figure-md">{thread.replyCount}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
