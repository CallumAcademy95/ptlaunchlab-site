import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import {
  createCheckoutSession,
  resolveCheckout,
  COURSE_PLANS,
  ENROL_SUCCESS_URL,
} from "@/app/lib/stripeCheckout";
import { getGymByPartnerSlug } from "@/app/lib/gyms";
import { sanitizeAttribution } from "@/app/lib/attribution";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/checkout
//
// Turns the enrolment flow's chosen plan — "pif" (£999.99) or "monthly"
// (10 × £99.99) — into a server-created Stripe Checkout Session whose
// `success_url` points at /enrol/success.
//
// Previously the browser redirected straight to the Payment Link and relied on
// a redirect configured in the Stripe Dashboard. Two of the three links never
// had one set, so those buyers paid and were dumped on stripe.com, never
// completing enrolment. See app/lib/stripeCheckout.ts for the full history.
//
// The client chooses a plan; the price comes from the server-side plan config
// and nothing in the request can change it. resolveCheckout() decides any
// discount server-side:
//   - ATP Fitness Felixstowe's page also sells "six_month" (£599 + 5 × £200)
//     and "pif_1599", which takes a member code (ATPPT / ATP500) checked against
//     an ATP-only map. Any other gym: those plans are refused and codes ignored.
//   - a gym that set a member saving gets it on its own pay-in-full, looked up
//     from that gym's config by gymSlug, if its Stripe coupon is configured.
//
// Body: { plan: "pif" | "monthly" | "six_month" | "pif_1599", memberCode?,
//         clientReferenceId?, email?, name?, gymReferral?, gymSlug?,
//         cancelPath?, attribution? }
// Returns: { url } on success; { url: null, reason: "invalid-code" } for a code
//          ATP's page does not recognise; or { url: null } so the client falls
//          back to the plan's raw Payment Link (or shows a contact message).
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
// making a real payment to find out.
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
    plans: Object.fromEntries(
      Object.values(COURSE_PLANS).map((p) => [p.choice, { price: p.price, checkoutPence: p.checkoutPence }]),
    ),
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

  const str = (v: unknown, max = 300) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
  const gymSlug = str(body.gymSlug, 60);

  const resolved = resolveCheckout(
    { plan: body.plan, gymSlug, memberCode: body.memberCode },
    getGymByPartnerSlug(gymSlug)?.memberSavingPence ?? 0,
    process.env,
  );
  if (!resolved.ok) {
    // Unknown plan: the client falls back to its own error handling.
    // Invalid code: the client says "that code isn't valid" and charges nothing.
    return NextResponse.json({ url: null, reason: resolved.reason });
  }
  const plan = resolved.plan;

  const session = await createCheckoutSession({
    plan,
    clientReferenceId: str(body.clientReferenceId, 200),
    email: str(body.email, 200),
    name: str(body.name, 200),
    gymReferral: str(body.gymReferral, 100),
    gymSlug,
    cancelPath: str(body.cancelPath, 200),
    attribution: sanitizeAttribution(body.attribution),
  }, resolved);

  if (!session) {
    return NextResponse.json({ url: null, reason: "stripe-unavailable" });
  }

  return NextResponse.json({ url: session.url, id: session.id });
}
