'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { SearchBar } from '@/components/forum/SearchBar';
import { TagChip } from '@/components/forum/TagChip';
import { useAuthStore } from '@/lib/store/auth';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumThread } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

type TabType = 'trending' | 'new' | 'unanswered';

const POPULAR_TAGS = [
  'Pension',
  'Reliefs',
  'Beginners',
  'Calculations',
  'Self-Employed',
];

export default function ForumPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[#006400]"></div>
          </div>
        </div>
      }
    >
      <ForumPageContent />
    </Suspense>
  );
}

function ForumPageContent() {
  const { firebaseUser } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        setThreads([]);
        setLoading(false);
        return;
      }
      const threadsRef = collection(db, 'forumThreads');

      // Fetch all threads and filter client-side to handle:
      // 1. Threads where isHidden doesn't exist (old threads)
      // 2. Threads where isHidden is false
      // 3. Avoid Firestore index requirements for isHidden queries
      let q;
      
      if (searchQuery) {
        q = query(
          threadsRef,
          orderBy('createdAt', 'desc'),
          limit(100) // Get more to filter client-side
        );
      } else if (activeTab === 'trending') {
        q = query(
          threadsRef,
          orderBy('votes', 'desc'),
          limit(100)
        );
      } else if (activeTab === 'new') {
        q = query(
          threadsRef,
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          threadsRef,
          where('replyCount', '==', 0),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      let threadData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumThread[];

      // Filter out hidden threads client-side
      // Include threads where isHidden is false or doesn't exist (undefined)
      threadData = threadData.filter(
        (thread) => thread.isHidden !== true
      );

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        threadData = threadData.filter(
          (thread) =>
            thread.title.toLowerCase().includes(lowerQuery) ||
            thread.bodyMD.toLowerCase().includes(lowerQuery)
        );
      }

      // Limit to 50 after filtering
      threadData = threadData.slice(0, 50);

      setThreads(threadData);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-bento border border-deep-green/10 bg-surface-container-lowest p-6 sm:p-10 shadow-[0px_20px_40px_rgba(0,100,0,0.08)]"
        >
          <div className="text-center">
            <p className="font-label-sm text-sm font-semibold uppercase tracking-widest text-forest-green">
              Community forum
            </p>
            <h1 className="mt-3 font-display-lg-mobile text-display-lg-mobile text-deep-green">
              Ask the questions payroll forgot to answer.
            </h1>
            <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant">
              Share relief hacks, decode payslips, and help someone else stay compliant.
            </p>
            {firebaseUser && (
              <Link
                href="/forum/new"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-deep-green px-6 py-3 font-label-sm text-sm font-semibold text-on-primary shadow-md transition hover:bg-forest-green"
              >
                <MessageSquare className="h-4 w-4" />
                Start a thread
              </Link>
            )}
          </div>

          <div className="mt-8">
            <SearchBar
              placeholder="Search discussions..."
              onSearch={(query) => setSearchQuery(query)}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low p-1">
            {(['new', 'trending', 'unanswered'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-deep-green to-royal-gold text-on-primary shadow'
                    : 'text-on-surface-variant hover:text-deep-green'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            {loading ? (
              <div className="py-12 text-center text-on-surface-variant">
                Fetching latest conversations...
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-bento border border-dashed border-outline-variant bg-surface-container-lowest/70 p-6 sm:p-12 text-center text-on-surface-variant">
                No threads yet. Be the first to start a conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread, index) => (
                  <ThreadCard key={thread.id} thread={thread} delay={index * 0.04} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
              <h3 className="font-headline-md text-lg font-semibold text-deep-green">Popular tags</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <TagChip key={tag} tag={tag} size="sm" />
                ))}
              </div>
            </div>

            <div className="rounded-input border border-secondary-container bg-primary-fixed/15 p-6 text-sm text-on-secondary-fixed">
              <h3 className="text-lg font-semibold">House rules</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Be respectful and stay on topic (PAYE & payroll).</li>
                <li>• No spam, no selling, no personal data.</li>
                <li>• Cite sources when referencing statutes.</li>
                <li>• Educational content — not legal advice.</li>
              </ul>
            </div>

            <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 text-sm text-on-surface-variant shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
              <h3 className="font-headline-md text-lg font-semibold text-deep-green">Healthy forum</h3>
              <p className="mt-2">
                {threads.length} threads visible · {threads.filter((t) => t.replyCount > 0).length}{' '}
                active discussions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
