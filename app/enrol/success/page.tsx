import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import PurchasePixel from "./PurchasePixel";
import PostPaymentEnrolment from "./PostPaymentEnrolment";

export const metadata: Metadata = {
  title: "Enrolment Confirmed | PT Launch Lab",
  description: "Your PT Launch Lab payment is confirmed. Complete your enrolment paperwork to finish.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://ptlaunchlab.co.uk/enrol/success" },
};

export default function EnrolSuccessPage() {
  return (
    <div className="min-h-screen bg-base">
      {/* Fire browser-side fbq Purchase, dedup with the server CAPI event via
          the Stripe session_id from the URL. useSearchParams requires a
          Suspense boundary in App Router. */}
      <Suspense fallback={null}>
        <PurchasePixel />
      </Suspense>
      <Nav />

      {/* Payment is done — the buyer now completes the full enrolment record +
          signed agreement. PostPaymentEnrolment swaps to the "what happens
          next" confirmation once submitted. */}
      <Suspense fallback={null}>
        <PostPaymentEnrolment />
      </Suspense>

      <Footer />
    </div>
  );
}
