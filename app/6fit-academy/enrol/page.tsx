import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | 6fit PT Academy",
  description:
    "Enrol in the 6fit PT Academy and claim your £200 exclusive discount. Level 2 & 3 Personal Training qualification with mentorship included.",
  robots: { index: false }, // Partner enrol pages excluded from index
};

// ─── 6fit partner config ──────────────────────────────────────────────────────
// TODO: Once you have created the £1,199 full-payment Stripe link and the
//       £399 deposit Stripe link for the discounted 6fit pricing, replace
//       the placeholder strings below with the real Stripe URLs.
const SIXFIT_PARTNER = {
  gymReferral: "6fit Gyms",
  promoCodes: {
    "6FITPTDISCOUNT": {
      label: "6fit Member Discount",
      discountAmount: 200,
      fullPrice: 1199,
      depositPrice: 399,
      fullStripeLink:    "REPLACE_WITH_6FIT_FULL_PAYMENT_STRIPE_LINK",    // TODO
      depositStripeLink: "REPLACE_WITH_6FIT_DEPOSIT_STRIPE_LINK",         // TODO
    },
  },
};

export default function SixFitEnrolPage() {
  return <EnrolmentFlow partner={SIXFIT_PARTNER} />;
}
