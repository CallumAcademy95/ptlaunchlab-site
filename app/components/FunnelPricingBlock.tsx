"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/app/lib/gtag";

// FunnelPricingBlock
// ----------------------------------------------------------------------------
// Drop-in pricing card for the avatar landing pages, the quiz result screen,
// and prospectus thank-you page. Polls /api/funnel-promo/status on mount; if
// the lead has an active 48h promo cookie it renders £1,599 struck through,
// £1,399 live, and a countdown to expiry. Otherwise it shows a "full price"
// view with no promo.
//
// CTAs always go to /api/funnel-promo/checkout?plan=full|deposit so the
// discounted Stripe Payment Link URL is never present in the DOM.
//
// Hormozi-style offer stack renders above the tier cards by default. It
// quantifies every component of the £1,599 bundle against believable RRPs to
// make the perceived value materially higher than the ask. Set
// showValueStack={false} on call sites that already render their own stack.

type Status =
  | { active: true; source: string; expiresAt: number; secondsRemaining: number }
  | { active: false };

type StackRow = { label: string; sub?: string; rrp: string };

// Value stack — assigned RRPs are defensible against the UK market:
//  - Level 2 standalone at Active IQ / Focus Awards providers: £400–600
//  - Level 3 standalone at OriGym / HFE: £800–1,200
//  - Tutor support 6–12 weeks: £300–600 (mentorship hourly rates £30–60)
//  - Mentorship Hub: actually sold standalone at £500
//  - Warm gym intros: unique — not sold elsewhere, marked "priceless"
//  - Free resubmissions: most providers charge £50–100 per resubmission
const VALUE_STACK: StackRow[] = [
  { label: "NCFE Level 2 Gym Instructor",        sub: "Ofqual regulated · the legal prerequisite", rrp: "£499" },
  { label: "NCFE Level 3 Personal Trainer",      sub: "Ofqual ref 603/4388/6 · gym-manager default", rrp: "£1,099" },
  { label: "Personal tutor — introduced in 24h", sub: "Reviews every assessment before you submit",   rrp: "£499" },
  { label: "PT Launch Lab Mentorship Hub",       sub: "Walks you from qualified to first paying client", rrp: "£500" },
  { label: "Warm-introduction gym interviews",   sub: "Direct intros to our 500+ PT hiring network",  rrp: "Priceless" },
  { label: "Free resubmissions — no cap",        sub: "Resubmit until your tutor says it's a pass",   rrp: "£199" },
];

