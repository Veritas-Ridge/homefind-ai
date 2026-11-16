// ============================================================================
// Brand assets and shared links (one place to change them)
// ----------------------------------------------------------------------------
// LOGO SLOT: the final horizontal lockup is still being produced. Until then
// the header renders a text wordmark matching crandellrealestate.com. To drop
// the new files in:
//   1. save the horizontal lockup as public/brand/logo-horizontal.svg (or .png)
//      and a light version for dark backgrounds as public/brand/logo-horizontal-light.svg
//   2. set LOGO.horizontal / LOGO.horizontalLight below to those paths
// The slot is a fixed 40px tall box on desktop (32px on phones), so nothing
// around it moves.
// FAVICON: replace public/favicon.png (512x512) and public/brand/apple-touch-icon.png
// (180x180) with the phoenix emblem; index.html and manifest.json already
// point at them.
// ============================================================================

export const LOGO = {
  horizontal: null,       // e.g. '/brand/logo-horizontal.svg'
  horizontalLight: null,  // e.g. '/brand/logo-horizontal-light.svg' (footer)
  alt: 'Crandell Real Estate Team with Balboa Realty',
};

export const MAIN_SITE = 'https://crandellrealestate.com';

// The four lead paths on the main site. Each has one job and one form.
export const LEAD_PATHS = [
  { name: 'Buy', href: `${MAIN_SITE}/buy/` },
  { name: 'Sell', href: `${MAIN_SITE}/sell/` },
  { name: 'Move', href: `${MAIN_SITE}/move/` },
  { name: 'Invest', href: `${MAIN_SITE}/invest/` },
];

export const TEAM = {
  phoneDisplay: '(480) 544 1539',
  phoneTel: 'tel:+14805441539',
  email: 'tanner@crandellrealestate.com',
  calendly: 'https://calendly.com/crandellrealestate/30min',
  contact: `${MAIN_SITE}/contact/`,
  about: `${MAIN_SITE}/#about-home`,
  communities: `${MAIN_SITE}/#communities-home`,
  privacy: `${MAIN_SITE}/privacy-policy/`,
  terms: `${MAIN_SITE}/terms-of-service/`,
};

export const SOCIAL = [
  { name: 'Instagram', href: 'https://www.instagram.com/crandellrealestateteam/' },
  { name: 'Facebook', href: 'https://www.facebook.com/CrandellRealEstateTeam' },
  { name: 'YouTube', href: 'https://www.youtube.com/@crandellrealestateteam' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/crandellrealestate/' },
  { name: 'Google Maps', href: 'https://www.google.com/maps/place/Crandell+Real+Estate+Team/@33.2521594,-111.8840008,11z/data=!3m1!4b1!4m6!3m5!1s0x6f9414be500ae087:0x446f605f955819cc!8m2!3d33.251981!4d-111.7191899!16s%2Fg%2F11rrp7v2mn' },
  { name: 'Zillow', href: 'https://www.zillow.com/profile/tannercrandell' },
];
