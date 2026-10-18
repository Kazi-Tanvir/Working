// src/app/api/orders/[id]/verify-payment/route.ts
// Staff: Verify manual bKash/Nagad TrxID advance payment

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffRole } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifySchema = z.object({
  transactionId: z.string().min(1),
  status: z.enum(['PAID', 'PARTIALLY_PAID', 'FAILED']),
  verifiedAmount: z.number().int().min(1).optional(),
  rejectionNote: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staffUser = await requireStaffRole(['ADMIN', 'MODERATOR']);
    const { id } = await params;
    const body = await req.json();

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid verification input' }, { status: 400 });
    }

    const { transactionId, status, verifiedAmount, rejectionNote } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const paymentTx = order.payments.find((p) => p.id === transactionId);
    if (!paymentTx) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Payment Transaction
      const updatedTx = await tx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status,
          amount: verifiedAmount ?? paymentTx.amount,
          verifiedById: staffUser.id,
          verifiedAt: new Date(),
          rejectionNote: rejectionNote ?? null,
        },
      });

      // 2. If approved, deduct advance from COD collectible
      if (status === 'PAID' || status === 'PARTIALLY_PAID') {
        const approvedAmount = verifiedAmount ?? paymentTx.amount;
        const newAdvancePaid = order.advancePaid + approvedAmount;
        const newCodCollectible = Math.max(0, order.totalAmount - newAdvancePaid);

        await tx.order.update({
          where: { id: order.id },
          data: {
            advancePaid: newAdvancePaid,
            codCollectible: newCodCollectible,
            paymentStatus: newCodCollectible === 0 ? 'PAID' : 'PARTIALLY_PAID',
            status: order.status === 'AWAITING_ADVANCE' ? 'CONFIRMED' : order.status,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            actorId: staffUser.id,
            fromStatus: order.status,
            toStatus: order.status === 'AWAITING_ADVANCE' ? 'CONFIRMED' : order.status,
            action: 'VERIFY_BKASH_ADVANCE',
            note: `bKash TrxID ${paymentTx.trxId} verified by ${staffUser.name}. Advance: ৳${approvedAmount}`,
          },
        });
      } else {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            actorId: staffUser.id,
            fromStatus: order.status,
            toStatus: order.status,
            action: 'REJECT_BKASH_ADVANCE',
            note: `Payment rejected by ${staffUser.name}. Reason: ${rejectionNote || 'Not found'}`,
          },
        });
      }

      return updatedTx;
    });

    return NextResponse.json({ success: true, payment: result });
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Verification failed';
    if (message.includes('401') || message.includes('403')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
