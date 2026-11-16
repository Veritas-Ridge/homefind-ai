// ============================================================================
// First touch attribution
// ----------------------------------------------------------------------------
// Captures UTM tags, click ids, the referring page and the landing page the
// first time a visitor arrives, and keeps them for 90 days. The data rides
// along with every lead (tour, question, sign up) so Follow Up Boss shows
// where the buyer came from (sourceUrl + campaign on the FUB event).
// ============================================================================

const KEY = 'crandell_attribution';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
const OWN_HOSTS = /(^|\.)crandellrealestate\.com$/i;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.captured_at || Date.now() - Date.parse(parsed.captured_at) > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Call once on app start. Keeps an existing first touch unless the visitor
// arrives on a new tagged campaign link, which replaces it.
export function captureAttribution() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const tagged = PARAMS.some((p) => url.searchParams.get(p));
    let referrer = '';
    try {
      if (document.referrer && !OWN_HOSTS.test(new URL(document.referrer).hostname)) referrer = document.referrer;
    } catch { /* ignore */ }

    const existing = read();
    if (existing && !tagged) return;

    const data = { captured_at: new Date().toISOString(), landing_page: url.href.slice(0, 500) };
    PARAMS.forEach((p) => {
      const v = url.searchParams.get(p);
      if (v) data[p] = v.slice(0, 200);
    });
    if (referrer) data.referrer = referrer.slice(0, 500);
    // A visit from the main site carries its own referrer; keep it as a source.
    if (!referrer && document.referrer) data.referrer = document.referrer.slice(0, 500);
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* storage blocked: attribution is best effort */ }
}

export function getAttribution() {
  return read();
}
