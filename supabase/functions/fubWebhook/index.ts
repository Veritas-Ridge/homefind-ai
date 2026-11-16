import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { fubSystemKey } from '../_shared/fub.ts';

/**
 * fubWebhook
 *
 * Public endpoint Follow Up Boss POSTs webhook events to (deployed with
 * verify_jwt off: FUB can't send a Supabase JWT). Authenticity comes from the
 * FUB-Signature header: hex HMAC-SHA256 of base64(raw body), keyed with our
 * registered X-System-Key.
 *
 * Does as little as possible so FUB always gets its 2xx inside 10 seconds:
 * verify, store in public.fub_webhook_events, return. processFubWebhooks (cron,
 * every minute) does the actual GETs and database updates.
 *
 *   200  stored (or already stored: FUB retries are deduped on eventId)
 *   401  bad or missing signature
 *   500  couldn't store it, so FUB will retry
 */

const encoder = new TextEncoder();

// Standard base64 of the body's UTF-8 bytes (what PHP's base64_encode gives
// FUB on their side). Chunked so large payloads don't overflow the stack.
function base64Utf8(text: string) {
  const bytes = encoder.encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function fubSignature(systemKey: string, rawBody: string) {
  return await hmacHex(systemKey, base64Utf8(rawBody));
}

async function hmacHex(key: string, message: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

serve(async (req) => {
  if (req.method !== 'POST') return text('method not allowed', 405);

  const systemKey = fubSystemKey();
  if (!systemKey) {
    // Can't verify anything without the key. 500 so FUB keeps retrying until
    // the secret is configured instead of us dropping events.
    console.error('[fubWebhook] FUB_SYSTEM_KEY not set; cannot verify signatures');
    return text('not configured', 500);
  }

  const raw = await req.text();
  const signature = (req.headers.get('FUB-Signature') ?? '').trim().toLowerCase();
  const expected = await fubSignature(systemKey, raw);
  if (!signature || !timingSafeEqual(signature, expected)) {
    console.warn('[fubWebhook] signature mismatch');
    return text('invalid signature', 401);
  }

  let evt: Record<string, any>;
  try {
    evt = JSON.parse(raw);
  } catch {
    return text('invalid json', 400);
  }
  if (!evt?.eventId || !evt?.event) return text('missing eventId/event', 400);

  const resourceIds = Array.isArray(evt.resourceIds)
    ? evt.resourceIds.map(Number).filter((n: number) => Number.isFinite(n))
    : [];

  const { error } = await supabaseAdmin.from('fub_webhook_events').upsert({
    event_id: String(evt.eventId),
    event: String(evt.event),
    resource_ids: resourceIds,
    uri: typeof evt.uri === 'string' ? evt.uri : null,
    data: evt.data ?? null,
    event_created: evt.eventCreated ?? null,
  }, { onConflict: 'event_id', ignoreDuplicates: true });

  if (error) {
    console.error('[fubWebhook] store failed:', error.message);
    return text('store failed', 500);
  }
  return text('ok', 200);
});
