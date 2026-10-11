// Client helper for POST /api/lead. Browser-only (reads localStorage/document),
// but kept a plain module so Node's test runner can load it; the "use client"
// boundary belongs to the components that import it.
import { attributionFromTouches, type Attribution } from "./attribution.ts";
import type { LeadIntent } from "./leads.ts";

// Durable counterpart to buildAttributionRef in EnrolmentFlow: sent as a
// structured field so it cannot be truncated.
export function readAttribution(): Attribution {
  try {
    const raw = (k: string): unknown => {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    };
    return attributionFromTouches(raw("ptll_first_touch"), raw("ptll_last_touch"));
  } catch {
    return {};
  }
}

export type SubmitLeadInput = {
  name: string;
  phone?: string;
  email: string;
  question?: string;
  intent: LeadIntent;
  source: string;
  gymSlug?: string;
  extra?: Record<string, unknown>;
  /** useFormSecurity().payload(): honeypot, time-trap and nonce, checked server-side as a spam flag. */
  _sec?: { hp: string; t: number; n: string };
  honeypot?: string;
};
export type SubmitLeadResult =
  | { ok: true; id: string; eventId: string; streamUrl?: string; track?: boolean }
  | { ok: false; field?: string; message: string };

const FALLBACK = "Something went wrong. Call us on 01977 285014 or try again.";

// Fires the Meta Pixel Lead ONLY after the server confirms the lead is saved,
// deduplicated against the server-side CAPI event by eventID. A saved TEST or
// spam row comes back with track: false and fires nothing.
export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        ...input,
        utm: readAttribution(),
        referrer: document.referrer || undefined,
        pagePath: location.pathname,
      }),
    });
    const data = (await res.json().catch(() => null)) as SubmitLeadResult | null;
    if (res.ok && data && data.ok) {
      if (data.track !== false) try {
        const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
        fbq?.("track", "Lead", { content_name: input.intent }, { eventID: data.eventId });
      } catch {
        /* tracking never breaks a saved lead */
      }
      return data;
    }
    return data && !data.ok && typeof data.message === "string" ? data : { ok: false, message: FALLBACK };
  } catch {
    return { ok: false, message: FALLBACK };
  } finally {
    clearTimeout(timer);
  }
}
