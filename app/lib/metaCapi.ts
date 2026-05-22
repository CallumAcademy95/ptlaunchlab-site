import crypto from "node:crypto";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Meta Conversions API (CAPI) helper
//
// Server-side event sender for Meta Pixel. Recovers ~30% of conversions that
// browser-side Pixel misses (iOS/Safari ITP, ad-blockers, closed-tab thank-you
// pages). Pairs with the browser-side `fbq` calls via `event_id` for dedup —
// Meta merges duplicate events within a 7-day window on `event_name + event_id`.
//
// All PII (email, phone, names) is SHA-256 hashed before transmission per
// Meta's requirements. Raw values never leave the server.
//
// Fails gracefully: every call wrapped in try/catch + non-blocking. CAPI
// telemetry MUST NEVER break a user's checkout or form submission.
//
// Setup (one-time, Meta Events Manager):
//   1. Events Manager → your pixel → Settings → Conversions API → Generate
//      Access Token. Copy long-lived token.
//   2. Vercel env:
//        META_PIXEL_ID            = 1988881834762642
//        META_CAPI_ACCESS_TOKEN   = <generated token>
//        META_CAPI_TEST_EVENT_CODE = TEST12345  (optional, for Test Events tab)
//   3. Events Manager → Test Events tab → enter TEST_EVENT_CODE, fire a test
//      event from this code, confirm it lands.
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_API_VERSION = "v18.0";

export type MetaCapiEventName =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "Schedule"
  | "InitiateCheckout"
  | "Purchase"
  | "CompleteRegistration";

export type MetaCapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;          // ISO 3166-1 alpha-2 lowercase ("gb")
  postcode?: string;
  externalId?: string;       // any stable id (e.g. user id from your DB)
  fbp?: string;              // _fbp cookie value
  fbc?: string;              // _fbc cookie value (built from fbclid)
  clientIpAddress?: string;
  clientUserAgent?: string;
};

export type MetaCapiCustomData = {
  currency?: string;         // ISO 4217 ("GBP")
  value?: number;
  contentName?: string;
  contentCategory?: string;  // we use this for the avatar slug
  contentIds?: string[];
  contents?: Array<{ id: string; quantity?: number; item_price?: number }>;
  orderId?: string;
  status?: string;
  // Free-form custom keys — Meta accepts these for matching/optimisation but
  // doesn't surface them in standard reporting.
  [key: string]: unknown;
};

export type SendCapiEventInput = {
  eventName: MetaCapiEventName;
  /**
   * Stable id used for dedup with browser fbq events. Must match what the
   * browser sends in `fbq('track', name, {}, { eventID: '<this value>' })`.
   * If omitted, a random one is generated server-side — fine for events
   * that have no paired browser fbq (e.g. Stripe webhook Purchase if the
   * browser thank-you page is closed before firing).
   */
  eventId?: string;
  eventTime?: number;        // unix seconds; defaults to now
  eventSourceUrl?: string;   // where the conversion happened (URL)
  actionSource?: "website" | "system_generated" | "email" | "chat" | "physical_store" | "phone_call" | "other";
  userData?: MetaCapiUserData;
  customData?: MetaCapiCustomData;
};

function hashOptional(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  return crypto.createHash("sha256").update(trimmed).digest("hex");
}

function normalisePhone(phone: string): string {
  // Meta accepts digits only, with country code. Strip everything non-numeric.
  // UK numbers entered as "07..." get auto-prefixed with 44 + leading-zero drop.
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    // UK mobile / landline format
    digits = "44" + digits.slice(1);
  }
  return digits;
}

