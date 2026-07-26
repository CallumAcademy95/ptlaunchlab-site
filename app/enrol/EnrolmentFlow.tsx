"use client";
import { useState, useEffect } from "react";
import { trackEvent } from "@/app/lib/gtag";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useFormSecurity } from "@/app/lib/security/client";
import {
  type PartnerConfig,
  ENROLMENT_CONTEXT_KEY,
  type EnrolmentContext,
  input,
  Field,
} from "./shared";

export type { PartnerConfig };

// ─── Stripe attribution helpers ──────────────────────────────────────────
// Encodes first/last touch UTMs + GA client_id into Stripe's
// `client_reference_id` (URL-safe base64, capped at 200 chars). The
// /api/stripe-webhook endpoint decodes this when checkout.session.completed
// fires and forwards it to GA4 Measurement Protocol as the `purchase` event.
function readTouch(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}
function readGaClientId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d\.\d\.(\d+\.\d+)/);
  return match?.[1] ?? "";
}
function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&");
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + escaped + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : "";
}
function urlSafeBase64(value: string): string {
  if (typeof window === "undefined") return "";
  // btoa needs a binary string — encode the UTF-8 bytes first
  const bytes = new TextEncoder().encode(value);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return window
    .btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function buildAttributionRef(gym?: string): string {
  try {
    const first = readTouch("ptll_first_touch");
    const last = readTouch("ptll_last_touch");
    // Short keys keep the payload under Stripe's 200-char client_reference_id limit
    const payload: Record<string, string> = {};
    if (gym) payload.gym = gym;
    if (first.utm_source) payload.fts = first.utm_source;
    if (first.utm_medium) payload.ftm = first.utm_medium;
    if (first.utm_campaign) payload.ftc = first.utm_campaign;
    if (last.utm_source && last.utm_source !== first.utm_source) payload.lts = last.utm_source;
    if (last.utm_medium && last.utm_medium !== first.utm_medium) payload.ltm = last.utm_medium;
    if (last.utm_campaign && last.utm_campaign !== first.utm_campaign) payload.ltc = last.utm_campaign;
    if (first.fbclid) payload.fbclid = first.fbclid;
    if (first.gclid) payload.gclid = first.gclid;
    // _fbp / _fbc are the Meta Pixel cookies. The Stripe webhook decodes
    // these out of client_reference_id and forwards them on the Purchase
    // CAPI event for higher EMQ. Read at the latest possible moment so
    // CookieYes-delayed pixel loads still get captured.
    const fbp = readCookie("_fbp");
    if (fbp) payload.fbp = fbp;
    const fbc = readCookie("_fbc");
    if (fbc) payload.fbc = fbc;
    const gaId = readGaClientId();
    if (gaId) payload.ga_client_id = gaId;

    return urlSafeBase64(JSON.stringify(payload)).slice(0, 200);
  } catch {
    return "";
  }
}

// Fallback path only — the direct-to-Payment-Link redirect used when
// /api/checkout can't create a session. Stripe Payment Links accept both
// `client_reference_id` and `prefilled_email` as query params.
function appendStripeAttribution(url: string, email: string, ref: string): string {
  try {
    const u = new URL(url);
    if (ref) u.searchParams.set("client_reference_id", ref);
    if (email) u.searchParams.set("prefilled_email", email.trim().toLowerCase());
    return u.toString();
  } catch {
    return url;
  }
}

// ─── Configuration ───────────────────────────────────────────────────────
const FULL_PAYMENT_STRIPE_LINK  = "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f";
const DEPOSIT_STRIPE_LINK       = "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05";
const SUPPORT_EMAIL             = "info@ptlaunchlab.co.uk";
const SUPPORT_PHONE             = "01977 365001";

// ─── Main Component — Pre-payment checkout ───────────────────────────────
// Collects the minimum needed to send the buyer to Stripe (name + email +
// plan choice). The full learner record + signed agreement are collected on
// the /enrol/success page once payment has cleared — see
// success/PostPaymentEnrolment.tsx.
export default function EnrolmentFlow({ partner, standalone }: { partner?: PartnerConfig; standalone?: boolean }) {
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput]     = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError]     = useState("");
  const sec = useFormSecurity();

  useEffect(() => {
    trackEvent('enrolment_started', {
      ...(partner?.gymReferral && { gym_referral: partner.gymReferral }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Promo code ───────────────────────────────────────────────────────
  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (partner?.promoCodes?.[code]) {
      setAppliedPromo(code);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code — please check and try again.");
    }
  }
  const activePromo = appliedPromo ? partner?.promoCodes?.[appliedPromo] : null;

  // ─── Validation ───────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim())       e.fullName = "Full name is required";
    if (!email.trim())          e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                e.email = "Enter a valid email address";
    return e;
  }

  // ─── Payment ──────────────────────────────────────────────────────────
  async function pay(type: "full" | "deposit") {
    if (submitting) return;
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    const amount = type === "full"
      ? (activePromo ? activePromo.fullPrice : 1599)
      : (activePromo ? activePromo.depositPrice : 599);

    // Stash context so the post-payment form on /enrol/success can prefill the
    // learner's name + email and carry plan / amount / attribution through.
    const context: EnrolmentContext = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      plan: type,
      amount,
      ...(appliedPromo && { promoCode: appliedPromo, discountApplied: activePromo?.discountAmount }),
      ...(partner?.gymReferral && { gymReferral: partner.gymReferral }),
      source: "website-enrolment-flow-v2",
      ts: new Date().toISOString(),
    };
    try { localStorage.setItem(ENROLMENT_CONTEXT_KEY, JSON.stringify(context)); } catch (_) {}

    trackEvent('enrolment_payment_attempted', {
      payment_type: type,
      amount,
      currency: 'GBP',
      ...(appliedPromo && { promo_code: appliedPromo }),
      ...(partner?.gymReferral && { gym_referral: partner.gymReferral }),
    });

    // Meta InitiateCheckout — fires right before the Stripe redirect so Meta
    // sees the high-intent moment between Lead and Purchase. Browser fbq +
    // server CAPI share one eventID for dedup. Both calls are fire-and-forget
    // so they NEVER delay the Stripe redirect.
    const planName = type === "full" ? "course_pif" : "course_deposit";
    const icEventId =
      (typeof window !== "undefined" && window.crypto?.randomUUID?.()) ||
      `ic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq(
        "track",
        "InitiateCheckout",
        {
          currency: "GBP",
          value: amount,
          content_name: planName,
          content_category: partner?.gymReferral || (appliedPromo ?? undefined),
        },
        { eventID: icEventId },
      );
    }
    fetch("/api/capi-initiate-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: icEventId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        plan: planName,
        value: amount,
        currency: "GBP",
        source: partner?.gymReferral || "enrol",
      }),
    }).catch(() => { /* fire-and-forget — never block Stripe redirect */ });

    // Pay-first safety net — alert admin that checkout has started so an
    // abandoned post-payment form (paid but never enrolled) can be chased.
    // Fire-and-forget so it never delays the Stripe redirect.
    fetch("/api/enrolment-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        plan: type,
        amount,
        ...(partner?.gymReferral && { gymReferral: partner.gymReferral }),
        ...(appliedPromo && { promoCode: appliedPromo }),
        [sec.SEC_KEY]: sec.payload(),
      }),
    }).catch(() => { /* fire-and-forget — never block Stripe redirect */ });

    const fullLink    = activePromo?.fullStripeLink    ?? partner?.stripeFullLink    ?? FULL_PAYMENT_STRIPE_LINK;
    const depositLink = activePromo?.depositStripeLink ?? partner?.stripeDepositLink ?? DEPOSIT_STRIPE_LINK;
    const paymentLink = type === "full" ? fullLink : depositLink;
    const ref = buildAttributionRef(partner?.gymReferral);

    // Ask the server to create a Checkout Session so the post-payment return
    // URL (/enrol/success) is set in code rather than in the Stripe Dashboard.
    // Dashboard-configured redirects had drifted on two of the three Payment
    // Links, dropping paying buyers on stripe.com and skipping the enrolment
    // form entirely — see app/lib/stripeCheckout.ts.
    //
    // If that fails for ANY reason we redirect to the raw Payment Link instead:
    // a buyer must never be blocked from paying. The 5s abort covers a slow or
    // unreachable API so nobody is left staring at a disabled button.
    let checkoutUrl = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          paymentLink,
          clientReferenceId: ref,
          email: email.trim().toLowerCase(),
          name: fullName.trim(),
          gymReferral: partner?.gymReferral,
          promoCode: appliedPromo ?? undefined,
          cancelPath: typeof window !== "undefined" ? window.location.pathname : "/enrol",
        }),
      });
      clearTimeout(timeout);
      const data = (await res.json()) as { url?: string | null };
      if (data?.url) checkoutUrl = data.url;
    } catch { /* fall through to the Payment Link */ }

    window.location.href = checkoutUrl || appendStripeAttribution(paymentLink, email, ref);
  }

  const firstName = fullName.trim().split(" ")[0];

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <>
      {!standalone && <Nav />}
      <main className={`${standalone ? "" : "pt-[72px]"} min-h-screen bg-deep`}>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <sec.Honeypot />

          {/* Page header */}
          <div className="text-center mb-10">
            <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">
              PT Launch Lab — Enrolment
            </p>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-3">
              {firstName ? `Secure your place, ${firstName}.` : "Secure your place."}
            </h1>
            <p className="text-soft text-sm">
              Choose your payment option to lock in your spot. You&apos;ll complete your
              enrolment details straight after — it only takes a couple of minutes.
            </p>
          </div>

          {/* Error summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
              <p className="text-red-400 text-sm font-bold mb-2">Please add your details before continuing:</p>
              <ul className="text-red-400 text-xs space-y-1">
                {Object.values(errors).map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-5">
            {/* Contact details — the minimum Stripe + receipt need */}
            <div className="bg-deep border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-bold text-lg pb-2 border-b border-white/10">Your details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name" required error={errors.fullName}>
                  <input type="text" value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jane Smith" className={input} />
                </Field>
                <Field label="Email Address" required error={errors.email}
                  hint="Your receipt and course access go here">
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" className={input} />
                </Field>
              </div>
            </div>

            {/* Promo code — only shown if partner config has promoCodes */}
            {partner?.promoCodes && (
              <div className="bg-deep border border-white/10 rounded-xl p-4">
                {appliedPromo && activePromo ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gold font-bold text-sm">
                        ✓ {activePromo.label} applied — £{activePromo.discountAmount} off
                      </p>
                      <p className="text-soft text-xs mt-0.5">Enter this code at Stripe checkout to apply your discount</p>
                    </div>
                    <button onClick={() => { setAppliedPromo(null); setPromoInput(""); }} className="text-faint text-xs hover:text-soft transition-colors">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-soft text-sm mb-2 font-semibold">Have a promo code?</p>
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        placeholder="Enter code"
                        className="flex-1 bg-deep border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/[0.15] text-sm focus:outline-none focus:border-gold/50 transition-colors uppercase"
                      />
                      <button
                        onClick={applyPromo}
                        className="px-4 py-2 rounded-lg bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-red-400 text-xs mt-1.5">{promoError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Payment options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full payment */}
              <button onClick={() => pay("full")} disabled={submitting}
                className="bg-deep border-2 border-gold/50 hover:border-gold hover:bg-gold/5 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">Best Value</p>
                <p className="text-white font-bold text-2xl mb-1">Pay in Full</p>
                {activePromo ? (
                  <div className="mb-3">
                    <p className="text-faint text-2xl font-bold line-through leading-none">£1,599</p>
                    <p className="text-gold text-4xl font-bold leading-none">£{activePromo.fullPrice.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-gold text-4xl font-bold mb-3">£1,599</p>
                )}
                <ul className="text-soft text-xs space-y-1.5 mb-6">
                  {activePromo && (
                    <li className="flex items-center gap-2"><span className="text-gold">✓</span> Save £{(1599 - activePromo.fullPrice).toLocaleString()}</li>
                  )}
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Immediate course access</li>
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> One single payment</li>
                </ul>
                <div className="w-full py-3.5 rounded-full bg-gold text-deep font-bold text-sm text-center group-hover:brightness-110 transition-all">
                  {submitting ? "Taking you to checkout…" : `Pay £${activePromo ? activePromo.fullPrice.toLocaleString() : "1,599"} →`}
                </div>
              </button>

              {/* Deposit plan */}
              <button onClick={() => pay("deposit")} disabled={submitting}
                className="bg-deep border-2 border-white/10 hover:border-gold/40 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                <p className="text-soft text-[10px] font-bold tracking-widest uppercase mb-3">Spread the Cost</p>
                <p className="text-white font-bold text-2xl mb-1">Deposit Plan</p>
                {activePromo ? (
                  <div className="mb-1">
                    <p className="text-faint text-2xl font-bold line-through leading-none">£599</p>
                    <p className="text-gold text-4xl font-bold leading-none">£{activePromo.depositPrice}</p>
                  </div>
                ) : (
                  <p className="text-gold text-4xl font-bold mb-1">£599</p>
                )}
                <p className="text-soft text-xs mb-3">then £200 × {activePromo ? Math.round((activePromo.fullPrice - activePromo.depositPrice) / 200) : 5} monthly payments</p>
                <ul className="text-soft text-xs space-y-1.5 mb-6">
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Start today with a deposit</li>
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Monthly payments to follow</li>
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Full access from day one</li>
                </ul>
                <div className="w-full py-3.5 rounded-full border border-gold text-gold font-bold text-sm text-center group-hover:bg-gold/10 transition-all">
                  {submitting ? "Taking you to checkout…" : `Pay £${activePromo ? activePromo.depositPrice : "599"} Deposit →`}
                </div>
              </button>
            </div>

            {/* Reassurance — what happens after payment */}
            <div className="bg-deep border border-white/10 rounded-2xl p-5 text-center">
              <p className="text-soft text-sm leading-relaxed">
                After payment you&apos;ll complete a short enrolment form — your details,
                a few learning questions and your learner agreement. You can start the same day.
              </p>
            </div>

            {/* Support */}
            <div className="bg-deep border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-white font-bold mb-2">Need help before you continue?</p>
              <p className="text-soft text-sm mb-5">
                If you have any questions before choosing your payment option, the team is here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4 text-sm">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold hover:underline">
                  {SUPPORT_EMAIL}
                </a>
                <span className="hidden sm:inline text-white/10">·</span>
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="text-gold hover:underline">
                  {SUPPORT_PHONE}
                </a>
              </div>
              <a href="/book-call"
                className="inline-block px-6 py-2.5 rounded-full border border-gold text-gold text-sm font-semibold hover:bg-gold hover:text-deep transition-all">
                Talk to the Team
              </a>
            </div>
          </div>

        </div>
      </main>
      {!standalone && <Footer />}
    </>
  );
}
