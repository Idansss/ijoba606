'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Invoice, RefundRequest, BankAccount } from '@/lib/types';
import { ArrowLeft, AlertTriangle, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function RequestRefundPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refundData, setRefundData] = useState({
    reason: '' as RefundRequest['reason'],
    reasonDetails: '',
    bankAccountId: '',
  });

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

      if (invoiceData.paymentStatus !== 'completed') {
        addToast({ type: 'error', message: 'Refund can only be requested for paid invoices' });
        router.push(`/consultants/invoices/${invoiceId}`);
        return;
      }

      setInvoice(invoiceData);

      // Fetch bank accounts
      const accountsRef = collection(db, 'bankAccounts');
      const accountsQuery = query(
        accountsRef,
        where('uid', '==', firebaseUser.uid),
        where('accountType', '==', 'user')
      );
      const accountsSnap = await getDocs(accountsQuery);
      const accounts = accountsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BankAccount[];

      setBankAccounts(accounts);
      if (accounts.length > 0) {
        const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
        setRefundData(prev => ({ ...prev, bankAccountId: defaultAccount.id! }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!db || !invoice) return;

    if (!refundData.reason || !refundData.reasonDetails) {
      addToast({ type: 'error', message: 'Please provide reason and details' });
      return;
    }

    if (!refundData.bankAccountId && bankAccounts.length > 0) {
      addToast({ type: 'error', message: 'Please select a bank account for refund' });
      return;
    }

    if (bankAccounts.length === 0) {
      addToast({ type: 'error', message: 'Please add a bank account first' });
      router.push('/settings/bank-account');
      return;
    }

    if (!confirm('Submit refund request? An admin will review your request.')) {
      return;
    }

    setSubmitting(true);
    try {
      // Get transaction
      const transactionsRef = collection(db, 'paymentTransactions');
      const transactionQuery = query(
        transactionsRef,
        where('invoiceId', '==', invoice.id),
        where('status', '==', 'completed')
      );
      const transactionSnap = await getDocs(transactionQuery);

      if (transactionSnap.empty) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionSnap.docs[0];

      // Get selected bank account
      const selectedAccount = bankAccounts.find(a => a.id === refundData.bankAccountId);
      if (!selectedAccount) {
        throw new Error('Bank account not found');
      }

      // Create refund request
      const refundsRef = collection(db, 'refundRequests');
      const refundRef = doc(refundsRef);
      const refund: Omit<RefundRequest, 'id'> = {
        invoiceId: invoice.id!,
        transactionId: transaction.id,
        consultantUid: invoice.consultantUid,
        customerUid: invoice.customerUid,
        amount: invoice.total * 100, // Convert to kobo
        reason: refundData.reason,
        reasonDetails: refundData.reasonDetails,
        status: 'pending',
        bankAccount: {
          accountNumber: selectedAccount.accountNumber,
          accountName: selectedAccount.accountName,
          bankCode: selectedAccount.bankCode,
          bankName: selectedAccount.bankName,
        },
        createdAt: serverTimestamp() as any,
      };
      await setDoc(refundRef, refund);

      // Update invoice
      const invoiceRef = doc(db, 'invoices', invoice.id!);
      await updateDoc(invoiceRef, {
        serviceStatus: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      // Send notification to consultant
      const consultantNotifRef = doc(
        collection(db, 'notifications', invoice.consultantUid, 'items')
      );
      await setDoc(consultantNotifRef, {
        type: 'refund_requested',
        ref: invoice.id,
        title: 'Refund Requested',
        snippet: `Customer has requested a refund for invoice ${invoice.invoiceNumber}.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Refund request submitted. An admin will review it.' });
      router.push(`/consultants/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error submitting refund request:', error);
      addToast({ type: 'error', message: 'Failed to submit refund request' });
    } finally {
      setSubmitting(false);
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
          <DollarSign className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Request Refund</h1>
          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800 mb-1">Refund Policy</p>
              <p className="text-sm text-orange-700">
                Refund requests will be reviewed by an admin. If approved, the refund will be processed to your bank account. 
                Processing may take 3-5 business days.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold">₦{invoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Refund Amount:</span>
              <span className="font-semibold text-green-600">₦{invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Refund *</label>
            <select
              value={refundData.reason}
              onChange={(e) => setRefundData({ ...refundData, reason: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Reason</option>
              <option value="service_not_provided">Service Not Provided</option>
              <option value="poor_quality">Poor Quality</option>
              <option value="dispute">Dispute</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
            <textarea
              value={refundData.reasonDetails}
              onChange={(e) => setRefundData({ ...refundData, reasonDetails: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Please provide details about why you need a refund..."
              required
            />
          </div>

          {bankAccounts.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund to Bank Account *</label>
              <select
                value={refundData.bankAccountId}
                onChange={(e) => setRefundData({ ...refundData, bankAccountId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} - {account.bankName} ({account.accountNumber})
                    {account.isDefault && ' - Default'}
                  </option>
                ))}
              </select>
              <Link
                href="/settings/bank-account"
                className="text-sm text-purple-600 hover:underline mt-1 inline-block"
              >
                Manage bank accounts
              </Link>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2">
                You need to add a bank account to receive refunds.
              </p>
              <Link
                href="/settings/bank-account"
                className="text-sm text-purple-600 hover:underline font-semibold"
              >
                Add Bank Account →
              </Link>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/consultants/invoices/${invoice.id}`)}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !refundData.reason || !refundData.reasonDetails || !refundData.bankAccountId}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Refund Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
