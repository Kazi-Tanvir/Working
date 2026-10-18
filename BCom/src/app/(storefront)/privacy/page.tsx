// src/app/(storefront)/privacy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'প্রাইভেসি পলিসি | সুকুন কালেকশন',
  description: 'আমাদের প্রাইভেসি পলিসি এবং গ্রাহক ডেটা সুরক্ষা সম্পর্কিত বিবরণ।',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-slate-800">
      <div className="mb-6">
        <Link href="/" className="text-green-700 hover:underline font-medium text-sm">
          ← হোমপেজে ফিরে যান
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
        প্রাইভেসি পলিসি (Privacy Policy)
      </h1>
      <p className="text-sm text-slate-500 mb-6">সর্বশেষ আপডেট: অক্টোবর ২০২৬</p>

      <div className="space-y-6 leading-relaxed text-sm md:text-base">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">১. আমরা কোন তথ্য সংগ্রহ করি</h2>
          <p>
            আমাদের ওয়েবসাইটে অর্ডার প্রক্রিয়াকরণের জন্য আমরা গ্রাহকের নাম, মোবাইল নাম্বার এবং ডেলিভারি ঠিকানা সংগ্রহ করি। কোনো প্রকার কার্ড বা ব্যাংকিং পাসওয়ার্ড আমরা সংরক্ষণ করি না।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">২. চেকআউট ও লিড ক্যাপচার নোটিশ</h2>
          <p>
            চেকআউট ফর্মে আপনার মোবাইল নাম্বার দেওয়ার পর যদি কোনো কারণে ইন্টারনেট বিভ্রাট বা অনাকাঙ্ক্ষিত কারণে অর্ডার অসম্পূর্ণ থেকে যায়, তবে আপনাকে সহায়তার উদ্দেশ্যে আমাদের কাস্টমার সার্ভিস প্রতিনিধি শুধুমাত্র একবার যোগাযোগ করতে পারে। অসম্পূর্ণ লিডের ডেটা ৩০ দিন পর স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">৩. তথ্যের ব্যবহার ও গোপনীয়তা</h2>
          <p>
            আপনার তথ্য শুধুমাত্র কুরিয়ার পার্সেল ডেলিভারি (যেমন: Steadfast Courier) এবং অর্ডার নিশ্চিতকরণের জন্য ব্যবহৃত হয়। আমরা কোনো তৃতীয় পক্ষের কাছে গ্রাহকের ফোন নাম্বার বা ব্যক্তিগত তথ্য বিক্রি বা হস্তান্তর করি না।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">৪. যোগাযোগ</h2>
          <p>
            আপনার ব্যক্তিগত তথ্য সংক্রান্ত যেকোনো জিজ্ঞাসা বা আপত্তি থাকলে আমাদের হেল্পলাইন <strong>01712-345678</strong> অথবা WhatsApp এ যোগাযোগ করতে পারেন।
          </p>
        </section>
      </div>
    </div>
  );
}
