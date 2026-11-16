import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse, getUser, isAdminProfile } from '../_shared/supabaseAdmin.ts';
import { processEvent, cleanAttribution, type FubEventRow } from '../_shared/fub.ts';
import { sendLeadNotification } from '../_shared/notify.ts';

/**
 * contactAgentForProperty
 *
 * "Schedule a Tour" / "Ask a Question" on a listing. Records the request in
 * the Follow Up Boss outbox (public.fub_events) and sends it right away as a
 * FUB "Property Inquiry" event. If FUB is down or rejects the call with a
 * retryable error, the row stays pending and the process-fub-events cron
 * retries it — the lead is never dropped on the floor.
 *
 * Body: { property: { id } | propertyId, intent: 'tour' | 'question', message?,
 *         preferred_date?, preferred_time?, attribution?,
 *         source?: 'ai_chat', contact?: { name, email, phone } }
 *
 * The response returns as soon as the lead is saved. Follow Up Boss delivery
 * and the email to the team run in the background (EdgeRuntime.waitUntil), so
 * the buyer never waits on a third party API. The old version awaited FUB
 * inline, which is what left the Schedule a Tour button spinning.
 * Signed-in callers are identified from the JWT only. Signed-out visitors (the
 * AI chat's tour card) must supply contact details and are limited per IP.
 */

const MAX_MESSAGE_LENGTH = 2000;
const ANON_LEADS_PER_IP_PER_DAY = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hashIp(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`crandell-lead:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 12)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanContact(raw: unknown) {
  const c = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = str(c.name, 100);
  const email = str(c.email, 200).toLowerCase();
  const phone = str(c.phone, 30).replace(/[^\d+()\-.\s]/g, '');
  if (!name || !EMAIL_RE.test(email)) return null;
  return { name, email, ...(phone ? { phone } : {}) };
}

// Runs work after the response is sent; falls back to awaiting it locally.
function background(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p);
  else return p;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    const body = await req.json().catch(() => ({}));
    const propertyId = body.propertyId || body.property?.id;
    const intent: 'tour' | 'question' = body.intent === 'tour' ? 'tour' : 'question';
    const message = str(body.message, MAX_MESSAGE_LENGTH);
    const preferredDate = str(body.preferred_date, 40) || null;
    const preferredTime = str(body.preferred_time, 40) || null;
    const source = body.source === 'ai_chat' ? 'ai_chat' : undefined;
    const attribution = cleanAttribution(body.attribution) ?? cleanAttribution(user?.attribution);
    const phone = str(body.phone, 30).replace(/[^\d+()\-.\s]/g, '') || null;

    let person: { name: string; email: string; phone?: string } | null = null;
    if (!user) {
      person = cleanContact(body.contact);
      if (!person) return jsonResponse({ error: 'Please enter your name and a valid email.' }, 400);
      const { data: withinLimit } = await supabaseAdmin.rpc('ai_usage_hit', {
        p_key: `lead:ip:${await hashIp(req)}`,
        p_limit: ANON_LEADS_PER_IP_PER_DAY,
      });
      if (withinLimit === false) {
        return jsonResponse({ error: "We've received several requests from you today. Please call (480) 544-1539." }, 429);
      }
    }

    if (!propertyId) return jsonResponse({ error: 'propertyId required' }, 400);

    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('id, address, city, price, mls_number')
      .eq('id', propertyId)
      .maybeSingle();
    if (!property) return jsonResponse({ error: 'Listing not found' }, 404);

    const { data: row, error: insertError } = await supabaseAdmin
      .from('fub_events')
      .insert({
        user_id: user?.id ?? null,
        event_type: 'Property Inquiry',
        property_id: propertyId,
        payload: {
          intent,
          message,
          ...(preferredDate ? { preferred_date: preferredDate } : {}),
          ...(preferredTime ? { preferred_time: preferredTime } : {}),
          ...(source ? { source } : {}),
          ...(person ? { person } : {}),
          ...(attribution ? { attribution } : {}),
        },
      })
      .select('id, user_id, event_type, property_id, payload, attempts')
      .single();

    if (insertError || !row) {
      console.error('[contactAgentForProperty] outbox insert failed:', insertError);
      return jsonResponse({ error: "We couldn't send your request. Please call (480) 544-1539." }, 500);
    }

    // Optional phone from the dialog: keep it on the profile so FUB gets it
    // with this event and every later one.
    if (user && phone && phone !== user.phone) {
      const { error: phoneError } = await supabaseAdmin.from('profiles').update({ phone }).eq('id', user.id);
      if (phoneError) console.error('[contactAgentForProperty] phone save failed:', phoneError);
    }

    const where = `${property.address}, ${property.city}`;
    const teamAccount = isAdminProfile(user);
    const name = user ? (user.full_name || user.email) : person!.name;
    const email = user?.email ?? person!.email;
    const now = new Date().toISOString();

    const { data: alertRow, error: alertError } = await supabaseAdmin.from('engagement_alerts').insert({
      user_id: user?.id ?? null,
      user_email: email,
      user_name: user ? name : `${name} (not signed in)`,
      status: 'new',
      alert_type: intent === 'tour' ? 'tour_request' : 'question',
      property_id: property.id,
      fub_event_id: row.id,
      drop_percentage: 0,
      last_activity_date: now,
      ai_summary: intent === 'tour'
        ? `Requested a tour of ${where}${preferredDate || preferredTime ? ` (prefers ${[preferredDate, preferredTime].filter(Boolean).join(', ')})` : ''}`
        : `Asked a question about ${where}${message ? `: "${message.slice(0, 280)}"` : ''}`,
      recommended_action: intent === 'tour' ? 'Confirm a showing time within 2 hours' : 'Reply within 24 hours',
    }).select('id').single();
    if (alertError) console.error('[contactAgentForProperty] engagement alert insert failed:', alertError);

    // Deliver after responding. FUB failures stay in the outbox for the
    // processFubEvents cron to retry; the email goes out regardless.
    const deliver = Promise.allSettled([
      processEvent(row as FubEventRow).then((r) => {
        if (r.status !== 'sent') console.warn('[contactAgentForProperty] FUB', r.status, r.error ?? '');
      }),
      sendLeadNotification({
        intent, name, email, phone: phone ?? user?.phone ?? person?.phone ?? null, message,
        preferredDate, preferredTime, property, attribution, teamAccount,
      }).then(async (r) => {
        if (!r.sent) console.error('[contactAgentForProperty] email not sent:', r.reason);
        if (alertRow?.id) {
          await supabaseAdmin.from('engagement_alerts')
            .update({ notified_at: r.sent ? new Date().toISOString() : null })
            .eq('id', alertRow.id);
        }
      }),
    ]);
    await background(deliver);

    return jsonResponse({ success: true, intent });
  } catch (err) {
    console.error('[contactAgentForProperty] error:', err);
    return jsonResponse({ error: "We couldn't send your request. Please call (480) 544-1539." }, 500);
  }
});
