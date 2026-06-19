'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, MessageCircle, Sparkles, UserRound, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthStore } from '@/lib/store/auth';
import { db } from '@/lib/firebase/config';
import { signInAnon, signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { useToastStore } from '@/lib/store/toast';
import { cn } from '@/lib/utils/cn';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Icon } from '@/components/ui/Icon';

const navLinks = [
  { href: '/play', label: 'Learn & Play', icon: 'sports_esports' },
  { href: '/forum', label: 'Forum', icon: 'forum' },
  { href: '/calculator', label: 'Calculator', icon: 'calculate' },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { href: '/glossary', label: 'Glossary', icon: 'menu_book' },
  { href: '/consultants', label: 'Consultants', icon: 'support_agent' },
  { href: '/news', label: 'News', icon: 'newspaper' },
  { href: '/contact', label: 'Contact', icon: 'mail' },
];

export function Header() {
  const pathname = usePathname();
  const { firebaseUser, user, profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        return;
      }
      if (error instanceof Error && error.message === 'Redirecting to sign in...') {
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
    <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-surface/70 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between gap-4 px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="shrink-0" aria-label="ijoba 606 home">
          <BrandLogo
            textClassName="text-base sm:text-lg"
            taglineClassName="hidden sm:block xl:hidden"
          />
        </Link>

        <nav className="hidden h-11 items-center gap-0.5 rounded-full border border-outline-variant/30 bg-surface-container-low px-1.5 xl:flex">
          {visibleNavLinks.map(({ href, label, icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 font-label-sm text-label-sm transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-deep-green to-royal-gold text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                <Icon name={icon} className="text-[16px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {!firebaseUser ? (
            <>
              <button
                onClick={handleSignInAnon}
                className="hidden rounded-full border border-outline-variant px-4 py-2 font-label-sm text-label-sm text-on-surface-variant transition hover:border-deep-green hover:text-deep-green 2xl:block"
              >
                Try Demo
              </button>
              <button
                onClick={handleSignInGoogle}
                className="rounded-full bg-deep-green px-4 py-2 font-label-sm text-label-sm text-on-primary shadow-sm transition hover:bg-forest-green"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="relative hidden rounded-full p-2 text-on-surface-variant transition hover:text-deep-green md:flex md:items-center"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error px-1 text-xs font-semibold text-on-error">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container-low py-1 pl-1 pr-3 text-left transition hover:bg-surface-container-high"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-green font-figure-md text-figure-md font-bold text-on-primary">
                    {initials}
                  </div>
                  <div className="hidden text-sm sm:block">
                    <p className="font-figure-md text-[10px] font-bold leading-none text-royal-gold">
                      {profile?.totalPoints?.toLocaleString() ?? 0} pts
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {user?.handle ? formatHandleForDisplay(user.handle) : 'User'}
                    </p>
                  </div>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-3 w-60 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-[0px_20px_40px_rgba(0,50,0,0.12)]"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                      >
                        <UserRound className="h-4 w-4 text-deep-green" />
                        Profile & Stats
                      </Link>
                      <Link
                        href="/forum/me"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                      >
                        <MessageCircle className="h-4 w-4 text-forest-green" />
                        Forum Activity
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                      >
                        <FileText className="h-4 w-4 text-deep-green" />
                        My Dashboard
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-deep-green transition hover:bg-primary-fixed/20"
                        >
                          <Sparkles className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-error transition hover:bg-error-container"
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
            className="rounded-full border border-outline-variant p-2 text-on-surface-variant transition hover:border-deep-green hover:text-deep-green xl:hidden"
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
            className="mx-margin-mobile mb-4 space-y-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-[0px_20px_40px_rgba(0,50,0,0.12)] xl:hidden"
          >
            <div className="space-y-2">
              {visibleNavLinks.map(({ href, label, icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold',
                      isActive
                        ? 'bg-gradient-to-r from-deep-green to-royal-gold text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
                    )}
                    onClick={() => setNavOpen(false)}
                  >
                    <Icon name={icon} className="text-[20px]" />
                    {label}
                  </Link>
                );
              })}
            </div>

            {!firebaseUser ? (
              <button
                onClick={handleSignInGoogle}
                className="w-full rounded-2xl bg-deep-green px-4 py-3 text-center text-base font-semibold text-on-primary"
              >
                Sign in with Google
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="block rounded-2xl border border-outline-variant px-4 py-3 text-center font-semibold text-on-surface"
                >
                  View profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-2xl border border-error/40 px-4 py-3 text-center font-semibold text-error"
                >
                  Sign out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
