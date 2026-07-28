// Middleware-side half of the partner portal auth. Edge-runtime safe — imports
// nothing from next/headers and never touches the service-role client.
//
// Two jobs:
//   1. Bounce anonymous requests to /partners/login before the page renders.
//   2. Refresh the Supabase access token and write the rotated cookies onto the
//      response, so a partner who leaves the tab open doesn't get logged out.
//
// The finer-grained checks (partner paused, must-change-password) need a
// database read and live in requirePartner() in ./partner-auth.ts instead.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Mirrors isProtectedAdminPath in middleware.ts. Kept as an explicit path check
 * so the middleware matcher does not need broadening.
 */
export function isProtectedPartnerPath(pathname: string): boolean {
  if (pathname === "/partners/login") return false;
  if (pathname === "/partners") return true;
  return pathname.startsWith("/partners/");
}

/**
 * Returns a redirect to the login page for anonymous requests, or a response
 * carrying any refreshed session cookies for authenticated ones.
 */
export async function gatePartnerRequest(request: NextRequest): Promise<NextResponse> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  // Fail closed. A misconfigured deploy must not leave /partners wide open.
  if (!url || !anonKey) {
    console.error("[partner-gate] SUPABASE_URL or SUPABASE_ANON_KEY missing — denying /partners.");
    return NextResponse.redirect(new URL("/partners/login?error=config", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/partners/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
