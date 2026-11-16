import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse, isServiceRole } from '../_shared/supabaseAdmin.ts';
import { fubJson, mirrorFubPerson, unlinkFubPeople, refreshFubUsers, PERSON_FIELDS } from '../_shared/fub.ts';

/**
 * processFubWebhooks
 *
 * Drains public.fub_webhook_events (filled by fubWebhook). For people events
 * it fetches the changed contacts from FUB and mirrors the ones that are app
 * users into public.fub_contacts (agent, stage, tags, contacted). FUB contacts
 * who never used HomeFind are ignored.
 *
 * Scheduled every minute by the 'process-fub-webhooks' pg_cron job.
 * Service-role only (verify_jwt on + role claim check).
 */

const BATCH_SIZE = 25;
const PEOPLE_PER_REQUEST = 100;
const RETRY_DELAYS_MIN = [1, 5, 15, 60, 240];

const PEOPLE_EVENTS = new Set([
  'peopleCreated', 'peopleUpdated', 'peopleStageUpdated', 'peopleTagsCreated',
  'peopleRelationshipCreated', 'peopleRelationshipUpdated', 'peopleRelationshipDeleted',
]);

interface WebhookRow {
  id: number;
  event: string;
  resource_ids: number[];
  attempts: number;
}

// Fetch people by id (trash included, so a contact moved to Trash still
// updates) and mirror each one. Returns how many matched app users.
async function syncPeople(ids: number[]) {
  let matched = 0;
  for (let i = 0; i < ids.length; i += PEOPLE_PER_REQUEST) {
    const chunk = ids.slice(i, i + PEOPLE_PER_REQUEST);
    const { ok, status, data, error } = await fubJson(
      `/people?id=${chunk.join(',')}&fields=${PERSON_FIELDS}&includeTrash=true&limit=${PEOPLE_PER_REQUEST}`,
    );
    if (!ok) throw Object.assign(new Error(`GET /people ${status}: ${error}`), { status });
    for (const person of data?.people ?? []) {
      if (await mirrorFubPerson(person)) matched++;
    }
  }
  return matched;
}

async function handle(row: WebhookRow): Promise<'processed' | 'ignored'> {
  if (row.event === 'peopleDeleted') {
    await unlinkFubPeople(row.resource_ids);
    return 'processed';
  }
  if (PEOPLE_EVENTS.has(row.event)) {
    await syncPeople(row.resource_ids);
    return 'processed';
  }
  // Subscribed to something we don't act on yet: keep the record, do nothing.
  return 'ignored';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!isServiceRole(req)) return jsonResponse({ error: 'forbidden' }, 403);

  const body = await req.json().catch(() => ({}));

  // Manual maintenance hook: { refreshUsers: true } reloads the agent list.
  if (body.refreshUsers) {
    return jsonResponse({ users: await refreshFubUsers() });
  }

  const { data: rows, error } = await supabaseAdmin.rpc('fub_claim_webhook_events', { p_limit: BATCH_SIZE });
  if (error) {
    console.error('[processFubWebhooks] claim failed:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const counts: Record<string, number> = { processed: 0, ignored: 0, retry: 0, failed: 0 };
  for (const row of (rows ?? []) as WebhookRow[]) {
    const attempts = row.attempts + 1;
    try {
      const outcome = await handle(row);
      counts[outcome]++;
      await supabaseAdmin.from('fub_webhook_events').update({
        status: outcome, attempts, locked_at: null, last_error: null, processed_at: new Date().toISOString(),
      }).eq('id', row.id);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      // 4xx other than 429 won't fix itself (bad key, no access).
      const retryable = status === 0 || status === 429 || status >= 500;
      const willRetry = retryable && attempts <= RETRY_DELAYS_MIN.length;
      counts[willRetry ? 'retry' : 'failed']++;
      console.error(`[processFubWebhooks] ${row.event} #${row.id} failed:`, (err as Error).message);
      await supabaseAdmin.from('fub_webhook_events').update({
        status: willRetry ? 'pending' : 'failed',
        attempts,
        locked_at: null,
        last_error: (err as Error).message.slice(0, 500),
        ...(willRetry ? { next_attempt_at: new Date(Date.now() + RETRY_DELAYS_MIN[attempts - 1] * 60_000).toISOString() } : {}),
      }).eq('id', row.id);
    }
  }

  return jsonResponse({ claimed: rows?.length ?? 0, ...counts });
});
