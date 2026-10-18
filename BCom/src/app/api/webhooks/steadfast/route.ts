// src/app/api/webhooks/steadfast/route.ts
// Webhook: Steadfast Courier status sync & automatic single restock on RETURNED

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.STEADFAST_WEBHOOK_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }

    const payload = await req.json();
    const invoiceNo = payload.invoice;
    const status = payload.status; // Steadfast delivery status string

    if (!invoiceNo) {
      return NextResponse.json({ error: 'Missing invoice number' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNo },
      include: {
        items: true,
        courierDispatch: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (status === 'delivered') {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'DELIVERED' },
        });

        await tx.courierDispatch.update({
          where: { orderId: order.id },
          data: {
            dispatchStatus: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'DELIVERED',
            action: 'STEADFAST_WEBHOOK_DELIVERED',
            note: 'Delivered confirmed by Steadfast webhook',
          },
        });
      } else if (status === 'cancelled' || status === 'returned') {
        let restockPerformed = false;
        if (!order.isStockRestocked) {
          restockPerformed = true;
          for (const item of order.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'RETURNED',
            isStockRestocked: restockPerformed ? true : order.isStockRestocked,
            returnReason: payload.reason || 'Returned by customer (Steadfast webhook)',
          },
        });

        await tx.courierDispatch.update({
          where: { orderId: order.id },
          data: {
            dispatchStatus: 'RETURNED',
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'RETURNED',
            action: 'STEADFAST_WEBHOOK_RETURNED',
            note: `Parcel returned. Restocked: ${restockPerformed ? 'Yes' : 'Already restocked'}`,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Steadfast webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
