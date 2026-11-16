// ============================================================================
// Follow Up Boss client
// ----------------------------------------------------------------------------
// Every FUB call in the app goes through fubFetch here, so auth, the
// registered-system headers, rate limits and retries are handled once.
//
// Lead activity is sent as POST /v1/events (the only endpoint FUB runs lead
// routing, dedupe and action plans on). Rows come from public.fub_events (the
// outbox); see the fub_event_pipeline migration for how they get there.
//
// Env:
//   FOLLOW_UP_BOSS_API_KEY  owner/admin API key (Basic auth username)
//   FUB_SYSTEM              registered system name (X-System)
//   FUB_SYSTEM_KEY          registered system key (X-System-Key); also the
//                           secret FUB signs webhooks with
// Register a system at https://apps.followupboss.com/system-registration.
// ============================================================================
import { supabaseAdmin } from './supabaseAdmin.ts';

export const FUB_BASE = 'https://api.followupboss.com/v1';
const SOURCE = 'HomeFind AI';
const SITE_URL = 'https://search.crandellrealestate.com';
const BASE_TAGS = ['HomeFind AI'];

// Backoff for retryable outbox failures (429, 5xx, network). After the last
// step the event is marked failed so a bad key can't loop forever.
const RETRY_DELAYS_MIN = [1, 5, 15, 60, 240];

// Fields we read for the contact mirror (GET /people omits most by default).
export const PERSON_FIELDS = [
  'id', 'firstName', 'lastName', 'emails', 'phones', 'stage', 'stageId', 'tags', 'contacted',
  'assignedUserId', 'assignedTo', 'assignedLenderId', 'assignedLenderName', 'updated', 'created',
].join(',');

// ----------------------------------------------------------------------------
// HTTP
// ----------------------------------------------------------------------------

export function fubSystemName() {
  return Deno.env.get('FUB_SYSTEM') || 'HomeFind-AI';
}

export function fubSystemKey() {
  return Deno.env.get('FUB_SYSTEM_KEY') || '';
}

let warnedNoSystemKey = false;

