// ============================================================================
// Lead tracking (Google Tag Manager)
// ----------------------------------------------------------------------------
// Same standard as the main site funnels: each lead fires exactly one
// `lead_submit` event, tagged with its lead path and a unique transaction id.
// On the search tool the lead path is always "search" and lead_type says which
// action point produced it.
// ============================================================================

const LEAD_PATH = 'search';

function transactionId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// leadType: 'tour_request' | 'question' | 'registration' | 'saved_search'
export function trackLead(leadType, details = {}) {
  const id = transactionId();
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'lead_submit',
      lead_path: LEAD_PATH,
      lead_type: leadType,
      transaction_id: id,
      property_id: details.propertyId,
      mls_number: details.mls,
    });
  } catch { /* analytics must never break the lead */ }
  return id;
}
