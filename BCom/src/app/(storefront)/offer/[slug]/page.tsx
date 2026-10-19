// src/app/(storefront)/offer/[slug]/page.tsx
// Single-Product High-Converting Ad Funnel Page

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import CheckoutForm from '@/components/CheckoutForm';
import { ProductVariantData, StoreSettingsData, BundleConfigItem } from '@/components/CheckoutForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
  });

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | ক্যাশ অন ডেলিভারি`,
    description: product.description.slice(0, 150),
  };
}

export default async function OfferPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Load Product, Variants, and StoreSettings in parallel
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    }),
  ]);

  if (!product || product.variants.length === 0) {
    notFound();
  }

  // First available variant for headline pricing
  const defaultVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const regularPrice = defaultVariant.regularPrice;
  const salePrice = defaultVariant.salePrice;
  const savings = Math.max(0, regularPrice - salePrice);

  // Parse images & features safely
  const images = (Array.isArray(product.images) ? product.images : [
    'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80',
  ]) as string[];

  const features = (Array.isArray(product.features) ? product.features : [
    '১০০% খাঁটি ইজিপশিয়ান সুতি কাপড়ে তৈরি',
    'ছবি ও ভিডিওর সাথে হুবহু মিল গ্যারান্টি',
    'পণ্য হাতে পেয়ে চেক করে পেমেন্ট করার সুবিধা',
    'সারা বাংলাদেশে দ্রুততম কুরিয়ার হোম ডেলিভারি',
  ]) as string[];

  const bundles = (product.bundleConfig as BundleConfigItem[] | null) || [
    { qty: 1, discountBdt: 0, label: '১ টি পাঞ্জাবি' },
    { qty: 2, discountBdt: 130, label: '২ টি কম্বো প্যাক (৳১৩০ সাশ্রয়!)' },
  ];

  const variantsData: ProductVariantData[] = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    label: v.label,
    regularPrice: v.regularPrice,
    salePrice: v.salePrice,
    stock: v.stock,
  }));

  const settingsData: StoreSettingsData = {
    insideDhakaCharge: settings.insideDhakaCharge,
    subDhakaCharge: settings.subDhakaCharge,
    outsideDhakaCharge: settings.outsideDhakaCharge,
    bkashMerchantNumber: settings.bkashMerchantNumber,
    whatsappNumber: settings.whatsappNumber,
    supportPhone: settings.supportPhone,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Product Image Showcase */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200">
        <Image
          src={images[0]}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
        {savings > 0 && (
          <div className="absolute top-3 left-3 bg-red-700 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
            বাঁচুন ৳{savings.toLocaleString()}!
          </div>
        )}
      </div>

      {/* Title & Pricing Card */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-3">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
          {product.name}
        </h1>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl md:text-3xl font-extrabold text-green-700">
            ৳{salePrice.toLocaleString()}
          </span>
          {savings > 0 && (
            <span className="text-base md:text-lg text-slate-400 line-through">
              ৳{regularPrice.toLocaleString()}
            </span>
          )}
          <span className="text-xs bg-green-100 text-green-800 font-semibold px-2.5 py-1 rounded-md">
            স্পেশাল অফার
          </span>
        </div>

        {/* Real stock indicator */}
        <div className="text-xs md:text-sm text-slate-600 flex items-center gap-2 pt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span>
            {defaultVariant.stock > 0
              ? `${defaultVariant.label}-এ আর মাত্র ${defaultVariant.stock}টি বাকি আছে`
              : 'স্টক দ্রুত ফুরিয়ে যাচ্ছে'}
          </span>
        </div>

        {/* Quick jump to checkout */}
        <a
          href="#checkout-form"
          className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-center text-sm md:text-base shadow-sm transition mt-2"
        >
          🛒 অর্ডার করতে নিচের ফর্মে যান
        </a>
      </div>

      {/* Why Choose Us & Trust Guarantees */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>✨</span> কেন আমাদের থেকে অর্ডার করবেন?
        </h2>

        <div className="space-y-2.5">
          {features.map((feat, index) => (
            <div key={index} className="flex items-start gap-2.5 text-sm md:text-base text-slate-700">
              <span className="text-green-600 font-bold shrink-0">✓</span>
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            🛡️ <strong>১০০% সততা গ্যারান্টি:</strong> ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে পছন্দ হলে মূল্য পরিশোধ করুন। ছবির সাথে অমিল থাকলে ডেলিভারি চার্জ দিয়ে রিটার্ন করার সুযোগ রয়েছে।
          </p>
        </div>
      </div>

      {/* Customer Reviews (Privacy Redacted) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>⭐</span> সম্মানিত গ্রাহকদের রিভিউ
        </h2>

        <div className="space-y-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">রাহাত খান • মিরপুর, ঢাকা</span>
              <span className="text-amber-500 font-bold">★★★★★</span>
            </div>
            <p className="text-slate-600">
              &quot;কাপড়ের মান আলহামদুলিল্লাহ অনেক ভালো। ছবিতে যেমন দেখেছি বাস্তবে ঠিক তেমনই পেয়েছি। ডেলিভারিও ২ দিনের মধ্যে পেয়েছি।&quot;
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">মাহমুদুল হাসান • চট্টগ্রাম সদর</span>
              <span className="text-amber-500 font-bold">★★★★★</span>
            </div>
            <p className="text-slate-600">
              &quot;সাইজ একদম পারফেক্ট হয়েছে। কলার আর বাটন ফিনিশিং দারুণ। শুভকামনা রইল সুকুন কালেকশনের জন্য।&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Minimal Checkout Form */}
      <CheckoutForm
        productSlug={product.slug}
        productName={product.name}
        variants={variantsData}
        bundles={bundles}
        settings={settingsData}
      />
    </div>
  );
}
