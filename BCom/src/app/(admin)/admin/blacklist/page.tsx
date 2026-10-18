// src/app/(admin)/admin/blacklist/page.tsx
// ADMIN-only Phone Blacklist Management

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BlacklistPage() {
  const blocks = await prisma.blockedCustomer
    .findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">কাস্টমার ফোন ব্ল্যাকলিস্ট</h1>
        <p className="text-sm text-slate-500">
          প্রতারক বা বারবার পার্সেল রিফিউজ করা গ্রাহকের ফোন নাম্বার ব্লক করুন। ব্লক করা নাম্বার থেকে কোনো অর্ডার নেওয়া হবে না।
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {blocks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            বর্তমানে কোনো ফোন নাম্বার ব্ল্যাকলিস্টে নেই।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {blocks.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono font-bold text-slate-900">{b.phone}</div>
                  <div className="text-xs text-slate-500">কারণ: {b.reason}</div>
                </div>
                <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">
                  সক্রিয় ব্লক
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
