import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, isServiceRole, requireAdmin } from '../_shared/supabaseAdmin.ts';
import { fubJson, fubSystemKey, fubSystemName, refreshFubUsers } from '../_shared/fub.ts';

/**
 * fubWebhooks: check the FUB connection and manage our webhook subscriptions.
 *
 * Body { action }:
 *   'status'     (default) what the API key and system key can do, plus the
 *                webhooks currently registered for our system
 *   'register'   make sure every event in WEBHOOK_EVENTS posts to fubWebhook
 *                (idempotent; re-enables disabled ones), then loads agents
 *   'unregister' delete the webhooks that point at fubWebhook
 *
 * FUB rules this works within: only the account OWNER's API key can manage
 * webhooks, the X-System/X-System-Key pair must be a registered system, and
 * each event allows at most 2 webhooks per system.
 *
 * Callable by app admins or the service role.
 */

// peopleUpdated already covers stage, tag, agent, lender and contacted
// changes, so the narrower peopleStageUpdated/peopleTagsCreated aren't needed.
const WEBHOOK_EVENTS = ['peopleCreated', 'peopleUpdated', 'peopleDeleted'];

function callbackUrl() {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/fubWebhook`;
}

async function status(): Promise<Record<string, any>> {
  const out: Record<string, unknown> = {
    apiKeyConfigured: !!Deno.env.get('FOLLOW_UP_BOSS_API_KEY'),
    system: fubSystemName(),
    systemKeyConfigured: !!fubSystemKey(),
    callbackUrl: callbackUrl(),
    events: WEBHOOK_EVENTS,
  };
  if (!out.apiKeyConfigured) return { ...out, ready: false, problems: ['FOLLOW_UP_BOSS_API_KEY is not set'] };

  const problems: string[] = [];
  const [identity, me, limits] = await Promise.all([
    fubJson('/identity'),
    fubJson('/me'),
    fubJson('/rateLimit/limits'),
  ]);

  if (!identity.ok) problems.push(`API key rejected by FUB (${identity.status}): ${identity.error}`);
  out.account = identity.data?.account ? { id: identity.data.account.id, domain: identity.data.account.domain } : null;
  out.apiKeyUser = identity.data?.user ?? null;

  let isOwner = false;
  if (me.ok && me.data?.id != null) {
    const u = await fubJson(`/users/${me.data.id}`);
    isOwner = !!u.data?.isOwner;
    out.apiKeyRole = u.data?.role ?? me.data?.role ?? null;
  }
  out.apiKeyIsOwner = isOwner;
  if (!isOwner) problems.push('The API key must belong to the FUB account owner to manage webhooks');

  // /rateLimit/limits only answers registered systems, so it doubles as a
  // check that X-System + X-System-Key are valid.
  out.systemKeyValid = limits.ok;
  out.rateLimits = limits.ok ? limits.data?.current_limits ?? null : null;
  if (!out.systemKeyConfigured) problems.push('FUB_SYSTEM_KEY is not set');
  else if (!limits.ok) problems.push(`FUB did not accept X-System "${fubSystemName()}" with this X-System-Key (${limits.status})`);

  const hooks = await fubJson('/webhooks?limit=100');
  out.webhooks = hooks.ok
    ? (hooks.data?.webhooks ?? []).map((w: any) => ({ id: w.id, event: w.event, status: w.status, url: w.url, ours: w.url === callbackUrl() }))
    : { error: `${hooks.status}: ${hooks.error}` };

  return { ...out, ready: problems.length === 0, problems };
}

async function register() {
  const s = await status();
  if (!s.ready) return { ok: false, ...s };

  const existing = (s.webhooks as any[]) ?? [];
  const results: Record<string, string> = {};
  for (const event of WEBHOOK_EVENTS) {
    const forEvent = existing.filter((w) => w.event === event);
    const ours = forEvent.find((w) => w.ours);
    if (ours?.status === 'Active') { results[event] = `already active (#${ours.id})`; continue; }
    if (ours) {
      const r = await fubJson(`/webhooks/${ours.id}`, { method: 'PUT', body: JSON.stringify({ status: 'Active' }) });
      results[event] = r.ok ? `re-enabled (#${ours.id})` : `re-enable failed (${r.status}): ${r.error}`;
      continue;
    }
    if (forEvent.length >= 2) {
      results[event] = `skipped: FUB allows 2 webhooks per event and both are used (${forEvent.map((w) => w.url).join(', ')})`;
      continue;
    }
    const r = await fubJson('/webhooks', { method: 'POST', body: JSON.stringify({ event, url: callbackUrl() }) });
    results[event] = r.ok ? `created (#${r.data?.id})` : `create failed (${r.status}): ${r.error}`;
  }

  const agents = await refreshFubUsers();
  return { ok: Object.values(results).every((v) => !/failed|skipped/.test(v)), results, agentsLoaded: agents };
}

async function unregister() {
  const hooks = await fubJson('/webhooks?limit=100');
  if (!hooks.ok) return { ok: false, error: `${hooks.status}: ${hooks.error}` };
  const results: Record<string, string> = {};
  for (const w of hooks.data?.webhooks ?? []) {
    if (w.url !== callbackUrl()) continue;
    const r = await fubJson(`/webhooks/${w.id}`, { method: 'DELETE' });
    results[`${w.event} #${w.id}`] = r.ok ? 'deleted' : `delete failed (${r.status}): ${r.error}`;
  }
  return { ok: true, results };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!isServiceRole(req)) {
      const { error } = await requireAdmin(req);
      if (error) return error;
    }
    const { action = 'status' } = await req.json().catch(() => ({}));
    if (action === 'register') return jsonResponse(await register());
    if (action === 'unregister') return jsonResponse(await unregister());
    return jsonResponse(await status());
  } catch (err) {
    console.error('[fubWebhooks] error:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
