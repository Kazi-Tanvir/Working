// src/app/api/orders/route.ts
// Public Checkout Mutation Endpoint (Rate-limited, server-authoritative, idempotent)

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { createAuthoritativeOrder } from '@/services/order.service';
import { normalizeBdPhone, isValidBdPhone } from '@/lib/bd-phone';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendMetaCapiEvent } from '@/services/meta-capi.service';
import { DeliveryZone, PaymentMethod } from '@prisma/client';

const orderSchema = z.object({
  idempotencyKey: z.string().min(8),
  sessionKey: z.string().optional(),
  customerName: z.string().min(2, 'নাম ন্যূনতম ২ অক্ষরের হতে হবে'),
  customerPhone: z.string().min(11, '১১ ডিজিটের সঠিক মোবাইল নাম্বার দিন'),
  customerAddress: z.string().min(6, 'সম্পূর্ণ ঠিকানা লিখুন'),
  deliveryZone: z.enum(['INSIDE_DHAKA', 'SUB_DHAKA', 'OUTSIDE_DHAKA']),
  paymentMethod: z.enum(['COD', 'BKASH_MANUAL', 'NAGAD_MANUAL']).default('COD'),
  bkashSenderPhone: z.string().optional(),
  bkashTrxId: z.string().optional(),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
  // Honeypot field (must be empty for genuine human shoppers)
  website_hp: z.string().optional(),
  // Attribution cookies
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    // 1. IP Rate Limiting Guard (Max 6 order submissions per minute per IP)
    const rateLimit = await checkRateLimit(`order:ip:${ip}`, 6, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত অনুরোধ করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Honeypot check (Bot protection)
    if (body.website_hp) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // 3. Schema Validation
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'তথ্য সঠিকভাবে পূরণ করুন' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 4. Phone Normalization & Validation
    const normalizedPhone = normalizeBdPhone(data.customerPhone);
    if (!isValidBdPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)' },
        { status: 400 }
      );
    }

    // 5. Create Server-Authoritative Order
    const { order, deduplicated } = await createAuthoritativeOrder({
      idempotencyKey: data.idempotencyKey,
      sessionKey: data.sessionKey,
      customerName: data.customerName,
      customerPhone: normalizedPhone,
      customerAddress: data.customerAddress,
      deliveryZone: data.deliveryZone as DeliveryZone,
      paymentMethod: data.paymentMethod as PaymentMethod,
      bkashSenderPhone: data.bkashSenderPhone ? normalizeBdPhone(data.bkashSenderPhone) : undefined,
      bkashTrxId: data.bkashTrxId,
      variantId: data.variantId,
      quantity: data.quantity,
      ipAddress: ip,
      userAgent,
      fbp: data.fbp,
      fbc: data.fbc,
      utmSource: data.utmSource,
      utmCampaign: data.utmCampaign,
    });

    // 6. Non-blocking Meta CAPI background event
    after(async () => {
      try {
        await sendMetaCapiEvent({
          eventName: 'Purchase',
          eventId: order.idempotencyKey,
          sourceUrl: req.nextUrl.toString(),
          user: {
            phone: order.customerPhone,
            clientIpAddress: ip,
            clientUserAgent: userAgent,
            fbp: data.fbp,
            fbc: data.fbc,
          },
          customData: {
            value: order.totalAmount,
            currency: 'BDT',
            order_id: order.invoiceNo,
          },
        });
      } catch (e) {
        console.error('CAPI background error:', e);
      }
    });

    return NextResponse.json(
      {
        success: true,
        publicToken: order.publicToken,
        invoiceNo: order.invoiceNo,
        deduplicated,
      },
      { status: deduplicated ? 200 : 201 }
    );
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি';

    if (message === 'OUT_OF_STOCK') {
      return NextResponse.json(
        { error: 'দুঃখিত! এই সাইজের স্টক শেষ হয়ে গেছে।' },
        { status: 409 }
      );
    }

    if (message === 'COOLDOWN_ACTIVE_USE_WHATSAPP') {
      return NextResponse.json(
        { error: 'আপনার নাম্বার থেকে ইতিমধ্যে একটি অর্ডার করা হয়েছে। পরিবর্তনের জন্য হোয়াটসঅ্যাপে জানান।' },
        { status: 429 }
      );
    }

    if (message === 'ORDER_BLOCKED_CONTACT_SUPPORT') {
      return NextResponse.json(
        { error: 'আপনার অর্ডারটি প্রসেস করা যাচ্ছে না। অনুগ্রহ করে হেল্পলাইনে যোগাযোগ করুন।' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
