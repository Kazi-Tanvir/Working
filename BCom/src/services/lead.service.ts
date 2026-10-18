// src/services/lead.service.ts
// Session-scoped IncompleteOrder Lead capture and lifecycle management

import { prisma } from '@/lib/prisma';
import { DeliveryZone } from '@prisma/client';

export interface UpsertIncompleteLeadInput {
  sessionKey: string;
  customerPhone: string;
  customerName?: string;
  customerAddress?: string;
  deliveryZone?: DeliveryZone;
  productSlug?: string;
  variantLabel?: string;
  quantity?: number;
  estimatedTotal?: number;
}

export async function upsertIncompleteLead(input: UpsertIncompleteLeadInput) {
  const existing = await prisma.incompleteOrder.findUnique({
    where: { sessionKey: input.sessionKey },
  });

  // Never reopen leads that have already been converted or dismissed
  if (existing) {
    if (existing.status !== 'OPEN') {
      return existing;
    }

    return await prisma.incompleteOrder.update({
      where: { sessionKey: input.sessionKey },
      data: {
        customerPhone: input.customerPhone,
        customerName: input.customerName || existing.customerName,
        customerAddress: input.customerAddress || existing.customerAddress,
        deliveryZone: input.deliveryZone || existing.deliveryZone,
        productSlug: input.productSlug || existing.productSlug,
        variantLabel: input.variantLabel || existing.variantLabel,
        quantity: input.quantity || existing.quantity,
        estimatedTotal: input.estimatedTotal || existing.estimatedTotal,
      },
    });
  }

  // Create new session-scoped lead with 30-day privacy expiration
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return await prisma.incompleteOrder.create({
    data: {
      sessionKey: input.sessionKey,
      customerPhone: input.customerPhone,
      customerName: input.customerName ?? null,
      customerAddress: input.customerAddress ?? null,
      deliveryZone: input.deliveryZone ?? null,
      productSlug: input.productSlug ?? null,
      variantLabel: input.variantLabel ?? null,
      quantity: input.quantity ?? 1,
      estimatedTotal: input.estimatedTotal ?? null,
      status: 'OPEN',
      expiresAt,
    },
  });
}

export async function dismissLead(leadId: string, staffUserId: string, note?: string) {
  return await prisma.incompleteOrder.update({
    where: { id: leadId },
    data: {
      status: 'DISMISSED',
      dismissedById: staffUserId,
      dismissedAt: new Date(),
      staffNote: note ?? undefined,
    },
  });
}
