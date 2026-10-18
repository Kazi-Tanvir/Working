// src/app/api/courier/steadfast/route.ts
// Staff: 1-Click Idempotent Steadfast Courier Booking and Reconciliation

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffRole } from '@/lib/auth-guard';
import { courierService } from '@/services/courier.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const dispatchSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(['DISPATCH', 'RECONCILE']).default('DISPATCH'),
});

export async function POST(req: NextRequest) {
  try {
    await requireStaffRole(['ADMIN', 'MODERATOR']);
    const body = await req.json();

    const parsed = dispatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid dispatch parameters' }, { status: 400 });
    }

    const { orderId, action } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { courierDispatch: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'RECONCILE') {
      const reconcileResult = await courierService.checkStatusByInvoice(order.invoiceNo);
      return NextResponse.json({ success: true, result: reconcileResult });
    }

    // Default action: DISPATCH
    const bookingResult = await courierService.createParcel(order.id);
    return NextResponse.json({ success: true, result: bookingResult });
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Dispatch failed';
    if (message.includes('401') || message.includes('403')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
