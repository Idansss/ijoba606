'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ForumReport } from '@/lib/types';
import { moderateContent } from '@/lib/firebase/functions';
import { formatDistanceToNow } from 'date-fns';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { ArrowLeft } from 'lucide-react';

export default function AdminModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'actioned'>('open');

  useEffect(() => {
    if (!authLoading && user?.role !== 'moderator' && user?.role !== 'admin') {
      addToast({ type: 'error', message: 'Moderator access required' });
      router.push('/admin/login');
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

  useEffect(() => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      fetchReports();
    }
  }, [user, filter, fetchReports]);

  const handleModerateAction = async (
    report: ForumReport,
    action: 'hide' | 'unhide' | 'lock' | 'unlock' | 'pin' | 'unpin'
  ) => {
    try {
      if (!db) {
        addToast({
          type: 'error',
          message: 'Moderation tools are disabled in this local demo (no Firebase configuration).',
        });
        return;
      }
      await moderateContent({
        targetKind: report.targetKind,
        targetId: report.targetId,
        action,
      });

      // Mark report as actioned
      const reportRef = doc(db, 'forumReports', report.id!);
      await updateDoc(reportRef, { status: 'actioned' });

      addToast({ type: 'success', message: `Action completed: ${action}` });
      fetchReports();
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
            Review and action reported content
          </p>
        </div>

        {/* Stats */}
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

        {/* Filter Tabs */}
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

        {/* Reports List */}
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
                    <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-200">
                      <button
                        onClick={() => handleModerateAction(report, 'hide')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                      >
                        Hide Content
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
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

