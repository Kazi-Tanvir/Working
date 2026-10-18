// src/app/(storefront)/layout.tsx
import Link from 'next/link';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-xs md:text-sm py-2 px-4 text-center font-medium">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span>🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</span>
          <a
            href="tel:01712345678"
            className="text-green-400 hover:underline flex items-center gap-1 font-semibold"
          >
            📞 হেল্পলাইন: 01712-345678
          </a>
        </div>
      </div>

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
