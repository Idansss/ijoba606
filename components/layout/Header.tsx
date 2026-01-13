'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Calculator,
  Gamepad2,
  LogOut,
  Menu,
  MessageCircle,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthStore } from '@/lib/store/auth';
import { db } from '@/lib/firebase/config';
import {
  signInAnon,
  signInWithGoogle,
  signOut,
} from '@/lib/firebase/auth';
import { useToastStore } from '@/lib/store/toast';
import { cn } from '@/lib/utils/cn';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';

const navLinks = [
  { href: '/play', label: 'Learn & Play', icon: Gamepad2 },
  { href: '/forum', label: 'Forum', icon: MessageCircle },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/glossary', label: 'Glossary', icon: BookOpen },
  { href: '/consultants', label: 'Consultants', icon: Briefcase },
];

export function Header() {
  const pathname = usePathname();
  const { firebaseUser, user, profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // All nav links are visible (feature flags removed for consultants)
  const visibleNavLinks = navLinks;

  useEffect(() => {
    if (!firebaseUser) {
      setUnreadCount(0);
      return;
    }

    if (!db) return;
    const notifRef = collection(db, `notifications/${firebaseUser.uid}/items`);
    const q = query(notifRef, where('isRead', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    setNavOpen(false);
    setProfileOpen(false);
  }, [pathname, firebaseUser]);

  const handleSignInAnon = async () => {
    try {
      await signInAnon();
      addToast({ type: 'success', message: 'Welcome! Jump right in.' });
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      const message = error instanceof Error ? error.message : 'Sign in failed. Please check your Firebase configuration.';
      addToast({ type: 'error', message });
    }
  };

  const handleSignInGoogle = async () => {
    try {
      await signInWithGoogle();
      addToast({ type: 'success', message: 'Welcome back!' });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      if (error instanceof Error && error.message === 'Sign-in cancelled') {
        // Don't show error for user cancellation
        return;
      }
      if (error instanceof Error && error.message === 'Redirecting to sign in...') {
        // Don't show error for redirect
        return;
      }
      const message = error instanceof Error ? error.message : 'Sign in failed. Please check your Firebase configuration.';
      addToast({ type: 'error', message });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({ type: 'info', message: 'Signed out. See you soon!' });
    } catch (error) {
      console.error('Sign out failed:', error);
      addToast({ type: 'error', message: 'Sign out failed. Try again.' });
    }
  };

  const initials = user?.handle?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_92%,#ffffff_8%)] backdrop-blur">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)] uppercase">
                ijoba 606
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Learn · Play · Calculate
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/70 px-1 py-1 shadow-inner shadow-white/40 md:flex">
            {visibleNavLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!firebaseUser ? (
              <>
                <button
                  onClick={handleSignInAnon}
                  className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-purple-400 hover:text-slate-900 md:block"
                >
                  Try Demo
                </button>
                <button
                  onClick={handleSignInGoogle}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:brightness-110"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="relative hidden rounded-full border border-slate-200 px-3 py-2 text-slate-500 transition hover:border-purple-400 hover:text-purple-700 md:flex md:items-center"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 pr-1 text-left shadow-sm transition hover:border-purple-400"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-lg font-bold text-white shadow-md">
                      {initials}
                    </div>
                    <div className="hidden text-sm md:block">
                      <p className="font-semibold text-slate-900">
                        {user?.handle ? formatHandleForDisplay(user.handle) : 'User'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {profile?.totalPoints?.toLocaleString() ?? 0} pts
                      </p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-3 w-60 rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl"
                      >
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <UserRound className="h-4 w-4 text-purple-600" />
                          Profile & Stats
                        </Link>
                        <Link
                          href="/forum/me"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <MessageCircle className="h-4 w-4 text-blue-600" />
                          Forum Activity
                        </Link>
                        {user?.role === 'admin' ? (
                          <Link
                            href="/admin"
                            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        ) : (
                          <Link
                            href="/admin/login"
                            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            Admin Access
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            <button
              onClick={() => setNavOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-purple-400 hover:text-slate-900 md:hidden"
              aria-label="Toggle menu"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {navOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mt-4 space-y-4 rounded-3xl border border-white/60 bg-white/95 p-5 shadow-2xl md:hidden"
            >
              <div className="space-y-2">
                {visibleNavLinks.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold',
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                      onClick={() => setNavOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              {!firebaseUser ? (
                <button
                  onClick={handleSignInGoogle}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-3 text-center text-base font-semibold text-white"
                >
                  Sign in with Google
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="block rounded-2xl border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700"
                  >
                    View profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-2xl border border-rose-200 px-4 py-3 text-center font-semibold text-rose-600"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
