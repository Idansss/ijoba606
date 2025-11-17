'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { signInAnon, signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { useToastStore } from '@/lib/store/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function Header() {
  const { firebaseUser, user, profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to notifications
  useEffect(() => {
    if (!firebaseUser) return;

    const notifRef = collection(db, `notifications/${firebaseUser.uid}/items`);
    const q = query(notifRef, where('isRead', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleSignInAnon = async () => {
    try {
      await signInAnon();
      addToast({ type: 'success', message: 'Welcome! You dey inside now 👋' });
    } catch (error) {
      addToast({ type: 'error', message: 'Sign in failed. Try again.' });
    }
  };

  const handleSignInGoogle = async () => {
    try {
      await signInWithGoogle();
      addToast({ type: 'success', message: 'Welcome back! 🎉' });
    } catch (error) {
      addToast({ type: 'error', message: 'Sign in failed. Try again.' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({ type: 'info', message: 'Signed out. See you soon!' });
      setShowMenu(false);
    } catch (error) {
      addToast({ type: 'error', message: 'Sign out failed. Try again.' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              IJBoba 606
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/play"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Learn & Play
            </Link>
            <Link
              href="/forum"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Forum
            </Link>
            <Link
              href="/calculator"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Calculator
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Auth & Profile */}
          <div className="flex items-center gap-3">
            {!firebaseUser ? (
              <>
                <button
                  onClick={handleSignInAnon}
                  className="hidden md:block px-4 py-2 text-sm text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                  Try as Guest
                </button>
                <button
                  onClick={handleSignInGoogle}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                {/* Notifications Bell */}
                <Link
                  href="/profile"
                  className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.handle?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user?.handle}</div>
                      <div className="text-xs text-gray-500">
                        {profile?.totalPoints || 0} pts
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                      >
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/forum/me"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          My Forum Activity
                        </Link>
                        {user?.role === 'admin' && (
                          <>
                            <hr className="my-2" />
                            <Link
                              href="/admin/questions"
                              className="block px-4 py-2 text-sm text-purple-600 hover:bg-gray-100"
                              onClick={() => setShowMenu(false)}
                            >
                              Admin Panel
                            </Link>
                          </>
                        )}
                        <hr className="my-2" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setShowMenu(!showMenu)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-gray-200"
            >
              <nav className="flex flex-col gap-3">
                <Link
                  href="/play"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                  onClick={() => setShowMenu(false)}
                >
                  Learn & Play
                </Link>
                <Link
                  href="/forum"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                  onClick={() => setShowMenu(false)}
                >
                  Forum
                </Link>
                <Link
                  href="/calculator"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                  onClick={() => setShowMenu(false)}
                >
                  Calculator
                </Link>
                <Link
                  href="/leaderboard"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                  onClick={() => setShowMenu(false)}
                >
                  Leaderboard
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

