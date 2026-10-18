// src/services/state-machine.service.ts
// Strict state-machine rules for OrderStatus, PaymentStatus, and DispatchStatus

import { OrderStatus, PaymentStatus, DispatchStatus } from '@prisma/client';

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'ON_HOLD', 'NO_ANSWER', 'AWAITING_ADVANCE', 'CANCELLED'],
  ON_HOLD: ['CONFIRMED', 'NO_ANSWER', 'CANCELLED'],
  NO_ANSWER: ['CONFIRMED', 'ON_HOLD', 'CANCELLED'],
  AWAITING_ADVANCE: ['CONFIRMED', 'ON_HOLD', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'ON_HOLD', 'CANCELLED'],
  PACKED: ['SHIPPED', 'ON_HOLD', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'PARTIAL_DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  PARTIAL_DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  UNPAID: ['ADVANCE_PENDING_VERIFICATION', 'PAID', 'PARTIALLY_PAID', 'FAILED'],
  ADVANCE_PENDING_VERIFICATION: ['PARTIALLY_PAID', 'PAID', 'FAILED'],
  PARTIALLY_PAID: ['PAID', 'REFUNDED'],
  PAID: ['REFUNDED'],
  REFUNDED: [],
  FAILED: ['ADVANCE_PENDING_VERIFICATION', 'UNPAID'],
};

export const ALLOWED_DISPATCH_TRANSITIONS: Record<DispatchStatus, DispatchStatus[]> = {
  NOT_SENT: ['DISPATCHING'],
  DISPATCHING: ['BOOKED', 'FAILED', 'NEEDS_RECONCILIATION'],
  BOOKED: ['IN_TRANSIT', 'DELIVERED', 'RETURNED', 'FAILED'],
  IN_TRANSIT: ['DELIVERED', 'RETURNED'],
  DELIVERED: [],
  RETURNED: [],
  FAILED: ['DISPATCHING'],
  NEEDS_RECONCILIATION: ['BOOKED', 'FAILED', 'NOT_SENT', 'DISPATCHING'],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_PAYMENT_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function canTransitionDispatchStatus(from: DispatchStatus, to: DispatchStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_DISPATCH_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
