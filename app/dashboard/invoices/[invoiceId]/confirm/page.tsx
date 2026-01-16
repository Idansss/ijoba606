'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Invoice, ServiceCompletion, Dispute } from '@/lib/types';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmServicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [completion, setCompletion] = useState<ServiceCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in' });
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [firebaseUser, invoiceId, router, addToast]);

  const fetchData = async () => {
    if (!db || !invoiceId) return;

    setLoading(true);
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        addToast({ type: 'error', message: 'Invoice not found' });
        router.push('/dashboard');
        return;
      }

      const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;

      if (invoiceData.customerUid !== firebaseUser.uid) {
        addToast({ type: 'error', message: 'You do not have access to this invoice' });
        router.push('/dashboard');
        return;
      }

      if (invoiceData.serviceStatus !== 'pending_confirmation') {
        addToast({ type: 'info', message: 'Service is not pending confirmation' });
        router.push(`/consultants/invoices/${invoiceId}`);
        return;
      }

      setInvoice(invoiceData);

      // Fetch service completion
      const completionsRef = collection(db, 'serviceCompletions');
      const completionQuery = query(completionsRef, where('invoiceId', '==', invoiceId));
      const completionSnap = await getDocs(completionQuery);

      if (!completionSnap.empty) {
        setCompletion({ id: completionSnap.docs[0].id, ...completionSnap.docs[0].data() } as ServiceCompletion);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!db || !invoice || !completion) return;

    if (!confirm('Confirm that the service has been completed successfully? Funds will be held for 48 hours before release.')) {
      return;
    }

    setConfirming(true);
    try {
      const holdReleaseAt = new Date();
      holdReleaseAt.setHours(holdReleaseAt.getHours() + 48);

      // Update invoice
      const invoiceRef = doc(db, 'invoices', invoice.id!);
      await updateDoc(invoiceRef, {
        serviceStatus: 'pending_release',
        updatedAt: serverTimestamp(),
      });

      // Update service completion
      const completionRef = doc(db, 'serviceCompletions', completion.id!);
      await updateDoc(completionRef, {
        status: 'confirmed',
        confirmedAt: serverTimestamp(),
        holdReleaseAt: serverTimestamp() as any, // Will be set properly in Cloud Function
        updatedAt: serverTimestamp(),
      });

      // Update wallet transaction to pending_release
      const transactionsRef = collection(db, 'walletTransactions');
      const transactionQuery = query(
        transactionsRef,
        where('invoiceId', '==', invoice.id),
        where('consultantUid', '==', invoice.consultantUid)
      );
      const transactionSnap = await getDocs(transactionQuery);

      if (!transactionSnap.empty) {
        const transactionRef = doc(db, 'walletTransactions', transactionSnap.docs[0].id);
        await updateDoc(transactionRef, {
          fundStatus: 'pending_release',
          holdReleaseAt: serverTimestamp() as any,
          updatedAt: serverTimestamp(),
        });
      }

      // Send notification to consultant
      const consultantNotifRef = db
        .collection('notifications')
        .doc(invoice.consultantUid)
        .collection('items')
        .doc();
      await setDoc(consultantNotifRef, {
        type: 'service_confirmed',
        ref: invoice.id,
        title: 'Service Confirmed',
        snippet: `Customer has confirmed service for invoice ${invoice.invoiceNumber}. Funds will be released in 48 hours.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Service confirmed. Funds will be released in 48 hours.' });
      router.push(`/consultants/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error confirming service:', error);
      addToast({ type: 'error', message: 'Failed to confirm service' });
    } finally {
      setConfirming(false);
    }
  };

  const handleDispute = async () => {
    if (!db || !invoice || !completion) return;

    if (!disputeReason || !disputeDetails) {
      addToast({ type: 'error', message: 'Please provide reason and details for dispute' });
      return;
    }

    if (!confirm('Raise a dispute? An admin will review your case.')) {
      return;
    }

    setDisputing(true);
    try {
      // Create dispute
      const disputesRef = collection(db, 'disputes');
      const disputeRef = doc(disputesRef);
      const dispute: Omit<Dispute, 'id'> = {
        invoiceId: invoice.id!,
        serviceCompletionId: completion.id!,
        consultantUid: invoice.consultantUid,
        customerUid: invoice.customerUid,
        reason: disputeReason,
        details: disputeDetails,
        status: 'open',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      await setDoc(disputeRef, dispute);

      // Update invoice
      const invoiceRef = doc(db, 'invoices', invoice.id!);
      await updateDoc(invoiceRef, {
        serviceStatus: 'disputed',
        updatedAt: serverTimestamp(),
      });

      // Update service completion
      const completionRef = doc(db, 'serviceCompletions', completion.id!);
      await updateDoc(completionRef, {
        status: 'disputed',
        disputeId: disputeRef.id,
        updatedAt: serverTimestamp(),
      });

      // Send notification to consultant
      const consultantNotifRef = db
        .collection('notifications')
        .doc(invoice.consultantUid)
        .collection('items')
        .doc();
      await setDoc(consultantNotifRef, {
        type: 'dispute_raised',
        ref: invoice.id,
        title: 'Dispute Raised',
        snippet: `Customer has raised a dispute for invoice ${invoice.invoiceNumber}.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Dispute raised. An admin will review your case.' });
      router.push(`/consultants/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error raising dispute:', error);
      addToast({ type: 'error', message: 'Failed to raise dispute' });
    } finally {
      setDisputing(false);
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

  if (!invoice || !completion) {
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
          <CheckCircle2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Completion Confirmation</h1>
          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">Consultant has marked service as complete</p>
              <p className="text-sm text-blue-700">
                Please review and confirm if the service was provided satisfactorily. 
                If you confirm, funds will be held for 48 hours before release to the consultant. 
                If you have any issues, you can raise a dispute.
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
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold">₦{invoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed At:</span>
              <span className="font-semibold">
                {completion.completedAt && completion.completedAt.toDate().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Confirm Service</h3>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {confirming ? 'Confirming...' : 'Confirm Service Completed'}
          </button>
        </div>

        {/* Dispute Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Raise a Dispute</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select Reason</option>
                <option value="service_not_provided">Service Not Provided</option>
                <option value="poor_quality">Poor Quality</option>
                <option value="not_as_described">Not As Described</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
              <textarea
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide details about the issue..."
                required
              />
            </div>
            <button
              onClick={handleDispute}
              disabled={disputing || !disputeReason || !disputeDetails}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              {disputing ? 'Raising Dispute...' : 'Raise Dispute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
