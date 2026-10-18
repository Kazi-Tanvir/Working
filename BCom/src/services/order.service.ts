// src/services/order.service.ts
// Server-Authoritative Order Creation Engine

import { prisma } from '@/lib/prisma';
import { DeliveryZone, PaymentMethod } from '@prisma/client';

export interface CreateOrderInput {
  idempotencyKey: string;
  sessionKey?: string;
  customerName: string;
  customerPhone: string; // Already normalized to 01XXXXXXXXX
  customerAddress: string;
  deliveryZone: DeliveryZone;
  paymentMethod: PaymentMethod;
  bkashSenderPhone?: string;
  bkashTrxId?: string;
  variantId: string;
  quantity: number;
  ipAddress?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  utmSource?: string;
  utmCampaign?: string;
}

export async function createAuthoritativeOrder(input: CreateOrderInput) {
  // 1. Idempotency Check: Return existing order on network retry / double-tap
  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: {
      items: true,
      payments: true,
    },
  });

  if (existingOrder) {
    return { order: existingOrder, deduplicated: true };
  }

  // 2. Hard Blacklist Check (Phone only — never hard-block shared CGNAT IPs)
  const blocked = await prisma.blockedCustomer.findFirst({
    where: {
      phone: input.customerPhone,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (blocked) {
    throw new Error('ORDER_BLOCKED_CONTACT_SUPPORT');
  }

  // 3. Load StoreSettings & Authoritative ProductVariant
  const [settings, variant] = await Promise.all([
    prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    }),
    prisma.productVariant.findFirst({
      where: { id: input.variantId, isActive: true, deletedAt: null },
      include: { product: true },
    }),
  ]);

  if (!variant || !variant.product.isActive) {
    throw new Error('PRODUCT_VARIANT_UNAVAILABLE');
  }

  if (input.quantity < 1 || input.quantity > 20) {
    throw new Error('INVALID_QUANTITY');
  }

  // 4. Phone Cooldown Check (Safe query — no undefined inside OR)
  const cooldownCutoff = new Date(Date.now() - settings.orderCooldownMinutes * 60 * 1000);
  const recentOrder = await prisma.order.findFirst({
    where: {
      customerPhone: input.customerPhone,
      createdAt: { gte: cooldownCutoff },
      status: { notIn: ['CANCELLED', 'RETURNED'] },
    },
  });

  if (recentOrder) {
    throw new Error('COOLDOWN_ACTIVE_USE_WHATSAPP');
  }

  // 5. Compute IP Velocity Risk Score (Weak signal for Moderator review)
  let riskScore = 0;
  if (input.ipAddress) {
    const recentIpOrders = await prisma.order.count({
      where: {
        ipAddress: input.ipAddress,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentIpOrders >= 3) riskScore += 40;
  }

  // 6. Server-Authoritative Financial Calculation
  const deliveryCharge =
    input.deliveryZone === 'INSIDE_DHAKA'
      ? settings.insideDhakaCharge
      : input.deliveryZone === 'SUB_DHAKA'
      ? settings.subDhakaCharge
      : settings.outsideDhakaCharge;

  const subTotal = variant.salePrice * input.quantity;

  // Check bundle discount if product has bundleConfig
  let discountAmount = 0;
  if (variant.product.bundleConfig && Array.isArray(variant.product.bundleConfig)) {
    const matchedBundle = (variant.product.bundleConfig as Array<{ qty: number; discountBdt: number }>).find(
      (b) => b.qty === input.quantity
    );
    if (matchedBundle) {
      discountAmount = matchedBundle.discountBdt;
    }
  }

  const totalAmount = subTotal + deliveryCharge - discountAmount;
  // Note: Unverified manual bKash advance does NOT reduce codCollectible until staff verifies TrxID
  const advancePaid = 0;
  const codCollectible = totalAmount - advancePaid;

  // 7. Execute Atomic Transaction (Stock Check + Counter + Order + Lead Conversion)
  const order = await prisma.$transaction(async (tx) => {
    // 7a. Conditional Atomic Stock Decrement
    const stockUpdate = await tx.productVariant.updateMany({
      where: {
        id: variant.id,
        isActive: true,
        stock: { gte: input.quantity },
      },
      data: {
        stock: { decrement: input.quantity },
      },
    });

    if (stockUpdate.count === 0) {
      throw new Error('OUT_OF_STOCK');
    }

    // 7b. Atomic Sequential Invoice Number Generation
    const counter = await tx.invoiceCounter.upsert({
      where: { id: 'default' },
      update: { lastNumber: { increment: 1 } },
      create: { id: 'default', lastNumber: 1001 },
    });

    const invoiceNo = `INV-${counter.lastNumber}`;

    // 7c. Create Order + OrderItem + Status History
    const createdOrder = await tx.order.create({
      data: {
        invoiceNo,
        idempotencyKey: input.idempotencyKey,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress.trim(),
        deliveryZone: input.deliveryZone,
        deliveryCharge,
        subTotal,
        discountAmount,
        totalAmount,
        advancePaid,
        codCollectible,
        paymentMethod: input.paymentMethod,
        paymentStatus:
          input.paymentMethod !== 'COD' && input.bkashTrxId
            ? 'ADVANCE_PENDING_VERIFICATION'
            : 'UNPAID',
        status:
          input.paymentMethod !== 'COD' && input.bkashTrxId
            ? 'AWAITING_ADVANCE'
            : 'PENDING',
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        riskScore,
        fbp: input.fbp ?? null,
        fbc: input.fbc ?? null,
        utmSource: input.utmSource ?? null,
        utmCampaign: input.utmCampaign ?? null,
        items: {
          create: {
            productId: variant.productId,
            variantId: variant.id,
            productName: variant.product.name,
            variantLabel: variant.label,
            skuSnapshot: variant.sku,
            quantity: input.quantity,
            unitPrice: variant.salePrice,
            unitCost: variant.costPrice,
            totalPrice: subTotal,
          },
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus:
              input.paymentMethod !== 'COD' && input.bkashTrxId
                ? 'AWAITING_ADVANCE'
                : 'PENDING',
            action: 'CUSTOMER_CHECKOUT_SUBMIT',
            note: 'Order created via public funnel checkout',
          },
        },
      },
      include: {
        items: true,
      },
    });

    // 7d. Record Pending Manual bKash Transaction if submitted
    if (input.paymentMethod !== 'COD' && input.bkashTrxId) {
      await tx.paymentTransaction.create({
        data: {
          orderId: createdOrder.id,
          method: input.paymentMethod,
          amount: deliveryCharge,
          senderPhone: input.bkashSenderPhone ?? null,
          trxId: input.bkashTrxId.trim().toUpperCase(),
          status: 'ADVANCE_PENDING_VERIFICATION',
        },
      });
    }

    // 7e. Convert Open IncompleteOrder Leads for this Session or Phone
    await tx.incompleteOrder.updateMany({
      where: {
        status: 'OPEN',
        OR: [
          ...(input.sessionKey ? [{ sessionKey: input.sessionKey }] : []),
          { customerPhone: input.customerPhone },
        ],
      },
      data: {
        status: 'CONVERTED',
        convertedOrderId: createdOrder.id,
      },
    });

    return createdOrder;
  });

  return { order, deduplicated: false };
}
