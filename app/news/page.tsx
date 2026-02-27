'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  category?: string;
  publishedAt: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  imageUrl?: string;
  isActive?: boolean;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const ref = collection(db, 'newsArticles');
        const q = query(ref, orderBy('publishedAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        const data = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) as NewsArticle[];
        const active = data.filter((a) => a.isActive !== false);
        setArticles(active);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Tax News & Updates
        </h1>
        <p className="text-gray-600">
          Stay informed with the latest PAYE, tax, and compliance news relevant to Nigeria.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No articles yet</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Tax news and updates will appear here. Content can be added manually by admins or
            automatically via AI-powered feeds.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug || article.id}`}
              className="block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition group"
            >
              <div className="p-6 flex gap-6">
                {article.imageUrl && (
                  <div className="shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {article.category && (
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                      {article.category}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mt-1 group-hover:text-purple-600 transition">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 mt-2 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {article.publishedAt?.toDate
                        ? format(article.publishedAt.toDate(), 'MMM d, yyyy')
                        : '—'}
                    </span>
                    {article.source && (
                      <span className="text-gray-400">{article.source}</span>
                    )}
                    <span className="flex items-center gap-1 text-purple-600 font-semibold group-hover:gap-2 transition-all">
                      Read more
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
