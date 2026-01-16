'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { ConsultantWallet, WalletTransaction, WithdrawalRequest } from '@/lib/types';
import { DollarSign, ArrowUp, ArrowDown, Plus, TrendingUp, Wallet, CreditCard, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function ConsultantWalletPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [wallet, setWallet] = useState<ConsultantWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '',
    accountName: '',
    bankCode: '',
    bankName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to view your wallet' });
      router.push('/consultants');
      return;
    }

    fetchWalletData();
  }, [firebaseUser, router, addToast]);

  const fetchWalletData = async () => {
    if (!db || !firebaseUser) return;

    setLoading(true);
    try {
      // Fetch or create wallet
      const walletRef = doc(db, 'consultantWallets', firebaseUser.uid);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        setWallet({ id: walletSnap.id, ...walletSnap.data() } as ConsultantWallet);
      } else {
        // Create new wallet
        const newWallet: Omit<ConsultantWallet, 'id'> = {
          consultantUid: firebaseUser.uid,
          balance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
          totalPending: 0,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };
        await setDoc(walletRef, newWallet);
        setWallet({ id: walletRef.id, ...newWallet } as ConsultantWallet);
      }

      // Fetch transactions
      const transactionsRef = collection(db, 'walletTransactions');
      const transactionsQuery = query(
        transactionsRef,
        where('consultantUid', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      setTransactions(
        transactionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WalletTransaction))
      );

      // Fetch withdrawal requests
      const withdrawalsRef = collection(db, 'withdrawalRequests');
      const withdrawalsQuery = query(
        withdrawalsRef,
        where('consultantUid', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const withdrawalsSnap = await getDocs(withdrawalsQuery);
      setWithdrawals(
        withdrawalsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithdrawalRequest))
      );

      // Fetch saved bank accounts
      const bankAccountsRef = collection(db, 'bankAccounts');
      const bankAccountsQuery = query(
        bankAccountsRef,
        where('uid', '==', firebaseUser.uid),
        where('accountType', '==', 'consultant')
      );
      const bankAccountsSnap = await getDocs(bankAccountsQuery);
      const accounts = bankAccountsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedBankAccounts(accounts);
      if (accounts.length > 0) {
        const defaultAccount = accounts.find((a: any) => a.isDefault) || accounts[0];
        setSelectedBankAccountId(defaultAccount.id);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      addToast({ type: 'error', message: 'Failed to load wallet data' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!db || !firebaseUser || !wallet) return;

    const amount = parseFloat(withdrawAmount) * 100; // Convert to kobo
    if (isNaN(amount) || amount <= 0) {
      addToast({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (amount > availableBalance) {
      addToast({ type: 'error', message: 'Insufficient available balance' });
      return;
    }

    if (!selectedBankAccountId) {
      addToast({ type: 'error', message: 'Please select a bank account' });
      return;
    }

    const selectedAccount = savedBankAccounts.find(a => a.id === selectedBankAccountId);
    if (!selectedAccount) {
      addToast({ type: 'error', message: 'Selected bank account not found' });
      return;
    }

    setSubmitting(true);
    try {
      // Create withdrawal request
      const withdrawalsRef = collection(db, 'withdrawalRequests');
      const withdrawalRef = doc(withdrawalsRef);
      const withdrawalRequest: Omit<WithdrawalRequest, 'id'> = {
        consultantUid: firebaseUser.uid,
        amount,
        status: 'pending',
        bankAccount: {
          accountNumber: selectedAccount.accountNumber,
          accountName: selectedAccount.accountName,
          bankCode: selectedAccount.bankCode,
          bankName: selectedAccount.bankName,
        },
        createdAt: serverTimestamp() as any,
      };

      await setDoc(withdrawalRef, withdrawalRequest);

      // Update wallet (deduct from available balance)
      const walletRef = doc(db, 'consultantWallets', firebaseUser.uid);
      await setDoc(
        walletRef,
        {
          balance: availableBalance - amount, // Only deduct from available (credited) funds
          totalPending: wallet.totalPending + amount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Create debit transaction
      const transactionsRef = collection(db, 'walletTransactions');
      const transactionRef = doc(transactionsRef);
      await setDoc(transactionRef, {
        consultantUid: firebaseUser.uid,
        type: 'debit',
        amount,
        status: 'pending',
        description: `Withdrawal request to ${bankAccount.accountName} (${bankAccount.accountNumber})`,
        withdrawalRequestId: withdrawalRef.id,
        createdAt: serverTimestamp(),
      });

      addToast({ type: 'success', message: 'Withdrawal request submitted successfully' });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      addToast({ type: 'error', message: 'Failed to submit withdrawal request' });
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

  if (!wallet) {
    return null;
  }

      // Calculate available balance (only credited funds)
      const availableBalance = transactions
        .filter(t => t.type === 'credit' && t.fundStatus === 'credited')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const pendingRelease = transactions
        .filter(t => t.type === 'credit' && t.fundStatus === 'pending_release')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const inService = transactions
        .filter(t => t.type === 'credit' && t.fundStatus === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

      const balanceInNaira = availableBalance / 100; // Only available funds
      const totalEarningsInNaira = wallet.totalEarnings / 100;
      const totalWithdrawnInNaira = wallet.totalWithdrawn / 100;
      const totalPendingInNaira = (wallet.totalPending + pendingRelease + inService) / 100;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Wallet
        </h1>
        <p className="text-gray-600">Manage your earnings and withdrawals</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Available Balance</p>
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">₦{balanceInNaira.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Earnings</p>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">₦{totalEarningsInNaira.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Withdrawn</p>
            <ArrowDown className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">₦{totalWithdrawnInNaira.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Release</p>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">₦{(pendingRelease / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-500 mt-1">48-hour hold</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">In Service</p>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">₦{(inService / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={balanceInNaira <= 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Request Withdrawal
        </button>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {transaction.type === 'credit' ? (
                    <ArrowUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <ArrowDown className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.createdAt && formatDistanceToNow(transaction.createdAt.toDate(), { addSuffix: true })}
                    </p>
                    {transaction.fundStatus && (
                      <p className="text-xs mt-1">
                        <span className={`px-2 py-1 rounded ${
                          transaction.fundStatus === 'credited' ? 'bg-green-100 text-green-700' :
                          transaction.fundStatus === 'pending_release' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {transaction.fundStatus === 'credited' ? 'Available' :
                           transaction.fundStatus === 'pending_release' ? 'Pending Release (48h hold)' :
                           'Pending (In Service)'}
                        </span>
                        {transaction.holdReleaseAt && transaction.fundStatus === 'pending_release' && (
                          <span className="text-gray-500 ml-2">
                            Releases {formatDistanceToNow(transaction.holdReleaseAt.toDate(), { addSuffix: true })}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₦
                    {(transaction.amount / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdrawal Requests */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Withdrawal Requests</h2>
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No withdrawal requests yet</p>
          ) : (
            withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    ₦{(withdrawal.amount / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {withdrawal.bankAccount.accountName} - {withdrawal.bankAccount.accountNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    {withdrawal.createdAt && formatDistanceToNow(withdrawal.createdAt.toDate(), { addSuffix: true })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                    withdrawal.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : withdrawal.status === 'pending' || withdrawal.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : withdrawal.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4">Request Withdrawal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  max={balanceInNaira}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: ₦{balanceInNaira.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {savedBankAccounts.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {savedBankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} - {account.bankName} ({account.accountNumber})
                        {account.isDefault && ' - Default'}
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/consultants/bank-account"
                    className="text-sm text-purple-600 hover:underline mt-1 inline-block"
                  >
                    Manage bank accounts
                  </Link>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    You need to add a bank account first.
                  </p>
                  <Link
                    href="/consultants/bank-account"
                    className="text-sm text-purple-600 hover:underline font-semibold"
                  >
                    Add Bank Account →
                  </Link>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting || !selectedBankAccountId || savedBankAccounts.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
