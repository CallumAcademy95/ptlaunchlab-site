import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hubSlugs, getHubForLocation } from "./app/lib/ukLocations";

/**
 * Redirect old site location URLs to the new structure.
 *
 * Old site: /Paisley, /Kingston-upon-Hull, /South-East-England
 * New site: /level-3-personal-trainer-course/paisley
 *
 * Detection rule: single path segment starting with a capital letter.
 * All current real routes are lowercase multi-word slugs, so this is safe.
 */

// Map old first-path-segment → new first-path-segment
const SLUG_REDIRECTS: Record<string, string> = {
  // Old site URL patterns
  "personal-trainer-courses":                    "level-3-personal-trainer-course",
  "personal-training-courses":                   "level-3-personal-trainer-course",
  "personal-trainer-course":                     "personal-trainer-course-with-business-support",
  "flexible-personal-trainer-course-uk":         "flexible-personal-trainer-course",
  "best-online-personal-trainer-course-uk":      "best-online-personal-trainer-course",
  "pt-course-payment-plan-uk":                   "pt-course-payment-plan",
  "pt-courses":                                  "pt-course",
  "online-personal-trainer":                     "online-personal-training-course",
  "ncfe-level-3-personal-training-course":       "ncfe-level-3-pt-qualification",
  "become-a-qualified-personal-trainer-uk":      "become-a-qualified-personal-trainer",
  // Old URL variants without an app directory
  // NOTE: quit-9-5-become-a-personal-trainer is intentionally NOT redirected here
  // — it has real pages at /quit-9-5-become-a-personal-trainer/[hub-location]
  "how-to-become-an-online-personal-trainer":    "how-to-become-a-personal-trainer",
  "how-to-become-a-personal-trainer-uk-online":  "how-to-become-a-personal-trainer",
  "change-career-to-fitness-uk":                 "career-change-personal-trainer",
  "online-pt-qualification":                     "online-pt-qualification-uk",
  "personal-trainer-courses-for-career-change":  "career-change-personal-trainer",
  "start-your-own-personal-training-business-uk": "start-your-own-personal-training-business",
  "pt-courses-that-include-business-training":   "pt-courses-with-business-training",
  "personal-training-course-business-support":   "personal-training-course-with-business-support",
};

// Base routes that exist only as /[slug]/[location] with no root page.tsx.
// Visiting without a location slug would 404 — redirect to the main course page.
const BASE_ONLY_REDIRECTS: Record<string, string> = {
  "accredited-personal-trainer-course":                  "/personal-trainer-course-with-business-support",
  "become-a-personal-trainer-online":                    "/personal-trainer-course-with-business-support",
  "become-a-qualified-personal-trainer":                 "/personal-trainer-course-with-business-support",
  "best-online-personal-trainer-course":                 "/personal-trainer-course-with-business-support",
  "career-change-personal-trainer":                      "/personal-trainer-course-with-business-support",
  "fast-track-personal-trainer-course":                  "/personal-trainer-course-with-business-support",
  "flexible-personal-trainer-course":                    "/personal-trainer-course-with-business-support",
  "gym-floor-personal-trainer":                          "/personal-trainer-course-with-business-support",
  "how-to-become-a-personal-trainer":                    "/personal-trainer-course-with-business-support",
  "hybrid-personal-trainer":                             "/personal-trainer-course-with-business-support",
  "level-2-3-personal-training":                         "/personal-trainer-course-with-business-support",
  "level-3-gym-instructing-and-personal-training-diploma": "/personal-trainer-course-with-business-support",
  "level-3-personal-trainer-course":                     "/personal-trainer-course-with-business-support",
  "ncfe-level-3-pt-qualification":                       "/personal-trainer-course-with-business-support",
  "ofqual-regulated-personal-trainer-course":            "/personal-trainer-course-with-business-support",
  "online-coaching-course":                              "/personal-trainer-course-with-business-support",
  "online-personal-training-course":                     "/personal-trainer-course-with-business-support",
  "online-pt-qualification-uk":                          "/personal-trainer-course-with-business-support",
  "personal-trainer-certification":                      "/personal-trainer-course-with-business-support",
  "personal-trainer-courses-online-uk":                  "/personal-trainer-course-with-business-support",
  "personal-trainer-diploma":                            "/personal-trainer-course-with-business-support",
  "personal-trainer-qualification-recognised-by-uk-gyms": "/personal-trainer-course-with-business-support",
  "personal-training-course-with-business-support":      "/personal-trainer-course-with-business-support",
  "personal-training-course-with-mentorship":            "/personal-trainer-course-with-business-support",
  "pt-course":                                           "/personal-trainer-course-with-business-support",
  "pt-course-payment-plan":                              "/personal-trainer-course-with-business-support",
  "pt-courses-with-business-training":                   "/personal-trainer-course-with-business-support",
  "quit-9-5-become-a-personal-trainer":                  "/personal-trainer-course-with-business-support",
  "start-your-own-personal-training-business":           "/personal-trainer-course-with-business-support",
};

