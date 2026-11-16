import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse } from '../_shared/supabaseAdmin.ts';
import { SPARK_RESO_BASE, sparkToken, sparkFetch } from '../_shared/spark.ts';

/**
 * syncMembersOffices — replicates the RESO Member and Office resources.
 *
 * WHY: Spark's replication docs say agent and office details are NOT stored on
 * Property records, and changes to a Member or Office do not bump the
 * listing's ModificationTimestamp. Reading names/phones off the Property
 * payload therefore goes stale. ARMLS IDX rules require the listing office to
 * be credited on every listing, so we replicate Member + Office and then push
 * the current values onto `properties` via refresh_listing_attribution().
 *
 * Flow per resource (Office first, then Member):
 *   1. First run: full crawl (no filter), resumable through @odata.nextLink.
 *   2. After that: ModificationTimestamp window bounded on both sides.
 * Finally calls refresh_listing_attribution() to update listings.
 *
 * POST { probe: true }  → returns one raw record of each resource. No writes.
 * POST { reset: true }  → forget the cursor and re-crawl everything.
 * Deployed with verify_jwt off, like syncListingsReso: it only pulls MLS
 * directory data into service-role-only tables and returns counts.
 */

const TOP = 1000;
const TIME_BUDGET_MS = 40_000;
const CURSOR_KEY = 'reso_member_office_cursor';
const OVERLAP_MS = 5 * 60 * 1000;

type Res = 'Office' | 'Member';
type ResCursor = { next?: string; since?: string; until?: string; last_completed?: string };

const SELECT: Record<Res, string> = {
  Office: 'OfficeKey,OfficeMlsId,OfficeName,OfficePhone,OfficeEmail,OfficeStatus,ModificationTimestamp',
  Member: [
    'MemberKey', 'MemberMlsId', 'MemberFullName', 'MemberFirstName', 'MemberLastName', 'MemberEmail',
    'MemberPreferredPhone', 'MemberMobilePhone', 'MemberOfficePhone',
    'OfficeKey', 'OfficeMlsId', 'OfficeName', 'MemberStatus', 'ModificationTimestamp',
  ].join(','),
};

const s = (v: unknown) => (typeof v === 'string' && v.trim() && v !== '********' ? v.trim() : null);

function officeRow(r: any) {
  if (!r.OfficeKey) return null;
  return {
    office_key: String(r.OfficeKey),
    office_mls_id: s(r.OfficeMlsId),
    office_name: s(r.OfficeName),
    office_phone: s(r.OfficePhone),
    office_email: s(r.OfficeEmail),
    office_status: s(r.OfficeStatus),
    modification_timestamp: r.ModificationTimestamp ?? null,
    synced_at: new Date().toISOString(),
  };
}

function memberRow(r: any) {
  if (!r.MemberKey) return null;
  return {
    member_key: String(r.MemberKey),
    member_mls_id: s(r.MemberMlsId),
    full_name: s(r.MemberFullName) || [s(r.MemberFirstName), s(r.MemberLastName)].filter(Boolean).join(' ') || null,
    email: s(r.MemberEmail),
    direct_phone: null, // ARMLS Member has no MemberDirectPhone field
    preferred_phone: s(r.MemberPreferredPhone),
    mobile_phone: s(r.MemberMobilePhone),
    office_phone: s(r.MemberOfficePhone),
    office_key: s(r.OfficeKey),
    office_mls_id: s(r.OfficeMlsId),
    office_name: s(r.OfficeName),
    member_status: s(r.MemberStatus),
    modification_timestamp: r.ModificationTimestamp ?? null,
    synced_at: new Date().toISOString(),
  };
}

async function loadCursor(): Promise<Record<Res, ResCursor>> {
  const { data } = await supabaseAdmin.from('sync_cache').select('cache_value').eq('cache_key', CURSOR_KEY).maybeSingle();
  return { Office: {}, Member: {}, ...(data?.cache_value || {}) };
}
async function saveCursor(val: Record<Res, ResCursor>) {
  const { error } = await supabaseAdmin.from('sync_cache').upsert(
    { cache_key: CURSOR_KEY, cache_value: val, sync_key: CURSOR_KEY, updated_at: new Date().toISOString() },
    { onConflict: 'cache_key' },
  );
  if (error) throw new Error(`saveCursor: ${error.message}`);
}

