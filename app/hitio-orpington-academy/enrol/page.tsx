import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | HITIO PT Academy Orpington",
  description:
    "Claim your £200 HITIO member discount and start your Level 2 & 3 PT qualification today.",
  robots: { index: false },
};

// ─── HITIO Orpington partner config ──────────────────────────────────────────
// gymSlug is the stable join key and must NEVER change: every sale ever
// attributed to this partner is keyed on it. gymReferral is display only.
const HITIO_PARTNER = {
  gymSlug: "hitio-orpington",
  gymReferral: "HITIO Gym Orpington",
  promoCodes: {
    "HITIOPT": {
      label: "HITIO Member Discount",
      discountAmount: 200,
      fullPrice: 1399,
      depositPrice: 599,
      fullStripeLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      depositStripeLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
    },
  },
};

export default function HitioOrpingtonEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav. Black, because the HITIO wordmark is
          pure white and disappears on anything lighter. */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png"
              alt="HITIO Gym Orpington"
              width={132}
              height={36}
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">HITIO PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Orpington</p>
            </div>
          </div>
          <div className="bg-[#e70034] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            HITIOPT
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set, promo available */}
      <EnrolmentFlow partner={HITIO_PARTNER} standalone />

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
