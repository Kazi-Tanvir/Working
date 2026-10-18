// src/services/meta-capi.service.ts
// Meta Conversions API (CAPI) service with SHA-256 hashing for Bangladeshi phone and user data

import crypto from 'crypto';

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

/**
 * Normalizes phone to international format 8801XXXXXXXXX before SHA-256 hashing
 */
function hashPhone(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }
  return sha256(cleaned);
}

export interface MetaCapiEventPayload {
  eventName: 'ViewContent' | 'InitiateCheckout' | 'Lead' | 'Purchase';
  eventId: string; // Deduplication UUID matching client-side pixel eventId
  eventTime?: number;
  sourceUrl?: string;
  user: {
    phone?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_ids?: string[];
    order_id?: string;
  };
}

export async function sendMetaCapiEvent(payload: MetaCapiEventPayload): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  // Skip silently if credentials are not configured
  if (!pixelId || !accessToken || accessToken === 'EAAB_your_capi_token') {
    return true;
  }

  const userData: Record<string, unknown> = {};

  if (payload.user.phone) {
    userData.ph = [hashPhone(payload.user.phone)];
  }
  if (payload.user.clientIpAddress) {
    userData.client_ip_address = payload.user.clientIpAddress;
  }
  if (payload.user.clientUserAgent) {
    userData.client_user_agent = payload.user.clientUserAgent;
  }
  if (payload.user.fbp) {
    userData.fbp = payload.user.fbp;
  }
  if (payload.user.fbc) {
    userData.fbc = payload.user.fbc;
  }

  const body = {
    data: [
      {
        event_name: payload.eventName,
        event_time: payload.eventTime || Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        event_source_url: payload.sourceUrl || undefined,
        action_source: 'website',
        user_data: userData,
        custom_data: payload.customData || undefined,
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (err) {
    console.error('Meta CAPI error:', err);
    return false;
  }
}
