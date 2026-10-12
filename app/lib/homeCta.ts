// The home page's two points of sale. Pure so it's unit-tested.
import { COURSE_PRICE_LABEL } from "./pricing.ts";

export const HOME_CTA_SOURCES = ["home-hero", "home-proof", "home-pain", "home-how", "home-pricing", "home-founders", "home-reviews", "home-partners", "home-final", "home-sticky"] as const;
export type HomeCtaSource = (typeof HOME_CTA_SOURCES)[number];
export const ENROL_HREF = "/enrol";
export function enrolLabel(withPrice: boolean): string {
  return withPrice ? `Enrol ${COURSE_PRICE_LABEL}` : "Enrol now";
}
export const CALL_QUESTION = { label: "Best time to call? (optional)", options: ["Morning", "Afternoon", "Evening"] };
export function callSuccessMessage(first: string): string {
  return `Thanks ${first}, we'll call you today.`;
}

/** Where every "Book a free call" control points. Without JS (or without a
 *  CallModalProvider on the page) the link simply navigates here. */
export const CALL_HREF = "/book-call";

/** A plain left click opens the pop-up; Ctrl/Cmd/Shift/Alt or middle clicks
 *  keep the browser's own behaviour (new tab, new window) on /book-call. */
export function shouldOpenCallModal(e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }): boolean {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export type GaEvent = { name: string; params: Record<string, string> };

/** GA events the old home page fired, kept alongside cta_click so existing
 *  GA4 key events and reports keep counting (cfd1cd9 FinalCTA.tsx and
 *  ConversionSection.tsx). */
export const LEGACY_EVENTS = {
  /** FinalCTA "Discover Your Pathway" (/book-call) → home-final "Book a free call". */
  finalCall: { name: "book_call_click", params: { location: "final_cta" } },
  /** FinalCTA "Start Today" (/enrol) → home-final "Enrol now". */
  finalEnrol: { name: "enrol_click", params: { location: "final_cta" } },
  /** ConversionSection pay-in-full button → PriceBlock "Enrol now". */
  pricingFull: { name: "enrol_click", params: { method: "full" } },
  /** ConversionSection "Start Paying Monthly" (method deposit) → PriceBlock "Prefer 10 monthly payments…" link. */
  pricingMonthly: { name: "enrol_click", params: { method: "deposit" } },
  /** ConversionSection "book a call" link → PriceBlock "Not sure? Book a free call". */
  pricingCall: { name: "book_call_click", params: { location: "conversion_section" } },
} as const satisfies Record<string, GaEvent>;

/** The GA events one CTA click sends: cta_click, then its legacy event if any. */
export function ctaClickEvents(source: string, action: "enrol" | "call", legacy?: GaEvent): [string, Record<string, string>][] {
  const out: [string, Record<string, string>][] = [["cta_click", { source, action }]];
  if (legacy) out.push([legacy.name, { ...legacy.params }]);
  return out;
}