// Numeric total used for the strikethrough. Excludes "Priceless" rows.
// = 499 + 1099 + 499 + 500 + 199 = £2,796
const TOTAL_VALUE_DISPLAY = "£2,796";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FunnelPricingBlock({
  variant = "dark",
  showValueStack = true,
}: {
  variant?: "dark" | "light";
  showValueStack?: boolean;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/funnel-promo/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Status) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ active: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!status || !status.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Initial loading state: don't flash full-price view, but don't block either
  if (status === null) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-white/[0.07] mb-8 min-h-[320px] animate-pulse" />
    );
  }

  const isActive = status.active;
  const secondsRemaining = isActive
    ? Math.max(0, Math.floor((status.expiresAt - now) / 1000))
    : 0;
  const hardExpired = isActive && secondsRemaining <= 0;
  const showPromo = isActive && !hardExpired;

  const accent = variant === "light" ? "#F5C518" : "#FFD24A";
  const cardBg = variant === "light" ? "bg-[#0D3559]" : "bg-card";
  const cardBorder = variant === "light" ? "border-[#F5C518]/40" : "border-gold/30";

  const youPay = showPromo ? "£1,399" : "£1,599";

  const handleCheckout = (plan: "full" | "deposit") => {
    trackEvent("promo_checkout_clicked", { plan, has_promo: showPromo });
    window.location.href = `/api/funnel-promo/checkout?plan=${plan}`;
  };

  return (
    <div className={`${cardBg} rounded-2xl p-6 sm:p-8 border ${cardBorder} mb-8`}>

      {/* ─── VALUE STACK (Hormozi-style perceived-value lift) ─── */}
      {showValueStack && (
        <>
          <p
            className="text-[11px] font-bold tracking-widest uppercase mb-2"
            style={{ color: accent }}
          >
            Everything that&apos;s included
          </p>
          <h3 className="font-display font-extrabold text-white text-2xl sm:text-3xl leading-tight tracking-tight mb-5">
            The full bundle —{" "}
            <span style={{ color: accent }}>not a stripped-back cert.</span>
          </h3>

          <ul className="space-y-2.5 mb-5">
            {VALUE_STACK.map((row) => (
              <li
                key={row.label}
                className="flex items-start gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }}>
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-snug">{row.label}</p>
                  {row.sub && <p className="text-soft/55 text-xs leading-snug mt-0.5">{row.sub}</p>}
                </div>
                <span
                  className="text-xs font-bold tabular-nums shrink-0 ml-2"
                  style={{ color: row.rrp === "Priceless" ? accent : "rgba(255,255,255,0.5)" }}
                >
                  {row.rrp}
                </span>
              </li>
            ))}
          </ul>

          {/* Subtotal — "stacked value vs you pay" */}
          <div className="rounded-xl bg-deep/40 border border-white/[0.06] p-4 mb-6">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-soft/70 text-sm">Stacked value</span>
              <span className="text-soft/50 text-lg line-through tabular-nums">{TOTAL_VALUE_DISPLAY}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-white font-semibold text-base">You pay today</span>
              <span
                className="font-display font-extrabold text-3xl tabular-nums"
                style={{ color: accent }}
              >
                {youPay}
              </span>
            </div>
            {showPromo && (
              <p className="text-faint text-[11px] mt-2">
                Includes your £200 funnel discount — auto-applied at checkout.
              </p>
            )}
          </div>
        </>
      )}

      {/* ─── EXISTING PROMO / TIER CARDS ─── */}
      {showPromo ? (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span
              className="text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
              style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}40` }}
            >
              £200 off — funnel exclusive
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-soft/60">Expires in</span>
              <span
                className="font-mono font-bold text-sm tabular-nums"
                style={{ color: accent }}
              >
                {formatCountdown(secondsRemaining)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            {/* Pay in full tier */}
            <div className="rounded-xl border border-white/[0.08] bg-deep/40 p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-soft/50 mb-1">
                Pay in full
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-soft/40 text-lg line-through">£1,599</span>
                <span
                  className="font-display font-extrabold text-3xl"
                  style={{ color: accent }}
                >
                  £1,399
                </span>
              </div>
              <p className="text-faint text-xs mb-4">Best total value — save £200</p>
              <button
                onClick={() => handleCheckout("full")}
                className="w-full py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all"
                style={{ background: accent, color: "#072B4A" }}
              >
                Pay £1,399 →
              </button>
            </div>

            {/* Deposit tier */}
            <div className="rounded-xl border border-white/[0.08] bg-deep/40 p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-soft/50 mb-1">
                Deposit + monthlies
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-soft/40 text-lg line-through">£599 + 5×£200</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="font-display font-extrabold text-2xl"
                  style={{ color: accent }}
                >
                  £599
                </span>
                <span className="text-white/80 text-sm">+ 4 × £200</span>
              </div>
              <p className="text-faint text-xs mb-4">£1,399 total — save £200</p>
              <button
                onClick={() => handleCheckout("deposit")}
                className="w-full py-3 rounded-full font-bold text-sm border-2 hover:bg-white/5 transition-all"
                style={{ borderColor: accent, color: accent }}
              >
                Pay £599 deposit →
              </button>
            </div>
          </div>

          <p className="text-faint text-xs text-center mt-4">
            Discount auto-applies via your unique link. Offer ends when the timer hits zero.
          </p>
        </>
      ) : (
        <>
          {!showValueStack && (
            <>
              <h3 className="font-display font-extrabold text-white text-xl leading-tight tracking-tight mb-2">
                Enrol on the course
              </h3>
              <p className="text-soft/60 text-sm mb-5 leading-relaxed">
                £1,599 total. Pay in full or £599 deposit + 5 monthly payments of £200.
              </p>
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pay in full tier (no promo) */}
            <div className="rounded-xl border border-white/[0.08] bg-deep/40 p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-soft/50 mb-1">
                Pay in full
              </p>
              <span
                className="font-display font-extrabold text-3xl block mb-1"
                style={{ color: accent }}
              >
                £1,599
              </span>
              <p className="text-faint text-xs mb-4">One-off · Best total value</p>
              <button
                onClick={() => handleCheckout("full")}
                className="w-full py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all"
                style={{ background: accent, color: "#072B4A" }}
              >
                Pay £1,599 →
              </button>
            </div>

            {/* Deposit tier (no promo) */}
            <div className="rounded-xl border border-white/[0.08] bg-deep/40 p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-soft/50 mb-1">
                Deposit + monthlies
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="font-display font-extrabold text-2xl"
                  style={{ color: accent }}
                >
                  £599
                </span>
                <span className="text-white/80 text-sm">+ 5 × £200</span>
              </div>
              <p className="text-faint text-xs mb-4">£1,599 total · Spread over 6 months</p>
              <button
                onClick={() => handleCheckout("deposit")}
                className="w-full py-3 rounded-full font-bold text-sm border-2 hover:bg-white/5 transition-all"
                style={{ borderColor: accent, color: accent }}
              >
                £599 deposit →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── RISK REVERSAL (Hormozi: reduce perceived risk to zero) ─── */}
      <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: "Tutor in 24 hours", body: "Personally introduced — or your deposit back, no questions." },
          { title: "7-day cancellation", body: "Change your mind in the first week, full refund. Simple." },
          { title: "Free resubmissions", body: "Resubmit any assessment, no extra fees, no time pressure." },
          { title: "Pass support guarantee", body: "Tutor reviews every submission first — most learners never fail." },
        ].map((g) => (
          <div key={g.title} className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }}>
              <path d="M12 2L4 7v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V7l-8-5z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">{g.title}</p>
              <p className="text-soft/55 text-[11px] leading-snug">{g.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