// All route bases that use the [location] dynamic segment.
// When a request comes in for a non-hub location, it is 301-redirected to the
// nearest hub page — avoiding builds for ~420 spoke locations while keeping
// their URLs functional for any inbound links.
const LOCATION_ROUTE_BASES = new Set([
  "accredited-personal-trainer-course",
  "become-a-personal-trainer-online",
  "become-a-qualified-personal-trainer",
  "best-online-personal-trainer-course",
  "best-personal-trainer-course-uk",
  "career-change-personal-trainer",
  "fast-track-personal-trainer-course",
  "flexible-personal-trainer-course",
  "gym-floor-personal-trainer",
  "how-to-become-a-personal-trainer",
  "hybrid-personal-trainer",
  "level-2-3-personal-training",
  "level-3-gym-instructing-and-personal-training-diploma",
  "level-3-personal-trainer-course",
  "ncfe-level-3-pt-qualification",
  "ofqual-regulated-personal-trainer-course",
  "online-coaching-course",
  "online-personal-training-course",
  "online-pt-qualification-uk",
  "personal-trainer-certification",
  "personal-trainer-course-with-business-support",
  "personal-trainer-courses-online-uk",
  "personal-trainer-diploma",
  "personal-trainer-qualification-recognised-by-uk-gyms",
  "personal-training-course-with-business-support",
  "personal-training-course-with-mentorship",
  "pt-course",
  "pt-course-payment-plan",
  "pt-courses-with-business-training",
  "quit-9-5-become-a-personal-trainer",
  "start-your-own-personal-training-business",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect .vercel.app domain to canonical domain to prevent duplicate content
  // and avoid separate ISR cache entries being generated for the preview URL
  const host = request.headers.get("host") ?? "";
  if (host.includes("vercel.app")) {
    const url = request.nextUrl.clone();
    url.host = "ptlaunchlab.co.uk";
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

  // Redirect base-only routes that have no root page.tsx (exact match, no location)
  const exactSlug = pathname.replace(/^\//, "").toLowerCase();
  const baseRedirect = BASE_ONLY_REDIRECTS[exactSlug];
  if (baseRedirect && !pathname.slice(1).includes("/")) {
    const url = request.nextUrl.clone();
    url.pathname = baseRedirect;
    return NextResponse.redirect(url, { status: 301 });
  }

  // Handle old slug redirects (with or without a trailing /location segment)
  const segMatch = pathname.match(/^\/([a-z][a-z0-9-]*)(\/[a-z][a-z0-9-]*)?$/i);
  if (segMatch) {
    const oldSlug = segMatch[1].toLowerCase();
    const location = segMatch[2] ?? "";
    const newSlug = SLUG_REDIRECTS[oldSlug];
    if (newSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${newSlug}${location.toLowerCase()}`;
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  // Match /Something or /Something-Else — one segment, starts with capital
  const match = pathname.match(/^\/([A-Z][A-Za-z-]*)$/);
  if (match) {
    const slug = match[1].toLowerCase();
    const url = request.nextUrl.clone();
    url.pathname = `/level-3-personal-trainer-course/${slug}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // Hub & Spoke: redirect non-hub location slugs to their nearest hub page.
  // e.g. /pt-course/morley → /pt-course/leeds
  // Only applies to known location route bases, not gym partner pages (/6fit-academy/enrol etc.)
  const locationMatch = pathname.match(/^\/([a-z][a-z0-9-]+)\/([a-z][a-z0-9-]+)$/);
  if (locationMatch) {
    const routeBase = locationMatch[1];
    const locationSlug = locationMatch[2];
    if (LOCATION_ROUTE_BASES.has(routeBase) && !hubSlugs.includes(locationSlug)) {
      const hubSlug = getHubForLocation(locationSlug);
      if (hubSlug) {
        const url = request.nextUrl.clone();
        url.pathname = `/${routeBase}/${hubSlug}`;
        return NextResponse.redirect(url, { status: 301 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals, static files, and API routes
  matcher: ["/((?!_next|api|favicon|icon|logo|.*\\..*).*)"],
};
