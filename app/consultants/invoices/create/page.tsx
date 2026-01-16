'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Invoice, InvoiceItem, User } from '@/lib/types';
import { Plus, Trash2, Save, Send, Search, X } from 'lucide-react';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const customerUid = searchParams.get('customerUid');
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<User[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    title: '',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    vat: 0, // 7.5% VAT
    paystackFee: 0, // Paystack fee (customer bears)
    tax: 0, // Total tax (VAT + Paystack fee)
    total: 0,
    currency: 'NGN',
    status: 'draft',
    paymentStatus: 'pending',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
  });

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to create an invoice' });
      router.push('/consultants');
      return;
    }

    // If customerUid is provided, load that customer
    if (customerUid && !selectedCustomer) {
      loadCustomer(customerUid);
    }
  }, [firebaseUser, router, addToast, customerUid]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for customers
  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers();
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customerSearch]);

  const loadCustomer = async (uid: string) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = { uid: userSnap.id, ...userSnap.data() } as User;
        setSelectedCustomer(userData);
        setCustomerSearch(formatHandleForDisplay(userData.handle));
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const searchCustomers = async () => {
    if (!db) return;
    try {
      const usersRef = collection(db, 'users');
      // Search by handle (case-insensitive search would need a different approach)
      // For now, we'll fetch recent users and filter client-side
      const q = query(usersRef, limit(50));
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() } as User))
        .filter((user) => {
          const handle = formatHandleForDisplay(user.handle).toLowerCase();
          const search = customerSearch.toLowerCase();
          return handle.includes(search) || user.uid.toLowerCase().includes(search);
        })
        .slice(0, 10); // Limit to 10 suggestions

      setCustomerSuggestions(users);
      setShowSuggestions(users.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const selectCustomer = (user: User) => {
    setSelectedCustomer(user);
    setCustomerSearch(formatHandleForDisplay(user.handle));
    setShowSuggestions(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerSuggestions([]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        items[index].total = items[index].quantity * items[index].unitPrice;
      }

      // Recalculate subtotal, VAT, Paystack fee, and total
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const vat = subtotal * 0.075; // 7.5% VAT
      const subtotalWithVAT = subtotal + vat;
      // Paystack fee: 1.5% + ₦100 (customer bears)
      const paystackFee = subtotalWithVAT * 0.015 + 100;
      const total = subtotalWithVAT + paystackFee;

      return {
        ...prev,
        items,
        subtotal,
        vat,
        paystackFee,
        tax: vat + paystackFee,
        total,
      };
    });
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), { description: '', quantity: 1, unitPrice: 0, total: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setInvoice(prev => {
      const items = (prev.items || []).filter((_, i) => i !== index);
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const vat = subtotal * 0.075; // 7.5% VAT
      const subtotalWithVAT = subtotal + vat;
      const paystackFee = subtotalWithVAT * 0.015 + 100; // 1.5% + ₦100
      const total = subtotalWithVAT + paystackFee;

      return {
        ...prev,
        items,
        subtotal,
        vat,
        paystackFee,
        tax: vat + paystackFee,
        total,
      };
    });
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const handleSave = async (sendInvoice: boolean = false) => {
    if (!db || !firebaseUser) {
      addToast({ type: 'error', message: 'Missing required information' });
      return;
    }

    const targetCustomerUid = selectedCustomer?.uid || customerUid;
    if (!targetCustomerUid) {
      addToast({ type: 'error', message: 'Please select a customer' });
      return;
    }

    if (!invoice.title || !invoice.description || invoice.items?.some(item => !item.description || item.unitPrice <= 0)) {
      addToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setSaving(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      // Recalculate to ensure accuracy
      const subtotal = invoice.items?.reduce((sum, item) => sum + item.total, 0) || 0;
      const vat = subtotal * 0.075; // 7.5% VAT
      const subtotalWithVAT = subtotal + vat;
      const paystackFee = subtotalWithVAT * 0.015 + 100; // 1.5% + ₦100
      const total = subtotalWithVAT + paystackFee;

      const invoiceData: Partial<Invoice> = {
        invoiceNumber,
        consultantUid: firebaseUser.uid,
        customerUid: targetCustomerUid,
        chatId: chatId || undefined,
        title: invoice.title,
        description: invoice.description,
        items: invoice.items,
        subtotal,
        vat,
        paystackFee,
        tax: vat + paystackFee, // Total tax (VAT + Paystack fee)
        total,
        currency: 'NGN',
        status: sendInvoice ? 'sent' : 'draft',
        paymentStatus: 'pending',
        dueDate: invoice.dueDate || Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        ...(sendInvoice && { sentAt: serverTimestamp() as any }),
      };

      const invoiceRef = doc(collection(db, 'invoices'));
      await setDoc(invoiceRef, invoiceData);

      // If sent and chatId exists, create a message in the chat
      if (sendInvoice && chatId) {
        const messagesRef = collection(db, 'chatMessages');
        const messageRef = doc(messagesRef);
        await setDoc(messageRef, {
          chatId,
          senderUid: firebaseUser.uid,
          senderName: 'You',
          senderType: 'consultant',
          content: `Invoice ${invoiceNumber} has been sent. Total: ₦${invoice.total.toLocaleString()}`,
          messageType: 'invoice',
          invoiceId: invoiceRef.id,
          isRead: false,
          createdAt: serverTimestamp(),
        });

        // Update chat
        const chatRef = doc(db, 'consultantChats', chatId);
        await updateDoc(chatRef, {
          lastMessage: `Invoice ${invoiceNumber} sent`,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      addToast({ 
        type: 'success', 
        message: sendInvoice ? 'Invoice created and sent!' : 'Invoice saved as draft' 
      });
      
      router.push(`/consultants/invoices/${invoiceRef.id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      addToast({ type: 'error', message: 'Failed to save invoice' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Create Invoice
        </h1>
        <p className="text-gray-600">Create and send an invoice to your client</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 space-y-6">
        {/* Customer Selection */}
        <div className="relative" ref={searchRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search by name or user ID..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {selectedCustomer && (
              <button
                onClick={clearCustomer}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {showSuggestions && customerSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {customerSuggestions.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => selectCustomer(user)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                >
                  <div className="font-semibold">{formatHandleForDisplay(user.handle)}</div>
                  <div className="text-xs text-gray-500">{user.uid}</div>
                </button>
              ))}
            </div>
          )}
          {selectedCustomer && (
            <div className="mt-2 p-2 bg-purple-50 rounded-lg">
              <span className="text-sm text-purple-700">
                Selected: <strong>{formatHandleForDisplay(selectedCustomer.handle)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Title *</label>
          <input
            type="text"
            value={invoice.title || ''}
            onChange={(e) => setInvoice(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Tax Consultation Services"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={invoice.description || ''}
            onChange={(e) => setInvoice(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe the services provided..."
            required
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Items *</label>
            <button
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {invoice.items?.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Unit Price (₦)"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1 text-right font-semibold">
                  ₦{item.total.toLocaleString()}
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeItem(index)}
                    className="w-full px-2 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₦{invoice.subtotal?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (7.5%):</span>
                <span className="font-semibold">₦{invoice.vat?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal + VAT:</span>
                <span className="font-semibold">₦{((invoice.subtotal || 0) + (invoice.vat || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-orange-600">
                <span>Paystack Fee (1.5% + ₦100):</span>
                <span className="font-semibold">₦{invoice.paystackFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total (Customer Pays):</span>
                <span className="text-purple-600">₦{invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                * VAT and Paystack fees are automatically calculated. Customer bears all fees.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            Create & Send
          </button>
        </div>
      </div>
    </div>
  );
}
