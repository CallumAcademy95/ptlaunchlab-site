import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | Gym n Go PT Academy",
  description: "Claim your £200 Gym n Go member discount and start your Level 2 & 3 PT qualification today.",
  robots: { index: false },
};

// ─── Gym n Go partner config ──────────────────────────────────────────────────
// The £200 comes off pay-in-full only (£1,599 → £1,399). Deposit stays £599:
// discounts don't apply to deposit plans, and Stripe enforces that independently
// — the deposit price has allow_promotion_codes off.
const GYM_N_GO_PARTNER = {
  gymSlug: "gym-n-go",
  gymReferral: "Gym n Go Forest Hill",
  promoCodes: {
    "GYMNGOPT": {
      label: "Gym n Go Member Discount",
      discountAmount: 200,
      fullPrice: 1399,
      depositPrice: 599,
      fullStripeLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      depositStripeLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
    },
  },
};

export default function GymNGoEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gym-logos/gym-n-go.png"
              alt="Gym n Go Forest Hill"
              width={915}
              height={383}
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-white font-black text-sm uppercase leading-none truncate">Gym n Go PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Powered by PT Launch Lab</p>
            </div>
          </div>
          <div className="bg-[#0087C4] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0">
            GYMNGOPT
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set, promo available */}
      <EnrolmentFlow partner={GYM_N_GO_PARTNER} standalone />

      {/* Minimal footer */}
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
