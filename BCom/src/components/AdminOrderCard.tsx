// src/components/AdminOrderCard.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ORDER_STATUS_LABELS, DISPATCH_STATUS_LABELS } from '@/lib/constants';

export interface OrderItemData {
  id: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CourierDispatchData {
  dispatchStatus: string;
  consignmentId?: string | null;
  trackingCode?: string | null;
  lastError?: string | null;
}

export interface AdminOrderData {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryZone: string;
  totalAmount: number;
  codCollectible: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  riskScore: number;
  createdAt: string;
  items: OrderItemData[];
  courierDispatch?: CourierDispatchData | null;
  processedBy?: { name: string; role: string } | null;
}

interface AdminOrderCardProps {
  order: AdminOrderData;
  onStatusUpdated?: () => void;
}

export default function AdminOrderCard({ order: initialOrder, onStatusUpdated }: AdminOrderCardProps) {
  const [order, setOrder] = useState<AdminOrderData>(initialOrder);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cleanPhone = order.customerPhone.replace(/^0/, '');
  const waUrl = `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম ${order.customerName}, আপনার অর্ডার নং ${order.invoiceNo} এর ডেলিভারি কনফার্মেশনের জন্য যোগাযোগ করছি।`
  )}`;

  // Handle Steadfast 1-Click Dispatch
  const handleSteadfastDispatch = async (action: 'DISPATCH' | 'RECONCILE' = 'DISPATCH') => {
    setIsDispatching(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/courier/steadfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Steadfast booking failed');
      }

      setFeedback(`কুরিয়ার বুকিং সফল! CID: ${data.result.consignmentId || 'Pending'}`);
      setOrder((prev) => ({
        ...prev,
        status: 'SHIPPED',
        courierDispatch: {
          dispatchStatus: data.result.dispatchStatus || 'BOOKED',
          consignmentId: data.result.consignmentId,
          trackingCode: data.result.trackingCode,
        },
      }));
      onStatusUpdated?.();
    } catch (err: unknown) {
      setFeedback(`ব্যর্থ: ${(err as Error)?.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Handle Order Status Change
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Status change failed');
      }

      setOrder((prev) => ({ ...prev, status: newStatus }));
      setFeedback(`স্ট্যাটাস পরিবর্তন হয়েছে: ${newStatus}`);
      onStatusUpdated?.();
    } catch (err: unknown) {
      setFeedback(`ব্যর্থ: ${(err as Error)?.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusBadge = ORDER_STATUS_LABELS[order.status] || {
    label: order.status,
    color: 'bg-slate-100 text-slate-700',
  };

  const dispatchBadge = order.courierDispatch?.dispatchStatus
    ? DISPATCH_STATUS_LABELS[order.courierDispatch.dispatchStatus]
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-base text-slate-900">{order.invoiceNo}</span>
          <span className="text-xs text-slate-400">
            • {new Date(order.createdAt).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
          {dispatchBadge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dispatchBadge.color}`}>
              {dispatchBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Customer & Address Details */}
      <div className="space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between">
          <div className="font-semibold text-slate-900 text-base">{order.customerName}</div>
          <a
            href={`tel:${order.customerPhone}`}
            className="font-mono font-bold text-green-700 hover:underline"
          >
            {order.customerPhone}
          </a>
        </div>
        <div className="text-slate-600 text-xs leading-relaxed">
          📍 {order.customerAddress} ({order.deliveryZone})
        </div>
      </div>

      {/* Item & Financial Row */}
      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
        <div className="font-medium text-slate-900">
          📦 আইটেম:{' '}
          {order.items.map((i) => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(', ')}
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
          <span>
            পেমেন্ট: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
          </span>
          <span className="font-bold text-sm text-slate-900">
            COD Collectible: <span className="text-green-700">৳{order.codCollectible.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Feedback notice */}
      {feedback && (
        <div className="text-xs p-2.5 rounded-lg bg-slate-100 text-slate-800 font-medium">
          ℹ {feedback}
        </div>
      )}

      {/* Operational Actions Grid (48px Touch Targets) */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href={`tel:${order.customerPhone}`}
          className="min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition"
        >
          <span>📞</span> কল করুন
        </a>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition"
        >
          <span>💬</span> হোয়াটসঅ্যাপ
        </a>

        {order.courierDispatch?.dispatchStatus === 'NEEDS_RECONCILIATION' ? (
          <button
            type="button"
            disabled={isDispatching}
            onClick={() => handleSteadfastDispatch('RECONCILE')}
            className="min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center gap-1 font-semibold text-xs transition"
          >
            ⚠️ চেক স্ট্যাটাস
          </button>
        ) : (
          <button
            type="button"
            disabled={isDispatching || order.status === 'SHIPPED' || order.status === 'DELIVERED'}
            onClick={() => handleSteadfastDispatch('DISPATCH')}
            className="min-h-[44px] bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center gap-1 font-semibold text-xs transition"
          >
            <span>🚚</span> {isDispatching ? 'বুকিং...' : 'Steadfast'}
          </button>
        )}
      </div>

      {/* Secondary Controls: Status Transition & Invoice Print */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">স্ট্যাটাস:</span>
          <select
            disabled={isUpdatingStatus}
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="PENDING">PENDING (নতুন)</option>
            <option value="CONFIRMED">CONFIRMED (কনফার্মড)</option>
            <option value="ON_HOLD">ON_HOLD (হোল্ড)</option>
            <option value="NO_ANSWER">NO_ANSWER (রিসিভ করেনি)</option>
            <option value="PACKED">PACKED (প্যাক করা)</option>
            <option value="SHIPPED">SHIPPED (কুরিয়ারে)</option>
            <option value="DELIVERED">DELIVERED (ডেলিভার্ড)</option>
            <option value="CANCELLED">CANCELLED (বাতিল)</option>
            <option value="RETURNED">RETURNED (রিটার্ন)</option>
          </select>
        </div>

        <Link
          href={`/admin/invoice/${order.id}`}
          target="_blank"
          className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 hover:underline"
        >
          <span>🖨️</span> ইনভয়েস প্রিন্ট
        </Link>
      </div>
    </div>
  );
}
