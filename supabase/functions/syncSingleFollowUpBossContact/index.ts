import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from '../_shared/supabaseAdmin.ts';
import { fubJson, mirrorFubPerson, PERSON_FIELDS } from '../_shared/fub.ts';

/**
 * syncSingleFollowUpBossContact (admin): the "Sync" button on a FUB contact.
 *
 * Pulls the contact from FUB and links it to the HomeFind account with the
 * same email: sets fub_contact_id, refreshes the fub_contacts mirror (agent,
 * stage, tags) and fills in the name if the account has none. Logged to
 * fub_sync_history either way.
 *
 * Body: { contact_id, contact_email?, contact_name? }
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { user, error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { contact_id, contact_email, contact_name } = await req.json().catch(() => ({}));
  const log = (status: 'success' | 'failed', extra: Record<string, unknown>) =>
    supabaseAdmin.from('fub_sync_history').insert({
      sync_type: 'manual',
      status,
      contact_email: contact_email ?? null,
      contact_name: contact_name || contact_email || null,
      triggered_by: user.email,
      records_synced: status === 'success' ? 1 : 0,
      errors: status === 'success' ? 0 : 1,
      ...extra,
    });

  try {
    if (!contact_id) return jsonResponse({ error: 'contact_id is required' }, 400);

    const { ok, status, data: person, error } = await fubJson(`/people/${encodeURIComponent(contact_id)}?fields=${PERSON_FIELDS}`);
    if (!ok || !person) throw new Error(`Follow Up Boss returned ${status}: ${error}`);

    const profileId = await mirrorFubPerson(person);
    if (!profileId) {
      const msg = 'No HomeFind account uses this contact\'s email yet. Invite them first.';
      await log('failed', { error_message: msg });
      return jsonResponse({ error: msg }, 404);
    }

    const synced: Record<string, unknown> = {
      fub_contact_id: String(person.id),
      stage: person.stage ?? null,
      assigned_to: person.assignedTo ?? null,
      tags: person.tags ?? [],
    };

    const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ');
    if (fullName) {
      const { data: updated } = await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profileId)
        .or('full_name.is.null,full_name.eq.')
        .select('id');
      if (updated?.length) synced.full_name = fullName;
    }

    await log('success', { synced_fields: synced });
    return jsonResponse({ success: true, message: 'Contact synced successfully', synced_fields: synced });
  } catch (err) {
    await log('failed', { error_message: (err as Error).message });
    console.error('[syncSingleFollowUpBossContact] error:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
