'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Shield, Lock, ArrowRight, UserPlus } from 'lucide-react';

// Unique admin registration code - change this to something secure
const ADMIN_REGISTRATION_CODE = 'IJ606-REGISTER-2024';

export default function AdminRegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [registrationCode, setRegistrationCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already admin
  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      router.push('/admin');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addToast({ type: 'error', message: 'Please sign in first' });
      router.push('/');
      return;
    }

    if (registrationCode !== ADMIN_REGISTRATION_CODE) {
      addToast({ type: 'error', message: 'Invalid registration code' });
      return;
    }

    if (!db) {
      addToast({ type: 'error', message: 'Database not available' });
      return;
    }

    setLoading(true);
    try {
      // Update user role to admin
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'admin' });
      
      addToast({ 
        type: 'success', 
        message: 'Successfully registered as admin! Redirecting...' 
      });
      
      // Wait a moment for the toast to show, then redirect
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (error: any) {
      console.error('Error updating role:', error);
      
      // Check if it's a permission error
      if (error?.code === 'permission-denied') {
        addToast({ 
          type: 'error', 
          message: 'Permission denied. You may need to be granted admin access manually by an existing admin.' 
        });
      } else {
        addToast({ type: 'error', message: 'Failed to register as admin. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <Shield className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Registration</h1>
          <p className="text-gray-600 mb-6">Please sign in to register as admin</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Go to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h1>
          <p className="text-gray-600">Enter the registration code to become an admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="registrationCode" className="block text-sm font-semibold text-gray-700 mb-2">
              Registration Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="registrationCode"
                type="password"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                placeholder="Enter admin registration code"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Contact a system administrator for the registration code
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After registration, you will have full admin access including the ability to manage users, questions, and system settings.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !registrationCode}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </>
            ) : (
              <>
                Register as Admin
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Already have admin access?{' '}
            <button
              onClick={() => router.push('/admin/login')}
              className="text-green-600 font-semibold hover:underline"
            >
              Login to Admin Panel
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
