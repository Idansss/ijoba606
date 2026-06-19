'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        href="/admin"
        className="flex items-center gap-1 text-[#404a3b] hover:text-[#006400] transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Dashboard</span>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-[#707a6a]" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-[#404a3b] hover:text-[#006400] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1a1c15] font-semibold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
