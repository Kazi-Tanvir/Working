// src/app/(admin)/admin/orders/page.tsx
// Mobile-First Order Operations & Management Page

import { prisma } from '@/lib/prisma';
import AdminOrderCard, { AdminOrderData } from '@/components/AdminOrderCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status } = await searchParams;

  const whereClause = status ? { status: status as any } : {};

  const orders = await prisma.order
    .findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        courierDispatch: true,
        processedBy: { select: { name: true, role: true } },
      },
    })
    .catch(() => []);

  const ordersData: AdminOrderData[] = orders.map((o) => ({
    id: o.id,
    invoiceNo: o.invoiceNo,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    deliveryZone: o.deliveryZone,
    totalAmount: o.totalAmount,
    codCollectible: o.codCollectible,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    riskScore: o.riskScore,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    courierDispatch: o.courierDispatch
      ? {
          dispatchStatus: o.courierDispatch.dispatchStatus,
          consignmentId: o.courierDispatch.consignmentId,
          trackingCode: o.courierDispatch.trackingCode,
          lastError: o.courierDispatch.lastError,
        }
      : null,
    processedBy: o.processedBy,
  }));

  const filters = [
    { label: 'সব অর্ডার', value: undefined },
    { label: 'নতুন (Pending)', value: 'PENDING' },
    { label: 'কনফার্মড', value: 'CONFIRMED' },
    { label: 'প্যাকড', value: 'PACKED' },
    { label: 'কুরিয়ারে (Shipped)', value: 'SHIPPED' },
    { label: 'ডেলিভার্ড', value: 'DELIVERED' },
    { label: 'বাতিল (Cancelled)', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">অর্ডার অপারেশন ও ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-500">
            মোট অর্ডার: {ordersData.length} টি {status ? `(${status} ফিল্টার)` : ''}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((f) => {
          const isActive = status === f.value;
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/orders?status=${f.value}` : '/admin/orders'}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Orders Cards List */}
      {ordersData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="text-4xl">📦</div>
          <h3 className="font-bold text-slate-800 text-base">কোনো অর্ডার পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            এই ফিল্টারে বর্তমানে কোনো অর্ডার নেই। টেস্ট অর্ডার দেখতে সীডার চালান অথবা লাইভ শপ থেকে অর্ডার দিন।
          </p>
          <Link
            href="/admin/orders"
            className="inline-block text-xs font-semibold text-green-700 hover:underline pt-2"
          >
            সব অর্ডার দেখুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordersData.map((order) => (
            <AdminOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
