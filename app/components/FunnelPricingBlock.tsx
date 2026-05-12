"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/app/lib/gtag";

// FunnelPricingBlock
// ----------------------------------------------------------------------------
// Drop-in pricing card for the quiz result screen and prospectus thank-you
// page. Polls /api/funnel-promo/status on mount; if the lead has an active
// 48h promo cookie it renders £1,599 struck through, £1,399 live, and a
// countdown to expiry. Otherwise it shows a "full price" view with no promo.
//
// CTAs always go to /api/funnel-promo/checkout?plan=full|deposit so the
// discounted Stripe Payment Link URL is never present in the DOM.

type Status =
  | { active: true; source: string; expiresAt: number; secondsRemaining: number }
  | { active: false };

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FunnelPricingBlock({
  variant = "dark",
}: {
  variant?: "dark" | "light";
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
      <div className="bg-card rounded-2xl p-6 border border-white/[0.07] mb-8 min-h-[160px] animate-pulse" />
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

  const handleCheckout = (plan: "full" | "deposit") => {
    trackEvent("promo_checkout_clicked", { plan, has_promo: showPromo });
    window.location.href = `/api/funnel-promo/checkout?plan=${plan}`;
  };

  return (
    <div className={`${cardBg} rounded-2xl p-6 sm:p-8 border ${cardBorder} mb-8`}>
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

          <h3 className="font-display font-extrabold text-white text-2xl sm:text-3xl leading-tight tracking-tight mb-2">
            Save £200 on your course
          </h3>
          <p className="text-soft/60 text-sm mb-6 leading-relaxed">
            For taking the quiz / downloading the prospectus, we&apos;ve unlocked a
            £200 discount on the full PT Launch Lab course. Code applies
            automatically at checkout.
          </p>

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
          <h3 className="font-display font-extrabold text-white text-xl leading-tight tracking-tight mb-2">
            Enrol on the course
          </h3>
          <p className="text-soft/60 text-sm mb-5 leading-relaxed">
            £1,599 total. Pay in full or £599 deposit + 5 monthly payments of £200.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleCheckout("full")}
              className="flex-1 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: accent, color: "#072B4A" }}
            >
              Pay £1,599 in full →
            </button>
            <button
              onClick={() => handleCheckout("deposit")}
              className="flex-1 py-3 rounded-full font-bold text-sm border-2 hover:bg-white/5 transition-all"
              style={{ borderColor: accent, color: accent }}
            >
              £599 deposit →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
