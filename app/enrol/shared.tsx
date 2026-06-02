// Shared building blocks for the two-phase enrolment flow.
//
// Phase 1 (pre-payment) lives in EnrolmentFlow.tsx — collects name + email +
// plan and sends the buyer to Stripe.
// Phase 2 (post-payment) lives in success/PostPaymentEnrolment.tsx — collects
// the full learner record + signed agreement once payment has completed.
//
// Both phases reuse the field primitives, styles, types and blank-state
// constants defined here so the look stays identical across the split.

import React from "react";

// ─── Partner config (passed in from gym-specific enrol pages) ───────────────
export interface PartnerConfig {
  gymReferral: string;           // e.g. "6fit Gyms"
  stripeFullLink?: string;       // default full-price Stripe link (no promo needed)
  stripeDepositLink?: string;    // default deposit Stripe link (no promo needed)
  promoCodes?: Record<string, {
    label: string;               // e.g. "6fit Member Discount"
    discountAmount: number;      // e.g. 200
    fullPrice: number;           // discounted full price e.g. 1199
    depositPrice: number;        // discounted deposit e.g. 399
    fullStripeLink: string;      // Stripe link for discounted full payment
    depositStripeLink: string;   // Stripe link for discounted deposit
  }>;
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface LearnerDetails {
  title: string; fullName: string; dateOfBirth: string; gender: string;
  nationalInsurance: string; mobile: string; email: string;
  addressLine1: string; addressLine2: string; town: string; county: string; postcode: string;
}
export interface LearningDetails {
  heardAbout: string; highestQualification: string;
  gcseEnglish: string; gcseMaths: string; gcseICT: string; employmentStatus: string;
}
export interface AgreementState {
  detailsAccurate: boolean; selfFunded: boolean;
  coolingOffUnderstood: boolean; termsAgreed: boolean; commitToLearning: boolean;
  signature: string; signatureType: "drawn" | "typed"; signedAt: string;
}

// The context written to localStorage at the pay step and read back on the
// success page so the post-payment form can carry plan/amount/attribution and
// prefill the learner's name + email.
export interface EnrolmentContext {
  fullName: string;
  email: string;
  plan: "full" | "deposit";
  amount: number;
  promoCode?: string;
  discountApplied?: number;
  gymReferral?: string;
  source: string;
  ts: string;
}

export const ENROLMENT_CONTEXT_KEY = "ptll_enrolment_context";

export const blankLearner: LearnerDetails = {
  title: "", fullName: "", dateOfBirth: "", gender: "",
  nationalInsurance: "", mobile: "", email: "",
  addressLine1: "", addressLine2: "", town: "", county: "", postcode: "",
};
export const blankLearning: LearningDetails = {
  heardAbout: "", highestQualification: "",
  gcseEnglish: "", gcseMaths: "", gcseICT: "", employmentStatus: "",
};
export const blankAgreement: AgreementState = {
  detailsAccurate: false, selfFunded: false,
  coolingOffUnderstood: false, termsAgreed: false, commitToLearning: false,
  signature: "", signatureType: "drawn", signedAt: "",
};

// ─── Shared styles ───────────────────────────────────────────────────────────
export const input = "w-full bg-deep border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/[0.15] focus:outline-none focus:border-gold/50 transition-colors text-sm";
export const sel = input + " cursor-pointer";

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

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-deep border border-white/10 rounded-2xl p-6 space-y-4">
      <h2 className="text-white font-bold text-lg pb-2 border-b border-white/10">{title}</h2>
      {children}
    </div>
  );
}

// ─── Checkbox row ────────────────────────────────────────────────────────────
export function Check({ checked, onChange, error, children }: {
  checked: boolean; onChange: (v: boolean) => void; error?: boolean; children: React.ReactNode;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all ${
      checked ? "border-gold/40 bg-gold/5" :
      error   ? "border-red-500/40 bg-red-500/5" :
                "border-white/10 hover:border-white/[0.15]"
    }`}>
      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
        checked ? "bg-gold border-gold" : "border-white/[0.15]"
      }`}>
        {checked && <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-deep"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-soft text-sm leading-relaxed">{children}</span>
    </label>
  );
}
