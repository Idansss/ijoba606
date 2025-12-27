'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumThread, ForumPost } from '@/lib/types';
import { TagChip } from '@/components/forum/TagChip';
import { VoteBar } from '@/components/forum/VoteBar';
import { Post } from '@/components/forum/Post';
import { SubscribeButton } from '@/components/forum/SubscribeButton';
import { ModeratorBar } from '@/components/forum/ModeratorBar';
import { MarkdownEditor } from '@/components/forum/MarkdownEditor';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { createPost } from '@/lib/firebase/functions';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser, user } = useAuthStore();
  const { addToast } = useToastStore();
  const threadId = params.id as string;

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    if (!db) {
      setLoading(false);
      return;
    }

    // Fetch thread
    const fetchThread = async () => {
      try {
        if (!db) {
          setLoading(false);
          return;
        }
        const threadRef = doc(db, 'forumThreads', threadId);
        const threadSnap = await getDoc(threadRef);
        
        if (threadSnap.exists()) {
          setThread({ id: threadSnap.id, ...threadSnap.data() } as ForumThread);
        } else {
          addToast({ type: 'error', message: 'Thread not found' });
          router.push('/forum');
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();

    // Subscribe to posts
    const postsRef = collection(db, 'forumPosts');
    const q = query(postsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as ForumPost))
        .filter((post) => post.tid === threadId);
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [threadId, router, addToast]);

  const handleReply = async () => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Sign in to reply' });
      return;
    }

    if (!replyBody.trim() || replyBody.length < 10) {
      addToast({ type: 'error', message: 'Reply must be at least 10 characters' });
      return;
    }

    if (thread?.isLocked) {
      addToast({ type: 'error', message: 'This thread is locked' });
      return;
    }

    setSubmittingReply(true);
    try {
      await createPost({
        tid: threadId,
        bodyMD: replyBody,
      });

      setReplyBody('');
      addToast({ type: 'success', message: 'Reply posted! 🎉' });
    } catch (error) {
      console.error('Error posting reply:', error);
      addToast({ type: 'error', message: 'Failed to post reply. Try again.' });
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return null;
  }

  const timeAgo = thread.createdAt
    ? formatDistanceToNow(new Date(thread.createdAt.seconds * 1000), {
        addSuffix: true,
      })
    : '';

  const isOwner = user?.uid === thread.uid;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-semibold"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Forum
        </Link>

        {/* Moderator Bar */}
        <ModeratorBar
          targetKind="thread"
          targetId={threadId}
          isHidden={thread.isHidden}
          isLocked={thread.isLocked}
          isPinned={thread.isPinned}
          onUpdate={() => window.location.reload()}
        />

        {/* Thread */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200 mb-8"
        >
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {thread.isPinned && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                📌 Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                🔒 Locked
              </span>
            )}
            {thread.acceptedPostId && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                ✓ Solved
              </span>
            )}
          </div>

          <div className="flex gap-6">
            {/* Vote Bar */}
            <VoteBar
              targetId={threadId}
              targetKind="thread"
              currentVotes={thread.votes}
              layout="vertical"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {thread.title}
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {thread.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span>Posted {timeAgo}</span>
                <span>•</span>
                <span>{thread.replyCount} replies</span>
              </div>

              {/* Body */}
              <div className="prose prose-sm max-w-none mb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {thread.bodyMD}
                </ReactMarkdown>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <SubscribeButton threadId={threadId} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                isAccepted={post.id === thread.acceptedPostId}
                showAcceptButton={isOwner && !thread.acceptedPostId}
              />
            ))}
          </div>
        </div>

        {/* Reply Form */}
        {firebaseUser && !thread.isLocked ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Post a Reply
            </h3>
            <MarkdownEditor
              value={replyBody}
              onChange={setReplyBody}
              placeholder="Share your thoughts, answer, or insights..."
              minHeight="200px"
              maxLength={3000}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleReply}
                disabled={submittingReply || replyBody.length < 10}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : thread.isLocked ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 font-semibold">
              🔒 This thread is locked. No new replies can be posted.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-4">Sign in to reply to this thread</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

