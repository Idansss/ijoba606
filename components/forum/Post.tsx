'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ForumPost } from '@/lib/types';
import { VoteBar } from './VoteBar';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useAuthStore } from '@/lib/store/auth';
import { ReportButton } from './ReportButton';
import { Icon } from '@/components/ui/Icon';

interface PostProps {
  post: ForumPost;
  isAccepted?: boolean;
  showAcceptButton?: boolean;
  onAccept?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function Post({
  post,
  isAccepted = false,
  showAcceptButton = false,
  onAccept,
  onEdit,
  onDelete,
}: PostProps) {
  const { user } = useAuthStore();
  const [showActions, setShowActions] = useState(false);

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), {
        addSuffix: true,
      })
    : '';

  const isOwner = user?.uid === post.uid;
  const canModerate = user?.role === 'moderator' || user?.role === 'admin';

  if (post.isHidden && !canModerate) {
    return (
      <div className="rounded-input border border-outline-variant bg-surface-container p-4 text-center italic text-outline">
        This post has been hidden by moderators
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-bento border bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.03)] backdrop-blur-sm ${
        isAccepted
          ? 'border-secondary/40 bg-secondary-container/20'
          : post.isHidden
          ? 'border-error/40 bg-error-container/30'
          : 'border-deep-green/5'
      }`}
    >
      {/* Accepted Badge */}
      {isAccepted && (
        <div className="mb-4 flex items-center gap-2 text-secondary">
          <Icon name="verified" className="text-[22px]" filled />
          <span className="font-label-sm text-label-sm uppercase tracking-widest">Accepted Answer</span>
        </div>
      )}

      {/* Hidden Badge */}
      {post.isHidden && canModerate && (
        <div className="mb-4 flex items-center gap-2 rounded-input border border-error/30 bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
          <Icon name="visibility_off" className="text-[18px]" /> Hidden by moderator
        </div>
      )}

      <div className="flex gap-4">
        {/* Vote Bar */}
        <VoteBar
          targetId={post.id!}
          targetKind="post"
          currentVotes={post.votes}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-forest-green to-secondary font-bold text-on-primary">
                U
              </div>
              <div>
                <div className="font-semibold text-on-surface">Anonymous User</div>
                <div className="text-sm text-outline">{timeAgo}</div>
              </div>
            </div>

            {/* Actions Menu */}
            {(isOwner || canModerate) && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="rounded-input p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  <Icon name="more_horiz" className="text-[20px]" />
                </button>

                {showActions && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-input border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-[0px_20px_40px_rgba(0,50,0,0.12)]">
                    {isOwner && onEdit && (
                      <button
                        onClick={() => {
                          onEdit();
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-surface-container"
                      >
                        Edit
                      </button>
                    )}
                    {(isOwner || canModerate) && onDelete && (
                      <button
                        onClick={() => {
                          onDelete();
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error-container/40"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {post.bodyMD}
            </ReactMarkdown>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {showAcceptButton && onAccept && !isAccepted && (
              <button
                onClick={onAccept}
                className="flex items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:text-deep-green"
              >
                <Icon name="check_circle" className="text-[18px]" />
                Accept Answer
              </button>
            )}
            <ReportButton targetKind="post" targetId={post.id!} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

