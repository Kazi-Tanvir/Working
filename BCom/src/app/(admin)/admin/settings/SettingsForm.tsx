// src/app/(admin)/admin/settings/SettingsForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { updateStoreSettings } from './actions';
import { StoreSettings } from '@prisma/client';

export default function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateStoreSettings(formData);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error?.message || 'সেটিংস আপডেট করতে ব্যর্থ হয়েছে।');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {savedSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <span>✓</span>
          <span>স্টোর সেটিংস ও হোয়াটসঅ্যাপ নাম্বার সফলভাবে আপডেট হয়েছে!</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          মৌলিক স্টোর ও যোগাযোগ তথ্য
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              স্টোরের নাম
            </label>
            <input
              name="storeName"
              type="text"
              defaultValue={settings.storeName}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-green-700 focus:ring-1 focus:ring-green-700 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কাস্টমার হেল্পলাইন ফোন নাম্বার
            </label>
            <input
              name="supportPhone"
              type="text"
              defaultValue={settings.supportPhone}
              required
              placeholder="017XXXXXXXX"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-green-700 focus:ring-1 focus:ring-green-700 bg-white text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              হোয়াটসঅ্যাপ নাম্বার (WhatsApp Number)
            </label>
            <input
              name="whatsappNumber"
              type="text"
              defaultValue={settings.whatsappNumber}
              required
              placeholder="88017XXXXXXXX বা 017XXXXXXXX"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-green-600 focus:border-green-700 focus:ring-2 focus:ring-green-700/20 bg-green-50/20 text-slate-900 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              ফরম্যাট: 8801712345678 (আন্তর্জাতিক কোড সহ) অথবা 01712345678।
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিকাশ মার্চেন্ট / পার্সোনাল নাম্বার
            </label>
            <input
              name="bkashMerchantNumber"
              type="text"
              defaultValue={settings.bkashMerchantNumber || ''}
              placeholder="01XXXXXXXXX (Personal / Merchant)"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-green-700 focus:ring-1 focus:ring-green-700 bg-white text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">ডেলিভারি চার্জ নির্ধারণ (BDT)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">ঢাকার ভিতরে (Inside Dhaka)</label>
              <input
                name="insideDhakaCharge"
                type="number"
                defaultValue={settings.insideDhakaCharge}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-green-700 bg-white text-slate-900 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">ঢাকা সাব-এরিয়া (Sub Dhaka)</label>
              <input
                name="subDhakaCharge"
                type="number"
                defaultValue={settings.subDhakaCharge}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-green-700 bg-white text-slate-900 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">ঢাকার বাইরে (Outside Dhaka)</label>
              <input
                name="outsideDhakaCharge"
                type="number"
                defaultValue={settings.outsideDhakaCharge}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-green-700 bg-white text-slate-900 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold text-slate-900 mb-2">কুলডাউন ও সিকিউরিটি</h2>
          <div className="max-w-xs">
            <label className="block text-xs text-slate-600 mb-1">অর্ডার কুলডাউন (মিনিট)</label>
            <input
              name="orderCooldownMinutes"
              type="number"
              defaultValue={settings.orderCooldownMinutes}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-green-700 bg-white text-slate-900 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              একই ফোন নাম্বার থেকে নির্দিষ্ট সময়ের মধ্যে ডুপ্লিকেট সাবমিশন ঠেকায়।
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {isPending ? 'সংরক্ষণ হচ্ছে...' : '✓ সেটিংস সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </form>
  );
}
