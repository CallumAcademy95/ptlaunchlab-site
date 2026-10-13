import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { targetForLocation } from "./app/lib/locationRedirects";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "./app/lib/admin-auth";
import { isProtectedFormPath, checkFormRequest } from "./app/lib/security/middleware-checks";
import { isProtectedPartnerPath, gatePartnerRequest } from "./app/lib/partner-session-edge";
import { isProtectedAdminPath } from "./app/lib/admin-paths";

// Paths that require a valid admin auth cookie — see app/lib/admin-paths.ts.
// Static files (anything with a dot, e.g. /admin/sw.js, /admin.webmanifest)
// never reach this middleware: the matcher below skips them.

export async function middleware(request: NextRequest) {
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

  // ─── Form endpoint hardening ─────────────────────────────────────────
  // Method + content-type + body-size + origin checks BEFORE the route
  // handler. Keeps the cheap stuff at the edge.
  if (isProtectedFormPath(pathname)) {
    const rejection = checkFormRequest(request);
    if (rejection) return rejection;
  }

  // ─── Admin auth gate ─────────────────────────────────────────────────
  if (isProtectedAdminPath(pathname)) {
    const cookie = request.cookies.get(ADMIN_AUTH_COOKIE);
    const ok = await verifyAuthCookieValue(cookie?.value);
    if (!ok) {
      // For API routes return 401 JSON; for pages redirect to login with `next` param
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Unauthenticated. Sign in at /admin/login." },
          { status: 401 }
        );
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Authed — fall through to the rest of the middleware (or the route handler)
  }

  // ─── Partner portal gate ─────────────────────────────────────────────
  // Separate auth system to the admin gate above: Supabase Auth sessions for
  // external gym partners. Returns early either way — the redirect rules below
  // are all for public marketing URLs and none of them can match /partners/*.
  if (isProtectedPartnerPath(pathname)) {
    return gatePartnerRequest(request);
  }

  // Old /blog and /blog/<slug> URLs from a previous site iteration. The blog
  // never made it onto the new Next.js site — podcast pages with full
  // transcripts cover similar topical ground, so forward all blog URLs to
  // /podcast for any inbound link / cached SERP result.
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/podcast";
    return NextResponse.redirect(url, { status: 301 });
  }

  // Old capitalised one-segment URLs from the previous site (/Paisley,
  // /Kingston-upon-Hull, /South-East-England). Single segment starting with a
  // capital letter; every real route is lowercase. One permanent hop straight to
  // the page that town now belongs to (app/lib/locationRedirects.ts). The pruned
  // /<template>/<town> URLs and old-site slug aliases are redirected in
  // next.config.ts, which runs before this middleware.
  const match = pathname.match(/^\/([A-Z][A-Za-z-]*)$/);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = targetForLocation(match[1]);
    return NextResponse.redirect(url, { status: 308 });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals and static files. We DO want
  // /admin and the protected /api/whatsapp-* routes to pass through the auth
  // gate above, so we no longer blanket-exclude /api here. The webhook is
  // unprotected by an explicit path check inside the middleware.
  matcher: [
    "/((?!_next|favicon|icon|logo|.*\\..*).*)",
  ],
};
