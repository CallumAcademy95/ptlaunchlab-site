// Booking tokens. Pure (node:crypto only).
// - Link token (?t=): base64url(JSON {l: consultation id, t: call type, e: expiry ms})
//   + "." + base64url(HMAC-SHA256(secret, payload)). The setter app signs the
//   identical format (APP lib/setter/booking-link.ts); both test one fixed vector.
// - Manage token: 32 random bytes; only its sha256 hex is stored.
import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { CallType } from "./callTypes.ts";

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");

export function signLinkToken(p: { leadId: string; callType: CallType; expMs: number }, secret: string): string {
  const payload = b64(JSON.stringify({ l: p.leadId, t: p.callType, e: p.expMs }));
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function verifyLinkToken(token: string, secret: string, nowMs: number): { leadId: string; callType: CallType } | null {
  if (typeof token !== "string" || !secret) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const want = createHmac("sha256", secret).update(payload).digest();
  let got: Buffer;
  try { got = Buffer.from(sig, "base64url"); } catch { return null; }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const j = JSON.parse(Buffer.from(payload, "base64url").toString()) as { l?: unknown; t?: unknown; e?: unknown };
    if (typeof j.l !== "string" || (j.t !== "consultation" && j.t !== "gym_partner") || typeof j.e !== "number") return null;
    if (nowMs > j.e) return null;
    return { leadId: j.l, callType: j.t };
  } catch {
    return null;
  }
}

export function hashManageToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newManageToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashManageToken(token) };
}
