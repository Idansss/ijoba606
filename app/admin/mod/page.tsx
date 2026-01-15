'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumReport, ForumThread, ForumPost } from '@/lib/types';
import { moderateContent } from '@/lib/firebase/functions';
import { formatDistanceToNow } from 'date-fns';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { ArrowLeft, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function AdminModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [moderatedThreads, setModeratedThreads] = useState<ForumThread[]>([]);
  const [moderatedPosts, setModeratedPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'actioned'>('open');
  const [activeTab, setActiveTab] = useState<'reports' | 'moderated'>('reports');

  useEffect(() => {
    if (!authLoading) {
      // Block anonymous users
      if (user?.anon === true) {
        addToast({ type: 'error', message: 'Moderator access requires a registered account. Please sign in with Google.' });
        router.push('/');
        return;
      }
      // Block non-moderator/admin users
      if (user?.role !== 'moderator' && user?.role !== 'admin') {
        addToast({ type: 'error', message: 'Moderator access required' });
        router.push('/admin/login');
      }
    }
  }, [user, authLoading, router, addToast]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        // Firebase is not configured; skip fetching and treat as no reports.
        setReports([]);
        return;
      }
      const reportsRef = collection(db, 'forumReports');
      const q = query(reportsRef, where('status', '==', filter));
      
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumReport[];

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      addToast({ type: 'error', message: 'Failed to fetch reports' });
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  const fetchModeratedContent = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        setModeratedThreads([]);
        setModeratedPosts([]);
        setLoading(false);
        return;
      }

      // Fetch hidden threads - try query first, fallback to getting all and filtering
      const threadsRef = collection(db, 'forumThreads');
      let threadsData: ForumThread[] = [];
      
      try {
        const threadsQuery = query(threadsRef, where('isHidden', '==', true));
        const threadsSnapshot = await getDocs(threadsQuery);
        threadsData = threadsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ForumThread[];
      } catch (queryError: any) {
        // If query fails (e.g., missing index or permission issue), try getting all and filtering client-side
        console.warn('Query with isHidden filter failed, trying alternative approach:', queryError);
        try {
          const allThreadsSnapshot = await getDocs(threadsRef);
          const allThreads = allThreadsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ForumThread[];
          threadsData = allThreads.filter((thread) => thread.isHidden === true);
        } catch (fallbackError) {
          console.error('Error fetching threads (fallback):', fallbackError);
          throw fallbackError;
        }
      }

      // Fetch hidden posts - try query first, fallback to getting all and filtering
      const postsRef = collection(db, 'forumPosts');
      let postsData: ForumPost[] = [];
      
      try {
        const postsQuery = query(postsRef, where('isHidden', '==', true));
        const postsSnapshot = await getDocs(postsQuery);
        postsData = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ForumPost[];
      } catch (queryError: any) {
        // If query fails, try getting all and filtering client-side
        console.warn('Query with isHidden filter failed, trying alternative approach:', queryError);
        try {
          const allPostsSnapshot = await getDocs(postsRef);
          const allPosts = allPostsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ForumPost[];
          postsData = allPosts.filter((post) => post.isHidden === true);
        } catch (fallbackError) {
          console.error('Error fetching posts (fallback):', fallbackError);
          throw fallbackError;
        }
      }

      setModeratedThreads(threadsData);
      setModeratedPosts(postsData);
    } catch (error: any) {
      console.error('Error fetching moderated content:', error);
      const errorMessage = error?.code === 'permission-denied' 
        ? 'Permission denied. Make sure you are logged in as a moderator/admin and Firestore rules are deployed.'
        : error?.message || 'Failed to fetch moderated content';
      addToast({ type: 'error', message: errorMessage });
      // Set empty arrays on error so UI doesn't break
      setModeratedThreads([]);
      setModeratedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch reports when on reports tab
  useEffect(() => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      if (activeTab === 'reports') {
        fetchReports();
      }
    }
  }, [user, filter, activeTab, fetchReports]);

  // Always fetch moderated content on page load to show counter
  useEffect(() => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      fetchModeratedContent();
    }
  }, [user, fetchModeratedContent]);

  // Also fetch moderated content when switching to that tab (in case it was updated)
  useEffect(() => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      if (activeTab === 'moderated') {
        fetchModeratedContent();
      }
    }
  }, [activeTab, fetchModeratedContent]);

  const [moderationReason, setModerationReason] = useState<Record<string, string>>({});
  const [showReasonInput, setShowReasonInput] = useState<Record<string, boolean>>({});

  const handleModerateAction = async (
    report: ForumReport,
    action: 'hide' | 'unhide' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'delete'
  ) => {
    try {
      if (!db) {
        addToast({
          type: 'error',
          message: 'Moderation tools are disabled in this local demo (no Firebase configuration).',
        });
        return;
      }

      // Require reason for hide and delete actions
      const requiresReason = ['hide', 'delete'].includes(action);
      const reason = moderationReason[report.id || ''] || '';

      if (requiresReason && !reason.trim()) {
        addToast({ type: 'error', message: 'Please provide a reason for this action' });
        setShowReasonInput({ ...showReasonInput, [report.id || '']: true });
        return;
      }

      await moderateContent({
        targetKind: report.targetKind,
        targetId: report.targetId,
        action,
        reason: requiresReason ? reason.trim() : undefined,
      });

      // Mark report as actioned
      const reportRef = doc(db, 'forumReports', report.id!);
      await updateDoc(reportRef, { status: 'actioned' });

      // Clear reason input
      setModerationReason({ ...moderationReason, [report.id || '']: '' });
      setShowReasonInput({ ...showReasonInput, [report.id || '']: false });

      addToast({ type: 'success', message: `Action completed: ${action}` });
      fetchReports();
      // Refresh moderated content list to update counter
      fetchModeratedContent();
      // Refresh moderated content list to update counter
      fetchModeratedContent();
    } catch (error) {
      console.error('Moderation error:', error);
      addToast({ type: 'error', message: 'Failed to perform action. Try again.' });
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      if (!db) {
        addToast({
          type: 'error',
          message: 'Moderation tools are disabled in this local demo (no Firebase configuration).',
        });
        return;
      }
      const reportRef = doc(db, 'forumReports', reportId);
      await updateDoc(reportRef, { status: 'actioned' });
      addToast({ type: 'info', message: 'Report dismissed' });
      fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
      addToast({ type: 'error', message: 'Failed to dismiss report' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'moderator' && user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <AdminBreadcrumb items={[{ label: 'Moderation' }]} />

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </Link>
        </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Moderation Dashboard
          </h1>
          <p className="text-gray-600">
            Review and action reported content, manage moderated items
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl max-w-md">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('moderated')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'moderated'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Moderated Content ({moderatedThreads.length + moderatedPosts.length})
          </button>
        </div>

        {/* Stats - Only show for reports tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {reports.filter(r => r.status === 'open').length}
              </div>
              <div className="text-sm text-gray-600">Open Reports</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reports.filter(r => r.status === 'actioned').length}
              </div>
              <div className="text-sm text-gray-600">Actioned Reports</div>
            </div>
          </div>
        )}

        {/* Filter Tabs - Only show for reports tab */}
        {activeTab === 'reports' && (
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl max-w-md">
          <button
            onClick={() => setFilter('open')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              filter === 'open'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Open ({reports.filter(r => r.status === 'open').length})
          </button>
          <button
            onClick={() => setFilter('actioned')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              filter === 'actioned'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Actioned ({reports.filter(r => r.status === 'actioned').length})
          </button>
        </div>
        )}

        {/* Reports List */}
        {activeTab === 'reports' && (
        <>
        {reports.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {filter === 'open' ? 'No pending reports' : 'No actioned reports'}
            </h3>
            <p className="text-gray-600">
              {filter === 'open'
                ? 'All clear! No reports to review.'
                : 'Switch to "Open" to see pending reports.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const timeAgo = report.createdAt
                ? formatDistanceToNow(new Date(report.createdAt.seconds * 1000), {
                    addSuffix: true,
                  })
                : '';

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.targetKind === 'thread'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {report.targetKind.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.status === 'open'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Reason: {report.reason}
                      </h3>
                      {report.text && (
                        <p className="text-gray-600 text-sm mb-2">
                          Details: {report.text}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Reported {timeAgo}</span>
                        <span>•</span>
                        <Link
                          href={
                            report.targetKind === 'thread'
                              ? `/forum/thread/${report.targetId}`
                              : `/forum`
                          }
                          className="text-purple-600 hover:text-purple-700 font-semibold"
                        >
                          View Content →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {report.status === 'open' && (
                    <div className="pt-4 border-t-2 border-gray-200">
                      {/* Reason input for hide/delete */}
                      {(showReasonInput[report.id || ''] || false) && (
                        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reason for moderation (required):
                          </label>
                          <textarea
                            value={moderationReason[report.id || ''] || ''}
                            onChange={(e) =>
                              setModerationReason({
                                ...moderationReason,
                                [report.id || '']: e.target.value,
                              })
                            }
                            placeholder="Explain why this content is being moderated..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            if (!showReasonInput[report.id || '']) {
                              setShowReasonInput({ ...showReasonInput, [report.id || '']: true });
                            } else {
                              handleModerateAction(report, 'hide');
                            }
                          }}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                        >
                          {showReasonInput[report.id || ''] ? 'Confirm Hide' : 'Hide Content'}
                        </button>
                        <button
                          onClick={() => {
                            if (!showReasonInput[report.id || '']) {
                              setShowReasonInput({ ...showReasonInput, [report.id || '']: true });
                            } else {
                              handleModerateAction(report, 'delete');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
                        >
                          {showReasonInput[report.id || ''] ? 'Confirm Delete' : 'Delete Content'}
                        </button>
                        {report.targetKind === 'thread' && (
                          <>
                            <button
                              onClick={() => handleModerateAction(report, 'lock')}
                              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-all"
                            >
                              Lock Thread
                            </button>
                            <button
                              onClick={() => handleModerateAction(report, 'pin')}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
                            >
                              Pin Thread
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDismissReport(report.id!)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                        >
                          Dismiss Report
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            }            )}
          </div>
        )}
        </>
        )}

        {/* Moderated Content List */}
        {activeTab === 'moderated' && (
          <>
            {moderatedThreads.length === 0 && moderatedPosts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-200 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No moderated content
                </h3>
                <p className="text-gray-600">
                  All content is visible. Hidden items will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Hidden Threads */}
                {moderatedThreads.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Hidden Threads ({moderatedThreads.length})
                    </h2>
                    <div className="space-y-4">
                      {moderatedThreads.map((thread) => {
                        const timeAgo = thread.createdAt
                          ? formatDistanceToNow(new Date(thread.createdAt.seconds * 1000), {
                              addSuffix: true,
                            })
                          : '';
                        const moderatedTimeAgo = thread.moderatedAt
                          ? formatDistanceToNow(new Date(thread.moderatedAt.seconds * 1000), {
                              addSuffix: true,
                            })
                          : '';

                        return (
                          <motion.div
                            key={thread.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-200"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                    THREAD
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    HIDDEN
                                  </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                  {thread.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                  {thread.bodyMD}
                                </p>
                                {thread.moderationReason && (
                                  <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                                      Moderation Reason:
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                      {thread.moderationReason}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Created {timeAgo}</span>
                                  {moderatedTimeAgo && (
                                    <>
                                      <span>•</span>
                                      <span>Hidden {moderatedTimeAgo}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <Link
                                    href={`/forum/thread/${thread.id}`}
                                    className="text-purple-600 hover:text-purple-700 font-semibold"
                                  >
                                    View Thread →
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t-2 border-gray-200">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await moderateContent({
                                        targetKind: 'thread',
                                        targetId: thread.id!,
                                        action: 'unhide',
                                      });
                                      addToast({ type: 'success', message: 'Thread unhidden' });
                                      fetchModeratedContent();
                                    } catch (error) {
                                      console.error('Error unhiding thread:', error);
                                      addToast({ type: 'error', message: 'Failed to unhide thread' });
                                    }
                                  }}
                                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition-all flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Unhide Thread
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to permanently delete this thread?')) {
                                      return;
                                    }
                                    try {
                                      await moderateContent({
                                        targetKind: 'thread',
                                        targetId: thread.id!,
                                        action: 'delete',
                                        reason: 'Permanently deleted by admin',
                                      });
                                      addToast({ type: 'success', message: 'Thread deleted' });
                                      fetchModeratedContent();
                                    } catch (error) {
                                      console.error('Error deleting thread:', error);
                                      addToast({ type: 'error', message: 'Failed to delete thread' });
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Permanently
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hidden Posts */}
                {moderatedPosts.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Hidden Posts ({moderatedPosts.length})
                    </h2>
                    <div className="space-y-4">
                      {moderatedPosts.map((post) => {
                        const timeAgo = post.createdAt
                          ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), {
                              addSuffix: true,
                            })
                          : '';
                        const moderatedTimeAgo = post.moderatedAt
                          ? formatDistanceToNow(new Date(post.moderatedAt.seconds * 1000), {
                              addSuffix: true,
                            })
                          : '';

                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-red-200"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                    POST
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    HIDDEN
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                                  {post.bodyMD}
                                </p>
                                {post.moderationReason && (
                                  <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                                      Moderation Reason:
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                      {post.moderationReason}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Created {timeAgo}</span>
                                  {moderatedTimeAgo && (
                                    <>
                                      <span>•</span>
                                      <span>Hidden {moderatedTimeAgo}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <Link
                                    href={`/forum/thread/${post.tid}`}
                                    className="text-purple-600 hover:text-purple-700 font-semibold"
                                  >
                                    View Thread →
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t-2 border-gray-200">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await moderateContent({
                                        targetKind: 'post',
                                        targetId: post.id!,
                                        action: 'unhide',
                                      });
                                      addToast({ type: 'success', message: 'Post unhidden' });
                                      fetchModeratedContent();
                                    } catch (error) {
                                      console.error('Error unhiding post:', error);
                                      addToast({ type: 'error', message: 'Failed to unhide post' });
                                    }
                                  }}
                                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition-all flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Unhide Post
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to permanently delete this post?')) {
                                      return;
                                    }
                                    try {
                                      await moderateContent({
                                        targetKind: 'post',
                                        targetId: post.id!,
                                        action: 'delete',
                                        reason: 'Permanently deleted by admin',
                                      });
                                      addToast({ type: 'success', message: 'Post deleted' });
                                      fetchModeratedContent();
                                    } catch (error) {
                                      console.error('Error deleting post:', error);
                                      addToast({ type: 'error', message: 'Failed to delete post' });
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Permanently
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