async function syncResource(res: Res, cur: ResCursor, token: string, start: number) {
  let nextUrl: string | null;
  let since = cur.since || '';
  let until = cur.until || '';
  if (cur.next) {
    nextUrl = cur.next;
  } else if (!cur.last_completed) {
    // first ever run: full crawl
    since = '';
    until = new Date().toISOString();
    nextUrl = `${SPARK_RESO_BASE}/${res}?$count=true&$top=${TOP}&$select=${SELECT[res]}`;
  } else {
    since = new Date(Date.parse(cur.last_completed) - OVERLAP_MS).toISOString();
    until = new Date().toISOString();
    const filter = `(ModificationTimestamp gt ${since} and ModificationTimestamp lt ${until})`;
    nextUrl = `${SPARK_RESO_BASE}/${res}?$count=true&$top=${TOP}&$select=${SELECT[res]}&$filter=${encodeURIComponent(filter)}`;
  }

  const table = res === 'Office' ? 'spark_offices' : 'spark_members';
  const conflict = res === 'Office' ? 'office_key' : 'member_key';
  const build = res === 'Office' ? officeRow : memberRow;
  let upserted = 0;
  let pages = 0;
  let odataCount: number | null = null;

  while (nextUrl && Date.now() - start < TIME_BUDGET_MS) {
    const r = await sparkFetch(nextUrl, token);
    if (!r.ok) throw new Error(`RESO ${res} ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const data = await r.json();
    if (odataCount === null) odataCount = data['@odata.count'] ?? null;
    const rows = (data.value || []).map(build).filter(Boolean);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabaseAdmin.from(table).upsert(rows.slice(i, i + 500), { onConflict: conflict });
      if (error) throw new Error(`${table} upsert: ${error.message}`);
    }
    upserted += rows.length;
    nextUrl = data['@odata.nextLink'] || null;
    pages++;
  }

  const done = !nextUrl;
  const newCur: ResCursor = done
    ? { last_completed: until }
    : { ...cur, next: nextUrl!, since, until };
  return { cursor: newCur, stats: { resource: res, odata_count: odataCount, upserted, pages, window_complete: done, since: since || 'full', until } };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const start = Date.now();
  try {
    const token = sparkToken();
    const body = await req.json().catch(() => ({}));

    if (body.probe === true) {
      const out: Record<string, unknown> = {};
      for (const res of ['Office', 'Member'] as Res[]) {
        const r = await sparkFetch(`${SPARK_RESO_BASE}/${res}?$top=1&$count=true`, token);
        const txt = await r.text();
        let json: any = null;
        try { json = JSON.parse(txt); } catch { /* keep text */ }
        out[res] = r.ok
          ? { status: r.status, count: json?.['@odata.count'] ?? null, fields: json?.value?.[0] ? Object.keys(json.value[0]).sort() : [] }
          : { status: r.status, body: txt.slice(0, 300) };
      }
      return jsonResponse({ probe: true, ...out });
    }

    let cursor = await loadCursor();
    if (body.reset === true) cursor = { Office: {}, Member: {} };

    const stats: unknown[] = [];
    for (const res of ['Office', 'Member'] as Res[]) {
      if (Date.now() - start >= TIME_BUDGET_MS) break;
      const out = await syncResource(res, cursor[res], token, start);
      cursor[res] = out.cursor;
      stats.push(out.stats);
      await saveCursor(cursor);
    }

    const { data: refreshed, error: rpcErr } = await supabaseAdmin.rpc('refresh_listing_attribution', { p_keys: null });
    if (rpcErr) console.error('[syncMembersOffices] refresh_listing_attribution failed:', rpcErr);

    return jsonResponse({ success: true, stats, listings_refreshed: refreshed ?? null, refresh_error: rpcErr?.message ?? null });
  } catch (err: any) {
    console.error('[syncMembersOffices] error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
});
