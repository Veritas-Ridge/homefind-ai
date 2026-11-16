// ============================================================================
// Per listing share previews (Vercel Routing Middleware)
// ----------------------------------------------------------------------------
// The app renders in the browser, so link preview crawlers (iMessage,
// Facebook, Slack, X, LinkedIn, WhatsApp, text message apps) only ever saw the
// generic tags in index.html: no photo, address or price. For crawler requests
// to /PropertyDetail?id=... this looks the listing up and serves index.html
// with listing specific Open Graph / Twitter tags. People get the normal SPA,
// untouched.
// ============================================================================

export const config = { matcher: ['/PropertyDetail', '/PropertyDetail/'] };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bfnudxyxgjhdqwlcqyar.supabase.co';
// Public anon key (same one shipped in the browser bundle); listings are
// world readable under RLS.
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbnVkeHl4Z2poZHF3bGNxeWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzMyMjEsImV4cCI6MjA5MDgwOTIyMX0.H6LBxejXxnsqzsjtVFUPF4qq21ra1yRiXIRoWLlxHLQ';

const CRAWLER_UA = /bot|crawl|spider|facebookexternalhit|facebookcatalog|meta-externalagent|slack|whatsapp|telegram|discord|linkedin|pinterest|embedly|quora|skype|vkshare|redditbot|applebot|iframely|preview|outbrain|google-inspectiontool|bingpreview|tumblr|bitly|nuzzel|mastodon|line-poker|kakaotalk/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function money(n) {
  return typeof n === 'number' && n > 0 ? `$${Math.round(n).toLocaleString('en-US')}` : '';
}

function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

// Spark originals can be 2500px / 900KB, over some crawlers' limits. Ask the
// Spark resize CDN for a 1200x900 box (same scheme as src/lib/listingPhotos).
const SPARK_PHOTO = /^https:\/\/cdn\.(?:photos|resize)\.sparkplatform\.com\/([a-z0-9]+)\/(?:\d+x\d+\/true\/)?([^/?#]+)$/i;
function sharePhoto(url) {
  if (!url) return '';
  const m = String(url).match(SPARK_PHOTO);
  return m ? `https://cdn.resize.sparkplatform.com/${m[1]}/1200x900/true/${m[2]}` : url;
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!CRAWLER_UA.test(ua)) return; // normal visitors: continue to the SPA

  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!UUID.test(id)) return;

  try {
    const [listingRes, shellRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/properties?id=eq.${id}&status=in.(active,coming_soon)`
          + '&select=id,address,city,state,zip_code,price,bedrooms,bathrooms,square_feet,primary_photo_url,images',
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
      ),
      fetch(new URL('/index.html', url.origin)),
    ]);
    if (!shellRes.ok) return;
    let html = await shellRes.text();

    const rows = listingRes.ok ? await listingRes.json() : [];
    const p = Array.isArray(rows) ? rows[0] : null;

    let title;
    let description;
    let image;
    if (p) {
      const street = titleCase(p.address);
      const place = [titleCase(p.city), p.state || 'AZ'].filter(Boolean).join(', ');
      const facts = [
        p.bedrooms ? `${p.bedrooms} bd` : '',
        p.bathrooms ? `${p.bathrooms} ba` : '',
        p.square_feet > 0 ? `${p.square_feet.toLocaleString('en-US')} sq ft` : '',
      ].filter(Boolean).join(' · ');
      title = `${money(p.price)} · ${street}, ${place}`;
      description = `${facts}${facts ? '. ' : ''}${street}, ${place} ${p.zip_code || ''}. Shared by the Crandell Real Estate Team, Balboa Realty.`.trim();
      image = sharePhoto(p.primary_photo_url || (Array.isArray(p.images) ? p.images[0] : ''));
    } else {
      title = 'This home is no longer on the market · Crandell Real Estate Team';
      description = 'See similar homes for sale in the East Valley with the Crandell Real Estate Team, Balboa Realty.';
      image = '';
    }

    const canonical = `${url.origin}/PropertyDetail?id=${id}`;
    const tags = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(description)}" />`,
      `<link rel="canonical" href="${esc(canonical)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Crandell Real Estate Team" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      ...(image ? [
        `<meta property="og:image" content="${esc(image)}" />`,
        `<meta property="og:image:alt" content="${esc(p ? `Photo of ${titleCase(p.address)}` : '')}" />`,
        `<meta name="twitter:image" content="${esc(image)}" />`,
      ] : []),
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
    ].join('\n    ');

    // Drop the generic tags, then add the listing ones.
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
      .replace(/<\/head>/i, `    ${tags}\n  </head>`);

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch {
    return; // never break the page over a preview
  }
}
