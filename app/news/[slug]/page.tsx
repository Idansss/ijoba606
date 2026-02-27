'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function NewsArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [article, setArticle] = useState<{
    id: string;
    title: string;
    excerpt: string;
    content: string;
    source?: string;
    sourceUrl?: string;
    category?: string;
    publishedAt?: { toDate: () => Date };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!db || !slug) {
        setLoading(false);
        return;
      }
      try {
        const ref = collection(db, 'newsArticles');
        const q = query(ref, where('slug', '==', slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setArticle({ id: doc.id, ...doc.data() } as any);
        } else {
          // Fallback: try by document id
          const docRef = doc(db, 'newsArticles', slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setArticle({ id: docSnap.id, ...docSnap.data() } as any);
          } else {
            setArticle(null);
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h1>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-purple-600 hover:underline font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to news
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-semibold mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to news
      </Link>

      <article className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 md:p-12">
          {article.category && (
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
              {article.category}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {article.publishedAt?.toDate
                ? format(article.publishedAt.toDate(), 'MMMM d, yyyy')
                : '—'}
            </span>
            {article.source && (
              <span className="flex items-center gap-1">
                {article.sourceUrl ? (
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-purple-600 hover:underline"
                  >
                    {article.source}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  article.source
                )}
              </span>
            )}
          </div>

          <div
            className="mt-8 prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-purple-600"
            dangerouslySetInnerHTML={{
              __html:
                article.content?.startsWith('<') ?
                  article.content :
                  `<p>${(article.content || '').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />')}</p>`,
            }}
          />
        </div>
      </article>
    </div>
  );
}
