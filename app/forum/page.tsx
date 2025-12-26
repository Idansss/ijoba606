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
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
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
      let q;

      if (searchQuery) {
        q = query(threadsRef, orderBy('createdAt', 'desc'), limit(50));
      } else if (activeTab === 'trending') {
        q = query(threadsRef, orderBy('votes', 'desc'), limit(50));
      } else if (activeTab === 'new') {
        q = query(threadsRef, orderBy('createdAt', 'desc'), limit(50));
      } else {
        q = query(
          threadsRef,
          where('replyCount', '==', 0),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      let threadData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumThread[];

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        threadData = threadData.filter(
          (thread) =>
            thread.title.toLowerCase().includes(lowerQuery) ||
            thread.bodyMD.toLowerCase().includes(lowerQuery)
        );
      }

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
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.15)]"
        >
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
              Community forum
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              Ask the questions payroll forgot to answer.
            </h1>
            <p className="mt-4 text-slate-500">
              Share relief hacks, decode payslips, and help someone else stay compliant.
            </p>
            {firebaseUser && (
              <Link
                href="/forum/new"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30"
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

          <div className="mt-8 flex flex-wrap gap-2 rounded-full border border-slate-100 bg-white/80 p-1">
            {(['new', 'trending', 'unanswered'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
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
              <div className="py-12 text-center text-slate-500">
                Fetching latest conversations...
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-12 text-center text-slate-500">
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
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Popular tags</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <TagChip key={tag} tag={tag} size="sm" />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-900">
              <h3 className="text-lg font-semibold">House rules</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Be respectful and stay on topic (PAYE & payroll).</li>
                <li>• No spam, no selling, no personal data.</li>
                <li>• Cite sources when referencing statutes.</li>
                <li>• Educational content — not legal advice.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 text-sm text-slate-500">
              <h3 className="text-lg font-semibold text-slate-900">Healthy forum</h3>
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
