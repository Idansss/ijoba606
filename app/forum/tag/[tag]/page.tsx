'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumThread } from '@/lib/types';

export default function TagPage() {
  const params = useParams();
  const tag = decodeURIComponent(params.tag as string);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreadsByTag = useCallback(async () => {
    setLoading(true);
    try {
      const threadsRef = collection(db, 'forumThreads');
      const q = query(
        threadsRef,
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const threadData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumThread[];

      setThreads(threadData);
    } catch (error) {
      console.error('Error fetching threads by tag:', error);
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    fetchThreadsByTag();
  }, [fetchThreadsByTag]);

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
            Tag: {tag}
          </h1>
          <p className="text-gray-600">
            {threads.length} thread{threads.length !== 1 ? 's' : ''} with this tag
          </p>
        </motion.div>

        {/* Threads */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No threads found
            </h3>
            <p className="text-gray-600 mb-6">
              No discussions with the &quot;{tag}&quot; tag yet
            </p>
            <Link
              href="/forum/new"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
            >
              Create First Thread
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread, index) => (
              <ThreadCard key={thread.id} thread={thread} delay={index * 0.05} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

