import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from '../_shared/supabaseAdmin.ts';

/**
 * fubStatus (admin only)
 *
 * Powers the "Follow Up Boss connection" panel on the admin dashboard:
 *   - connected: the API key authenticates against FUB /v1/identity
 *   - account:   FUB account name / id / domain so you can see WHICH account
 *   - queue:     outbox health. Pending events older than 10 minutes mean the
 *                processFubEvents cron isn't draining the queue (for example
 *                the vault service_role_key secret is wrong).
 */

const FUB_BASE = 'https://api.followupboss.com/v1';
const STALL_MINUTES = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const apiKey = Deno.env.get('FOLLOW_UP_BOSS_API_KEY');
  let connected = false;
  let account: Record<string, unknown> | null = null;
  let connectionError: string | null = null;

  if (!apiKey) {
    connectionError = 'FOLLOW_UP_BOSS_API_KEY is not set on the edge functions';
  } else {
    try {
      const res = await fetch(`${FUB_BASE}/identity`, {
        headers: {
          Authorization: `Basic ${btoa(apiKey + ':')}`,
          'X-System': Deno.env.get('FUB_SYSTEM') ?? 'HomeFind-AI',
          'X-System-Key': Deno.env.get('FUB_SYSTEM_KEY') ?? 'crandell-real-estate',
        },
      });
      if (res.ok) {
        const data = await res.json();
        connected = true;
        account = {
          id: data?.account?.id ?? null,
          name: data?.account?.name ?? null,
          domain: data?.account?.domain ?? null,
          user: data?.user?.name ?? data?.user?.email ?? null,
        };
      } else {
        connectionError = `FUB responded ${res.status}${res.status === 401 ? ' (API key rejected)' : ''}`;
      }
    } catch (err) {
      connectionError = `Could not reach FUB: ${(err as Error).message}`;
    }
  }

  const stallBefore = new Date(Date.now() - STALL_MINUTES * 60_000).toISOString();
  const [{ count: pending }, { count: stalled }, { count: failed }, { data: lastSent }] = await Promise.all([
    supabaseAdmin.from('fub_events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('fub_events').select('id', { count: 'exact', head: true })
      .eq('status', 'pending').lt('next_attempt_at', stallBefore),
    supabaseAdmin.from('fub_events').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabaseAdmin.from('fub_events').select('sent_at').eq('status', 'sent')
      .order('sent_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return jsonResponse({
    connected,
    account,
    connection_error: connectionError,
    queue: {
      pending: pending ?? 0,
      stalled: stalled ?? 0,
      failed: failed ?? 0,
      last_sent_at: lastSent?.sent_at ?? null,
      worker_ok: (stalled ?? 0) === 0,
    },
    checked_at: new Date().toISOString(),
  });
});
