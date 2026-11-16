// ============================================================================
// Team email notifications (Resend)
// ----------------------------------------------------------------------------
// Tanner gets an email the moment a buyer asks a question or requests a tour,
// independent of Follow Up Boss, so a CRM hiccup never hides a live lead.
// Recipient is LEAD_NOTIFY_EMAIL (comma separated for more than one).
// ============================================================================

const DEFAULT_NOTIFY = 'Tanner@CrandellRealEstate.com';
const SITE_URL = 'https://search.crandellrealestate.com';

export interface LeadNotice {
  intent: 'tour' | 'question';
  name: string;
  email: string;
  phone?: string | null;
  message?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  property: { id: string; address: string; city: string; price?: number | null; mls_number?: string | null };
  attribution?: Record<string, unknown> | null;
  teamAccount?: boolean;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function money(n: unknown) {
  return typeof n === 'number' ? `$${Math.round(n).toLocaleString('en-US')}` : '';
}

export async function sendLeadNotification(n: LeadNotice): Promise<{ sent: boolean; reason?: string }> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { sent: false, reason: 'RESEND_API_KEY not set' };

  const to = (Deno.env.get('LEAD_NOTIFY_EMAIL') ?? DEFAULT_NOTIFY).split(',').map((s) => s.trim()).filter(Boolean);
  const where = `${n.property.address}, ${n.property.city}`;
  const listingUrl = `${SITE_URL}/PropertyDetail?id=${n.property.id}`;
  const what = n.intent === 'tour' ? 'Tour request' : 'Question';
  const subject = `${n.teamAccount ? '[Team test] ' : ''}${what}: ${where}`;

  const when = n.intent === 'tour' && (n.preferredDate || n.preferredTime)
    ? [n.preferredDate, n.preferredTime].filter(Boolean).join(', ')
    : '';
  const a = (n.attribution ?? {}) as Record<string, string>;
  const source = [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(' / ') || a.referrer || '';

  const rows: [string, string][] = [
    ['Name', n.name],
    ['Email', n.email],
    ['Phone', n.phone || 'Not provided'],
    ['Listing', `${where} ${money(n.property.price)}${n.property.mls_number ? ` (MLS# ${n.property.mls_number})` : ''}`],
    ...(when ? [['Preferred time', when] as [string, string]] : []),
    ...(source ? [['Source', source] as [string, string]] : []),
  ];

  const html = `
  <div style="font-family:Georgia,serif;color:#12100D;background:#F7F1E5;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#FFFDF8;border-radius:12px;padding:24px">
      <h2 style="margin:0 0 12px;font-weight:400">${esc(what)} from ${esc(n.name)}</h2>
      <table style="font-family:Arial,sans-serif;font-size:14px;color:#3E3A33;border-collapse:collapse">
        ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join('')}
      </table>
      ${n.message ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#3E3A33;white-space:pre-wrap;border-left:3px solid #4F90B5;padding-left:12px">${esc(n.message)}</p>` : ''}
      <p style="margin-top:20px"><a href="${listingUrl}" style="background:#12100D;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-family:Arial,sans-serif;font-size:14px">View listing</a></p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#3E3A33">Also delivered to Follow Up Boss as a Property Inquiry.</p>
    </div>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: Deno.env.get('ALERTS_FROM_EMAIL') ?? 'Crandell Real Estate <alerts@crandellrealestate.com>',
        to,
        reply_to: n.email,
        subject,
        html,
      }),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: (err as Error).message };
  }
}
