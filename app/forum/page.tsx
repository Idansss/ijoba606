'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { SearchBar } from '@/components/forum/SearchBar';
import { TagChip } from '@/components/forum/TagChip';
import { useAuthStore } from '@/lib/store/auth';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumThread } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

type TabType = 'trending' | 'new' | 'unanswered';

const POPULAR_TAGS = ['Pension', 'Reliefs', 'Beginners', 'Calculations', 'Self-Employed'];

export default function ForumPage() {
  const { firebaseUser } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    fetchThreads();
  }, [activeTab, searchQuery]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const threadsRef = collection(db, 'forumThreads');
      let q;

      if (searchQuery) {
        // Note: This is a simple client-side filter. In production, use searchForum Cloud Function
        q = query(threadsRef, orderBy('createdAt', 'desc'), limit(50));
      } else if (activeTab === 'trending') {
        q = query(threadsRef, orderBy('votes', 'desc'), limit(50));
      } else if (activeTab === 'new') {
        q = query(threadsRef, orderBy('createdAt', 'desc'), limit(50));
      } else {
        // Unanswered (replyCount === 0)
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

      // Client-side search filter (temporary solution)
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
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Community Forum
          </h1>
          <p className="text-gray-600 mb-6">
            No gist yet? Start one make we learn together! 💬
          </p>

          {/* Create Thread Button */}
          {firebaseUser && (
            <Link
              href="/forum/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              + Create New Thread
            </Link>
          )}
        </motion.div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar
            placeholder="Search discussions..."
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl max-w-md">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            New
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'trending'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('unanswered')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'unanswered'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Unanswered
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : threads.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
                <div className="text-6xl mb-4">💭</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No threads yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to start a conversation!
                </p>
                {firebaseUser && (
                  <Link
                    href="/forum/new"
                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                  >
                    Create First Thread
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread, index) => (
                  <ThreadCard key={thread.id} thread={thread} delay={index * 0.05} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Tags */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="font-bold text-lg text-gray-800 mb-4">
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <TagChip key={tag} tag={tag} size="sm" />
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-blue-900 mb-3">
                Community Guidelines
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Be respectful and helpful</li>
                <li>• Stay on topic (PAYE & tax)</li>
                <li>• No spam or advertising</li>
                <li>• Use appropriate language</li>
                <li>• Educational discussion only</li>
              </ul>
            </div>

            {/* Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="font-bold text-lg text-gray-800 mb-4">
                Forum Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Threads</span>
                  <span className="font-bold text-gray-900">{threads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Today</span>
                  <span className="font-bold text-gray-900">--</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

