import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_MAX_AGE,
  constantTimeEqual,
  issueAuthCookieValue,
} from "@/app/lib/admin-auth";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin-auth
// Body: { password: string }
// On success: sets the signed admin auth cookie. Returns { success: true }.
// On failure: 401 + { success: false, error: string }
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// Tiny in-memory rate limiter (per server instance) so brute force across a
// single instance is throttled. Not bulletproof across serverless instances —
// add a Supabase rate-limit table later if traffic grows.
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 min
const MAX_ATTEMPTS = 8;

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
  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: "Admin auth not configured (ADMIN_PASSWORD missing)." },
      { status: 500 }
    );
  }

  const key = getClientKey(request);
  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again in 5 minutes." },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const submitted = (body.password || "").trim();
  if (!submitted) {
    return NextResponse.json({ success: false, error: "Password required." }, { status: 400 });
  }

  if (!constantTimeEqual(submitted, ADMIN_PASSWORD)) {
    return NextResponse.json(
      { success: false, error: "Incorrect password." },
      { status: 401 }
    );
  }

  // Reset rate-limit on successful auth
  attempts.delete(key);

  let cookieValue: string;
  try {
    cookieValue = await issueAuthCookieValue();
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
