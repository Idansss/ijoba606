'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { BankAccount } from '@/lib/types';
import { Plus, Trash2, Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface PaystackBank {
  name: string;
  code: string;
  active: boolean;
  type: string;
  currency: string;
}

export default function BankAccountPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: '',
    bankCode: '',
    bankName: '',
    accountName: '',
  });

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to manage bank accounts' });
      router.push('/consultants');
      return;
    }

    fetchBanks();
    fetchBankAccounts();
  }, [firebaseUser, router, addToast]);

  const fetchBanks = async () => {
    try {
      const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banks');
      }

      const data = await response.json();
      if (data.status) {
        setBanks(data.data.filter((bank: PaystackBank) => bank.active));
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      addToast({ type: 'error', message: 'Failed to load banks. Please try again.' });
    }
  };

  const fetchBankAccounts = async () => {
    if (!db || !firebaseUser) return;

    try {
      const accountsRef = collection(db, 'bankAccounts');
      const q = query(
        accountsRef,
        where('uid', '==', firebaseUser.uid),
        where('accountType', '==', 'consultant')
      );

      const snapshot = await getDocs(q);
      const accounts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BankAccount[];

      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      addToast({ type: 'error', message: 'Failed to load bank accounts' });
    } finally {
      setLoading(false);
    }
  };

  const resolveAccountName = async () => {
    if (!formData.accountNumber || !formData.bankCode) {
      addToast({ type: 'error', message: 'Please enter account number and select bank' });
      return;
    }

    setResolving(true);
    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${formData.accountNumber}&bank_code=${formData.bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resolve account');
      }

      const data = await response.json();
      if (data.status && data.data) {
        setFormData(prev => ({
          ...prev,
          accountName: data.data.account_name,
        }));
        addToast({ type: 'success', message: 'Account name resolved successfully' });
      }
    } catch (error) {
      console.error('Error resolving account:', error);
      const message = error instanceof Error ? error.message : 'Failed to resolve account name';
      addToast({ type: 'error', message });
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async () => {
    if (!db || !firebaseUser) return;

    if (!formData.accountNumber || !formData.bankCode || !formData.accountName) {
      addToast({ type: 'error', message: 'Please fill in all fields and resolve account name' });
      return;
    }

    setSaving(true);
    try {
      const accountData: Omit<BankAccount, 'id'> = {
        uid: firebaseUser.uid,
        accountType: 'consultant',
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        bankCode: formData.bankCode,
        bankName: formData.bankName,
        isDefault: bankAccounts.length === 0, // First account is default
        isVerified: true, // Verified via Paystack resolution
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const accountsRef = collection(db, 'bankAccounts');
      const accountRef = doc(accountsRef);
      await setDoc(accountRef, accountData);

      addToast({ type: 'success', message: 'Bank account saved successfully' });
      setFormData({ accountNumber: '', bankCode: '', bankName: '', accountName: '' });
      fetchBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      addToast({ type: 'error', message: 'Failed to save bank account' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!db) return;

    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'bankAccounts', accountId));
      addToast({ type: 'success', message: 'Bank account deleted' });
      fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      addToast({ type: 'error', message: 'Failed to delete bank account' });
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!db || !firebaseUser) return;

    try {
      // Remove default from all accounts
      const accountsRef = collection(db, 'bankAccounts');
      const q = query(
        accountsRef,
        where('uid', '==', firebaseUser.uid),
        where('accountType', '==', 'consultant')
      );
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() })
      );
      await Promise.all(updates);

      // Set new default
      await updateDoc(doc(db, 'bankAccounts', accountId), {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Default bank account updated' });
      fetchBankAccounts();
    } catch (error) {
      console.error('Error setting default account:', error);
      addToast({ type: 'error', message: 'Failed to update default account' });
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Bank Account Management
        </h1>
        <p className="text-gray-600">Manage your bank accounts for withdrawals</p>
      </div>

      {/* Add Bank Account Form */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold mb-4">Add Bank Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <select
              value={formData.bankCode}
              onChange={(e) => {
                const selected = banks.find(b => b.code === e.target.value);
                setFormData({
                  ...formData,
                  bankCode: e.target.value,
                  bankName: selected?.name || '',
                  accountName: '', // Clear resolved name when bank changes
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    accountNumber: e.target.value,
                    accountName: '', // Clear resolved name when account number changes
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0000000000"
                maxLength={10}
              />
              <button
                onClick={resolveAccountName}
                disabled={resolving || !formData.accountNumber || !formData.bankCode}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {resolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  'Resolve'
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <input
              type="text"
              value={formData.accountName}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="Account name will appear here after resolution"
            />
            {formData.accountName && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account verified</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !formData.accountName}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Bank Account'}
          </button>
        </div>
      </div>

      {/* Saved Bank Accounts */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Saved Bank Accounts</h2>
        {bankAccounts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No bank accounts saved yet</p>
        ) : (
          <div className="space-y-4">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{account.accountName}</p>
                    {account.isDefault && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                        Default
                      </span>
                    )}
                    {account.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{account.bankName}</p>
                  <p className="text-sm text-gray-500">Account: {account.accountNumber}</p>
                </div>
                <div className="flex gap-2">
                  {!account.isDefault && (
                    <button
                      onClick={() => account.id && handleSetDefault(account.id)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => account.id && handleDelete(account.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
