'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Invoice } from '@/lib/types';
import { FileText, Clock, CheckCircle2, XCircle, DollarSign, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';

type ServiceStatus = 'pending_payment' | 'in_progress' | 'completed' | 'cancelled';

export default function UserDashboardPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ServiceStatus | 'pending_payment'>('all');

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to view your dashboard' });
      router.push('/');
      return;
    }

    fetchInvoices();
  }, [firebaseUser, router, addToast]);

  const fetchInvoices = async () => {
    if (!db || !firebaseUser) return;

    setLoading(true);
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('customerUid', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const invoicesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];

      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      addToast({ type: 'error', message: 'Failed to load invoices' });
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'pending_payment') {
      return invoice.paymentStatus === 'pending' || invoice.status === 'sent';
    }
    return invoice.serviceStatus === filter;
  });

  const stats = {
    pendingPayment: invoices.filter(i => i.paymentStatus === 'pending' || i.status === 'sent').length,
    inProgress: invoices.filter(i => i.serviceStatus === 'in_progress').length,
    completed: invoices.filter(i => i.serviceStatus === 'completed').length,
    total: invoices.length,
  };

  const getStatusIcon = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'completed' && invoice.serviceStatus === 'completed') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (invoice.paymentStatus === 'pending' || invoice.status === 'sent') {
      return <Clock className="w-5 h-5 text-[#a98700]" />;
    }
    if (invoice.serviceStatus === 'in_progress') {
      return <Clock className="w-5 h-5 text-[#006d33]" />;
    }
    if (invoice.status === 'cancelled' || invoice.serviceStatus === 'cancelled') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <FileText className="w-5 h-5 text-on-surface-variant" />;
  };

  const getStatusColor = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'completed' && invoice.serviceStatus === 'completed') {
      return 'text-green-600 bg-green-50';
    }
    if (invoice.paymentStatus === 'pending' || invoice.status === 'sent') {
      return 'text-[#a98700] bg-[#fcf7e6]';
    }
    if (invoice.serviceStatus === 'in_progress') {
      return 'text-[#006d33] bg-[#e6f3ec]';
    }
    if (invoice.status === 'cancelled' || invoice.serviceStatus === 'cancelled') {
      return 'text-red-600 bg-red-50';
    }
    return 'text-on-surface-variant bg-surface-container-low';
  };

  const getStatusText = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'pending' || invoice.status === 'sent') {
      return 'Pending Payment';
    }
    if (invoice.serviceStatus === 'in_progress') {
      return 'In Progress';
    }
    if (invoice.serviceStatus === 'completed') {
      return 'Completed';
    }
    if (invoice.status === 'cancelled' || invoice.serviceStatus === 'cancelled') {
      return 'Cancelled';
    }
    return 'Draft';
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#006400]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-8">
        <h1 className="font-display-lg-mobile text-display-lg-mobile mb-2 text-deep-green">
          My Dashboard
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your invoices and services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Total Services</p>
              <p className="font-figure-xl text-2xl font-bold text-on-surface">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-[#006400]" />
          </div>
        </div>
        <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Pending Payment</p>
              <p className="text-2xl font-bold text-[#a98700]">{stats.pendingPayment}</p>
            </div>
            <Clock className="w-8 h-8 text-[#a98700]" />
          </div>
        </div>
        <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">In Progress</p>
              <p className="text-2xl font-bold text-[#006d33]">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-[#006d33]" />
          </div>
        </div>
        <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-4 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-label-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-[#006400] text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending_payment')}
            className={`px-4 py-2 rounded-full font-label-sm font-semibold transition ${
              filter === 'pending_payment'
                ? 'bg-[#a98700] text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Pending Payment
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-full font-label-sm font-semibold transition ${
              filter === 'in_progress'
                ? 'bg-[#006d33] text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-label-sm font-semibold transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest p-6 sm:p-12 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] text-center">
            <FileText className="w-16 h-16 text-outline mx-auto mb-4" />
            <p className="text-on-surface-variant text-lg">No invoices found</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-input border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(invoice)}
                    <h3 className="text-xl font-bold text-on-surface">{invoice.title}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(invoice)}`}>
                      {getStatusText(invoice)}
                    </span>
                  </div>
                  <p className="text-on-surface-variant mb-2">{invoice.description}</p>
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant/70">
                    <span>Invoice #{invoice.invoiceNumber}</span>
                    <span>•</span>
                    <span>
                      {invoice.createdAt && formatDistanceToNow(invoice.createdAt.toDate(), { addSuffix: true })}
                    </span>
                    {invoice.dueDate && (
                      <>
                        <span>•</span>
                        <span>Due: {invoice.dueDate.toDate().toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-figure-xl text-2xl font-bold text-deep-green mb-2">
                    ₦{invoice.total.toLocaleString()}
                  </p>
                  {invoice.paymentStatus === 'pending' && (
                    <Link
                      href={`/consultants/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-on-primary rounded-full font-label-sm font-semibold hover:bg-forest-green transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      Pay Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {invoice.paymentStatus === 'completed' && (
                    <Link
                      href={`/consultants/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-full font-label-sm font-semibold hover:bg-surface-container-high transition"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
