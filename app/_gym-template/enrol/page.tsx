// ─────────────────────────────────────────────────────────────────────────────
// GYM PARTNER ENROL PAGE TEMPLATE
// Paste this into app/[gym-slug]/enrol/page.tsx and fill in the config below.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";
import type { PartnerConfig } from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | GYM NAME PT Academy",
  description: "Start your Level 2 & 3 PT qualification today — pay in full or monthly.",
  robots: { index: false },
};

const PARTNER: PartnerConfig = {
  // Stable join key for the partner platform — lowercase, no spaces, NEVER
  // changed once live. Match it to the route folder (e.g. /acme-academy → "acme")
  // and add the same value as `slug` on the pp_partners row.
  gymSlug: "GYM-SLUG-HERE",
  gymReferral: "GYM NAME HERE",
  // No prices, payment links or promo codes here: every gym sells the same two
  // plans (app/lib/pricing.ts) and is attributed by gymSlug, not a code.
};

export default function GymEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://example.com/logo.png"   // replace with gym logo
              alt="GYM NAME"
              width={36} height={36}
              className="rounded-lg"
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">GYM NAME PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Enrolment</p>
            </div>
          </div>
        </div>
      </div>

      <EnrolmentFlow partner={PARTNER} standalone />

      <div className="bg-[#061F36] border-t border-[#1A3A5C] py-6 px-6 text-center">
        <p className="text-[#4A6280] text-xs">
          PT Launch Lab · NCFE Accredited Centre No. 9002788 ·{" "}
          <a href="/terms" className="hover:text-[#8CA3BF] transition-colors">Terms</a>
          {" "}·{" "}
          <a href="/privacy" className="hover:text-[#8CA3BF] transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
}
