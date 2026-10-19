// src/app/(storefront)/layout.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: 'default' },
  });

  const supportPhone = settings?.supportPhone || '01712-345678';

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-xs md:text-sm py-2 px-4 text-center font-medium">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span>🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</span>
          <a
            href={`tel:${supportPhone}`}
            className="text-green-400 hover:underline flex items-center gap-1 font-semibold"
          >
            📞 হেল্পলাইন: {supportPhone}
          </a>
        </div>
      </div>

      {/* Main Sticky Store Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-xl bg-green-700 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-green-800 transition">
              🌿
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-base md:text-lg text-slate-900 leading-tight">
                সুকুন কালেকশন
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Sukoon Collection
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-semibold">
            <Link
              href="/"
              className="text-slate-700 hover:text-green-700 px-2 py-1 rounded-md transition"
            >
              হোম
            </Link>
            <Link
              href="/offer/premium-egyptian-cotton-panjabi"
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg shadow-xs transition inline-flex items-center gap-1 font-bold"
            >
              🔥 হট অফার
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Trust & Legal Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-4 text-slate-300 font-medium">
            <Link href="/privacy" className="hover:text-white transition">
              প্রাইভেসি পলিসি
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition">
              ব্যবহারের শর্তাবলী
            </Link>
            <span>•</span>
            <Link href="/return-policy" className="hover:text-white transition">
              রিটার্ন ও রিফান্ড পলিসি
            </Link>
            <span>•</span>
            <Link href="/sign-in" className="hover:text-green-400 text-slate-400 transition">
              স্টাফ লগইন 🔒
            </Link>
          </div>
          <p className="text-slate-500 leading-relaxed max-w-lg mx-auto">
            © {new Date().getFullYear()} সুকুন কালেকশন (Sukoon Collection)। সকল স্বত্ব সংরক্ষিত।
            <br />
            গ্রাহক সন্তুষ্টি আমাদের প্রথম অগ্রাধিকার। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন।
          </p>
        </div>
      </footer>
    </div>
  );
}
