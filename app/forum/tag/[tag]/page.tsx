'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumThread } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

export default function TagPage() {
  const params = useParams();
  const tag = decodeURIComponent(params.tag as string);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreadsByTag = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        setThreads([]);
        setLoading(false);
        return;
      }
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
          <h1 className="mb-2 flex items-center gap-3 font-display-lg-mobile text-display-lg-mobile text-deep-green">
            <Icon name="sell" className="text-royal-gold" filled />
            {tag}
          </h1>
          <p className="text-on-surface-variant">
            {threads.length} thread{threads.length !== 1 ? 's' : ''} with this tag
          </p>
        </motion.div>

        {/* Threads */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-deep-green"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-12">
            <Icon name="sell" className="mb-4 text-[56px] text-royal-gold" />
            <h3 className="mb-2 font-headline-md text-headline-md text-deep-green">
              No threads found
            </h3>
            <p className="mb-6 text-on-surface-variant">
              No discussions with the &quot;{tag}&quot; tag yet
            </p>
            <Link
              href="/forum/new"
              className="inline-block rounded-full bg-deep-green px-6 py-3 font-label-sm text-label-sm font-semibold text-on-primary transition-all hover:bg-forest-green"
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

