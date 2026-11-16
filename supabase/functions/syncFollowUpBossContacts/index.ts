import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from '../_shared/supabaseAdmin.ts';
import { fubJson, mirrorFubPerson, PERSON_FIELDS } from '../_shared/fub.ts';

/**
 * syncFollowUpBossContacts (admin): powers the "Follow Up Boss Contacts" panel.
 *
 * Lists the most recent FUB contacts (newest first, paged with FUB's `next`
 * cursor), flags which ones already have a HomeFind account, and links those
 * accounts to their FUB contact (fub_contact_id + fub_contacts mirror).
 *
 * User admins (agents) only see contacts assigned to them in FUB, matched by
 * their email to a FUB user. Full admins see the whole account.
 *
 * Body: { maxContacts?: number }  (default 300, capped at 1000)
 */

const PAGE_SIZE = 100;

const firstValue = (list: any) =>
  Array.isArray(list) && list.length ? (typeof list[0] === 'string' ? list[0] : list[0]?.value ?? null) : null;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { user, error: authError } = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json().catch(() => ({}));
    const maxContacts = Math.min(Math.max(Number(body.maxContacts) || 300, PAGE_SIZE), 1000);

    let filter = '';
    if (user.role !== 'admin' && user.is_user_admin) {
      const { ok, data } = await fubJson(`/users?email=${encodeURIComponent(user.email)}&fields=id,email`);
      const fubUser = ok ? data?.users?.[0] : null;
      if (!fubUser) {
        return jsonResponse({
          total_contacts: 0, invited_users: 0, uninvited_contacts: 0, contacts: [],
          message: `No Follow Up Boss user found with email ${user.email}`,
        });
      }
      filter = `&assignedUserId=${fubUser.id}`;
    }

    const people: any[] = [];
    let total = 0;
    let next: string | null = `/people?sort=-created&limit=${PAGE_SIZE}&fields=${PERSON_FIELDS}${filter}`;
    while (next && people.length < maxContacts) {
      const { ok, status, data, error }: { ok: boolean; status: number; data: any; error?: string } = await fubJson(next);
      if (!ok) return jsonResponse({ error: `Follow Up Boss returned ${status}: ${error}` }, 502);
      if (!total) total = Number(data?._metadata?.total) || 0;
      people.push(...(data?.people ?? []));
      next = data?._metadata?.nextLink ?? null;
    }

    // Which of these contacts already have a HomeFind account?
    const emailsOf = (p: any) =>
      (p.emails ?? []).map((e: any) => String(e?.value ?? e).trim().toLowerCase()).filter((e: string) => e.includes('@'));
    const allEmails = [...new Set(people.flatMap(emailsOf))];
    const profilesByEmail = new Map<string, any>();
    for (let i = 0; i < allEmails.length; i += 200) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, fub_contact_id')
        .in('email', allEmails.slice(i, i + 200));
      (data ?? []).forEach((p) => profilesByEmail.set(p.email.toLowerCase(), p));
    }

    const contacts = [];
    let invited = 0;
    for (const person of people) {
      const match = emailsOf(person).map((e: string) => profilesByEmail.get(e)).find(Boolean) ?? null;
      if (match) {
        invited++;
        if (match.fub_contact_id !== String(person.id)) await mirrorFubPerson(person);
      }
      const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown';
      contacts.push({
        id: person.id,
        name,
        first_name: person.firstName ?? null,
        last_name: person.lastName ?? null,
        email: firstValue(person.emails) ?? 'No email',
        phone: firstValue(person.phones),
        company: null,
        stage: person.stage ?? null,
        assigned_to: person.assignedTo ?? null,
        created_at: person.created ?? null,
        is_invited_to_homefinder: !!match,
        homefinder_match: !!match,
        match_type: match ? 'email' : null,
        homefinder_email: match?.email ?? null,
        homefinder_name: match?.full_name ?? null,
      });
    }

    return jsonResponse({
      total_contacts: total || people.length,
      loaded_contacts: people.length,
      invited_users: invited,
      uninvited_contacts: people.length - invited,
      contacts,
    });
  } catch (err) {
    console.error('[syncFollowUpBossContacts] error:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
