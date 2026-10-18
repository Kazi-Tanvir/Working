// src/app/(storefront)/return-policy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'রিটার্ন ও রিফান্ড পলিসি | সুকুন কালেকশন',
  description: 'আমাদের সহজ ও স্বচ্ছ রিটার্ন এবং এক্সচেঞ্জ পলিসি।',
};

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-slate-800">
      <div className="mb-6">
        <Link href="/" className="text-green-700 hover:underline font-medium text-sm">
          ← হোমপেজে ফিরে যান
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
        রিটার্ন ও এক্সচেঞ্জ পলিসি (Return & Exchange)
      </h1>
      <p className="text-sm text-slate-500 mb-6">সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

      <div className="space-y-6 leading-relaxed text-sm md:text-base">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 font-medium">
          ✅ আমাদের পলিসি অত্যন্ত সহজ: ডেলিভারি ম্যানের সামনে পার্সেল খুলে দেখে নিন। ছবির সাথে মিল না থাকলে ডেলিভারি চার্জ দিয়ে সাথে সাথে রিটার্ন করতে পারবেন।
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">১. ডেলিভারির সময় ইনস্ট্যান্ট রিটার্ন</h2>
          <p>
            ডেলিভারি ম্যান উপস্থিত থাকাকালীন কাপড় বা পণ্যের সাইজ ও মান চেক করুন। কোনো ত্রুটি থাকলে কোনো প্রকার বাড়তি চার্জ ছাড়াই রিটার্ন করতে পারবেন।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">২. সাইজ পরিবর্তন বা এক্সচেঞ্জ</h2>
          <p>
            যদি সাইজ ছোট বা বড় হয়, ডেলিভারি পাওয়ার ৩ দিনের মধ্যে আমাদের হেল্পলাইনে জানালে আমরা সম্পূর্ণ ফ্রিতে বা প্রযোজ্য এক্সচেঞ্জ কুরিয়ার চার্জে সঠিক সাইজটি আপনার কাছে পাঠিয়ে দিব।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">৩. রিফান্ড প্রক্রিয়া</h2>
          <p>
            অগ্রিম পেমেন্ট করা থাকলে এবং পণ্য রিটার্ন হলে ২ কার্যদিবসের মধ্যে আপনার বিকাশ বা নগদ নাম্বারে সম্পূর্ণ রিফান্ড পাঠিয়ে দেওয়া হবে।
          </p>
        </section>
      </div>
    </div>
  );
}
