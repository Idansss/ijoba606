'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, orderBy, limit, doc, getDoc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { PaymentTransaction, RefundRequest, Dispute, Invoice } from '@/lib/types';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type TabType = 'transactions' | 'refunds' | 'disputes';

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user?.anon === true) {
        addToast({ type: 'error', message: 'Admin access requires a registered account' });
        router.push('/');
        return;
      }
      if (user?.role !== 'admin') {
        addToast({ type: 'error', message: 'Admin access required' });
        router.push('/admin/login');
      }
    }
  }, [user, authLoading, router, addToast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = useCallback(async () => {
    if (!db) return;

    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const transactionsRef = collection(db, 'paymentTransactions');
        const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        setTransactions(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PaymentTransaction))
        );
      } else if (activeTab === 'refunds') {
        const refundsRef = collection(db, 'refundRequests');
        const q = query(refundsRef, orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        setRefunds(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RefundRequest))
        );
      } else if (activeTab === 'disputes') {
        const disputesRef = collection(db, 'disputes');
        const q = query(disputesRef, orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        setDisputes(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Dispute))
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  const handleProcessRefund = async (refundId: string, action: 'approve' | 'reject') => {
    if (!db) return;

    setProcessing(refundId);
    try {
      const refundRef = doc(db, 'refundRequests', refundId);
      const refundSnap = await getDoc(refundRef);

      if (!refundSnap.exists()) {
        throw new Error('Refund not found');
      }

      const refund = refundSnap.data() as RefundRequest;

      if (action === 'approve') {
        // Update refund status
        await updateDoc(refundRef, {
          status: 'processing',
          updatedAt: serverTimestamp(),
        });

        // TODO: Process actual Paystack refund here
        // For now, we'll mark as processing
        // In production, call Paystack refund API

        // Update invoice
        const invoiceRef = doc(db, 'invoices', refund.invoiceId);
        await updateDoc(invoiceRef, {
          serviceStatus: 'cancelled',
          updatedAt: serverTimestamp(),
        });

        addToast({ type: 'success', message: 'Refund approved and processing' });
      } else {
        await updateDoc(refundRef, {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        });
        addToast({ type: 'info', message: 'Refund request rejected' });
      }

      fetchData();
    } catch (error) {
      console.error('Error processing refund:', error);
      addToast({ type: 'error', message: 'Failed to process refund' });
    } finally {
      setProcessing(null);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: string, action: 'resolve' | 'reject') => {
    if (!db || !user) return;

    setProcessing(disputeId);
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);

      if (!disputeSnap.exists()) {
        throw new Error('Dispute not found');
      }

      const dispute = disputeSnap.data() as Dispute;

      if (action === 'resolve') {
        await updateDoc(disputeRef, {
          status: 'resolved',
          resolution,
          resolvedBy: user.uid,
          resolvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Update invoice
        const invoiceRef = doc(db, 'invoices', dispute.invoiceId);
        await updateDoc(invoiceRef, {
          serviceStatus: 'completed',
          updatedAt: serverTimestamp(),
        });

        addToast({ type: 'success', message: 'Dispute resolved' });
      } else {
        await updateDoc(disputeRef, {
          status: 'rejected',
          resolution,
          resolvedBy: user.uid,
          resolvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Update invoice back to confirmed
        const invoiceRef = doc(db, 'invoices', dispute.invoiceId);
        await updateDoc(invoiceRef, {
          serviceStatus: 'pending_release',
          updatedAt: serverTimestamp(),
        });

        addToast({ type: 'info', message: 'Dispute rejected' });
      }

      fetchData();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      addToast({ type: 'error', message: 'Failed to resolve dispute' });
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <AdminBreadcrumb items={[{ label: 'Transactions' }]} />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Transaction Monitoring
          </h1>
          <p className="text-gray-600">Monitor payments, refunds, and disputes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl max-w-md">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'refunds'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Refunds
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'disputes'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Disputes
          </button>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Payment Transactions</h2>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions found</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">₦{(transaction.amount / 100).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Invoice: {transaction.invoiceId}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.createdAt && formatDistanceToNow(transaction.createdAt.toDate(), { addSuffix: true })}
                      </p>
                    </div>
                    <Link
                      href={`/consultants/invoices/${transaction.invoiceId}`}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Refunds Tab */}
        {activeTab === 'refunds' && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Refund Requests</h2>
            <div className="space-y-4">
              {refunds.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No refund requests found</p>
              ) : (
                refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold">₦{(refund.amount / 100).toLocaleString()}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            refund.status === 'completed' ? 'bg-green-100 text-green-700' :
                            refund.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            refund.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {refund.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Invoice: {refund.invoiceId}</p>
                        <p className="text-sm text-gray-600">Reason: {refund.reason}</p>
                        {refund.reasonDetails && (
                          <p className="text-sm text-gray-500 mt-1">{refund.reasonDetails}</p>
                        )}
                        {refund.bankAccount && (
                          <p className="text-xs text-gray-500 mt-1">
                            Refund to: {refund.bankAccount.accountName} - {refund.bankAccount.accountNumber}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/consultants/invoices/${refund.invoiceId}`}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </div>
                    {refund.status === 'pending' && (
                      <div className="flex gap-2 pt-3 border-t">
                        <button
                          onClick={() => refund.id && handleProcessRefund(refund.id, 'approve')}
                          disabled={processing === refund.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {processing === refund.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => refund.id && handleProcessRefund(refund.id, 'reject')}
                          disabled={processing === refund.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Disputes</h2>
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No disputes found</p>
              ) : (
                disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="font-semibold">{dispute.reason}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            dispute.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {dispute.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{dispute.details}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Invoice: {dispute.invoiceId} • {dispute.createdAt && formatDistanceToNow(dispute.createdAt.toDate(), { addSuffix: true })}
                        </p>
                        {dispute.resolution && (
                          <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                            <strong>Resolution:</strong> {dispute.resolution}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/consultants/invoices/${dispute.invoiceId}`}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </div>
                    {dispute.status === 'open' && (
                      <DisputeResolutionForm
                        disputeId={dispute.id!}
                        onResolve={(resolution, action) => handleResolveDispute(dispute.id!, resolution, action)}
                        processing={processing === dispute.id}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DisputeResolutionForm({ disputeId, onResolve, processing }: { disputeId: string; onResolve: (resolution: string, action: 'resolve' | 'reject') => void; processing: boolean }) {
  const [resolution, setResolution] = useState('');

  return (
    <div className="pt-3 border-t space-y-2">
      <textarea
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="Enter resolution details..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onResolve(resolution, 'resolve')}
          disabled={processing || !resolution}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Resolve (Approve Customer)'}
        </button>
        <button
          onClick={() => onResolve(resolution, 'reject')}
          disabled={processing || !resolution}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Reject (Approve Consultant)'}
        </button>
      </div>
    </div>
  );
}
