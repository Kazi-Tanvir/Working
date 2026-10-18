// src/app/(admin)/admin/page.tsx
// Operational KPIs Dashboard

import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Fetch operational counts
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    deliveredOrders,
    openLeads,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count().catch(() => 0),
    prisma.order.count({ where: { status: 'PENDING' } }).catch(() => 0),
    prisma.order.count({ where: { status: 'CONFIRMED' } }).catch(() => 0),
    prisma.order.count({ where: { status: 'SHIPPED' } }).catch(() => 0),
    prisma.order.count({ where: { status: 'DELIVERED' } }).catch(() => 0),
    prisma.incompleteOrder.count({ where: { status: 'OPEN' } }).catch(() => 0),
    prisma.order
      .findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      })
      .catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ড্যাশবোর্ড ও অপারেশনাল সামারি</h1>
          <p className="text-sm text-slate-500">প্রতিদিনের অর্ডার, ডেলিভারি ও লিড ট্র্যাকিং</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/orders"
            className="bg-green-700 hover:bg-green-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            📦 সব অর্ডার দেখুন
          </Link>
          <Link
            href="/admin/incomplete"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            📞 রিকভারি লিড ({openLeads})
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            নতুন অর্ডার (Pending)
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{pendingOrders}</div>
          <div className="text-xs text-slate-500">ফোন কল দিয়ে ভেরিফাই করুন</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            প্যাকিংয়ের জন্য প্রস্তুত
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{confirmedOrders}</div>
          <div className="text-xs text-slate-500">ইনভয়েস প্রিন্ট ও প্যাক করুন</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            কুরিয়ারে পথে আছে
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{shippedOrders}</div>
          <div className="text-xs text-slate-500">Steadfast কুরিয়ার ডেলিভারি</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wider">
            সফল ডেলিভারি
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{deliveredOrders}</div>
          <div className="text-xs text-slate-500">মোট ডেলিভার্ড পার্সেল</div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 text-base">সাম্প্রতিক ৫টি অর্ডার</h2>
          <Link href="/admin/orders" className="text-xs text-green-700 font-semibold hover:underline">
            সব দেখুন →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            এখনো কোনো অর্ডার পাওয়া যায়নি। ডেটাবেজ সীড করতে `npm run prisma:seed` চালান।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{ord.invoiceNo}</span>
                    <span className="font-medium text-slate-700">• {ord.customerName}</span>
                    <span className="text-xs font-mono text-slate-500">({ord.customerPhone})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {ord.customerAddress} • আইটেম: {ord.items.map((i) => `${i.productName} (${i.variantLabel})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-slate-900">৳{ord.totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{ord.paymentMethod}</div>
                  </div>
                  <Link
                    href={`/admin/orders`}
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-700 transition"
                  >
                    অপারেশন
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
