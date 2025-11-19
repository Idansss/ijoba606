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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            My Forum Activity
          </h1>
          <p className="text-gray-600">
            View your threads, replies, and subscriptions
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {myThreads.length}
            </div>
            <div className="text-sm text-gray-600">Threads Created</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {myPosts.length}
            </div>
            <div className="text-sm text-gray-600">Replies Posted</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {subscribedThreads.length}
            </div>
            <div className="text-sm text-gray-600">Subscriptions</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('threads')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'threads'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Threads
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'replies'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Replies
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Subscriptions
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* My Threads */}
            {activeTab === 'threads' && (
              <div className="space-y-4">
                {myThreads.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      No threads yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start a discussion to share your knowledge!
                    </p>
                    <Link
                      href="/forum/new"
                      className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
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
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      No replies yet
                    </h3>
                    <p className="text-gray-600">
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
                        className="block bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all"
                      >
                        <div className="text-sm text-gray-500 mb-2">
                          Replied {timeAgo}
                        </div>
                        <p className="text-gray-700 line-clamp-3">
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
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
                    <div className="text-6xl mb-4">🔔</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      No subscriptions
                    </h3>
                    <p className="text-gray-600">
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

