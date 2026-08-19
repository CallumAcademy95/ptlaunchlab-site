import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import {
  createCheckoutSession,
  priceForLink,
  PAYMENT_LINK_PRICES,
  ENROL_SUCCESS_URL,
} from "@/app/lib/stripeCheckout";
import { resolvePromoCode } from "@/app/lib/promoCodes";
import { PARTNER_PROMO_PREFIXES } from "@/app/lib/partnerPromo";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/checkout
//
// Turns the enrolment flow's chosen Payment Link into a server-created Stripe
// Checkout Session whose `success_url` points at /enrol/success — the page
// that collects the NCFE learner record and signed agreement.
//
// Previously the browser redirected straight to the Payment Link and relied on
// a redirect configured in the Stripe Dashboard. Two of the three links never
// had one set, so those buyers paid and were dumped on stripe.com, never
// completing enrolment. See app/lib/stripeCheckout.ts for the full history.
//
// The client still decides WHICH link (partner config, promo, funnel) — this
// route only maps that link to its price and creates the session. Behaviour is
// otherwise identical to the old redirect.
//
// Body: { paymentLink, clientReferenceId?, email?, name?, gymReferral?,
//         promoCode?, cancelPath? }
// Returns: { url } on success, or { url: null } so the client falls back to
//          redirecting to the Payment Link directly. NEVER blocks the buyer.
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

const rateLimiter = createRateLimiter(10, 60_000); // 10/min per IP — retries at the pay step are normal
const healthLimiter = createRateLimiter(6, 60_000);

// ─── GET /api/checkout — deployment health check (admin cookie required) ─────
//
// This route fails SOFT by design: a missing STRIPE_SECRET_KEY or a key without
// "Checkout Sessions → write" silently drops buyers back onto the raw Payment
// Links, which is the exact silent breakage this whole change exists to stop.
// So there needs to be a way to ask production "is it actually on?" without
// paying £599 to find out.
//
// Confirms permission with an intentionally empty create call — Stripe checks
// key permissions before validating params, so 403 means no access and 400
// ("missing success_url") means we're good. Nothing is created either way.
export async function GET(req: NextRequest) {
  const { verifyAuthCookieValue, ADMIN_AUTH_COOKIE } = await import("@/app/lib/admin-auth");
  const authed = await verifyAuthCookieValue(req.cookies.get(ADMIN_AUTH_COOKIE)?.value).catch(() => false);
  if (!authed) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!healthLimiter(getIP(req))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({
      ok: false,
      keyPresent: false,
      canCreateSessions: false,
      detail: "STRIPE_SECRET_KEY is not set — every buyer is falling back to the raw Payment Link.",
    });
  }

  let canCreateSessions = false;
  let detail = "";
  try {
    const probe = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "",
    });
    const json = (await probe.json()) as { error?: { message?: string } };
    canCreateSessions = probe.status === 400; // param validation reached ⇒ permission granted
    detail = canCreateSessions
      ? "Key can create Checkout Sessions."
      : `Stripe refused (${probe.status}): ${json.error?.message ?? "unknown"}`;
  } catch (err) {
    detail = `Probe failed: ${String(err)}`;
  }

  return NextResponse.json({
    ok: canCreateSessions,
    keyPresent: true,
    keyType: key.startsWith("rk_") ? "restricted" : key.startsWith("sk_") ? "secret" : "unknown",
    canCreateSessions,
    mappedPaymentLinks: Object.keys(PAYMENT_LINK_PRICES).length,
    successUrl: ENROL_SUCCESS_URL,
    detail,
  });
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimiter(ip)) {
    // Don't 429 at the pay step — let the client fall back to the Payment Link.
    return NextResponse.json({ url: null, reason: "rate-limited" });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ url: null, reason: "bad-json" });
  }

  const paymentLink = typeof body.paymentLink === "string" ? body.paymentLink : "";
  if (!paymentLink || !priceForLink(paymentLink)) {
    // Unknown/absent link — client falls back and goes straight to Stripe.
    return NextResponse.json({ url: null, reason: "unmapped-link" });
  }

  const str = (v: unknown, max = 300) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

  // The browser sends the code STRING, never a promotion code id. Resolving it
  // again here means a tampered client cannot nominate an arbitrary discount.
  const promoCode = str(body.promoCode, 60);
  const gymSlug = str(body.gymSlug, 60);
  // Checked by shape, not truthiness — see app/api/promo/validate/route.ts,
  // whose guard this mirrors. A gymSlug of "constructor" or "__proto__"
  // resolves to a truthy non-array (an inherited function) that a plain
  // `prefix ? … : …` check would not catch.
  const prefix = gymSlug ? PARTNER_PROMO_PREFIXES[gymSlug] : undefined;
  const validPrefix = Array.isArray(prefix) && prefix.length > 0 ? prefix : undefined;
  const resolved = promoCode && validPrefix ? await resolvePromoCode(promoCode, validPrefix) : null;

  const session = await createCheckoutSession({
    paymentLink,
    clientReferenceId: str(body.clientReferenceId, 200),
    email: str(body.email, 200),
    name: str(body.name, 200),
    gymReferral: str(body.gymReferral, 100),
    gymSlug,
    promoCode,
    promoCodeId: resolved?.ok ? resolved.promoId : undefined,
    cancelPath: str(body.cancelPath, 200),
  });

  if (!session) {
    return NextResponse.json({ url: null, reason: "stripe-unavailable" });
  }

  return NextResponse.json({ url: session.url, id: session.id });
}
