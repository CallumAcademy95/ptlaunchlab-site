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
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /personal-trainer-courses/[location] → /level-3-personal-trainer-course/[location]
  const coursesMatch = pathname.match(/^\/personal-trainer-courses\/([a-z][a-z0-9-]*)$/i);
  if (coursesMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/level-3-personal-trainer-course/${coursesMatch[1].toLowerCase()}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // Redirect /personal-trainer-courses (no location) → /level-3-personal-trainer-course
  if (pathname === "/personal-trainer-courses") {
    const url = request.nextUrl.clone();
    url.pathname = "/level-3-personal-trainer-course";
    return NextResponse.redirect(url, { status: 301 });
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
