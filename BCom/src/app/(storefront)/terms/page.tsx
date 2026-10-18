// src/app/(storefront)/terms/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'ব্যবহারের শর্তাবলী | সুকুন কালেকশন',
  description: 'আমাদের ওয়েবসাইটের ব্যবহারের সাধারণ শর্তাবলী ও নিয়মাবলী।',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-slate-800">
      <div className="mb-6">
        <Link href="/" className="text-green-700 hover:underline font-medium text-sm">
          ← হোমপেজে ফিরে যান
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
        ব্যবহারের শর্তাবলী (Terms of Service)
      </h1>
      <p className="text-sm text-slate-500 mb-6">সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

      <div className="space-y-6 leading-relaxed text-sm md:text-base">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">১. অর্ডার কনফার্মেশন ও ভেরিফিকেশন</h2>
          <p>
            অর্ডার সাবমিট করার পর আমাদের কাস্টমার সার্ভিস প্রতিনিধি আপনার প্রদত্ত মোবাইল নাম্বারে ফোন করে সাইজ, ঠিকানা ও অর্ডার কনফার্ম করবেন। ফোন ভেরিফিকেশনের পরই পার্সেল কুরিয়ারে হস্তান্তর করা হবে।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">২. ক্যাশ অন ডেলিভারি (COD) ও পেমেন্ট</h2>
          <p>
            গ্রাহক পণ্য হাতে পেয়ে মূল্য পরিশোধ করবেন। তবে অনাকাঙ্ক্ষিত ফেইক অর্ডার রোধে ঢাকার বাইরের কিছু অর্ডারের ক্ষেত্রে শুধুমাত্র কুরিয়ার চার্জ অগ্রিম বিকাশ চাওয়া হতে পারে।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">৩. ডেলিভারি সময়সীমা</h2>
          <p>
            ঢাকার ভিতরে ২৪-৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২-৩ কার্যদিবসের মধ্যে কুরিয়ারের মাধ্যমে ডেলিভারি সম্পন্ন হয়। প্রাকৃতিক দুর্যোগ বা রাজনৈতিক পরিস্থিতিতে সময় সামান্য বেশি লাগতে পারে।
          </p>
        </section>
      </div>
    </div>
  );
}
