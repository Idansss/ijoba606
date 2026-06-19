'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';

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

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="md:col-span-2 flex flex-col gap-4">
      <h4 className="font-label-sm text-label-sm uppercase tracking-widest text-deep-green">
        {title}
      </h4>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-body-md text-on-surface-variant transition-colors hover:text-royal-gold"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-outline-variant/10 bg-surface-container-lowest py-12">
      <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        <div className="mb-12 grid grid-cols-1 gap-gutter md:grid-cols-12">
          <div className="space-y-6 md:col-span-4">
            <BrandLogo
              markClassName="h-14 w-14"
              textClassName="text-xl text-deep-green"
              taglineClassName="text-[0.65rem]"
            />
            <p className="font-body-md text-body-md text-on-surface-variant">
              Make PAYE literacy hard to ignore.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/play"
                className="rounded-full bg-deep-green px-6 py-3 font-label-sm text-label-sm text-on-primary transition-colors hover:bg-forest-green"
              >
                Start a round
              </Link>
              <Link
                href="/calculator"
                className="rounded-full border border-deep-green px-6 py-3 font-label-sm text-label-sm text-deep-green transition-colors hover:bg-deep-green/5"
              >
                Estimate PAYE
              </Link>
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Community" links={communityLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-outline-variant/10 pt-8 md:flex-row md:items-center">
          <p className="text-label-sm text-on-surface-variant opacity-60">
            © {year} IJOBA 606. Empowering Nigerian Prosperity.
          </p>
          <p className="text-label-sm italic text-on-surface-variant opacity-60">
            Educational purposes only — not legal or tax advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
