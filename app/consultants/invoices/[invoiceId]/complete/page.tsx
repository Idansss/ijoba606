'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Invoice, ServiceCompletion } from '@/lib/types';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CompleteServicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in' });
      router.push('/consultants');
      return;
    }

    fetchInvoice();
  }, [firebaseUser, invoiceId, router, addToast]);

  const fetchInvoice = async () => {
    if (!db || !invoiceId) return;

    setLoading(true);
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        addToast({ type: 'error', message: 'Invoice not found' });
        router.push('/consultants/wallet');
        return;
      }

      const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;

      if (invoiceData.consultantUid !== firebaseUser.uid) {
        addToast({ type: 'error', message: 'You do not have access to this invoice' });
        router.push('/consultants/wallet');
        return;
      }

      if (invoiceData.serviceStatus !== 'in_progress' && invoiceData.serviceStatus !== 'pending_completion') {
        addToast({ type: 'info', message: 'Service is not in progress' });
        router.push(`/consultants/invoices/${invoiceId}`);
        return;
      }

      setInvoice(invoiceData);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      addToast({ type: 'error', message: 'Failed to load invoice' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!db || !invoice) return;

    if (!confirm('Mark this service as complete? The customer will be notified to confirm.')) {
      return;
    }

    setCompleting(true);
    try {
      // Update invoice status
      const invoiceRef = doc(db, 'invoices', invoice.id!);
      await updateDoc(invoiceRef, {
        serviceStatus: 'pending_confirmation',
        updatedAt: serverTimestamp(),
      });

      // Create service completion record
      const completionsRef = collection(db, 'serviceCompletions');
      const completionRef = doc(completionsRef);
      const completion: Omit<ServiceCompletion, 'id'> = {
        invoiceId: invoice.id!,
        consultantUid: invoice.consultantUid,
        customerUid: invoice.customerUid,
        status: 'pending_confirmation',
        completedAt: serverTimestamp() as any,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      await setDoc(completionRef, completion);

      // Send notification to customer
      const customerNotifRef = db
        .collection('notifications')
        .doc(invoice.customerUid)
        .collection('items')
        .doc();
      await setDoc(customerNotifRef, {
        type: 'service_completed',
        ref: invoice.id,
        title: 'Service Completed',
        snippet: `Consultant has marked service for invoice ${invoice.invoiceNumber} as complete. Please confirm.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Service marked as complete. Customer will be notified to confirm.' });
      router.push(`/consultants/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error marking service complete:', error);
      addToast({ type: 'error', message: 'Failed to mark service as complete' });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/consultants/invoices/${invoice.id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mark Service as Complete</h1>
          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Important Notice</p>
              <p className="text-sm text-yellow-700">
                Once you mark this service as complete, the customer will be notified to confirm. 
                If they accept, there will be a 48-hour hold period before funds are released to your wallet. 
                If they dispute, an admin will review the case.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Service Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Title:</span>
              <span className="font-semibold">{invoice.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">₦{invoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold capitalize">{invoice.serviceStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/consultants/invoices/${invoice.id}`)}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleMarkComplete}
            disabled={completing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {completing ? 'Marking Complete...' : 'Mark Service as Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
