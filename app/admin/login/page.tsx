'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Shield, Lock, ArrowRight } from 'lucide-react';

// Unique admin access code - change this to something secure
const ADMIN_ACCESS_CODE = 'IJ606-ADMIN-2024';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [accessCode, setAccessCode] = useState('');
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

    if (accessCode !== ADMIN_ACCESS_CODE) {
      addToast({ type: 'error', message: 'Invalid access code' });
      return;
    }

    setLoading(true);
    try {
      // Verify access code and redirect to admin dashboard
      // The actual admin role should be set manually or via registration
      addToast({ 
        type: 'info', 
        message: 'Access code verified. If you are an admin, you will be redirected.' 
      });
      
      // Check if user is already admin
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        addToast({ 
          type: 'error', 
          message: 'You do not have admin privileges. Please register as admin first.' 
        });
        router.push('/admin/register');
      }
    } catch (error) {
      console.error('Error:', error);
      addToast({ type: 'error', message: 'An error occurred' });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the admin panel</p>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
          <p className="text-gray-600">Enter your admin access code to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-semibold text-gray-700 mb-2">
              Access Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="accessCode"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter admin access code"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Contact a system administrator for the access code
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !accessCode}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              <>
                Verify Access
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don&apos;t have admin access?{' '}
            <button
              onClick={() => router.push('/admin/register')}
              className="text-purple-600 font-semibold hover:underline"
            >
              Register as Admin
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