export function fubHeaders(apiKey = Deno.env.get('FOLLOW_UP_BOSS_API_KEY') ?? '') {
  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(apiKey + ':')}`,
    'Content-Type': 'application/json',
    'X-System': fubSystemName(),
  };
  const key = fubSystemKey();
  if (key) headers['X-System-Key'] = key;
  else if (!warnedNoSystemKey) {
    warnedNoSystemKey = true;
    console.warn('[fub] FUB_SYSTEM_KEY is not set: half rate limits, and webhooks/text logging/automations are unavailable');
  }
  return headers;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The notes context allows 10 requests per 10s. Space note writes from this
// isolate so bulk jobs (daily summary, saved search alerts) stay under it.
const NOTE_SPACING_MS = 1100;
let lastNoteAt = 0;

export interface FubFetchOptions {
  apiKey?: string;
  // Retries for 429 and 5xx (network errors included). 0 = single attempt.
  retries?: number;
  // Longest we'll honor a Retry-After before giving up and returning the 429.
  maxWaitMs?: number;
}

// fetch() against the FUB API. `path` is relative to /v1 or a full FUB URL
// (webhook payloads hand us full URIs). Honors Retry-After on 429 and backs
// off on 5xx. Returns the final Response; throws only if every attempt was a
// network error.
export async function fubFetch(path: string, init: RequestInit = {}, opts: FubFetchOptions = {}): Promise<Response> {
  const apiKey = opts.apiKey ?? Deno.env.get('FOLLOW_UP_BOSS_API_KEY');
  if (!apiKey) throw new Error('FOLLOW_UP_BOSS_API_KEY not set');
  const url = path.startsWith('http') ? path : `${FUB_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!url.startsWith(FUB_BASE)) throw new Error(`refusing non-FUB url: ${url}`);

  const retries = opts.retries ?? 3;
  const maxWaitMs = opts.maxWaitMs ?? 30_000;
  const isNote = new URL(url).pathname.startsWith('/v1/notes');
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (isNote) {
      const wait = lastNoteAt + NOTE_SPACING_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastNoteAt = Date.now();
    }

    let res: Response;
    try {
      res = await fetch(url, { ...init, headers: { ...fubHeaders(apiKey), ...(init.headers ?? {}) } });
    } catch (err) {
      lastErr = err;
      if (attempt < retries) { await sleep(backoffMs(attempt)); continue; }
      throw err;
    }

    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get('Retry-After'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt);
      if (waitMs > maxWaitMs) return res;
      await res.body?.cancel();
      console.warn(`[fub] 429 on ${new URL(url).pathname} (${res.headers.get('X-RateLimit-Context') ?? '?'}), waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }
    if (res.status >= 500 && attempt < retries) {
      await res.body?.cancel();
      await sleep(backoffMs(attempt));
      continue;
    }
    return res;
  }
  throw lastErr ?? new Error('fubFetch: retries exhausted');
}

// Truncated exponential backoff with jitter, as FUB's error docs recommend.
function backoffMs(attempt: number) {
  return Math.min(2 ** attempt * 1000 + Math.random() * 1000, 16_000);
}

// fubFetch + JSON body; returns { ok, status, data, error }.
export async function fubJson<T = any>(path: string, init: RequestInit = {}, opts: FubFetchOptions = {}) {
  const res = await fubFetch(path, init, opts);
  const text = await res.text();
  let data: T | null = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
  const error = res.ok ? undefined : ((data as any)?.errorMessage ?? text.slice(0, 500)) || res.statusText;
  return { ok: res.ok, status: res.status, data, error };
}

// ----------------------------------------------------------------------------
// Mirror: FUB person → public.fub_contacts (+ profiles.fub_contact_id)
// ----------------------------------------------------------------------------

function personEmails(person: Record<string, any>): string[] {
  return (person.emails ?? [])
    .map((e: any) => (typeof e === 'string' ? e : e?.value))
    .filter((e: unknown): e is string => typeof e === 'string' && e.includes('@'))
    .map((e: string) => e.trim().toLowerCase());
}

// Record a FUB person against the matching app user, if there is one. Matches
// on the stored fub_contact_id first, then on email. Team accounts are never
// linked. Returns the profile id it wrote, or null if the person isn't one of
// our users.
export async function mirrorFubPerson(person: Record<string, any>): Promise<string | null> {
  if (person?.id == null) return null;
  const fubId = String(person.id);

  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, fub_contact_id, role, is_user_admin')
    .eq('fub_contact_id', fubId)
    .maybeSingle();

  if (!profile) {
    const emails = personEmails(person);
    if (emails.length === 0) return null;
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, fub_contact_id, role, is_user_admin')
      .in('email', emails)
      .limit(1);
    profile = data?.[0] ?? null;
    // Already linked to a different FUB person (e.g. a duplicate contact in
    // FUB): keep the existing link rather than flip-flopping between them.
    if (profile?.fub_contact_id && profile.fub_contact_id !== fubId) return null;
  }

  if (!profile || profile.role === 'admin' || profile.is_user_admin) return null;

  if (profile.fub_contact_id !== fubId) {
    await supabaseAdmin.from('profiles').update({ fub_contact_id: fubId }).eq('id', profile.id);
  }

  const num = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  const { error } = await supabaseAdmin.from('fub_contacts').upsert({
    profile_id: profile.id,
    fub_person_id: Number(fubId),
    stage: person.stage ?? null,
    stage_id: num(person.stageId),
    assigned_user_id: num(person.assignedUserId) || null,
    assigned_to: person.assignedTo || null,
    assigned_lender_id: num(person.assignedLenderId) || null,
    assigned_lender_name: person.assignedLenderName || null,
    tags: Array.isArray(person.tags) ? person.tags : [],
    contacted: person.contacted == null ? null : Boolean(Number(person.contacted)),
    fub_updated_at: person.updated ?? null,
    synced_at: new Date().toISOString(),
  });
  if (error) console.error('[fub] fub_contacts upsert failed:', error.message);

  if (num(person.assignedUserId)) await ensureFubUser(Number(person.assignedUserId));
  if (num(person.assignedLenderId)) await ensureFubUser(Number(person.assignedLenderId));
  return profile.id;
}

// Unlink every app user mirrored from these FUB people (peopleDeleted).
export async function unlinkFubPeople(ids: Array<number | string>) {
  const strIds = ids.map(String);
  await supabaseAdmin.from('fub_contacts').delete().in('fub_person_id', ids.map(Number));
  await supabaseAdmin.from('profiles').update({ fub_contact_id: null }).in('fub_contact_id', strIds);
}

// Make sure an agent/lender is in public.fub_users (refreshes the whole list
// when an unknown id shows up, which is also how new agents get picked up).
const knownUsers = new Set<number>();
export async function ensureFubUser(userId: number) {
  if (knownUsers.has(userId)) return;
  const { data } = await supabaseAdmin.from('fub_users').select('id').eq('id', userId).maybeSingle();
  if (data) { knownUsers.add(userId); return; }
  await refreshFubUsers();
}

export async function refreshFubUsers(): Promise<number> {
  const rows: Record<string, unknown>[] = [];
  let next: string | null = `/users?limit=100&fields=id,name,firstName,lastName,email,phone,role,status`;
  while (next) {
    const { ok, data, error }: { ok: boolean; data: any; error?: string } = await fubJson(next);
    if (!ok) { console.error('[fub] GET /users failed:', error); break; }
    for (const u of data?.users ?? []) {
      rows.push({
        id: u.id, name: u.name ?? null, first_name: u.firstName ?? null, last_name: u.lastName ?? null,
        email: u.email ?? null, phone: u.phone ?? null, role: u.role ?? null, status: u.status ?? null,
        synced_at: new Date().toISOString(),
      });
    }
    next = data?._metadata?.nextLink ?? null;
  }
  if (rows.length) {
    const { error } = await supabaseAdmin.from('fub_users').upsert(rows);
    if (error) console.error('[fub] fub_users upsert failed:', error.message);
    rows.forEach((r) => knownUsers.add(Number(r.id)));
  }
  return rows.length;
}

// ----------------------------------------------------------------------------
// Outbox → POST /v1/events
// ----------------------------------------------------------------------------

export interface FubEventRow {
  id: number;
  // null for leads from signed-out visitors (contact in payload.person)
  user_id: string | null;
  event_type: string;
  property_id: string | null;
  payload: Record<string, unknown>;
  attempts: number;
}

export interface SendResult {
  status: 'sent' | 'retry' | 'failed' | 'skipped';
  fubStatus?: number;
  personId?: string | null;
  error?: string;
}

function splitName(fullName: string | null | undefined, email: string) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: email.split('@')[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function propertyBlock(p: Record<string, any>) {
  return {
    street: p.address,
    city: p.city,
    state: p.state,
    code: p.zip_code,
    mlsNumber: p.mls_number,
    price: p.price,
    forRent: false,
    url: `${SITE_URL}/PropertyDetail?id=${p.id}`,
    type: p.property_type ? String(p.property_type).replace(/_/g, ' ') : undefined,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.square_feet,
  };
}

// First touch attribution captured by the browser (src/lib/attribution.js).
// Only known keys survive, each trimmed, so nothing arbitrary reaches FUB.
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'referrer', 'landing_page', 'captured_at'] as const;

export function cleanAttribution(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Record<string, string> = {};
  for (const k of ATTR_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 500);
  }
  return Object.keys(out).length ? out : null;
}

// Fills the FUB `campaign` block (FUB's Source / Campaign reporting). Per the
// FUB docs `campaign.source` is required, so we derive one from click ids or
// the referrer when there's no utm_source, and skip direct traffic. The
// landing page goes in the event description (events have no sourceUrl;
// person.sourceUrl is for a lead provider's own record link).
function applyAttribution(body: Record<string, any>, attr: Record<string, string> | null) {
  if (!attr) return;
  let refHost = '';
  try { refHost = attr.referrer ? new URL(attr.referrer).hostname.replace(/^www\./, '') : ''; } catch { /* ignore */ }
  const source = attr.utm_source || (attr.gclid ? 'google' : attr.fbclid ? 'facebook' : refHost);
  if (source) {
    const medium = attr.utm_medium || (attr.gclid || attr.fbclid ? 'cpc' : attr.utm_source ? '' : 'referral');
    body.campaign = {
      source,
      ...(medium ? { medium } : {}),
      ...(attr.utm_campaign ? { campaign: attr.utm_campaign } : {}),
      ...(attr.utm_term ? { term: attr.utm_term } : {}),
      ...(attr.utm_content ? { content: attr.utm_content } : {}),
    };
  }
  if (attr.landing_page && !body.description) body.description = `Landing page: ${attr.landing_page}`;
}

function money(n: unknown) {
  return typeof n === 'number' ? `$${Math.round(n).toLocaleString('en-US')}` : '';
}

// Build the FUB event body for an outbox row. Returns null when there's
// nothing sendable (e.g. the listing was removed before we got to it).
async function buildEvent(row: FubEventRow, profile: Record<string, any>) {
  const { firstName, lastName } = splitName(profile.full_name, profile.email);
  const tags = [...BASE_TAGS];
  const body: Record<string, any> = {
    source: SOURCE,
    system: fubSystemName(),
    type: row.event_type,
    person: {
      // A known FUB id makes FUB match directly instead of by email.
      ...(profile.fub_contact_id && Number(profile.fub_contact_id) ? { id: Number(profile.fub_contact_id) } : {}),
      firstName,
      lastName,
      emails: [{ value: profile.email }],
      ...(profile.phone ? { phones: [{ value: profile.phone }] } : {}),
    },
  };

  let property: Record<string, any> | null = null;
  if (row.property_id) {
    const { data } = await supabaseAdmin
      .from('properties')
      .select('id, address, city, state, zip_code, mls_number, price, property_type, bedrooms, bathrooms, square_feet')
      .eq('id', row.property_id)
      .maybeSingle();
    property = data;
    if (property) body.property = propertyBlock(property);
  }
  const where = property ? `${property.address}, ${property.city}` : 'a listing';

  switch (row.event_type) {
    case 'Registration':
      tags.push('Website Signup');
      body.message = `Created an account on ${SITE_URL.replace('https://', '')}`;
      break;

    case 'Property Inquiry': {
      if (!property) return null;
      if (row.payload.source === 'ai_chat') tags.push('AI Chat');
      const intent = row.payload.intent === 'tour' ? 'tour' : 'question';
      const note = typeof row.payload.message === 'string' ? row.payload.message.trim() : '';
      if (intent === 'tour') {
        tags.push('Tour Request');
        const when = [row.payload.preferred_date, row.payload.preferred_time].filter((v) => typeof v === 'string' && v).join(', ');
        body.message = `Requested a showing of ${where} (${money(property.price)}, MLS# ${property.mls_number ?? 'n/a'}).`
          + (when ? `\nPreferred time: ${when}.` : '')
          + (note ? `\n\n"${note}"` : '');
      } else {
        tags.push('Question');
        body.message = `Question about ${where} (${money(property.price)}, MLS# ${property.mls_number ?? 'n/a'}):`
          + `\n\n"${note || 'No message provided'}"`;
      }
      break;
    }

    case 'Saved Property':
      if (!property) return null;
      body.message = `Saved ${where} (${money(property.price)}).`;
      break;

    case 'Viewed Property':
      if (!property) return null;
      if (row.payload.hot) {
        tags.push('Hot Lead');
        body.message = `Hot lead: viewed ${where} ${row.payload.visits} times in the last 7 days.`;
      } else {
        body.message = `Viewed ${where} (${money(property.price)}).`;
      }
      break;

    case 'Property Search': {
      // Read the buyer's latest criteria at send time (the trigger debounces).
      const { data: prefs } = await supabaseAdmin
        .from('search_preferences')
        .select('min_price, max_price, min_bedrooms, min_bathrooms, cities, zip_code, property_types')
        .eq('user_id', row.user_id)
        .maybeSingle();
      if (!prefs) return null;
      const cities: string[] = prefs.cities ?? [];
      body.propertySearch = {
        type: 'For Sale',
        city: cities.length === 1 ? cities[0] : undefined,
        state: 'AZ',
        code: prefs.zip_code ?? undefined,
        minPrice: prefs.min_price ?? undefined,
        maxPrice: prefs.max_price ?? undefined,
        minBedrooms: prefs.min_bedrooms ?? undefined,
        minBathrooms: prefs.min_bathrooms ?? undefined,
      };
      const parts = [
        cities.length ? cities.join(', ') : null,
        prefs.min_price || prefs.max_price ? `${money(prefs.min_price) || 'any'}–${money(prefs.max_price) || 'any'}` : null,
        prefs.min_bedrooms ? `${prefs.min_bedrooms}+ bd` : null,
        prefs.min_bathrooms ? `${prefs.min_bathrooms}+ ba` : null,
        prefs.property_types?.length ? prefs.property_types.join('/').replace(/_/g, ' ') : null,
      ].filter(Boolean);
      body.message = `Searching: ${parts.join(' · ') || 'all Arizona homes'}`;
      break;
    }

    case 'Saved Property Search': {
      const f = (row.payload.filters ?? {}) as Record<string, any>;
      const num = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));
      const cities: string[] = Array.isArray(f.cities) && f.cities.length ? f.cities : f.city ? [f.city] : [];
      body.propertySearch = {
        type: 'For Sale',
        city: cities.length === 1 ? cities[0] : undefined,
        state: 'AZ',
        code: f.zip_code || undefined,
        minPrice: num(f.min_price),
        maxPrice: num(f.max_price),
        minBedrooms: num(f.bedrooms),
        minBathrooms: num(f.bathrooms),
      };
      tags.push('Saved Search');
      const parts = [
        cities.length ? cities.join(', ') : null,
        f.min_price || f.max_price ? `${money(num(f.min_price)) || 'any'}–${money(num(f.max_price)) || 'any'}` : null,
        f.bedrooms ? `${f.bedrooms}+ bd` : null,
        f.bathrooms ? `${f.bathrooms}+ ba` : null,
      ].filter(Boolean);
      body.message = `Saved a search with listing alerts: "${row.payload.name}"${parts.length ? ` (${parts.join(' · ')})` : ''}`;
      break;
    }

    default:
      return null;
  }

  if (profile.team_account) tags.push('Team Test');
  applyAttribution(body, cleanAttribution(row.payload.attribution) ?? cleanAttribution(profile.attribution));
  body.person.tags = tags;
  return body;
}

