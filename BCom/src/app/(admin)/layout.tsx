// src/app/(admin)/layout.tsx
// Wrapped in ClerkProvider with staff navigation bar

import { ClerkProvider, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className="min-h-dvh flex flex-col bg-slate-100 text-slate-900">
        {/* Admin Navigation Bar */}
        <header className="bg-slate-900 text-white shadow-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-base md:text-lg flex items-center gap-2">
                <span className="text-green-400">⚡</span> F-Commerce Admin
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                <Link
                  href="/admin/orders"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  অর্ডার তালিকা
                </Link>
                <Link
                  href="/admin/incomplete"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  অসম্পূর্ণ লিড
                </Link>
                <Link
                  href="/admin/products"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  প্রোডাক্ট স্টক
                </Link>
                <Link
                  href="/admin/blacklist"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  ব্ল্যাকলিস্ট
                </Link>
                <Link
                  href="/admin/analytics"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  প্রফিট রিপোর্ট
                </Link>
                <Link
                  href="/admin/settings"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  সেটিংস
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/offer/premium-egyptian-cotton-panjabi"
                target="_blank"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition"
              >
                লাইভ শপ ↗
              </Link>
              <UserButton />
            </div>
          </div>

          {/* Mobile sub-nav */}
          <div className="md:hidden flex overflow-x-auto px-4 py-2 gap-2 text-xs border-t border-slate-800 bg-slate-900/90 no-scrollbar">
            <Link href="/admin/orders" className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-800 text-slate-200">
              অর্ডার তালিকা
            </Link>
            <Link href="/admin/incomplete" className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-800 text-slate-200">
              অসম্পূর্ণ লিড
            </Link>
            <Link href="/admin/products" className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-800 text-slate-200">
              প্রোডাক্ট
            </Link>
            <Link href="/admin/analytics" className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-800 text-slate-200">
              প্রফিট
            </Link>
            <Link href="/admin/settings" className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-800 text-slate-200">
              সেটিংস
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
      </div>
    </ClerkProvider>
  );
}
