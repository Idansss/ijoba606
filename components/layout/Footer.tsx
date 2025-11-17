'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              IJBoba 606
            </h3>
            <p className="text-sm text-gray-600">
              Make PAYE literacy engaging. Learn through play, discuss in the
              community, and calculate your tax with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/play"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Learn & Play
                </Link>
              </li>
              <li>
                <Link
                  href="/forum"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Community Forum
                </Link>
              </li>
              <li>
                <Link
                  href="/calculator"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Tax Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-lg mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              Educational purposes only. Not legal or tax advice.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} IJBoba 606. All rights reserved. Made
            with 💜 for Nigeria.
          </p>
        </div>
      </div>
    </footer>
  );
}

