'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Invoice } from '@/lib/types';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamically import Paystack button to avoid SSR issues
const PaystackButton = dynamic(() => import('react-paystack').then(mod => mod.PaystackButton), {
  ssr: false,
});

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const { firebaseUser, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to view invoice' });
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
        router.push('/consultants');
        return;
      }

      const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;

      // Check if user has access
      if (invoiceData.consultantUid !== firebaseUser.uid && invoiceData.customerUid !== firebaseUser.uid) {
        addToast({ type: 'error', message: 'You do not have access to this invoice' });
        router.push('/consultants');
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

  const isConsultant = invoice?.consultantUid === firebaseUser?.uid;
  const isCustomer = invoice?.customerUid === firebaseUser?.uid;

  const handlePaystackSuccess = async (reference: any) => {
    if (!db || !invoice) return;

    setProcessingPayment(true);
    try {
      // Update invoice
      const invoiceRef = doc(db, 'invoices', invoice.id!);
      await updateDoc(invoiceRef, {
        paymentStatus: 'completed',
        paystackReference: reference.reference,
        paidAt: serverTimestamp(),
        status: 'paid',
        updatedAt: serverTimestamp(),
      });

      // Create payment transaction record
      const transactionsRef = collection(db, 'paymentTransactions');
      const transactionRef = doc(transactionsRef);
      await setDoc(transactionRef, {
        invoiceId: invoice.id,
        consultantUid: invoice.consultantUid,
        customerUid: invoice.customerUid,
        amount: invoice.total,
        currency: 'NGN',
        status: 'completed',
        paymentMethod: 'paystack',
        paystackReference: reference.reference,
        paystackTransactionId: reference.transaction,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Payment successful!' });
      
      // Refresh invoice
      fetchInvoice();
    } catch (error) {
      console.error('Error processing payment:', error);
      addToast({ type: 'error', message: 'Payment recorded but verification failed. Please contact support.' });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaystackClose = () => {
    addToast({ type: 'info', message: 'Payment cancelled' });
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

  const getStatusIcon = () => {
    if (invoice.status === 'paid') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (invoice.status === 'overdue') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    if (invoice.status === 'paid') return 'text-green-600 bg-green-50';
    if (invoice.status === 'overdue') return 'text-red-600 bg-red-50';
    if (invoice.status === 'sent') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-6">
        <Link
          href={isConsultant ? '/consultants/wallet' : '/dashboard'}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {isConsultant ? 'Wallet' : 'Dashboard'}
        </Link>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{invoice.title}</h1>
            <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-semibold capitalize">{invoice.status}</span>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">From</h3>
            <p className="text-gray-800">Consultant</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">To</h3>
            <p className="text-gray-800">Customer</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Description</h3>
          <p className="text-gray-700">{invoice.description}</p>
        </div>

        {/* Items */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-semibold text-gray-700">Description</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Unit Price</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 text-gray-800">{item.description}</td>
                  <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">₦{item.unitPrice.toLocaleString()}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">₦{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">₦{invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.vat && invoice.vat > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (7.5%):</span>
                <span className="font-semibold">₦{invoice.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {invoice.paystackFee && invoice.paystackFee > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Paystack Fee (1.5% + ₦100):</span>
                <span className="font-semibold">₦{invoice.paystackFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-purple-600">₦{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              * VAT and Paystack fees are included. Customer bears all fees.
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {isCustomer && invoice.status !== 'paid' && invoice.paymentStatus !== 'completed' && (
          <div className="border-t pt-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Make Payment</h3>
            <PaystackButton
              publicKey={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''}
              email={firebaseUser?.email || ''}
              amount={invoice.total * 100} // Paystack expects amount in kobo
              metadata={{
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerUid: invoice.customerUid,
                consultantUid: invoice.consultantUid,
              }}
              text="Pay Now"
              onSuccess={handlePaystackSuccess}
              onClose={handlePaystackClose}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition"
            />
          </div>
        )}

        {/* Payment Status */}
        {invoice.paymentStatus === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Payment Completed</span>
            </div>
            {invoice.paidAt && (
              <p className="text-sm text-green-700 mt-1">
                Paid on {invoice.paidAt.toDate().toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Service Status Actions */}
        {isConsultant && invoice.serviceStatus === 'in_progress' && (
          <div className="border-t pt-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Service Management</h3>
            <Link
              href={`/consultants/invoices/${invoice.id}/complete`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:brightness-110 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark Service as Complete
            </Link>
          </div>
        )}

        {isCustomer && invoice.serviceStatus === 'pending_confirmation' && (
          <div className="border-t pt-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Service Confirmation Required</h3>
            <p className="text-gray-600 mb-4">
              The consultant has marked this service as complete. Please confirm or raise a dispute.
            </p>
            <div className="flex gap-4">
              <Link
                href={`/dashboard/invoices/${invoice.id}/confirm`}
                className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:brightness-110 transition"
              >
                Confirm Service
              </Link>
            </div>
          </div>
        )}

        {isCustomer && invoice.paymentStatus === 'completed' && invoice.serviceStatus !== 'cancelled' && (
          <div className="border-t pt-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Request Refund</h3>
            <p className="text-gray-600 mb-4">
              If you're not satisfied with the service, you can request a refund.
            </p>
            <Link
              href={`/dashboard/invoices/${invoice.id}/refund`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Request Refund
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-6 border-t">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
