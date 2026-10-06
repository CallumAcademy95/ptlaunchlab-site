// Durable enrolment-source tracking. Pure and import-free so Node's test
// runner can load it directly.
//
// Attribution used to live only in the base64 client_reference_id blob, which
// Stripe caps at 200 chars and which therefore truncated. This module turns the
// first/last-touch records in localStorage into a small flat object that is
// sent to the server, sanitised there, and stamped into Stripe metadata
// (`attr_*`) where nothing truncates it.

export type Attribution = {
  /** first touch: source, medium, campaign, content, landing path, referrer host */
  fts?: string;
  ftm?: string;
  ftc?: string;
  ftco?: string;
  ftl?: string;
  ftr?: string;
  /** last touch (only present when it differs from first touch) */
  lts?: string;
  ltm?: string;
  ltc?: string;
  ltco?: string;
  ltl?: string;
  fbclid?: string;
  gclid?: string;
};

const KEYS: (keyof Attribution)[] = [
  "fts", "ftm", "ftc", "ftco", "ftl", "ftr",
  "lts", "ltm", "ltc", "ltco", "ltl",
  "fbclid", "gclid",
];

const CLICK_ID_MAX = 200;
const VALUE_MAX = 120;
const STRIPE_VALUE_MAX = 500;
const MAX_KEYS = 15;

function obj(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
}

function str(x: unknown): string | undefined {
  return typeof x === "string" && x.trim() ? x.trim() : undefined;
}

function hostOf(referrer: string | undefined): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).hostname || undefined;
  } catch {
    return undefined;
  }
}

export function attributionFromTouches(first: unknown, last: unknown): Attribution {
  const f = obj(first);
  const l = obj(last);
  const out: Attribution = {};
  const set = (k: keyof Attribution, v: string | undefined) => {
    if (v) out[k] = v;
  };

  set("fts", str(f.utm_source));
  set("ftm", str(f.utm_medium));
  set("ftc", str(f.utm_campaign));
  set("ftco", str(f.utm_content));
  set("ftl", str(f.landing_path));
  set("ftr", hostOf(str(f.referrer)));

  const differs = (a: unknown, b: unknown) => {
    const lv = str(a);
    return lv && lv !== str(b) ? lv : undefined;
  };
  set("lts", differs(l.utm_source, f.utm_source));
  set("ltm", differs(l.utm_medium, f.utm_medium));
  set("ltc", differs(l.utm_campaign, f.utm_campaign));
  set("ltco", differs(l.utm_content, f.utm_content));
  set("ltl", differs(l.landing_path, f.landing_path));

  set("fbclid", str(f.fbclid));
  set("gclid", str(f.gclid));
  return out;
}

export function sanitizeAttribution(x: unknown): Attribution {
  const src = obj(x);
  const out: Attribution = {};
  for (const k of KEYS) {
    const v = str(src[k]);
    if (!v) continue;
    const max = k === "fbclid" || k === "gclid" ? CLICK_ID_MAX : VALUE_MAX;
    out[k] = v.slice(0, max);
  }
  return out;
}

export function attributionMetadata(a: Attribution): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEYS) {
    if (Object.keys(out).length >= MAX_KEYS) break;
    const v = str(a?.[k]);
    if (v) out[`attr_${k}`] = v.slice(0, STRIPE_VALUE_MAX);
  }
  return out;
}

const REF_VALUE_MAX = 40;
const REF_MAX = 200;

/**
 * The funnel route's client_reference_id. Stripe rejects a session whose
 * client_reference_id exceeds 200 chars, and the buyer then falls back to the raw
 * Payment Link (skipping /enrol/success), so this must never overflow. Values are
 * capped at 40 chars here (full values live in attr_* metadata); if the encoded
 * result is still too long we keep only the funnel marker.
 */
export function buildFunnelClientRef(
  a: Attribution,
  funnelPromo: string | undefined,
  encode: (data: Record<string, string>) => string,
): string {
  const cap = (v: string | undefined) => (v ? v.slice(0, REF_VALUE_MAX) : undefined);
  const data: Record<string, string> = {
    fts: cap(a.fts) ?? "(direct)",
    ftm: cap(a.ftm) ?? "(none)",
    ftc: cap(a.ftc) ?? "(none)",
  };
  if (funnelPromo) data.funnel_promo = funnelPromo;
  const ref = encode(data);
  if (ref.length <= REF_MAX) return ref;
  return encode(funnelPromo ? { funnel_promo: funnelPromo } : {}).slice(0, REF_MAX);
}
