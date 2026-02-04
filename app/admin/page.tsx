'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { collection, getDocs, updateDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { 
  Users, 
  Shield, 
  FileQuestion, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Crown,
  Briefcase
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'moderator' | 'admin'>('all');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Admin access guard - block anonymous users and non-admins
  useEffect(() => {
    if (!authLoading) {
      // Block anonymous users
      if (user?.anon === true) {
        addToast({ type: 'error', message: 'Admin access requires a registered account. Please sign in with Google.' });
        router.push('/');
        return;
      }
      // Block non-admin users
      if (user?.role !== 'admin') {
        addToast({ type: 'error', message: 'Admin access required' });
        router.push('/admin/login');
      }
    }
  }, [user, authLoading, router, addToast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        setUsers([]);
        return;
      }
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      addToast({ type: 'error', message: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleUpdateRole = async (uid: string, newRole: 'user' | 'moderator' | 'admin') => {
    if (!db) return;
    
    setUpdatingRole(uid);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      addToast({ type: 'success', message: `User role updated to ${newRole}` });
      
      // Update local state
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      addToast({ type: 'error', message: 'Failed to update user role' });
    } finally {
      setUpdatingRole(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    moderators: users.filter(u => u.role === 'moderator').length,
    regular: users.filter(u => u.role === 'user').length,
  };

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, questions, rules, and moderation</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Admins</p>
              <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
            </div>
            <Crown className="w-12 h-12 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Moderators</p>
              <p className="text-3xl font-bold text-gray-900">{stats.moderators}</p>
            </div>
            <Shield className="w-12 h-12 text-orange-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Regular Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.regular}</p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/questions">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl p-6 shadow-lg cursor-pointer"
          >
            <FileQuestion className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Question Management</h3>
            <p className="text-purple-100">Create, edit, and manage quiz questions</p>
          </motion.div>
        </Link>

        <Link href="/admin/rules">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-xl p-6 shadow-lg cursor-pointer"
          >
            <Settings className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">PAYE Rules</h3>
            <p className="text-green-100">Configure tax rules and calculator settings</p>
          </motion.div>
        </Link>

        <Link href="/admin/mod">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg cursor-pointer"
          >
            <AlertTriangle className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Moderation</h3>
            <p className="text-orange-100">Review reports and moderate content</p>
          </motion.div>
        </Link>

        <Link href="/admin/transactions">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-xl p-6 shadow-lg cursor-pointer"
          >
            <DollarSign className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Transactions</h3>
            <p className="text-emerald-100">Monitor payments, refunds, and disputes</p>
          </motion.div>
        </Link>
        <Link href="/admin/consultants">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl p-6 shadow-lg cursor-pointer"
          >
            <Briefcase className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Consultants</h3>
            <p className="text-indigo-100">Approve applications and manage status</p>
          </motion.div>
        </Link>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by handle or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="user">Regular Users</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">{u.handle}</p>
                        <p className="text-xs text-gray-500 font-mono">{u.uid.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'moderator'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                        {u.role === 'moderator' && <Shield className="w-3 h-3 mr-1" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {u.createdAt
                        ? formatDistanceToNow(u.createdAt.toDate(), { addSuffix: true })
                        : 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleUpdateRole(u.uid, e.target.value as 'user' | 'moderator' | 'admin')
                          }
                          disabled={updatingRole === u.uid || u.uid === user?.uid}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        {u.uid === user?.uid && (
                          <span className="text-xs text-gray-500 self-center">(You)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
