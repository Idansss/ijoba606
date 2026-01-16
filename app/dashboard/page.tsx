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
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
    if (invoice.serviceStatus === 'in_progress') {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    if (invoice.status === 'cancelled' || invoice.serviceStatus === 'cancelled') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'completed' && invoice.serviceStatus === 'completed') {
      return 'text-green-600 bg-green-50';
    }
    if (invoice.paymentStatus === 'pending' || invoice.status === 'sent') {
      return 'text-yellow-600 bg-yellow-50';
    }
    if (invoice.serviceStatus === 'in_progress') {
      return 'text-blue-600 bg-blue-50';
    }
    if (invoice.status === 'cancelled' || invoice.serviceStatus === 'cancelled') {
      return 'text-red-600 bg-red-50';
    }
    return 'text-gray-600 bg-gray-50';
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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          My Dashboard
        </h1>
        <p className="text-gray-600">Manage your invoices and services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Services</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayment}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending_payment')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'pending_payment'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending Payment
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-200 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No invoices found</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(invoice)}
                    <h3 className="text-xl font-bold text-gray-800">{invoice.title}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(invoice)}`}>
                      {getStatusText(invoice)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{invoice.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
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
                  <p className="text-2xl font-bold text-purple-600 mb-2">
                    ₦{invoice.total.toLocaleString()}
                  </p>
                  {invoice.paymentStatus === 'pending' && (
                    <Link
                      href={`/consultants/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      Pay Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {invoice.paymentStatus === 'completed' && (
                    <Link
                      href={`/consultants/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
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
