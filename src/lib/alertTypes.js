// Engagement alert types (engagement_alerts.alert_type) → display label.
export const ALERT_TYPE_LABELS = {
  tour_request: 'Tour request',
  question: 'Question',
  agent_contact: 'Agent contact',
  engagement_drop: 'Engagement drop',
  other: 'Other',
};

export function alertTypeLabel(type) {
  return ALERT_TYPE_LABELS[type] || ALERT_TYPE_LABELS.other;
}

// Leads first: these need a same-day reply.
export const URGENT_ALERT_TYPES = new Set(['tour_request', 'question', 'agent_contact']);
