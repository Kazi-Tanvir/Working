// src/app/(admin)/admin/invoice/[id]/page.tsx
// 80mm POS Thermal Label & Standard A4 Printable Courier Invoice

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PrintButton from '@/components/PrintButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: PageProps) {
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        courierDispatch: true,
      },
    }),
    prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    }),
  ]);

  if (!order) {
    notFound();
  }

  const consignmentId = order.courierDispatch?.consignmentId || 'NOT DISPATCHED';

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* On-screen controls */}
      <div className="no-print mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="font-bold text-slate-800 text-sm">ইনভয়েস প্রিন্ট প্রিভিউ</h1>
          <p className="text-xs text-slate-500">80mm থার্মাল পিওএস অথবা এ৪ সাইজে প্রিন্ট করুন</p>
        </div>
        <PrintButton />
      </div>

      {/* 80mm Thermal Receipt Layout (Pure Black & White for zero blur) */}
      <div className="bg-white border-2 border-dashed border-black p-4 text-black font-sans max-w-[80mm] mx-auto text-xs space-y-3 leading-snug">
        {/* Merchant Header */}
        <div className="text-center border-b-2 border-black pb-2 space-y-0.5">
          <div className="text-base font-extrabold tracking-wide uppercase">
            {settings.storeName}
          </div>
          <div className="text-[11px] font-mono">হেল্পলাইন: {settings.supportPhone}</div>
          <div className="text-[10px]">ক্যাশ অন ডেলিভারি পার্সেল</div>
        </div>

        {/* Courier Consignment ID & Barcode placeholder */}
        <div className="text-center border-b-2 border-black pb-2">
          <div className="text-[10px] uppercase font-bold tracking-wider">Steadfast Consignment ID</div>
          <div className="text-xl font-mono font-black tracking-widest my-1">{consignmentId}</div>
          <div className="text-[11px] font-mono font-bold">ইনভয়েস নং: {order.invoiceNo}</div>
        </div>

        {/* Customer Details Box */}
        <div className="border border-black p-2 space-y-1">
          <div className="font-bold text-sm">{order.customerName}</div>
          <div className="font-mono font-bold text-base">{order.customerPhone}</div>
          <div className="text-xs pt-1 leading-normal">
            <strong>ঠিকানা:</strong> {order.customerAddress}
          </div>
          <div className="text-[10px] text-slate-700">জোন: {order.deliveryZone}</div>
        </div>

        {/* Items Table */}
        <div className="border-b border-black pb-2">
          <div className="font-bold mb-1 border-b border-black pb-0.5 flex justify-between">
            <span>আইটেম বিবরণ</span>
            <span>পরিমাণ</span>
          </div>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-xs py-0.5">
              <span>
                {item.productName} ({item.variantLabel})
              </span>
              <span className="font-bold font-mono">×{item.quantity}</span>
            </div>
          ))}
        </div>

        {/* COD Collectible Box */}
        <div className="border-2 border-black p-2 text-center space-y-0.5">
          <div className="text-[11px] font-bold uppercase tracking-wider">
            কুরিয়ার আদায়ের পরিমাণ (COD Collectible)
          </div>
          <div className="text-2xl font-black font-mono">৳{order.codCollectible.toLocaleString()}</div>
          {order.advancePaid > 0 && (
            <div className="text-[10px]">অগ্রিম পরিশোধ: ৳{order.advancePaid.toLocaleString()}</div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-[10px] text-center pt-1 border-t border-black space-y-0.5">
          <div>পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানকে মূল্য পরিশোধ করুন।</div>
          <div className="font-mono text-[9px]">Printed on {new Date().toLocaleString('en-GB')}</div>
        </div>
      </div>
    </div>
  );
}
