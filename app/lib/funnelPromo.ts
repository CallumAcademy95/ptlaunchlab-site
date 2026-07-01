import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Funnel promo — signed-cookie hard block
//
// When a lead submits the quiz or prospectus form we issue a signed cookie
// granting them a 48h window to redeem a £200 discount (£1,599 → £1,399).
// All "is the promo active?" checks happen server-side against the cookie's
// HMAC. The discounted Stripe Payment Link is never exposed in HTML/JS —
// only revealed via a 302 redirect from /api/funnel-promo/checkout after the
// cookie is validated.
//
// Cookie shape: `<base64url-payload>.<hex-hmac>` where payload is
// JSON: { source: string, exp: number (unix seconds) }.
// ─────────────────────────────────────────────────────────────────────────────

export const COOKIE_NAME = "ptll_promo";
export const WINDOW_MS = 48 * 60 * 60 * 1000;

export type FunnelSource = "quiz" | "prospectus" | "youtube" | "salary-calculator" | "book-call" | "career-planner";

export type PromoPayload = {
  source: FunnelSource;
  exp: number;
};

function secret(): string {
  const s = process.env.PTLL_PROMO_SECRET;
  if (!s || s.length < 16) {
    throw new Error("PTLL_PROMO_SECRET not set or too short (need 16+ chars)");
  }
  return s;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64");
}

export function signPromo(payload: PromoPayload): string {
  const json = JSON.stringify(payload);
  const body = b64urlEncode(Buffer.from(json, "utf8"));
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("hex");
  return `${body}.${mac}`;
}

export function verifyPromo(token: string | undefined | null): PromoPayload | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("hex");
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString("utf8")) as PromoPayload;
    if (!payload || typeof payload.exp !== "number" || typeof payload.source !== "string") {
      return null;
    }
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readPromoFromRequest(req: NextRequest): PromoPayload | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return verifyPromo(raw);
}

export function attachPromoCookie(res: NextResponse, source: FunnelSource): PromoPayload {
  const exp = Math.floor((Date.now() + WINDOW_MS) / 1000);
  const payload: PromoPayload = { source, exp };
  const token = signPromo(payload);
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: false, // client needs to know the cookie EXISTS to call /status, but value is HMAC-signed so tamper-proof
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(WINDOW_MS / 1000),
  });
  return payload;
}

// Stripe Payment Links — single source of truth
export const STRIPE_LINKS = {
  fullPif: "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",            // £1,599 one-off
  discountedPif:
    process.env.STRIPE_PAYMENT_LINK_FULL_DISCOUNTED ||
    "https://buy.stripe.com/fZuaER6ME7hi0Ma0o2fEk06",                    // £1,399 one-off (funnel only)
  deposit: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",             // £599 + 5×£200 (admin cancels 5th for funnel users)
} as const;

// client_reference_id encoder — mirrors the format the existing stripe-webhook
// already decodes (base64url-encoded JSON). Adding `funnel_promo` here means
// the webhook will surface it in GA4 + admin notifications without any extra
// decoding logic.
export function encodeClientRef(data: Record<string, string>): string {
  const json = JSON.stringify(data);
  return b64urlEncode(Buffer.from(json, "utf8"));
}
