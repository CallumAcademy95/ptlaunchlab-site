declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

type TrackParams = Record<string, string | number | boolean | undefined>;

type Touch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  msclkid?: string;
  ttclid?: string;
  landing_path?: string;
  referrer?: string;
};

function readTouch(key: string): Touch {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Touch) : {};
  } catch {
    return {};
  }
}

// Shared envelope for every event — same shape as Tracking.tsx pushes to
// dataLayer for auto-events, so GA4 reports stay consistent across
// auto-fired (cta_clicked, scroll_depth) and manually-fired (quiz_*,
// book_call_*, enrolment_*) events.
function enrich(eventName: string, params: TrackParams = {}) {
  if (typeof window === "undefined") return null;
  const first = readTouch("ptll_first_touch");
  const last = readTouch("ptll_last_touch");
  return {
    event: eventName,
    page_path: window.location.pathname,
    page_referrer: document.referrer,
    first_touch_source: first.utm_source ?? "(direct)",
    first_touch_medium: first.utm_medium ?? "(none)",
    first_touch_campaign: first.utm_campaign ?? "(none)",
    last_touch_source: last.utm_source ?? first.utm_source ?? "(direct)",
    last_touch_medium: last.utm_medium ?? first.utm_medium ?? "(none)",
    last_touch_campaign: last.utm_campaign ?? first.utm_campaign ?? "(none)",
    fbclid: first.fbclid ?? last.fbclid ?? "",
    gclid: first.gclid ?? last.gclid ?? "",
    ...params,
  };
}

export function trackEvent(eventName: string, params?: TrackParams) {
  if (typeof window === "undefined") return;
  const payload = enrich(eventName, params);
  if (!payload) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }
}
