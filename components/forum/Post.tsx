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
      <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 text-center text-gray-500 italic">
        This post has been hidden by moderators
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 ${
        isAccepted
          ? 'border-green-400 bg-green-50/50'
          : post.isHidden
          ? 'border-red-300 bg-red-50/50'
          : 'border-gray-200'
      }`}
    >
      {/* Accepted Badge */}
      {isAccepted && (
        <div className="mb-4 flex items-center gap-2 text-green-700">
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Accepted Answer</span>
        </div>
      )}

      {/* Hidden Badge */}
      {post.isHidden && canModerate && (
        <div className="mb-4 px-3 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          ⚠️ Hidden by moderator
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
              <div>
                <div className="font-semibold text-gray-800">Anonymous User</div>
                <div className="text-sm text-gray-500">{timeAgo}</div>
              </div>
            </div>

            {/* Actions Menu */}
            {(isOwner || canModerate) && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-200 py-2 z-10">
                    {isOwner && onEdit && (
                      <button
                        onClick={() => {
                          onEdit();
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
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
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
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
                className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
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

