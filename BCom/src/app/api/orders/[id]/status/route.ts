// src/app/api/orders/[id]/status/route.ts
// Staff: State-machine enforced status transitions with audit log and restock

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffRole } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { canTransitionOrderStatus } from '@/services/state-machine.service';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ON_HOLD',
    'NO_ANSWER',
    'AWAITING_ADVANCE',
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'PARTIAL_DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
  note: z.string().optional(),
  returnReason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staffUser = await requireStaffRole(['ADMIN', 'MODERATOR']);
    const { id } = await params;
    const body = await req.json();

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    const { status: targetStatus, note, returnReason } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!canTransitionOrderStatus(order.status, targetStatus as OrderStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${targetStatus}` },
        { status: 400 }
      );
    }

    // Execute status change, audit log, and optional atomic restock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Automatic restock when transitioning to CANCELLED or RETURNED
      let restockNeeded = false;
      if (
        (targetStatus === 'CANCELLED' || targetStatus === 'RETURNED') &&
        !order.isStockRestocked
      ) {
        restockNeeded = true;
      }

      if (restockNeeded) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus as OrderStatus,
          returnReason: returnReason ?? order.returnReason,
          isStockRestocked: restockNeeded ? true : order.isStockRestocked,
          processedById: staffUser.id,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          actorId: staffUser.id,
          fromStatus: order.status,
          toStatus: targetStatus as OrderStatus,
          action: `STATUS_CHANGE_TO_${targetStatus}`,
          note: note || `Status changed by ${staffUser.name} (${staffUser.role})`,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Transition failed';
    if (message.includes('401') || message.includes('403')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
