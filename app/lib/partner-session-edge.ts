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
  // Reachable while signed out, by definition — these are how someone who
  // can't sign in gets back in.
  if (pathname === "/partners/login") return false;
  if (pathname === "/partners/forgot-password") return false;
  if (pathname === "/partners/reset-password") return false;
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
  //
  // The reason is named in the redirect because these two variables fail for
  // different reasons: only the anon key missing means it wasn't added to this
  // Vercel project, whereas BOTH missing means the middleware bundle has no env
  // at all — usually a redeploy that reused the build cache and kept the values
  // inlined from before the variables existed.
  if (!url || !anonKey) {
    const missing = !url && !anonKey ? "config-both" : !anonKey ? "config-key" : "config-url";
    console.error(`[partner-gate] denying /partners — ${missing} (SUPABASE_URL: ${Boolean(url)}, SUPABASE_ANON_KEY: ${Boolean(anonKey)})`);
    return NextResponse.redirect(new URL(`/partners/login?error=${missing}`, request.url));
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
