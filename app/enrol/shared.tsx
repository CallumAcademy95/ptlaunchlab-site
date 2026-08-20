// Shared building blocks for the pre-payment enrolment step.
//
// This file used to serve a two-phase flow: phase 1 collected name + email +
// plan and sent the buyer to Stripe, phase 2 collected the full NCFE learner
// record on /enrol/success afterwards. Phase 2 has moved to Praxel, where
// enrolment and account creation are one act — so only the pre-payment pieces
// used by EnrolmentFlow.tsx remain here.
//
// The learner-record types, blank states and form primitives that went with
// phase 2 were removed with it. `git log app/enrol/` has them if a future
// on-site form ever needs them back.

import React from "react";

// ─── Partner config (passed in from gym-specific enrol pages) ───────────────
export interface PartnerConfig {
  // Stable join key for the partner platform. NEVER change one once it is live
  // — every sale ever attributed to that gym is keyed on it. Lowercase, no
  // spaces. `gymReferral` below is a display name and is NOT safe to join on:
  // it gets reworded, gains trailing spaces, and changes when a gym rebrands.
  gymSlug: string;               // e.g. "6fit"
  gymReferral: string;           // e.g. "6fit Gyms" — display only (Sheet, emails)
  stripeFullLink?: string;       // default full-price Stripe link
  stripeDepositLink?: string;    // default deposit Stripe link
  // No promo config here on purpose. Prices and discounts come from Stripe at
  // request time, keyed off gymSlug — see app/lib/partnerPromo.ts. Hardcoding
  // them here is what let the page advertise £1,399 while Stripe charged
  // £1,599, and what kept HITIO's launch codes off the site entirely.
}

// ─── Types ──────────────────────────────────────────────────────────────────

// Written to localStorage at the pay step so the thank-you page can show the
// right plan and amount back to the buyer.
//
// It no longer prefills a form: the learner's details are collected on Praxel,
// prefilled from their Stripe session rather than from this browser's storage —
// which is the whole point, since storage is empty if they pay on a phone and
// enrol on a laptop.
export interface EnrolmentContext {
  fullName: string;
  email: string;
  plan: "full" | "deposit";
  amount: number;
  promoCode?: string;
  discountApplied?: number;
  gymReferral?: string;
  gymSlug?: string;
  source: string;
  ts: string;
}

export const ENROLMENT_CONTEXT_KEY = "ptll_enrolment_context";

// ─── Shared styles ───────────────────────────────────────────────────────────
export const input = "w-full bg-deep border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/[0.15] focus:outline-none focus:border-gold/50 transition-colors text-sm";

// ─── Field wrapper ───────────────────────────────────────────────────────────
export function Field({ label, error, required, hint, children }: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-soft text-sm mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-gold text-xs">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-faint text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-1">⚠ {error}</p>}
    </div>
  );
}
