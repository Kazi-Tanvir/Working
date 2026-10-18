// src/app/(admin)/admin/settings/page.tsx
// ADMIN-only StoreSettings configuration

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">স্টোর সেটিংস ও কনফিগারেশন</h1>
        <p className="text-sm text-slate-500">
          ডেলিভারি চার্জ, হেল্পলাইন নাম্বার এবং চেকআউট কুলডাউন সেটিংস।
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">স্টোরের নাম</label>
            <input
              type="text"
              readOnly
              value={settings.storeName}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">কাস্টমার হেল্পলাইন</label>
            <input
              type="text"
              readOnly
              value={settings.supportPhone}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">হোয়াটসঅ্যাপ নাম্বার</label>
            <input
              type="text"
              readOnly
              value={settings.whatsappNumber}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">বিকাশ মার্চেন্ট / পার্সোনাল নাম্বার</label>
            <input
              type="text"
              readOnly
              value={settings.bkashMerchantNumber || 'নির্ধারণ করা হয়নি'}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-bold text-slate-900 mb-3">ডেলিভারি চার্জ নির্ধারণ (BDT)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">ঢাকার ভিতরে</div>
              <div className="text-xl font-bold text-slate-900 mt-1">৳{settings.insideDhakaCharge}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">ঢাকা সাব-এরিয়া</div>
              <div className="text-xl font-bold text-slate-900 mt-1">৳{settings.subDhakaCharge}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">ঢাকার বাইরে (৬৩ জেলা)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">৳{settings.outsideDhakaCharge}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-bold text-slate-900 mb-2">প্রতিরোধ ও নিরাপত্তা</h2>
          <p className="text-xs text-slate-500">
            অর্ডার কুলডাউন সময়সীমা: <strong>{settings.orderCooldownMinutes} মিনিট</strong> (একই নাম্বার থেকে ১৫ মিনিটের মধ্যে ডুপ্লিকেট অর্ডার সাবমিশন ঠেকায়)।
          </p>
        </div>
      </div>
    </div>
  );
}
