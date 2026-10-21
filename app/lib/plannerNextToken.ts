// app/lib/plannerNextToken.ts
// Ties the browser showing a Career Planner result to its own `leads` row, so
// /api/career-planner/next-step can only ever write to that row.
// Format: base64url(JSON {l: leadId, e: expiry ms}) + "." + base64url(HMAC-SHA256).
// Server-only (node:crypto). The secret is derived from the service-role key, so
// there is no new env var to set; rotating that key simply expires open tokens.
import { createHmac, timingSafeEqual } from "node:crypto";

export const NEXT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function nextTokenSecret(env: Record<string, string | undefined> = process.env): string {
  const k = env.SUPABASE_SERVICE_ROLE_KEY;
  return k ? createHmac("sha256", k).update("planner-next-step-v1").digest("hex") : "";
}

export function signNextToken(leadId: string, expMs: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ l: leadId, e: expMs })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function verifyNextToken(token: unknown, secret: string, nowMs: number): string | null {
  if (typeof token !== "string" || !secret) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const want = createHmac("sha256", secret).update(payload).digest();
  let got: Buffer;
  try { got = Buffer.from(sig, "base64url"); } catch { return null; }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const j = JSON.parse(Buffer.from(payload, "base64url").toString()) as { l?: unknown; e?: unknown };
    if (typeof j.l !== "string" || !j.l || typeof j.e !== "number" || nowMs > j.e) return null;
    return j.l;
  } catch {
    return null;
  }
}
