'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumThread, ForumPost } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { formatDistanceToNow } from 'date-fns';
import { Icon } from '@/components/ui/Icon';

type TabType = 'threads' | 'replies' | 'subscriptions';

export default function MyForumActivityPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('threads');
  const [myThreads, setMyThreads] = useState<ForumThread[]>([]);
  const [myPosts, setMyPosts] = useState<ForumPost[]>([]);
  const [subscribedThreads, setSubscribedThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyActivity = useCallback(async () => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      if (!db) {
        setLoading(false);
        return;
      }
      // Fetch my threads
      const threadsRef = collection(db, 'forumThreads');
      const threadsQuery = query(
        threadsRef,
        where('uid', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc')
      );
      const threadsSnapshot = await getDocs(threadsQuery);
      const threadsData = threadsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumThread[];
      setMyThreads(threadsData);

      // Fetch my posts
      const postsRef = collection(db, 'forumPosts');
      const postsQuery = query(
        postsRef,
        where('uid', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc')
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumPost[];
      setMyPosts(postsData);

      // Fetch subscribed threads (simplified - would need proper subcollection query)
      // For now, just show empty
      setSubscribedThreads([]);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/');
      return;
    }

    fetchMyActivity();
  }, [firebaseUser, router, fetchMyActivity]);

  if (!firebaseUser) {
    return null;
  }

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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 font-display-lg-mobile text-display-lg-mobile text-deep-green">
            My Forum Activity
          </h1>
          <p className="text-on-surface-variant">
            View your threads, replies, and subscriptions
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <div className="mb-2 font-figure-xl text-figure-xl text-deep-green">
              {myThreads.length}
            </div>
            <div className="text-sm text-on-surface-variant">Threads Created</div>
          </div>
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <div className="mb-2 font-figure-xl text-figure-xl text-forest-green">
              {myPosts.length}
            </div>
            <div className="text-sm text-on-surface-variant">Replies Posted</div>
          </div>
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <div className="mb-2 font-figure-xl text-figure-xl text-royal-gold">
              {subscribedThreads.length}
            </div>
            <div className="text-sm text-on-surface-variant">Subscriptions</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low p-1">
          {(['threads', 'replies', 'subscriptions'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full py-3 font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-deep-green to-royal-gold text-on-primary shadow'
                  : 'text-on-surface-variant hover:text-deep-green'
              }`}
            >
              {tab === 'threads' ? 'My Threads' : tab === 'replies' ? 'My Replies' : 'Subscriptions'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-deep-green"></div>
          </div>
        ) : (
          <>
            {/* My Threads */}
            {activeTab === 'threads' && (
              <div className="space-y-4">
                {myThreads.length === 0 ? (
                  <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-12">
                    <Icon name="edit_note" className="mb-4 text-[56px] text-royal-gold" />
                    <h3 className="mb-2 font-headline-md text-headline-md text-deep-green">
                      No threads yet
                    </h3>
                    <p className="mb-6 text-on-surface-variant">
                      Start a discussion to share your knowledge!
                    </p>
                    <Link
                      href="/forum/new"
                      className="inline-block rounded-full bg-deep-green px-6 py-3 font-label-sm text-label-sm font-semibold text-on-primary transition-all hover:bg-forest-green"
                    >
                      Create Thread
                    </Link>
                  </div>
                ) : (
                  myThreads.map((thread, index) => (
                    <ThreadCard key={thread.id} thread={thread} delay={index * 0.05} />
                  ))
                )}
              </div>
            )}

            {/* My Replies */}
            {activeTab === 'replies' && (
              <div className="space-y-4">
                {myPosts.length === 0 ? (
                  <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-12">
                    <Icon name="chat_bubble" className="mb-4 text-[56px] text-royal-gold" />
                    <h3 className="mb-2 font-headline-md text-headline-md text-deep-green">
                      No replies yet
                    </h3>
                    <p className="text-on-surface-variant">
                      Join discussions and share your insights!
                    </p>
                  </div>
                ) : (
                  myPosts.map((post) => {
                    const timeAgo = post.createdAt
                      ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), {
                          addSuffix: true,
                        })
                      : '';

                    return (
                      <Link
                        key={post.id}
                        href={`/forum/thread/${post.tid}`}
                        className="block rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.03)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0px_15px_40px_rgba(0,50,0,0.08)]"
                      >
                        <div className="mb-2 text-sm text-outline">
                          Replied {timeAgo}
                        </div>
                        <p className="line-clamp-3 text-on-surface-variant">
                          {post.bodyMD.substring(0, 200)}...
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            )}

            {/* Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                {subscribedThreads.length === 0 ? (
                  <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-12">
                    <Icon name="notifications" className="mb-4 text-[56px] text-royal-gold" />
                    <h3 className="mb-2 font-headline-md text-headline-md text-deep-green">
                      No subscriptions
                    </h3>
                    <p className="text-on-surface-variant">
                      Subscribe to threads to get notified of new replies!
                    </p>
                  </div>
                ) : (
                  subscribedThreads.map((thread, index) => (
                    <ThreadCard key={thread.id} thread={thread} delay={index * 0.05} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

