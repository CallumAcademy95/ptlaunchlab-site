import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "./admin-auth";

// Defence in depth for admin-only route handlers: the middleware already gates
// these paths, but each handler re-checks the cookie so a matcher or path-list
// change can't silently open them up. Returns a 401 response, or null if OK.
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const ok = await verifyAuthCookieValue(req.cookies.get(ADMIN_AUTH_COOKIE)?.value).catch(() => false);
  if (ok) return null;
  return NextResponse.json(
    { ok: false, error: "Unauthenticated. Sign in at /admin/login." },
    { status: 401 }
  );
}
