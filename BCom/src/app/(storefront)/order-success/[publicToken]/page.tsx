// src/app/(storefront)/order-success/[publicToken]/page.tsx
// Masked PII confirmation page

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ publicToken: string }>;
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const { publicToken } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Mask phone number for privacy: 01712345678 -> 017****5678
  const phone = order.customerPhone;
  const maskedPhone =
    phone.length >= 11
      ? `${phone.slice(0, 3)}****${phone.slice(-4)}`
      : phone;

  // Mask address partially
  const maskedAddress =
    order.customerAddress.length > 25
      ? `${order.customerAddress.slice(0, 20)}...`
      : order.customerAddress;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Success Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            আলহামদুলিল্লাহ, আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            অর্ডার নং: <span className="font-mono font-bold text-slate-800">{order.invoiceNo}</span>
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">গ্রাহকের নাম:</span>
            <span className="font-semibold text-slate-800">{order.customerName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">মোবাইল নাম্বার:</span>
            <span className="font-mono font-semibold text-slate-800">{maskedPhone}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">ডেলিভারি ঠিকানা:</span>
            <span className="font-medium text-slate-800 text-right">{maskedAddress}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">আইটেম:</span>
            <span className="font-medium text-slate-800">
              {order.items.map((i) => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(', ')}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-green-800">
            <span>ক্যাশ অন ডেলিভারি (পরিশোধযোগ্য):</span>
            <span>৳{order.codCollectible.toLocaleString()}</span>
          </div>
        </div>

        {/* Next Steps Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm text-left space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <span>📞</span> পরবর্তী ধাপ:
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">
            আমাদের কাস্টমার প্রতিনিধি কিছুক্ষণের মধ্যেই আপনার নাম্বারে কল করে অর্ডারটি কনফার্ম করবেন। অনুগ্রহ করে ফোনটি রিসিভ করুন।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <a
            href={`https://wa.me/8801712345678?text=${encodeURIComponent(`হ্যালো, আমার অর্ডার নং ${order.invoiceNo} সম্পর্কে জানতে চাই।`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <span>💬 হোয়াটসঅ্যাপে সহায়তা নিন</span>
          </a>

          <Link
            href="/"
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition"
          >
            ← আরও পণ্য দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}
