// src/app/(admin)/admin/incomplete/page.tsx
// Session-Scoped Incomplete Order Lead Recovery Queue

import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IncompleteLeadsPage() {
  const leads = await prisma.incompleteOrder
    .findMany({
      where: { status: 'OPEN' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">অসম্পূর্ণ অর্ডার রিকভারি কিউ (Abandoned Leads)</h1>
        <p className="text-sm text-slate-500">
          যেসব ক্রেতা চেকআউটে নাম্বার দিয়ে অর্ডার সম্পন্ন করেননি। ফোন বা হোয়াটসঅ্যাপে সহায়তা দিয়ে সেলস কনভার্ট করুন।
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="text-4xl">🎉</div>
          <h3 className="font-bold text-slate-800 text-base">কোনো অসম্পূর্ণ লিড নেই!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            সব ক্রেতা সফলভাবে অর্ডার সম্পন্ন করেছেন অথবা পূর্ববর্তী লিডগুলো নিষ্পত্তি করা হয়েছে।
          </p>
          <Link href="/admin/orders" className="inline-block text-xs font-semibold text-green-700 hover:underline">
            অর্ডার তালিকা দেখুন →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const cleanPhone = lead.customerPhone.replace(/^0/, '');
            const waUrl = `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(
              `আসসালামু আলাইকুম ${lead.customerName || 'স্যার/ম্যাডাম'}, আপনি সুকুন কালেকশনে ${lead.variantLabel || 'পাঞ্জাবি'} পছন্দের তালিকায় রেখেছিলেন। অর্ডারটি সম্পন্ন করতে কোনো সহযোগিতার প্রয়োজন আছে কি?`
            )}`;

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-4 md:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {lead.customerPhone}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    OPEN LEAD
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <strong>নাম:</strong> {lead.customerName || 'প্রদান করেননি'}
                  </div>
                  <div>
                    <strong>ঠিকানা:</strong> {lead.customerAddress || 'প্রদান করেননি'}
                  </div>
                  <div>
                    <strong>আইটেম:</strong> {lead.variantLabel || 'পণ্য নির্দিষ্ট নয়'} (পরিমাণ: {lead.quantity})
                  </div>
                  {lead.estimatedTotal && (
                    <div className="text-slate-900 font-semibold pt-1">
                      সম্ভাব্য বিল: ৳{lead.estimatedTotal.toLocaleString()}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pt-1">
                    সময়:{' '}
                    {new Date(lead.createdAt).toLocaleDateString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Recovery Actions (48px Touch Targets) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${lead.customerPhone}`}
                    className="min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition"
                  >
                    <span>📞</span> কল করুন
                  </a>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition"
                  >
                    <span>💬</span> হোয়াটসঅ্যাপ
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
