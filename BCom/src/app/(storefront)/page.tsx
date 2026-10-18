// src/app/(storefront)/page.tsx
// Storefront landing: redirects or features the main product funnel

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function StorefrontPage() {
  const featuredProduct = await prisma.product.findFirst({
    where: { isActive: true, isFeaturedFunnel: true },
  });

  if (featuredProduct) {
    redirect(`/offer/${featuredProduct.slug}`);
  }

  // Fallback if no featured product yet
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">সুকুন কালেকশন</h1>
      <p className="text-slate-600">আমাদের অফারসমূহ দেখতে নিচের বাটনে ক্লিক করুন।</p>
      <Link
        href="/offer/premium-egyptian-cotton-panjabi"
        className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-xl shadow-md transition"
      >
        পাঞ্জাবি অফার দেখুন 🛒
      </Link>
    </div>
  );
}
