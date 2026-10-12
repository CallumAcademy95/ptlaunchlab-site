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