// Fallback when the events response has no body: FUB can take a moment to
// make a brand new person readable, so this may still come back empty.
async function lookupPersonId(email: string): Promise<string | null> {
  try {
    const { ok, data } = await fubJson(`/people?email=${encodeURIComponent(email)}&limit=1&fields=id`, {}, { retries: 1 });
    const id = ok ? data?.people?.[0]?.id : null;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

async function postEvent(body: Record<string, any>) {
  return await fubFetch('/events', { method: 'POST', body: JSON.stringify(body) }, { retries: 1, maxWaitMs: 10_000 });
}

// Send one outbox row to FUB. Pure: returns what happened, doesn't touch the
// row (see processEvent for the bookkeeping).
export async function sendEvent(row: FubEventRow): Promise<SendResult> {
  if (!Deno.env.get('FOLLOW_UP_BOSS_API_KEY')) return { status: 'retry', error: 'FOLLOW_UP_BOSS_API_KEY not set' };

  let profile: Record<string, any> | null;
  if (row.user_id) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone, role, is_user_admin, fub_contact_id, attribution')
      .eq('id', row.user_id)
      .maybeSingle();
    profile = data;
    if (profile?.role === 'admin' || profile?.is_user_admin) {
      // Passive activity from the team (views, saves, searches) stays out of
      // the CRM. An explicit tour request or question is delivered, tagged
      // Team Test, so the team can verify the lead path end to end.
      if (row.event_type !== 'Property Inquiry') return { status: 'skipped', error: 'admin account' };
      profile = { ...profile, team_account: true };
    }
  } else {
    // Signed-out visitor (AI chat tour request): contact comes with the event.
    const person = (row.payload.person ?? {}) as Record<string, string>;
    profile = { id: null, email: person.email, full_name: person.name, phone: person.phone, fub_contact_id: null };
  }

  if (!profile?.email) return { status: 'skipped', error: 'profile or email missing' };

  const body = await buildEvent(row, profile);
  if (!body) return { status: 'skipped', error: 'nothing to send (listing or search criteria gone)' };

  let res: Response;
  try {
    res = await postEvent(body);
    // We sent a stored FUB id and FUB says it doesn't exist (deleted or merged
    // in FUB). Drop the stale link and let FUB match by email instead.
    if (res.status === 404 && body.person.id) {
      await res.body?.cancel();
      if (profile.id) {
        await unlinkFubPeople([body.person.id]);
        profile.fub_contact_id = null;
      }
      delete body.person.id;
      res = await postEvent(body);
    }
  } catch (err) {
    return { status: 'retry', error: `network: ${(err as Error).message}` };
  }

  // 200 = existing person updated, 201 = person created, 204 = FUB accepted
  // but ignored it (lead flow set to archive). All three are final.
  if (res.ok) {
    // The events response body IS the person record, so no lookup needed.
    let person: Record<string, any> | null = null;
    if (res.status !== 204) {
      try { person = await res.json(); } catch { /* empty body */ }
    } else {
      await res.body?.cancel();
    }

    let personId: string | null = person?.id != null ? String(person.id) : profile.fub_contact_id ?? null;
    if (!personId && profile.id && res.status !== 204) personId = await lookupPersonId(profile.email);

    if (profile.id) {
      if (person?.id != null) {
        await mirrorFubPerson(person);
      } else if (personId && personId !== profile.fub_contact_id) {
        await supabaseAdmin.from('profiles').update({ fub_contact_id: personId }).eq('id', profile.id);
      }
    }
    return { status: 'sent', fubStatus: res.status, personId };
  }

  const text = (await res.text().catch(() => '')).slice(0, 500);
  const retryable = res.status === 429 || res.status >= 500;
  return { status: retryable ? 'retry' : 'failed', fubStatus: res.status, error: text || res.statusText };
}

// Send one row and record the outcome on it.
export async function processEvent(row: FubEventRow): Promise<SendResult> {
  const result = await sendEvent(row);
  const attempts = row.attempts + 1;
  const update: Record<string, unknown> = {
    attempts,
    locked_at: null,
    fub_status: result.fubStatus ?? null,
    last_error: result.error ?? null,
  };

  if (result.status === 'sent') {
    update.status = 'sent';
    update.sent_at = new Date().toISOString();
    update.fub_person_id = result.personId ?? null;
  } else if (result.status === 'retry' && attempts <= RETRY_DELAYS_MIN.length) {
    update.status = 'pending';
    update.next_attempt_at = new Date(Date.now() + RETRY_DELAYS_MIN[attempts - 1] * 60_000).toISOString();
  } else {
    update.status = result.status === 'skipped' ? 'skipped' : 'failed';
  }

  const { error } = await supabaseAdmin.from('fub_events').update(update).eq('id', row.id);
  if (error) console.error(`[fub] failed to record outcome for event ${row.id}:`, error);
  return result;
}

// ----------------------------------------------------------------------------
// Notes (no lead routing; used for activity summaries and alert digests).
// Spaced and retried by fubFetch to respect the 10 per 10s notes limit.
// ----------------------------------------------------------------------------

export async function createFubNote(personId: string | number, subject: string, body: string) {
  try {
    const { ok, status, data, error } = await fubJson('/notes', {
      method: 'POST',
      body: JSON.stringify({ personId: Number(personId), subject, body, isHtml: false }),
    });
    if (!ok) console.error('[fub] note failed:', status, error);
    return { ok, status, noteId: data?.id != null ? String(data.id) : undefined, error };
  } catch (err) {
    console.error('[fub] note failed:', err);
    return { ok: false, status: 0, noteId: undefined, error: (err as Error).message };
  }
}

export async function postFubNote(personId: string, subject: string, body: string): Promise<boolean> {
  return (await createFubNote(personId, subject, body)).ok;
}
