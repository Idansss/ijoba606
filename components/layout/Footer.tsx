'use client';

import Link from 'next/link';

const productLinks = [
  { href: '/play', label: 'Learn & Play' },
  { href: '/round', label: 'Quiz Round' },
  { href: '/calculator', label: 'Tax Calculator' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

const communityLinks = [
  { href: '/forum', label: 'Community Forum' },
  { href: '/forum/new', label: 'Start a Thread' },
  { href: '/profile', label: 'Profile' },
  { href: '/results', label: 'Results History' },
];

const legalLinks = [
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/contact', label: 'Contact Us' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-[var(--border-soft)] text-[var(--foreground)]"
      style={{
        // Use theme tokens so light + dark stay in the same green family
        background:
          'linear-gradient(135deg, var(--background) 0%, var(--surface) 40%, var(--background) 100%)',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] opacity-70">
              ijoba 606
            </p>
            <h3 className="mt-4 text-3xl font-semibold">
              Make PAYE literacy hard to ignore.
            </h3>
            <p className="mt-3 text-sm opacity-85">
              Micro-quizzes, a kind community, and a Nigeria-ready PAYE calculator
              built so everyone can see their tax clearly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/play"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-500/30"
              >
                Start a round
              </Link>
              <Link
                href="/calculator"
                className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-[var(--foreground)]/90 hover:text-[var(--foreground)]"
              >
                Estimate PAYE
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest opacity-70">
              Product
            </h4>
            <ul className="mt-4 space-y-2 text-sm opacity-85">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest opacity-70">
              Community
            </h4>
            <ul className="mt-4 space-y-2 text-sm opacity-85">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 text-sm opacity-75 md:grid-cols-2">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-right md:text-left">
            © {year} ijoba 606. Educational purposes only — not legal or tax
            advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
