"use client";
import { useState, useEffect } from "react";
import { trackEvent } from "@/app/lib/gtag";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useFormSecurity } from "@/app/lib/security/client";
import { attributionFromTouches, type Attribution } from "@/app/lib/attribution";
import { CONTACT_EMAIL as SUPPORT_EMAIL, PHONE_NATIONAL as SUPPORT_PHONE, PHONE_TEL } from "@/app/lib/contactDetails";
import {
  COURSE_PRICE_PENCE,
  COURSE_PRICE_LABEL,
  MONTHLY_PRICE_PENCE,
  MONTHLY_PRICE_LABEL,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  formatPence,
  type CoursePlanChoice,
} from "@/app/lib/pricing";
// Display-safe ATP figures only — the member codes never reach this bundle.
import { ATP_SIX_MONTH, ATP_PIF_FULL_PENCE } from "@/app/lib/atpPrices";

/** What /api/checkout sells. The last two exist on ATP's enrol page only. */
type EnrolPlan = CoursePlanChoice | "six_month" | "pif_1599";
import { fallbackPaymentLink } from "@/app/lib/paymentLinks";
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
function buildAttributionRef(gym?: string, gymSlug?: string): string {
  try {
    const first = readTouch("ptll_first_touch");
    const last = readTouch("ptll_last_touch");
    // Short keys keep the payload under Stripe's 200-char client_reference_id limit
    const payload: Record<string, string> = {};
    // `gyms` (slug) is the durable join key for partner attribution; `gym` is the
    // display name kept for the existing Make → Google Sheet tracker. The slug is
    // set FIRST so that if the 200-char cap truncates anything, it survives.
    if (gymSlug) payload.gyms = gymSlug;
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

// Durable counterpart to buildAttributionRef: sent as a structured field and
// stamped into Stripe metadata server-side, so it cannot be truncated.
function readAttribution(): Attribution {
  try {
    const raw = (k: string): unknown => {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    };
    return attributionFromTouches(raw("ptll_first_touch"), raw("ptll_last_touch"));
  } catch {
    return {};
  }
}

// Fallback path only — the direct-to-Payment-Link redirect used when
// /api/checkout can't create a session and a current-price link is configured. Stripe Payment Links accept both
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

// ─── Main Component — Pre-payment checkout ───────────────────────────────
// Collects the minimum needed to send the buyer to Stripe (name + email +
// plan choice). The full learner record + signed agreement are collected on
// Praxel once payment has cleared, from a signed link that prefills their name
// and email out of the Stripe session.
//
// Two ways to pay, for everyone — direct, funnel or partner gym:
//   £999.99 in full, or 10 × £99.99 a month (the first taken today).
// No dated offers. Figures come from app/lib/pricing.ts. Two exceptions, both
// decided server-side by /api/checkout (v4.1 partner ladder):
//   - a gym's own member saving on pay-in-full (memberSavingPence, display only);
//   - ATP Fitness Felixstowe's page (ladder="atp") adds its 6-month plan and a
//     £1,599 pay-in-full with a member code box.
export default function EnrolmentFlow({
  partner,
  standalone,
  memberSavingPence = 0,
  ladder,
}: {
  partner?: PartnerConfig;
  standalone?: boolean;
  /**
   * The gym's member saving on pay-in-full, ALREADY resolved server-side by the
   * gym's enrol page (memberSavingForGym: 0 unless its coupon exists). Display
   * only — /api/checkout recomputes it from gymSlug and applies it itself.
   */
  memberSavingPence?: number;
  /**
   * "atp" on ATP Fitness Felixstowe's enrol page only: shows its four rungs and
   * the member code box. Codes are checked server-side; none are in this bundle.
   */
  ladder?: "atp";
}) {
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [memberCode, setMemberCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const atpLadder = ladder === "atp";
  // Never on ATP's page (its rungs replace it), never negative, never over £100.
  const saving = atpLadder ? 0 : Math.max(0, Math.min(10_000, Math.round(memberSavingPence) || 0));
  const pifTodayPence = COURSE_PRICE_PENCE - saving;
  // Set when checkout cannot be reached at all: session creation failed AND
  // no fallback Payment Link is configured for the plan. Never silently sends
  // the buyer to an older link — every older link sells a retired price.
  const [payError, setPayError]   = useState("");
  const sec = useFormSecurity();

  useEffect(() => {
    trackEvent('enrolment_started', {
      ...(partner?.gymReferral && { gym_referral: partner.gymReferral }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  async function pay(plan: EnrolPlan) {
    if (submitting) return;
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setPayError("");
    setCodeError("");
    setSubmitting(true);

    // What is charged TODAY, in pence and pounds. The monthly plan's checkout
    // payment is its first £99.99; ATP's 6-month plan takes its £599 today.
    // ATP's £1,599 is shown before any code — the code is checked server-side.
    const todayPence =
      plan === "pif" ? pifTodayPence
      : plan === "monthly" ? MONTHLY_PRICE_PENCE
      : plan === "six_month" ? ATP_SIX_MONTH.depositPence
      : ATP_PIF_FULL_PENCE;
    const amount = todayPence / 100;
    const recordedPlan: EnrolmentContext["plan"] =
      plan === "monthly" || plan === "six_month" ? "monthly" : "full";

    // Stash context so the thank-you page can show the plan back to the buyer.
    const context: EnrolmentContext = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      plan: recordedPlan,
      amount,
      ...(partner?.gymReferral && { gymReferral: partner.gymReferral }),
      ...(partner?.gymSlug && { gymSlug: partner.gymSlug }),
      source: "website-enrolment-flow-v3",
      ts: new Date().toISOString(),
    };
    try { localStorage.setItem(ENROLMENT_CONTEXT_KEY, JSON.stringify(context)); } catch { /* storage unavailable — non-fatal */ }

    trackEvent('enrolment_payment_attempted', {
      payment_type: plan,
      amount,
      currency: 'GBP',
      ...(partner?.gymReferral && { gym_referral: partner.gymReferral }),
    });

    // Meta InitiateCheckout — fires right before the Stripe redirect so Meta
    // sees the high-intent moment between Lead and Purchase. Browser fbq +
    // server CAPI share one eventID for dedup. Both calls are fire-and-forget
    // so they NEVER delay the Stripe redirect.
    const planName = recordedPlan === "full" ? "course_pif" : "course_monthly";
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
          content_category: partner?.gymReferral || undefined,
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
    fetch("/api/enrolment-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        plan: recordedPlan,
        // ATP's two extra rungs, so the admin alert names the right price.
        ...((plan === "six_month" || plan === "pif_1599") && { rung: plan }),
        ...(partner?.gymReferral && { gymReferral: partner.gymReferral }),
        [sec.SEC_KEY]: sec.payload(),
      }),
    }).catch(() => { /* fire-and-forget — never block Stripe redirect */ });

    const ref = buildAttributionRef(partner?.gymReferral, partner?.gymSlug);

    // Ask the server to create a Checkout Session so the post-payment return
    // URL (/enrol/success) is set in code rather than in the Stripe Dashboard,
    // and so the price is chosen server-side from the plan.
    //
    // If that fails we fall back to the plan's raw Payment Link — but only one
    // configured for the CURRENT price. If none is configured, we stop and say
    // so with a way to reach us, rather than send anyone to a retired price.
    // The 5s abort covers a slow or unreachable API.
    let checkoutUrl = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          plan,
          clientReferenceId: ref,
          attribution: readAttribution(),
          email: email.trim().toLowerCase(),
          name: fullName.trim(),
          gymReferral: partner?.gymReferral,
          gymSlug: partner?.gymSlug,
          ...(plan === "pif_1599" && memberCode.trim() && { memberCode: memberCode.trim() }),
          cancelPath: typeof window !== "undefined" ? window.location.pathname : "/enrol",
        }),
      });
      clearTimeout(timeout);
      const data = (await res.json()) as { url?: string | null; reason?: string };
      if (data?.url) checkoutUrl = data.url;
      if (data?.reason === "invalid-code") {
        // Nothing charged. Let them fix the code or clear it.
        setSubmitting(false);
        setCodeError("That code isn't valid. Check it and try again, or clear the box to pay without one.");
        return;
      }
    } catch { /* fall through to the Payment Link */ }

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    // Raw Payment Links exist for the two standard plans only, at the standard
    // price. Never for ATP's rungs (a deposit must carry its mandate; a code
    // must carry its discount), and never when a member saving was promised.
    const fallback =
      (plan === "pif" && saving === 0) || plan === "monthly" ? fallbackPaymentLink(plan) : null;
    if (fallback) {
      window.location.href = appendStripeAttribution(fallback, email, ref);
      return;
    }
    setSubmitting(false);
    setPayError(
      "We couldn't open the secure checkout just now, and you have not been charged. " +
        "Please try again in a minute, or contact us and we'll get you enrolled.",
    );
  }

  const firstName = fullName.trim().split(" ")[0];

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <>
      {!standalone && <Nav />}
      <main className={`${standalone ? "" : "pt-[72px]"} min-h-screen bg-deep`}>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <sec.Honeypot />

          {/* Page header. On a gym's page this is the GYM'S academy, so the
              eyebrow never names us. */}
          <div className="text-center mb-10">
            <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">
              {partner ? "Enrolment" : "PT Launch Lab — Enrolment"}
            </p>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-3">
              {firstName ? `Secure your place, ${firstName}.` : "Secure your place."}
            </h1>
            <p className="text-soft text-sm">
              Choose how you&apos;d like to pay. You&apos;ll complete your enrolment details
              straight after — it only takes a couple of minutes.
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

            {payError && (
              <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm font-bold mb-1">Checkout unavailable</p>
                <p className="text-red-300 text-xs leading-relaxed">
                  {payError}{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>
                  {" · "}
                  <a href={`tel:${PHONE_TEL}`} className="underline">{SUPPORT_PHONE}</a>
                </p>
              </div>
            )}

            {/* ATP Fitness Felixstowe only: its 6-month plan and the £1,599
                pay-in-full that takes a member code. Codes are checked by
                /api/checkout, never here. */}
            {atpLadder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-ladder="atp">
                <button onClick={() => pay("six_month")} disabled={submitting} data-plan="six_month"
                  className="bg-deep border-2 border-gold/50 hover:border-gold hover:bg-gold/5 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                  <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">6-month plan</p>
                  <p className="text-white font-bold text-2xl mb-1">{formatPence(ATP_SIX_MONTH.contractPence)} over 6 months</p>
                  <p className="text-gold text-4xl font-bold mb-1">{formatPence(ATP_SIX_MONTH.depositPence)}<span className="text-lg text-soft font-semibold"> today</span></p>
                  <p className="text-soft text-xs mb-6">
                    then {ATP_SIX_MONTH.instalments} × {formatPence(ATP_SIX_MONTH.instalmentPence)} monthly, starting in{" "}
                    {ATP_SIX_MONTH.trialDays} days
                  </p>
                  <div className="w-full py-3.5 rounded-full bg-gold text-deep font-bold text-sm text-center group-hover:brightness-110 transition-all">
                    {submitting ? "Taking you to checkout…" : `Pay ${formatPence(ATP_SIX_MONTH.depositPence)} today →`}
                  </div>
                </button>

                <div className="bg-deep border-2 border-white/10 rounded-2xl p-7 text-left" data-plan="pif_1599">
                  <p className="text-soft text-[10px] font-bold tracking-widest uppercase mb-3">Pay in full with your member code</p>
                  <p className="text-white font-bold text-2xl mb-1">Pay in Full</p>
                  <p className="text-white text-4xl font-bold mb-3">{formatPence(ATP_PIF_FULL_PENCE)}</p>
                  <label htmlFor="member-code" className="text-soft text-xs block mb-1.5">Member code</label>
                  <input id="member-code" name="memberCode" type="text" autoComplete="off" value={memberCode}
                    onChange={(e) => { setMemberCode(e.target.value); setCodeError(""); }}
                    placeholder="Enter your code" className={`${input} mb-1 uppercase`} />
                  <p className="text-faint text-[11px] mb-4">Your code comes off at checkout.</p>
                  {codeError && <p role="alert" className="text-red-400 text-xs mb-3">{codeError}</p>}
                  <button onClick={() => pay("pif_1599")} disabled={submitting}
                    className="w-full py-3.5 rounded-full border border-gold text-gold font-bold text-sm text-center hover:bg-gold/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? "Taking you to checkout…" : memberCode.trim() ? "Apply code and pay →" : `Pay ${formatPence(ATP_PIF_FULL_PENCE)} →`}
                  </button>
                </div>
              </div>
            )}

            {/* The two ways to pay (on ATP's page, its 3rd and 4th options) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pay in full */}
              <button onClick={() => pay("pif")} disabled={submitting} data-plan="pif"
                className="bg-deep border-2 border-gold/50 hover:border-gold hover:bg-gold/5 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">One payment</p>
                <p className="text-white font-bold text-2xl mb-1">Pay in Full</p>
                <p className="text-gold text-4xl font-bold mb-3">{COURSE_PRICE_LABEL}</p>
                {saving > 0 && (
                  <p className="text-white text-base font-bold -mt-2 mb-3">Member price {formatPence(pifTodayPence)}</p>
                )}
                <ul className="text-soft text-xs space-y-1.5 mb-6">
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Immediate course access</li>
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Nothing further to pay</li>
                </ul>
                <div className="w-full py-3.5 rounded-full bg-gold text-deep font-bold text-sm text-center group-hover:brightness-110 transition-all">
                  {submitting ? "Taking you to checkout…" : `Pay ${formatPence(pifTodayPence)} →`}
                </div>
              </button>

              {/* Pay monthly */}
              <button onClick={() => pay("monthly")} disabled={submitting} data-plan="monthly"
                className="bg-deep border-2 border-white/10 hover:border-gold/40 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                <p className="text-soft text-[10px] font-bold tracking-widest uppercase mb-3">Spread the cost</p>
                <p className="text-white font-bold text-2xl mb-1">Pay Monthly</p>
                <p className="text-white text-3xl font-bold mb-1">{MONTHLY_PRICE_LABEL}<span className="text-lg text-soft font-semibold"> /month</span></p>
                <p className="text-soft text-xs mb-3">
                  {MONTHLY_PAYMENTS} monthly payments, the first today — {formatPence(MONTHLY_PLAN_TOTAL_PENCE)} in total
                </p>
                <ul className="text-soft text-xs space-y-1.5 mb-6">
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Full access from day one</li>
                  <li className="flex items-center gap-2"><span className="text-gold">✓</span> Payments taken automatically, then they stop</li>
                </ul>
                <div className="w-full py-3.5 rounded-full border border-gold text-gold font-bold text-sm text-center group-hover:bg-gold/10 transition-all">
                  {submitting ? "Taking you to checkout…" : `Pay ${MONTHLY_PRICE_LABEL} today →`}
                </div>
              </button>
            </div>

            {/* The certificate condition and the monthly mandate are material
                terms of what someone is buying, so they belong on the screen
                where the purchase is agreed rather than only behind a link to
                the T&Cs. */}
            <div className="bg-deep border border-gold/25 rounded-2xl p-6">
              <p className="text-white font-bold text-sm mb-3">
                {atpLadder
                  ? "If you spread the cost, here is what you are agreeing to"
                  : "If you pay monthly, here is what you are agreeing to"}
              </p>
              <ul className="text-soft text-[13px] leading-relaxed space-y-2.5">
                {atpLadder && (
                  <li className="flex gap-2.5">
                    <span className="text-gold shrink-0">·</span>
                    <span>
                      On the 6-month plan, {formatPence(ATP_SIX_MONTH.depositPence)} is taken today, then your card is
                      securely saved and {formatPence(ATP_SIX_MONTH.instalmentPence)} is taken automatically each month
                      for {ATP_SIX_MONTH.instalments} months, starting {ATP_SIX_MONTH.trialDays} days from today.
                      Total {formatPence(ATP_SIX_MONTH.contractPence)}. Payments stop on their own once it is paid in full,
                      and the {ATP_SIX_MONTH.instalments} payments are due whether you finish the course early or not.
                    </span>
                  </li>
                )}
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">·</span>
                  <span>
                    {MONTHLY_PRICE_LABEL} is taken today, then your card is securely saved and{" "}
                    {MONTHLY_PRICE_LABEL} is taken automatically each month for {MONTHLY_PAYMENTS - 1} more
                    months — {MONTHLY_PAYMENTS} payments, {formatPence(MONTHLY_PLAN_TOTAL_PENCE)} in total.
                    Payments stop on their own after the {MONTHLY_PAYMENTS}th.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">·</span>
                  <span>
                    The {MONTHLY_PAYMENTS} payments are due in full. They run whether you finish the
                    course in three months or ten, and finishing your assessments early does not bring
                    them forward.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">·</span>
                  <span>
                    <span className="text-white">Your NCFE certificate is claimed once the course fee
                    has been paid in full</span>, after the final payment clears rather than before.
                    Your course access is not affected: every unit is open from day one.
                  </span>
                </li>
              </ul>
              <p className="text-faint text-[11px] mt-4">
                Set out in full in our{" "}
                <a href="/terms" className="text-gold hover:underline">terms and conditions</a>.
              </p>
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
                If you have any questions before choosing how to pay, the team is here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4 text-sm">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold hover:underline">
                  {SUPPORT_EMAIL}
                </a>
                <span className="hidden sm:inline text-white/10">·</span>
                <a href={`tel:${PHONE_TEL}`} className="text-gold hover:underline">
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
