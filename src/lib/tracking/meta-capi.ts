/**
 * Meta Conversions API (CAPI) — server-side event sender.
 *
 * Required env vars:
 *   NEXT_PUBLIC_META_PIXEL_ID  — Pixel ID (non-sensitive, also used client-side)
 *   META_CAPI_TOKEN            — System user access token (server-side ONLY, never NEXT_PUBLIC_)
 */

import { createHash } from 'crypto';
import { logger } from '@/lib/logger';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;

function sha256hex(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export interface MetaCapiEventPayload {
  eventName: 'Lead' | 'CompleteRegistration' | 'Purchase' | 'ViewContent' | 'InitiateCheckout';
  email?: string;
  clientIp?: string;
  userAgent?: string;
  sourceUrl?: string;
  /** _fbc cookie value (Facebook click ID) */
  fbc?: string;
  /** _fbp cookie value (Facebook browser pixel ID) */
  fbp?: string;
  /** Purchase value in currency units (e.g. 99 for 99 TND) */
  value?: number;
  /** ISO 4217 currency code — default TND */
  currency?: string;
  contentName?: string;
  /** Deduplication ID — must match the client-side eventID if pixel also fires */
  eventId?: string;
}

export async function sendMetaCapiEvent(payload: MetaCapiEventPayload): Promise<void> {
  if (!PIXEL_ID || !CAPI_TOKEN) {
    // Silently skip if not configured — tracking is non-blocking
    return;
  }

  const userData: Record<string, unknown> = {};
  if (payload.email) userData['em'] = [sha256hex(payload.email)];
  if (payload.clientIp) userData['client_ip_address'] = payload.clientIp;
  if (payload.userAgent) userData['client_user_agent'] = payload.userAgent;
  if (payload.fbc) userData['fbc'] = payload.fbc;
  if (payload.fbp) userData['fbp'] = payload.fbp;

  const customData: Record<string, unknown> = {};
  if (payload.value !== undefined) customData['value'] = payload.value;
  if (payload.currency ?? 'TND') customData['currency'] = payload.currency ?? 'TND';
  if (payload.contentName) customData['content_name'] = payload.contentName;

  const eventId = payload.eventId ?? `${payload.eventName}-${Date.now()}`;

  const body = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: payload.sourceUrl ?? 'https://eaf.nexusreussite.academy',
        action_source: 'website',
        event_id: eventId,
        user_data: userData,
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      logger.warn({ eventName: payload.eventName, status: res.status, text }, 'meta.capi.api_error');
    }
  } catch (err) {
    // CAPI is non-blocking — never let it crash the main request
    logger.warn({ err, eventName: payload.eventName }, 'meta.capi.fetch_failed');
  }
}
