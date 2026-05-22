/**
 * Edge-runtime security checks for form API routes.
 *
 * Called from middleware.ts on the specific form endpoints. Cheap checks
 * that fail fast before route handlers run. Returns null when the request
 * should proceed, or a NextResponse when it should be rejected.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = new Set([
  "/api/contact",
  "/api/quiz-submission",
  "/api/prospectus",
  "/api/gym-partnership",
  "/api/enrolments",
]);

// Max body size in bytes. Enrolments has a multi-step payload with optional
// promo code + GCSE fields — give it more room than the others.
const MAX_BODY: Record<string, number> = {
  "/api/contact":         8 * 1024,
  "/api/quiz-submission": 12 * 1024,
  "/api/prospectus":      4 * 1024,
  "/api/gym-partnership": 6 * 1024,
  "/api/enrolments":      32 * 1024,
};

// Origins allowed to POST to form endpoints. Apex + www + any *.vercel.app
// preview + localhost for dev. Anything else gets 403.
const ALLOWED_ORIGINS = [
  "https://ptlaunchlab.co.uk",
  "https://www.ptlaunchlab.co.uk",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deployments
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith(".vercel.app")) return true;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
  } catch {
    return false;
  }
  return false;
}

export function isProtectedFormPath(pathname: string): boolean {
  return PROTECTED_PATHS.has(pathname);
}

export function checkFormRequest(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;

  // Only POST is allowed
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 405 });
  }

  // Content-Type must be JSON
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 415 });
  }

  // Body size cap — fail fast before the handler reads/parses
  const max = MAX_BODY[pathname] ?? 8 * 1024;
  const cl = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (cl > max) {
    return NextResponse.json({ success: false, error: "Payload too large." }, { status: 413 });
  }

  // Origin check — required for state-changing requests
  const origin = req.headers.get("origin");
  // Some browsers omit Origin on same-origin POSTs from <form action>. We
  // accept that only if Referer is present and matches an allowed host.
  if (!origin) {
    const referer = req.headers.get("referer");
    if (!referer) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }
    try {
      const refOrigin = new URL(referer).origin;
      if (!isAllowedOrigin(refOrigin)) {
        return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }
  } else if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  return null;
}
