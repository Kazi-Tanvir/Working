// src/app/api/orders/incomplete/route.ts
// Public Incomplete Order Lead Capture (Rate-limited, session-scoped)

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { upsertIncompleteLead } from '@/services/lead.service';
import { normalizeBdPhone, isValidBdPhone } from '@/lib/bd-phone';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendMetaCapiEvent } from '@/services/meta-capi.service';
import { DeliveryZone } from '@prisma/client';

const leadSchema = z.object({
  sessionKey: z.string().min(8),
  customerPhone: z.string().min(11),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  deliveryZone: z.enum(['INSIDE_DHAKA', 'SUB_DHAKA', 'OUTSIDE_DHAKA']).optional(),
  productSlug: z.string().optional(),
  variantLabel: z.string().optional(),
  quantity: z.number().int().optional(),
  estimatedTotal: z.number().int().optional(),
  website_hp: z.string().optional(), // Honeypot
  fbp: z.string().optional(),
  fbc: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    // 1. IP Rate Limiting Guard (Max 12 lead submissions per minute per IP)
    const rateLimit = await checkRateLimit(`lead:ip:${ip}`, 12, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();

    // 2. Honeypot check
    if (body.website_hp) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // 3. Schema parse
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const data = parsed.data;
    const normalizedPhone = normalizeBdPhone(data.customerPhone);

    if (!isValidBdPhone(normalizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    // 4. Upsert session-scoped lead
    const lead = await upsertIncompleteLead({
      sessionKey: data.sessionKey,
      customerPhone: normalizedPhone,
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      deliveryZone: data.deliveryZone as DeliveryZone,
      productSlug: data.productSlug,
      variantLabel: data.variantLabel,
      quantity: data.quantity,
      estimatedTotal: data.estimatedTotal,
    });

    // 5. Fire async Meta CAPI Lead event in background
    after(async () => {
      try {
        await sendMetaCapiEvent({
          eventName: 'Lead',
          eventId: `lead_${data.sessionKey}`,
          sourceUrl: req.nextUrl.toString(),
          user: {
            phone: normalizedPhone,
            clientIpAddress: ip,
            clientUserAgent: userAgent,
            fbp: data.fbp,
            fbc: data.fbc,
          },
          customData: {
            content_name: data.productSlug,
            value: data.estimatedTotal,
            currency: 'BDT',
          },
        });
      } catch (e) {
        console.error('CAPI Lead error:', e);
      }
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 200 });
  } catch (err: unknown) {
    console.error('Incomplete lead capture error:', err);
    return NextResponse.json({ error: 'Lead capture failed' }, { status: 500 });
  }
}
