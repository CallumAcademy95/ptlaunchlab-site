// Server-created Stripe Checkout Sessions.
//
// WHY THIS EXISTS
// ───────────────
// The enrolment flow used to send buyers straight to a Stripe Payment Link.
// The post-payment return URL on a Payment Link lives in the Stripe Dashboard,
// NOT in this repo — so it can silently drift out of sync with the code.
//
// It did. The £599 deposit link and the £1,399 funnel link were both left on
// Stripe's default "stripe.com" landing page, which meant every buyer who used
// them paid and was never returned to /enrol/success — the page that collects
// the NCFE learner record and the signed learner agreement. Eight paying
// customers were lost that way between Nov 2025 and Jul 2026 before it was
// caught.
//
// Creating the session here puts `success_url` in version control, where it
// gets code-reviewed and deployed like everything else. It cannot drift again.
//
// FAIL-SAFE: every caller MUST fall back to the raw Payment Link URL if this
// returns null. This sits on the money path — a Stripe outage, a missing
// permission or a bad price ID must never leave a buyer unable to pay. The
// fallback is exactly the old behaviour (buyer pays, lands on stripe.com,
// admin chases via the /api/stripe-webhook reconciliation email).
//
// REQUIRED STRIPE KEY PERMISSIONS
//   STRIPE_SECRET_KEY needs "Checkout Sessions → write".
//   The current restricted key (rk_live_…GBxkR2) does NOT have it — enable it
//   at Dashboard → Developers → API keys → [key] → Edit permissions, or this
//   silently falls back to Payment Links on every request.

export const SITE_URL = "https://ptlaunchlab.co.uk";

// The buyer lands here after paying and completes the enrolment record.
// {CHECKOUT_SESSION_ID} is substituted by Stripe.
export const ENROL_SUCCESS_URL = `${SITE_URL}/enrol/success?session_id={CHECKOUT_SESSION_ID}`;

// ─── Payment Link → Price mapping ────────────────────────────────────────────
// Keyed by the Payment Link URLs already hard-coded across the enrol pages so
// callers keep choosing the destination exactly as they do today — this module
// only changes HOW the buyer gets there, never WHICH product they buy.
//
// Price IDs were read off live checkout sessions created by each link, so the
// product, price and any product-scoped coupons stay identical.
// `allowPromotionCodes` likewise mirrors each link's current setting: only the
// £1,599 PIF link accepts codes at Stripe checkout (that's how the partner gym
// discounts are applied).
interface LinkConfig {
  price: string;
  amount: number;                 // GBP, for logging/telemetry only — Stripe charges off the price ID
  label: string;
  allowPromotionCodes: boolean;
}

export const PAYMENT_LINK_PRICES: Record<string, LinkConfig> = {
  // £1,599 pay-in-full — the shared PIF link used by /enrol and every gym page
  "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f": {
    price: "price_1SffDN99z9lThumnkdXLn1LW",
    amount: 1599,
    label: "NCFE Level 3 Diploma in Gym Instructing and Personal Training",
    allowPromotionCodes: true,
  },
  // £599 deposit (+ 5×£200 collected separately) — the shared deposit link
  "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05": {
    price: "price_1Rxmab99z9lThumnJ1f7EEXb",
    amount: 599,
    label: "DEPOSIT - NCFE LEVEL 2&3 PERSONAL TRAINING DIPLOMA",
    allowPromotionCodes: false,
  },
  // £1,399 pay-in-full — funnel-promo only, never exposed in the client bundle
  "https://buy.stripe.com/fZuaER6ME7hi0Ma0o2fEk06": {
    price: "price_1RxmYD99z9lThumnc9W37CX7",
    amount: 1399,
    label: "NCFE LEVEL 2&3 PERSONAL TRAINING DIPLOMA",
    allowPromotionCodes: false,
  },
};

// Strip query/hash so a link carrying ?client_reference_id=… still matches.
export function normaliseLink(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function priceForLink(url: string): LinkConfig | null {
  return PAYMENT_LINK_PRICES[normaliseLink(url)] ?? null;
}

// ─── Stripe form encoding ────────────────────────────────────────────────────
// Stripe's REST API takes application/x-www-form-urlencoded with bracketed
// nested keys (line_items[0][price], metadata[gym_referral], …). The repo
// deliberately has no `stripe` npm dependency — /api/stripe-webhook already
// hand-rolls signature verification — so encode it here rather than adding one.
type FormValue = string | number | boolean | null | undefined | FormValue[] | { [k: string]: FormValue };

function encodeForm(obj: Record<string, FormValue>, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    const k = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === "object") {
          parts.push(...encodeForm(item as Record<string, FormValue>, `${k}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${k}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === "object") {
      parts.push(...encodeForm(value as Record<string, FormValue>, k));
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

// ─── Session creation ────────────────────────────────────────────────────────
export interface CheckoutSessionInput {
  /** The Payment Link URL this buyer would have been sent to — decides the price. */
  paymentLink: string;
  /** Base64url attribution blob; /api/stripe-webhook decodes it for GA4 + Meta CAPI. */
  clientReferenceId?: string;
  email?: string;
  name?: string;
  gymReferral?: string;
  promoCode?: string;
  funnelPromo?: string;
  /** Where to send a buyer who backs out of Stripe. Must be a ptlaunchlab.co.uk path. */
  cancelPath?: string;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

/**
 * Creates a Stripe Checkout Session with the return URL baked in.
 * Returns null on ANY failure — callers must fall back to `paymentLink`.
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[stripeCheckout] STRIPE_SECRET_KEY not set — falling back to Payment Link");
    return null;
  }

  const config = priceForLink(input.paymentLink);
  if (!config) {
    // An enrol page is pointing at a Payment Link we have no price for. The
    // buyer still gets to Stripe via the fallback, but the return URL for that
    // link must be set in the Dashboard until it's added to the map above.
    console.error(
      `[stripeCheckout] no price mapped for ${normaliseLink(input.paymentLink)} — falling back to Payment Link. Add it to PAYMENT_LINK_PRICES.`,
    );
    return null;
  }

  const cancelPath = input.cancelPath && input.cancelPath.startsWith("/") ? input.cancelPath : "/enrol";

  const body = encodeForm({
    mode: "payment",
    line_items: [{ price: config.price, quantity: 1 }],
    success_url: ENROL_SUCCESS_URL,
    cancel_url: `${SITE_URL}${cancelPath}`,
    // Prefills the email on Stripe's page, same as the old ?prefilled_email=
    customer_email: input.email?.trim().toLowerCase(),
    client_reference_id: input.clientReferenceId,
    allow_promotion_codes: config.allowPromotionCodes,
    // Metadata is the durable, structured home for this — the base64
    // client_reference_id blob is capped at 200 chars and drops fields when
    // full. The webhook already prefers metadata over the blob.
    metadata: {
      plan: config.amount >= 1300 ? "PIF" : "deposit",
      buyer_name: input.name?.trim().slice(0, 200),
      gym_referral: input.gymReferral,
      promo_code: input.promoCode,
      funnel_promo: input.funnelPromo,
      source: "api-checkout-session",
    },
  }).join("&");

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !json.url || !json.id) {
      console.error(
        `[stripeCheckout] create failed (${res.status}): ${json.error?.message ?? "no url returned"} — falling back to Payment Link`,
      );
      return null;
    }
    return { id: json.id, url: json.url };
  } catch (err) {
    console.error("[stripeCheckout] request threw — falling back to Payment Link:", err);
    return null;
  }
}
