import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_MAX_AGE,
  constantTimeEqual,
  getAdminUsers,
  issueAuthCookieValue,
} from "@/app/lib/admin-auth";
import { logSec } from "@/app/lib/security/log";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin-auth
// Body: { password: string }
// On success: sets the signed admin auth cookie. Returns { success: true }.
// On failure: 401 + { success: false, error: string }
// ─────────────────────────────────────────────────────────────────────────────

const ENDPOINT = "/api/admin-auth";

// In-memory rate limiter, per serverless instance.
//
// HONEST LIMITATION: this does not throttle an attacker spread across many
// instances. It is deliberately NOT backed by the database — putting the DB in
// the login path means a Supabase blip locks you out of your own admin, which
// is a worse failure than the one it prevents. The mitigations that actually
// matter here are a strong password and the audit log below; treat this as
// friction, not a control. If real brute-force pressure ever shows up in the
// logs, move it to Vercel KV (shared, and outside the auth-critical path).
//
// Tightened from 8/5min to 5/15min: no legitimate admin needs eight guesses.
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getClientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return true;
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) return false;
  return true;
}

export async function POST(request: NextRequest) {
  const users = getAdminUsers();
  if (users.length === 0) {
    return NextResponse.json(
      { success: false, error: "Admin auth not configured (set ADMIN_USERS or ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  const key = getClientKey(request);
  if (!checkRateLimit(key)) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: ["admin-login", "rate-limit"], ip: key });
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  let body: { password?: string; user?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const submitted = (body.password || "").trim();
  if (!submitted) {
    return NextResponse.json({ success: false, error: "Password required." }, { status: 400 });
  }

  // Compare against EVERY configured user rather than short-circuiting on the
  // first match, so response time does not reveal which account exists. The
  // password alone identifies the user — no username field is required, which
  // keeps the existing login form working unchanged.
  let matched: string | null = null;
  for (const u of users) {
    if (constantTimeEqual(submitted, u.password)) matched = matched ?? u.id;
  }

  if (!matched) {
    logSec({
      level: "security",
      endpoint: ENDPOINT,
      outcome: "blocked-user",
      signals: ["admin-login", "bad-password"],
      ip: key,
      ua: request.headers.get("user-agent"),
    });
    return NextResponse.json(
      { success: false, error: "Incorrect password." },
      { status: 401 }
    );
  }

  // Reset rate-limit on successful auth
  attempts.delete(key);

  // Audit trail. logSec writes one JSON line to stdout, surfaced in Vercel Logs —
  // filter `level:security` + `admin-login` to see who signed in, when, from where.
  logSec({
    level: "security",
    endpoint: ENDPOINT,
    outcome: "accepted",
    signals: ["admin-login", `user:${matched}`],
    ip: key,
    ua: request.headers.get("user-agent"),
  });

  let cookieValue: string;
  try {
    cookieValue = await issueAuthCookieValue(matched);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Auth setup error." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_AUTH_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_AUTH_MAX_AGE,
  });
  return res;
}
