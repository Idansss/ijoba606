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
import { ConsultantCTA } from '@/components/consultants/ConsultantCTA';
import { Icon } from '@/components/ui/Icon';
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
          const data = threadSnap.data() as ForumThread;
          const isModerator = user?.role === 'moderator' || user?.role === 'admin';

          // If thread is hidden and user is not a moderator/admin, redirect back to forum
          if (data.isHidden && !isModerator) {
            addToast({ type: 'error', message: 'This thread is no longer available.' });
            router.push('/forum');
            return;
          }

          setThread({ id: threadSnap.id, ...data } as ForumThread);
        } else {
          addToast({ type: 'error', message: 'Thread not found' });
          router.push('/forum');
        }
      } catch (error: any) {
        console.error('Error fetching thread:', error);
        if (error.code === 'permission-denied') {
          addToast({
            type: 'error',
            message: 'You do not have permission to view this thread.',
          });
          router.push('/forum');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchThread();

    // Subscribe to posts
    const postsRef = collection(db, 'forumPosts');
    const q = query(postsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const isModerator = user?.role === 'moderator' || user?.role === 'admin';
      const postsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as ForumPost))
        .filter((post) => post.tid === threadId)
        // Regular users shouldn't see hidden posts
        .filter((post) => !post.isHidden || isModerator);
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
      <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-deep-green"></div>
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
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Link
          href="/forum"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-deep-green transition hover:text-forest-green"
        >
          <Icon name="arrow_back" className="text-[20px]" />
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
          className="mb-8 rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-8"
        >
          {/* Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/30 px-3 py-1 text-sm font-semibold text-on-secondary-fixed">
                <Icon name="push_pin" className="text-[16px]" filled /> Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-3 py-1 text-sm font-semibold text-on-error-container">
                <Icon name="lock" className="text-[16px]" filled /> Locked
              </span>
            )}
            {thread.acceptedPostId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/60 px-3 py-1 text-sm font-semibold text-secondary">
                <Icon name="check_circle" className="text-[16px]" filled /> Solved
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
            <div className="min-w-0 flex-1">
              {/* Title */}
              <h1 className="mb-4 font-display-lg-mobile text-display-lg-mobile text-deep-green">
                {thread.title}
              </h1>

              {/* Tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {thread.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>

              {/* Meta */}
              <div className="mb-6 flex items-center gap-4 text-sm text-on-surface-variant">
                <span>Posted {timeAgo}</span>
                <span>•</span>
                <span>{thread.replyCount} replies</span>
              </div>

              {/* Body */}
              <div className="prose prose-sm mb-6 max-w-none">
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
          <h2 className="mb-6 font-headline-md text-headline-md text-deep-green">
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

        {/* Consultant CTA */}
        {process.env.NEXT_PUBLIC_CONSULTANTS_ENABLED === 'true' && (
          <div className="mb-6">
            <ConsultantCTA />
          </div>
        )}

        {/* Reply Form */}
        {firebaseUser && !thread.isLocked ? (
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <h3 className="mb-4 font-headline-md text-headline-md text-deep-green">
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
                className="rounded-full bg-gradient-to-r from-deep-green to-royal-gold px-8 py-3 font-label-sm text-label-sm font-bold text-on-primary shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : thread.isLocked ? (
          <div className="rounded-bento border border-error/30 bg-error-container/40 p-6 text-center">
            <p className="flex items-center justify-center gap-2 font-semibold text-on-error-container">
              <Icon name="lock" className="text-[20px]" filled />
              This thread is locked. No new replies can be posted.
            </p>
          </div>
        ) : (
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-low p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
            <p className="mb-4 text-on-surface-variant">Sign in to reply to this thread</p>
            <button
              onClick={() => router.push('/')}
              className="rounded-full bg-deep-green px-6 py-3 font-label-sm text-label-sm font-semibold text-on-primary transition-all hover:bg-forest-green"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

