import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "quit-9-5-become-a-personal-trainer":          "personal-trainer-course-with-business-support",
  "how-to-become-an-online-personal-trainer":    "how-to-become-a-personal-trainer",
  "how-to-become-a-personal-trainer-uk-online":  "how-to-become-a-personal-trainer",
  "change-career-to-fitness-uk":                 "career-change-personal-trainer",
  "online-pt-qualification":                     "online-pt-qualification-uk",
  "personal-trainer-courses-for-career-change":  "career-change-personal-trainer",
  "start-your-own-personal-training-business-uk": "start-your-own-personal-training-business",
  "pt-courses-that-include-business-training":   "pt-courses-with-business-training",
  "personal-training-course-business-support":   "personal-training-course-with-business-support",
};

// Base routes that exist only as /[slug]/[location] with no root page.tsx
// (kept for any legacy references — main redirects now handled in SLUG_REDIRECTS)
const BASE_ONLY_REDIRECTS: Record<string, string> = {};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals, static files, and API routes
  matcher: ["/((?!_next|api|favicon|icon|logo|.*\\..*).*)"],
};
