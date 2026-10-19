// src/app/(storefront)/page.tsx
// Rich, High-Converting Bangladeshi F-Commerce Storefront

import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'সুকুন কালেকশন | প্রিমিয়াম পাঞ্জাবি ও ইসলামিক লাইফস্টাইল',
  description:
    '১০০% খাঁটি সুতি ও লিনেন কাপড়ে তৈরি আকর্ষণীয় পাঞ্জাবি কালেকশন। কোনো অগ্রিম ছাড়াই সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা।',
};

export default async function StorefrontPage() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ isFeaturedFunnel: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    }),
  ]);

  const featuredProduct = products.find((p) => p.isFeaturedFunnel) || products[0];

  return (
    <div className="space-y-12 md:space-y-16">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50/70 via-slate-50/50 to-white pt-8 pb-12 md:pt-14 md:pb-16 px-4 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-800 text-xs md:text-sm font-bold shadow-xs">
            <span>✨ প্রিমিয়াম ইসলামিক ও লাইফস্টাইল কালেকশন</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            আভিজাত্য ও শতভাগ আরামের <br className="hidden sm:inline" />
            <span className="text-green-700">খাঁটি সুতি পাঞ্জাবি কালেকশন</span>
          </h1>

          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            গরমে সারাদিন পরে থাকার উপযোগী ১০০% প্রিমিয়াম সুতি ও সফট লিনেন ফেব্রিক। ছবির সাথে শতভাগ মিল গ্যারান্টি, পণ্য হাতে পেয়ে চেক করে পেমেন্ট করার নিশ্চয়তা।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#products"
              className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm md:text-base px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              🛍️ সব কালেকশন দেখুন
            </a>
            <a
              href={`tel:${settings.supportPhone}`}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm md:text-base px-5 py-3.5 rounded-xl shadow-xs transition-colors"
            >
              📞 সরাসরি কল করুন ({settings.supportPhone})
            </a>
          </div>

          {/* 4 Pillars of Trust */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 text-left">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="text-2xl shrink-0">🚚</span>
              <div>
                <h2 className="text-xs md:text-sm font-bold text-slate-900">ক্যাশ অন ডেলিভারি</h2>
                <p className="text-[11px] text-slate-500">সারাদেশে হোম ডেলিভারি</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="text-2xl shrink-0">🛡️</span>
              <div>
                <h2 className="text-xs md:text-sm font-bold text-slate-900">দেখে পেমেন্ট</h2>
                <p className="text-[11px] text-slate-500">পণ্য হাতে পেয়ে চেক করুন</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="text-2xl shrink-0">⚡</span>
              <div>
                <h2 className="text-xs md:text-sm font-bold text-slate-900">দ্রুত ডেলিভারি</h2>
                <p className="text-[11px] text-slate-500">২৪-৭২ ঘন্টায় নিশ্চিন্তে</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="text-2xl shrink-0">🔄</span>
              <div>
                <h2 className="text-xs md:text-sm font-bold text-slate-900">সহজ রিটার্ন</h2>
                <p className="text-[11px] text-slate-500">পছন্দ না হলে ফেরত দিন</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Deal Spotlight (If available) */}
      {featuredProduct && (
        <section className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Product Image */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/60 shadow-md">
                <Image
                  src={
                    Array.isArray(featuredProduct.images) && featuredProduct.images[0]
                      ? (featuredProduct.images[0] as string)
                      : 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={featuredProduct.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                  🔥 স্পেশাল অফার
                </div>
              </div>

              {/* Details & CTA */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-950/80 border border-green-600/40 text-green-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  সপ্তাহের সবচেয়ে জনপ্রিয় ডিল
                </div>

                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-snug">
                  {featuredProduct.name}
                </h2>

                <p className="text-slate-300 text-xs md:text-sm leading-relaxed line-clamp-3">
                  {featuredProduct.description}
                </p>

                {/* Price Display */}
                {featuredProduct.variants.length > 0 && (
                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-2xl md:text-3xl font-black text-green-400">
                      ৳{featuredProduct.variants[0].salePrice.toLocaleString()}
                    </span>
                    {featuredProduct.variants[0].regularPrice >
                      featuredProduct.variants[0].salePrice && (
                      <span className="text-slate-400 line-through text-base md:text-lg">
                        ৳{featuredProduct.variants[0].regularPrice.toLocaleString()}
                      </span>
                    )}
                    {featuredProduct.variants[0].regularPrice >
                      featuredProduct.variants[0].salePrice && (
                      <span className="text-xs bg-red-950/90 text-red-300 border border-red-800/60 font-bold px-2.5 py-1 rounded-md">
                        সাশ্রয় ৳
                        {(
                          featuredProduct.variants[0].regularPrice -
                          featuredProduct.variants[0].salePrice
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Available Sizes preview */}
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400">উপলব্ধ সাইজ:</span>
                  <div className="flex gap-1.5">
                    {featuredProduct.variants.map((v) => (
                      <span
                        key={v.id}
                        className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs text-slate-200"
                      >
                        {v.label.split(' ')[1] || v.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    href={`/offer/${featuredProduct.slug}`}
                    className="inline-flex items-center justify-center w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-extrabold text-sm md:text-base px-7 py-3.5 rounded-xl shadow-lg transition-all duration-200"
                  >
                    🛒 এখনই অর্ডার কনফার্ম করুন →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Product Catalog Grid */}
      <section id="products" className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <span className="text-green-700 font-bold text-xs uppercase tracking-wider">
              এক্সক্লুসিভ কালেকশন
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">
              আমাদের জনপ্রিয় পোশাকসমূহ
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            মোট {products.length}টি কালেকশন স্টকে রয়েছে
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => {
            const defaultVar = product.variants[0] || null;
            const savings =
              defaultVar && defaultVar.regularPrice > defaultVar.salePrice
                ? defaultVar.regularPrice - defaultVar.salePrice
                : 0;

            const primaryImage =
              Array.isArray(product.images) && product.images[0]
                ? (product.images[0] as string)
                : 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Image */}
                <Link
                  href={`/offer/${product.slug}`}
                  className="relative aspect-square w-full bg-slate-100 overflow-hidden block"
                >
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {savings > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-red-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      বাঁচুন ৳{savings.toLocaleString()}
                    </span>
                  )}
                  {product.isFeaturedFunnel && (
                    <span className="absolute top-2.5 right-2.5 bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      টপ সেলিং
                    </span>
                  )}
                </Link>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <Link
                      href={`/offer/${product.slug}`}
                      className="font-bold text-sm md:text-base text-slate-900 hover:text-green-700 transition line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </Link>

                    {/* Variant Sizes Chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.variants.map((v) => (
                        <span
                          key={v.id}
                          className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                        >
                          {v.label.split(' ')[1] || v.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {defaultVar ? (
                        <>
                          <div className="text-base md:text-lg font-extrabold text-green-700">
                            ৳{defaultVar.salePrice.toLocaleString()}
                          </div>
                          {savings > 0 && (
                            <div className="text-xs text-slate-400 line-through">
                              ৳{defaultVar.regularPrice.toLocaleString()}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm font-semibold text-slate-600">স্টক নেই</div>
                      )}
                    </div>

                    <Link
                      href={`/offer/${product.slug}`}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs md:text-sm px-3.5 py-2 rounded-xl shadow-xs transition"
                    >
                      অর্ডার করুন 🛒
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Customer Reviews Section */}
      <section className="bg-slate-100/70 border-y border-slate-200/80 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-green-700 font-bold text-xs uppercase tracking-wider">
              গ্রাহকদের মতামত
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
              সন্তুষ্ট গ্রাহকদের বাস্তব রিভিউ
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
              সারা বাংলাদেশ থেকে হাজারো সন্তুষ্ট গ্রাহকের ভালোবাসা ও আস্থার প্রতীক
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex text-amber-500 text-sm">★★★★★</div>
              <p className="text-slate-700 text-xs md:text-sm leading-relaxed">
                &ldquo;কাপড়ের মান আলহামদুলিল্লাহ অনেক ভালো। ছবিতে যেমন দেখেছি বাস্তবে ঠিক তেমনই পেয়েছি। ডেলিভারিও ২ দিনের মধ্যে পেয়েছি।&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">রাহাত ইসলাম</span>
                <span className="text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                  ✓ ভেরিফাইড বায়ার (মিরপুর, ঢাকা)
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex text-amber-500 text-sm">★★★★★</div>
              <p className="text-slate-700 text-xs md:text-sm leading-relaxed">
                &ldquo;সাইজ একদম পারফেক্ট হয়েছে। কলার আর বাটন ফিনিশিং দারুণ। শুভকামনা রইল সুকুন কালেকশনের জন্য।&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">তানভীর আহমেদ</span>
                <span className="text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                  ✓ ভেরিফাইড বায়ার (চট্টগ্রাম)
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex text-amber-500 text-sm">★★★★★</div>
              <p className="text-slate-700 text-xs md:text-sm leading-relaxed">
                &ldquo;প্যাকেজিং খুব সুন্দর ছিল এবং ডেলিভারি ম্যানের সামনে খুলে চেক করে পেমেন্ট করার সুযোগ পেয়ে নিশ্চিন্ত লেগেছে।&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">মাহমুদুল হাসান</span>
                <span className="text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                  ✓ ভেরিফাইড বায়ার (সিলেট)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions (FAQ) */}
      <section className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
            সাধারণ প্রশ্ন ও উত্তর
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            অর্ডার সংক্রান্ত যেকোনো দ্বিধা দূর করতে নিচের উত্তরগুলো পড়ুন
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm md:text-base text-slate-900">
              ১. আমি কীভাবে ক্যাশ অন ডেলিভারিতে অর্ডার করব?
            </h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed">
              পছন্দের পণ্যের &ldquo;অর্ডার করুন&rdquo; বাটনে ক্লিক করুন। এরপর আপনার নাম, মোবাইল নাম্বার ও সম্পূর্ণ ঠিকানা লিখে সাবমিট করলেই অর্ডার কনফার্ম হয়ে যাবে। কোনো অগ্রিম পেমেন্ট লাগবে না।
            </p>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm md:text-base text-slate-900">
              ২. ডেলিভারি চার্জ কত এবং কতদিনে পাব?
            </h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed">
              ঢাকার ভেতরে ডেলিভারি চার্জ ৳{settings.insideDhakaCharge} এবং সময় ২৪-৪৮ ঘন্টা। ঢাকা সাব-এরিয়ায় ৳{settings.subDhakaCharge} এবং ঢাকার বাইরে সারা বাংলাদেশে ৳{settings.outsideDhakaCharge} (সময় ২-৩ দিন)।
            </p>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm md:text-base text-slate-900">
              ৩. ছবির সাথে মিল না থাকলে কী করব?
            </h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed">
              আমাদের ১০০% সততা গ্যারান্টি রয়েছে। ডেলিভারি ম্যান থাকা অবস্থায় পার্সেল খুলে চেক করবেন। পছন্দ বা ছবির সাথে অমিল থাকলে কেবল ডেলিভারি চার্জ পরিশোধ করে পণ্যটি রিটার্ন করতে পারবেন।
            </p>
          </div>
        </div>
      </section>

      {/* 6. Bottom Sticky Contact / Order Banner */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-green-700 text-white rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-lg">
          <h2 className="text-xl md:text-2xl font-extrabold">
            পছন্দের পাঞ্জাবি অর্ডার করতে আর দেরি কেন?
          </h2>
          <p className="text-xs md:text-sm text-green-100 max-w-lg mx-auto">
            স্টক দ্রুত ফুরিয়ে যাওয়ার আগেই আপনার পছন্দের সাইজটি কনফার্ম করুন। সারা বাংলাদেশে নিশ্চিন্ত ক্যাশ অন ডেলিভারি সুবিধা।
          </p>
          <div className="pt-2">
            <a
              href="#products"
              className="inline-block bg-white hover:bg-slate-100 text-green-800 font-bold px-7 py-3 rounded-xl shadow-md transition"
            >
              এখনই কালেকশন দেখুন 🛍️
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
