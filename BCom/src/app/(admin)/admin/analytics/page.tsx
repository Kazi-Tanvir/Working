// src/app/(admin)/admin/analytics/page.tsx
// ADMIN-only Net Profit & Ad Spend Analytics

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [orders, adSpends] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] } },
      include: { items: true },
    }).catch(() => []),
    prisma.adSpend.findMany({
      orderBy: { spendDate: 'desc' },
      take: 30,
    }).catch(() => []),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCost = orders.reduce((sum, o) => {
    return sum + o.items.reduce((iSum, item) => iSum + (item.unitCost * item.quantity), 0);
  }, 0);
  const totalAdSpend = adSpends.reduce((sum, a) => sum + a.amountBdt, 0);
  const netProfit = totalRevenue - totalCost - totalAdSpend;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">নেট প্রফিট ও বিজ্ঞাপন ব্যয় অ্যানালিটিক্স</h1>
        <p className="text-sm text-slate-500">
          প্রকৃত বিক্রি, পাইকারি খরচ এবং মেটা বিজ্ঞাপন খরচের ভিত্তিতে নিট লাভ হিসাব।
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">মোট রেভিনিউ</div>
          <div className="text-2xl font-bold text-slate-900">৳{totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-slate-400">{orders.length}টি সক্রিয় অর্ডার</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">পণ্যের পাইকারি খরচ</div>
          <div className="text-2xl font-bold text-slate-900">৳{totalCost.toLocaleString()}</div>
          <div className="text-xs text-slate-400">COGS (Wholesale Unit Cost)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">বিজ্ঞাপন ব্যয় (Meta Ads)</div>
          <div className="text-2xl font-bold text-amber-600">৳{totalAdSpend.toLocaleString()}</div>
          <div className="text-xs text-slate-400">গত ৩০ দিনের মোট ব্যয়</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-green-700 uppercase">প্রকৃত নিট প্রফিট</div>
          <div className="text-2xl font-extrabold text-green-700">৳{netProfit.toLocaleString()}</div>
          <div className="text-xs text-green-605">সব খরচ বাদ দিয়ে</div>
        </div>
      </div>
    </div>
  );
}
