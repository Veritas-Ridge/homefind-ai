import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from '../_shared/supabaseAdmin.ts';
import { fubJson, createFubNote, mirrorFubPerson, fubSystemName, PERSON_FIELDS } from '../_shared/fub.ts';

/**
 * syncToFollowUpBoss (admin): the "Sync to FUB" button on an engagement alert.
 *
 * For the alert's buyer:
 *   1. Find their FUB contact (stored id, else email). If they aren't in FUB
 *      yet, create them with a "Visited Website" event: FUB dedupes and routes
 *      it to an agent, but it doesn't start action plans.
 *   2. Add a note with the alert details.
 *   3. Create a Follow Up task due today for the contact's assigned agent.
 *   4. Mark the alert action_taken.
 *
 * Body: { alert_id }
 */

const todayInArizona = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix' }).format(new Date()); // YYYY-MM-DD

async function findPerson(fubContactId: string | null, email: string | null) {
  if (fubContactId) {
    const r = await fubJson(`/people/${encodeURIComponent(fubContactId)}?fields=${PERSON_FIELDS}`);
    if (r.ok && r.data?.id) return r.data;
  }
  if (email) {
    const r = await fubJson(`/people?email=${encodeURIComponent(email)}&limit=1&fields=${PERSON_FIELDS}`);
    if (r.ok && r.data?.people?.[0]) return r.data.people[0];
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { error: authError } = await requireAdmin(req);
    if (authError) return authError;

    const { alert_id } = await req.json().catch(() => ({}));
    if (!alert_id) return jsonResponse({ error: 'alert_id is required' }, 400);

    const { data: alert } = await supabaseAdmin.from('engagement_alerts').select('*').eq('id', alert_id).maybeSingle();
    if (!alert) return jsonResponse({ error: 'Alert not found' }, 404);

    const { data: profile } = alert.user_id
      ? await supabaseAdmin.from('profiles').select('id, email, full_name, fub_contact_id').eq('id', alert.user_id).maybeSingle()
      : { data: null };
    const email = profile?.email ?? alert.user_email ?? null;
    const name = profile?.full_name || alert.user_name || email || 'this buyer';
    if (!email && !profile?.fub_contact_id) return jsonResponse({ error: 'Alert has no email to match in Follow Up Boss' }, 400);

    // 1. Find or create the FUB contact.
    let person = await findPerson(profile?.fub_contact_id ?? null, email);
    if (!person) {
      const [firstName, ...rest] = String(profile?.full_name || alert.user_name || '').trim().split(/\s+/);
      const r = await fubJson('/events', {
        method: 'POST',
        body: JSON.stringify({
          source: 'HomeFind AI',
          system: fubSystemName(),
          type: 'Visited Website',
          message: 'Added from a HomeFind AI engagement alert',
          person: {
            firstName: firstName || email!.split('@')[0],
            lastName: rest.join(' '),
            emails: [{ value: email }],
            tags: ['HomeFind AI'],
          },
        }),
      });
      if (r.status === 204) return jsonResponse({ error: 'Follow Up Boss ignored the contact (the HomeFind AI lead flow is archived)' }, 409);
      if (!r.ok || !r.data?.id) return jsonResponse({ error: `Follow Up Boss returned ${r.status}: ${r.error}` }, 502);
      person = r.data;
    }
    if (profile) await mirrorFubPerson(person);

    // 2. Note with the alert details.
    const note = [
      alert.ai_summary || 'Engagement changed on HomeFind AI.',
      alert.drop_percentage ? `Engagement drop: ${alert.drop_percentage}%` : null,
      alert.last_activity_date ? `Last active: ${new Date(alert.last_activity_date).toLocaleDateString('en-US')}` : null,
      `Recommended action: ${alert.recommended_action || 'Follow up with the buyer'}`,
    ].filter(Boolean).join('\n\n');
    const noteRes = await createFubNote(person.id, 'HomeFind AI engagement alert', note);

    // 3. Task for the assigned agent (FUB requires an assignee); fall back to
    // the API key's own user when the contact is unassigned.
    let assignedUserId = Number(person.assignedUserId) || null;
    if (!assignedUserId) {
      const me = await fubJson('/me');
      assignedUserId = Number(me.data?.id) || null;
    }
    const taskRes = assignedUserId
      ? await fubJson('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          personId: person.id,
          assignedUserId,
          name: `HomeFind AI: follow up with ${name}`,
          type: 'Follow Up',
          dueDate: todayInArizona(),
        }),
      })
      : { ok: false, status: 0, error: 'no FUB user to assign the task to' };

    // 4. Close out the alert.
    await supabaseAdmin.from('engagement_alerts').update({ status: 'action_taken' }).eq('id', alert_id);

    return jsonResponse({
      success: true,
      person_id: person.id,
      note: noteRes.ok ? 'created' : `failed: ${noteRes.error}`,
      task: taskRes.ok ? 'created' : `failed: ${taskRes.error}`,
      message: 'Synced to Follow Up Boss',
    });
  } catch (err) {
    console.error('[syncToFollowUpBoss] error:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
