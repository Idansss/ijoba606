import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax News & Updates',
  description:
    'Stay informed with the latest PAYE, tax, and compliance news relevant to Nigeria.',
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
