import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | 6fit PT Academy",
  description: "Claim your £200 6fit member discount and start your Level 2 & 3 PT qualification today.",
  robots: { index: false },
};

// ─── 6fit partner config ──────────────────────────────────────────────────────
// TODO: Replace placeholder Stripe links with real discounted payment links
// once created in your Stripe dashboard (£1,199 full / £399 deposit).
const SIXFIT_PARTNER = {
  gymReferral: "6fit Gyms",
  promoCodes: {
    "6FITPTDISCOUNT": {
      label: "6fit Member Discount",
      discountAmount: 200,
      fullPrice: 1199,
      depositPrice: 399,
      fullStripeLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      depositStripeLink: "https://buy.stripe.com/28E14h8UM4563Ym6MqfEk0a",
    },
  },
};

export default function SixFitEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://6fitgyms.co.uk/wp-content/uploads/2022/12/6fit_FF-02.png"
              alt="6fit Gyms"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">6fit PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Powered by PT Launch Lab</p>
            </div>
          </div>
          <div className="bg-[#ed0000] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            6FITPTDISCOUNT
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set, promo available */}
      <EnrolmentFlow partner={SIXFIT_PARTNER} standalone />

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