function buildUserDataPayload(user: MetaCapiUserData | undefined): Record<string, unknown> {
  if (!user) return {};
  const out: Record<string, unknown> = {};

  const em = hashOptional(user.email);
  if (em) out.em = [em];

  if (user.phone) {
    const ph = hashOptional(normalisePhone(user.phone));
    if (ph) out.ph = [ph];
  }

  const fn = hashOptional(user.firstName);
  if (fn) out.fn = [fn];

  const ln = hashOptional(user.lastName);
  if (ln) out.ln = [ln];

  const ct = hashOptional(user.city);
  if (ct) out.ct = [ct];

  const country = hashOptional(user.country);
  if (country) out.country = [country];

  const zp = hashOptional(user.postcode?.replace(/\s+/g, ""));
  if (zp) out.zp = [zp];

  // External id is hashed too per Meta spec when it's not already opaque.
  const extId = hashOptional(user.externalId);
  if (extId) out.external_id = [extId];

  // Pixel-paired fields — NOT hashed (Meta uses them raw to merge with Pixel)
  if (user.fbp) out.fbp = user.fbp;
  if (user.fbc) out.fbc = user.fbc;
  if (user.clientIpAddress) out.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) out.client_user_agent = user.clientUserAgent;

  return out;
}

/**
 * Send a Conversions API event. Returns the parsed Meta response on success,
 * or null on any failure (logged but never thrown). Safe to await in critical
 * paths because it cannot break the calling request.
 */
export async function sendCapiEvent(input: SendCapiEventInput): Promise<unknown | null> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    // Don't spam logs on every event — log once per cold start by checking a
    // module-level flag. For now keep it simple and log every call until the
    // env vars are set, so the user sees the message in Vercel logs.
    console.warn("[meta-capi] META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set — skipping event:", input.eventName);
    return null;
  }

  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000);
  const eventId = input.eventId ?? crypto.randomUUID();
  const actionSource = input.actionSource ?? "website";

  const event = {
    event_name: input.eventName,
    event_time: eventTime,
    event_id: eventId,
    event_source_url: input.eventSourceUrl,
    action_source: actionSource,
    user_data: buildUserDataPayload(input.userData),
    custom_data: input.customData ?? undefined,
  };

  const body: Record<string, unknown> = {
    data: [event],
    // Meta strongly recommends including the access_token in the BODY rather
    // than as a query param when sending POST requests — both work, but body
    // keeps it out of any intermediate logs.
    access_token: accessToken,
  };
  if (testEventCode) body.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[meta-capi] non-2xx ${res.status} for ${input.eventName}:`, text.slice(0, 300));
      return null;
    }
    return await res.json().catch(() => null);
  } catch (err) {
    console.error(`[meta-capi] dispatch failed for ${input.eventName}:`, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for extracting browser-side identifiers from an incoming request.
// Meta strongly recommends sending fbp / fbc / IP / UA from the server so the
// CAPI event can be matched against the browser Pixel event. We pull them
// from the request automatically where possible.
// ─────────────────────────────────────────────────────────────────────────────

export function extractRequestUserData(req: NextRequest): Pick<MetaCapiUserData, "fbp" | "fbc" | "clientIpAddress" | "clientUserAgent"> {
  const fbp = req.cookies.get("_fbp")?.value;
  const fbcCookie = req.cookies.get("_fbc")?.value;
  // If no _fbc cookie but we have an fbclid in the URL, synthesise one.
  // Format per Meta: fb.<subdomainIndex>.<creation_time_ms>.<fbclid>
  const fbclid = req.nextUrl.searchParams.get("fbclid");
  const fbc = fbcCookie || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);

  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || undefined;
  const ua = req.headers.get("user-agent") || undefined;

  return {
    fbp: fbp || undefined,
    fbc: fbc || undefined,
    clientIpAddress: ip,
    clientUserAgent: ua,
  };
}

/**
 * Generate a deterministic event_id from a stable input (e.g. Stripe session
 * id, our own quiz submission id). Useful when we want the server-side event
 * to dedup against a browser-side event that will fire using the same id, but
 * we can't pass a random UUID through the redirect chain.
 */
export function deterministicEventId(prefix: string, ...parts: string[]): string {
  const input = [prefix, ...parts].filter(Boolean).join(":");
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}
