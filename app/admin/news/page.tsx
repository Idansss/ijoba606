'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import {
  ArrowLeft,
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  category?: string;
  publishedAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  imageUrl?: string;
  isActive?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function AdminNewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    source: '',
    sourceUrl: '',
    category: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (user?.anon === true) {
        addToast({ type: 'error', message: 'Admin access requires a registered account.' });
        router.push('/');
        return;
      }
      if (user?.role !== 'admin') {
        addToast({ type: 'error', message: 'Admin access required' });
        router.push('/admin/login');
      }
    }
  }, [user, authLoading, router, addToast]);

  const fetchArticles = useCallback(async () => {
    if (!db) {
      setArticles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ref = collection(db, 'newsArticles');
      const q = query(ref, orderBy('publishedAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as NewsArticle[];
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
      addToast({ type: 'error', message: 'Failed to fetch articles' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user?.role === 'admin') fetchArticles();
  }, [user, fetchArticles]);

  const openModal = (article?: NewsArticle) => {
    if (article) {
      setEditingArticle(article);
      setForm({
        title: article.title,
        slug: article.slug || article.id,
        excerpt: article.excerpt || '',
        content: article.content || '',
        source: article.source || '',
        sourceUrl: article.sourceUrl || '',
        category: article.category || '',
        imageUrl: article.imageUrl || '',
        isActive: article.isActive !== false,
      });
    } else {
      setEditingArticle(null);
      setForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        source: '',
        sourceUrl: '',
        category: '',
        imageUrl: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const publishedAt = Timestamp.now();
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      publishedAt,
      updatedAt: serverTimestamp(),
      isActive: form.isActive,
    };

    try {
      if (editingArticle) {
        await updateDoc(doc(db, 'newsArticles', editingArticle.id), {
          ...payload,
          createdAt: editingArticle.createdAt,
        });
        addToast({ type: 'success', message: 'Article updated' });
      } else {
        await addDoc(collection(db, 'newsArticles'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        addToast({ type: 'success', message: 'Article published' });
      }
      setShowModal(false);
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      addToast({ type: 'error', message: 'Failed to save article' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'newsArticles', id));
      addToast({ type: 'success', message: 'Article deleted' });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      addToast({ type: 'error', message: 'Failed to delete article' });
    }
  };

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="max-w-6xl mx-auto">
        <AdminBreadcrumb items={[{ label: 'News Management' }]} />

        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </Link>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                News
              </span>{' '}
              <span className="text-gray-900">Management</span>
            </h1>
            <p className="text-gray-600">
              Create and manage tax news articles for the public news page.
            </p>
            <p className="text-sm text-gray-500 mt-1">Total: {articles.length} article(s)</p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Article
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No articles yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your first tax news article to display on the public news page.
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
              Add Article
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Published</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">{article.title}</p>
                        <p className="text-xs text-gray-500">{article.slug || article.id}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {article.category || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {article.publishedAt?.toDate
                          ? format(article.publishedAt.toDate(), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            article.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {article.isActive !== false ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/news/${article.slug || article.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                            title="View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openModal(article)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingArticle ? 'Edit Article' : 'New Article'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Article title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="url-friendly-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Excerpt *</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Short summary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Content (HTML) *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="<p>Your HTML content here...</p>"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. PAYE, Compliance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. FIRS"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Source URL</label>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (visible on news page)
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                >
                  {editingArticle ? 'Update' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
