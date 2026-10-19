// src/components/CheckoutForm.tsx
'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeBdPhone, isValidBdPhone } from '@/lib/bd-phone';

export interface ProductVariantData {
  id: string;
  sku: string;
  label: string;
  regularPrice: number;
  salePrice: number;
  stock: number;
}

export interface StoreSettingsData {
  insideDhakaCharge: number;
  subDhakaCharge: number;
  outsideDhakaCharge: number;
  bkashMerchantNumber?: string | null;
  whatsappNumber?: string | null;
  supportPhone?: string | null;
}

export interface BundleConfigItem {
  qty: number;
  discountBdt: number;
  label: string;
}

interface CheckoutFormProps {
  productSlug: string;
  productName: string;
  variants: ProductVariantData[];
  bundles?: BundleConfigItem[];
  settings: StoreSettingsData;
}

export default function CheckoutForm({
  productSlug,
  productName,
  variants,
  bundles = [
    { qty: 1, discountBdt: 0, label: '১ টি পাঞ্জাবি' },
    { qty: 2, discountBdt: 130, label: '২ টি কম্বো প্যাক (৳১৩০ সাশ্রয়!)' },
  ],
  settings,
}: CheckoutFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Form State
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants.find((v) => v.stock > 0)?.id || variants[0]?.id || ''
  );
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [deliveryZone, setDeliveryZone] = useState<'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA'>(
    'INSIDE_DHAKA'
  );
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH_MANUAL'>('COD');
  const [bkashSenderPhone, setBkashSenderPhone] = useState<string>('');
  const [bkashTrxId, setBkashTrxId] = useState<string>('');
  const [websiteHp, setWebsiteHp] = useState<string>(''); // Honeypot

  // UI & Loading States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [showStickyBar, setShowStickyBar] = useState<boolean>(true);

  const formRef = useRef<HTMLDivElement>(null);
  const leadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sessionKey and idempotencyKey once on client mount
  useEffect(() => {
    const sKey = `sess_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const iKey = `idem_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    setSessionKey(sKey);
    setIdempotencyKey(iKey);
  }, []);

  // Sticky Bar intersection observer
  useEffect(() => {
    if (!formRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide sticky bar when checkout form is visible in viewport
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);

  // Selected Variant details
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  // Pricing calculations
  const unitPrice = selectedVariant?.salePrice || 0;
  const regularUnitPrice = selectedVariant?.regularPrice || 0;
  const subTotal = unitPrice * selectedQty;

  const matchedBundle = bundles.find((b) => b.qty === selectedQty);
  const discountAmount = matchedBundle ? matchedBundle.discountBdt : 0;

  const deliveryCharge =
    deliveryZone === 'INSIDE_DHAKA'
      ? settings.insideDhakaCharge
      : deliveryZone === 'SUB_DHAKA'
      ? settings.subDhakaCharge
      : settings.outsideDhakaCharge;

  const totalAmount = Math.max(0, subTotal + deliveryCharge - discountAmount);

  // Phone input normalization on change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = normalizeBdPhone(raw);
    setCustomerPhone(normalized);

    // Debounced Incomplete Lead capture when 11 digits are completed
    if (isValidBdPhone(normalized) && sessionKey) {
      if (leadTimeoutRef.current) clearTimeout(leadTimeoutRef.current);
      leadTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/orders/incomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionKey,
              customerPhone: normalized,
              customerName,
              customerAddress,
              deliveryZone,
              productSlug,
              variantLabel: selectedVariant?.label,
              quantity: selectedQty,
              estimatedTotal: totalAmount,
              website_hp: websiteHp,
            }),
          });
        } catch {
          // Lead capture fails silently to avoid disrupting buyer
        }
      }, 1200);
    }
  };

  const scrollToCheckout = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('আপনার নাম লিখুন');
      return;
    }
    if (!isValidBdPhone(customerPhone)) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)');
      return;
    }
    if (!customerAddress.trim()) {
      setErrorMessage('সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (বাসা নং, রোড, থানা, জেলা)');
      return;
    }
    if (isOutOfStock) {
      setErrorMessage('নির্বাচিত সাইজটি বর্তমানে স্টকে নেই');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          sessionKey,
          customerName: customerName.trim(),
          customerPhone,
          customerAddress: customerAddress.trim(),
          deliveryZone,
          paymentMethod,
          bkashSenderPhone: paymentMethod === 'BKASH_MANUAL' ? bkashSenderPhone : undefined,
          bkashTrxId: paymentMethod === 'BKASH_MANUAL' ? bkashTrxId : undefined,
          variantId: selectedVariant.id,
          quantity: selectedQty,
          website_hp: websiteHp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'অর্ডার সম্পন্ন হতে সমস্যা হয়েছে');
      }

      // Order created successfully -> redirect to masked success page
      startTransition(() => {
        router.push(`/order-success/${data.publicToken}`);
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage((err as Error)?.message || 'অর্ডার করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <>
      <div ref={formRef} id="checkout-form" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-8">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>🛒</span> অর্ডার করতে নিচের তথ্যগুলো দিন
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            কোনো অগ্রিম পেমেন্ট ছাড়াই পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot field (hidden from genuine users) */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHp}
              onChange={(e) => setWebsiteHp(e.target.value)}
            />
          </div>

          {/* Option 1: Variant Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              অপশন ১: সাইজ / ভ্যারিয়েন্ট সিলেক্ট করুন *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const outOfStock = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      isSelected
                        ? 'border-green-600 bg-green-50/70 text-slate-900 ring-2 ring-green-600'
                        : outOfStock
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-sm">{v.label}</div>
                    <div className="text-xs mt-1">
                      {outOfStock ? (
                        <span className="text-red-600 font-medium">স্টক শেষ</span>
                      ) : v.stock <= 10 ? (
                        <span className="text-amber-700 font-medium">{v.stock}টি বাকি আছে</span>
                      ) : (
                        <span className="text-green-700 font-medium">স্টকে আছে</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option 2: Quantity / Bundle Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              অপশন ২: পরিমাণ / কম্বো অফার সিলেক্ট করুন *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bundles.map((bundle) => {
                const isSelected = selectedQty === bundle.qty;
                const bundlePrice = unitPrice * bundle.qty - bundle.discountBdt;
                return (
                  <button
                    key={bundle.qty}
                    type="button"
                    onClick={() => setSelectedQty(bundle.qty)}
                    className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-green-600 bg-green-50/70 text-slate-900 ring-2 ring-green-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-green-600' : 'border-slate-400'}`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-green-600" />}
                        </span>
                        {bundle.label}
                      </div>
                      {bundle.discountBdt > 0 && (
                        <div className="text-xs text-red-600 font-medium ml-6 mt-0.5">
                          ৳{bundle.discountBdt} স্পেশাল ডিসকাউন্ট
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-base text-slate-900">৳{bundlePrice.toLocaleString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input 1: Full Name */}
          <div>
            <label htmlFor="customerName" className="block text-sm font-semibold text-slate-900 mb-1.5">
              ইনপুট ১: আপনার পুরো নাম *
            </label>
            <input
              id="customerName"
              type="text"
              required
              autoComplete="name"
              placeholder="উদাঃ রহিম উদ্দিন"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition bg-slate-50/50"
            />
          </div>

          {/* Input 2: BD Phone Number */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="customerPhone" className="block text-sm font-semibold text-slate-900">
                ইনপুট ২: মোবাইল নাম্বার (১১ ডিজিট) *
              </label>
              <span className="text-xs text-slate-500 font-mono">
                {customerPhone.length}/১১ ডিজিট
              </span>
            </div>
            <input
              id="customerPhone"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              placeholder="017XXXXXXXX"
              value={customerPhone}
              onChange={handlePhoneChange}
              className={`w-full px-4 py-3 rounded-xl border font-mono transition bg-slate-50/50 focus:outline-none focus:ring-2 ${
                customerPhone.length === 11 && isValidBdPhone(customerPhone)
                  ? 'border-green-600 focus:ring-green-600'
                  : 'border-slate-300 focus:ring-green-600'
              }`}
            />
            <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1">
              <span>ℹ</span>
              <span>অর্ডারটি সম্পূর্ণ না হলে সহায়তার জন্য আমরা এই নাম্বারে যোগাযোগ করতে পারি।</span>
            </p>
          </div>

          {/* Input 3: Delivery Address */}
          <div>
            <label htmlFor="customerAddress" className="block text-sm font-semibold text-slate-900 mb-1.5">
              ইনপুট ৩: সম্পূর্ণ ডেলিভারি ঠিকানা *
            </label>
            <textarea
              id="customerAddress"
              required
              rows={2}
              autoComplete="street-address"
              placeholder="বাসা নং, রোড নং, এলাকা, থানা ও জেলা উল্লেখ করুন..."
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition bg-slate-50/50"
            />
          </div>

          {/* Option 3: Delivery Zone Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              অপশন ৩: ডেলিভারি এলাকা সিলেক্ট করুন *
            </label>
            <div className="space-y-2">
              {[
                { zone: 'INSIDE_DHAKA' as const, label: 'ঢাকার ভিতরে (Inside Dhaka City)', charge: settings.insideDhakaCharge },
                { zone: 'SUB_DHAKA' as const, label: 'ঢাকা সাব-এরিয়া (সাভার, আশুলিয়া, গাজীপুর, কেরানীগঞ্জ, নারায়ণগঞ্জ)', charge: settings.subDhakaCharge },
                { zone: 'OUTSIDE_DHAKA' as const, label: 'ঢাকার বাইরে (Outside Dhaka - ৬৩ জেলা)', charge: settings.outsideDhakaCharge },
              ].map((item) => {
                const isSelected = deliveryZone === item.zone;
                return (
                  <button
                    key={item.zone}
                    type="button"
                    onClick={() => setDeliveryZone(item.zone)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between text-sm ${
                      isSelected
                        ? 'border-green-600 bg-green-50/70 text-slate-900 ring-2 ring-green-600 font-medium'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-green-600' : 'border-slate-400'}`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-green-600" />}
                      </span>
                      {item.label}
                    </div>
                    <span className="font-bold text-slate-900">৳{item.charge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option 4: Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              অপশন ৪: পেমেন্ট মেথড সিলেক্ট করুন *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  paymentMethod === 'COD'
                    ? 'border-green-600 bg-green-50/70 text-slate-900 ring-2 ring-green-600 font-medium'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <span className="text-xl">💵</span>
                <div>
                  <div className="text-sm font-semibold">ক্যাশ অন ডেলিভারি (COD)</div>
                  <div className="text-xs text-slate-500">পণ্য হাতে পেয়ে পেমেন্ট করুন</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BKASH_MANUAL')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  paymentMethod === 'BKASH_MANUAL'
                    ? 'border-[#C91060] bg-pink-50 text-slate-900 ring-2 ring-[#C91060] font-medium'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <span className="text-xl">📱</span>
                <div>
                  <div className="text-sm font-semibold text-[#C91060]">বিকাশ অগ্রিম পেমেন্ট</div>
                  <div className="text-xs text-slate-500">ডেলিভারি চার্জ বিকাশ করুন</div>
                </div>
              </button>
            </div>

            {/* bKash instructions if selected */}
            {paymentMethod === 'BKASH_MANUAL' && (
              <div className="mt-3 p-4 bg-pink-50 border border-pink-200 rounded-xl space-y-3 text-sm">
                <p className="text-slate-800 font-medium">
                  অগ্রিম ডেলিভারি চার্জ <strong>৳{deliveryCharge}</strong> আমাদের বিকাশ নাম্বারে সেন্ড মানি করুন:
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-pink-200 font-mono font-bold text-[#C91060] text-center text-base">
                  {settings.bkashMerchantNumber || '01712-345678 (Personal)'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      যে নাম্বার থেকে বিকাশ করেছেন
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={bkashSenderPhone}
                      onChange={(e) => setBkashSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বিকাশ ট্রানজেকশন আইডি (TrxID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BL99XX45"
                      value={bkashTrxId}
                      onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>প্রোডাক্ট মূল্য ({selectedQty} টি):</span>
              <span className="font-semibold text-slate-800">৳{subTotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>কম্বো ডিসকাউন্ট:</span>
                <span>-৳{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold text-slate-800">৳{deliveryCharge.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-base font-bold text-slate-900">
              <span>সর্বমোট পরিশোধযোগ্য:</span>
              <span className="text-xl text-green-700">৳{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <a
                href={`https://wa.me/${(settings.whatsappNumber || '8801712345678').replace(/[^\d]/g, '')}?text=${encodeURIComponent(`হ্যালো, আমি ${productName} অর্ডার করতে পারছি না। সাহায্য করবেন?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-green-700 underline"
              >
                হোয়াটসঅ্যাপে অর্ডার দিন
              </a>
            </div>
          )}

          {/* Big CTA Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isOutOfStock}
            className="w-full min-h-[56px] bg-green-700 hover:bg-green-800 disabled:bg-slate-400 text-white font-bold text-lg rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>অর্ডার প্রসেস হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন</span>
            ) : isOutOfStock ? (
              <span>স্টক শেষ — অন্য সাইজ সিলেক্ট করুন</span>
            ) : (
              <span>✓ অর্ডার কনফার্ম করুন — ৳{totalAmount.toLocaleString()}</span>
            )}
          </button>
        </form>
      </div>

      {/* Sticky Bottom Mobile Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-4 max-w-lg mx-auto sm:hidden">
          <div>
            <div className="text-xs text-slate-500">মূল্য:</div>
            <div className="text-lg font-bold text-green-700">৳{totalAmount.toLocaleString()}</div>
          </div>
          <button
            type="button"
            onClick={scrollToCheckout}
            className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-xl text-center text-sm shadow-sm transition"
          >
            অর্ডার করতে ফর্ম পূরণ করুন 🛒
          </button>
        </div>
      )}
    </>
  );
}
