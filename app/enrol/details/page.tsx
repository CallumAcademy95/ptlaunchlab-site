import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import PostPaymentEnrolment from "../success/PostPaymentEnrolment";

export const metadata: Metadata = {
  title: "Enrolment Details | PT Launch Lab",
  description: "Complete your PT Launch Lab enrolment details so we can register you with NCFE.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://ptlaunchlab.co.uk/enrol/details" },
};

// No-payment learner-detail capture. Same 3-step form + signed agreement as the
// post-payment flow, but with no Stripe step — for gathering the full NCFE
// learner record from someone who has already paid (or is handled offline).
// Submits to /api/enrolments → admin email + PDF + Google Sheet row, exactly
// like a normal enrolment, but flagged as a manual entry so it doesn't fire
// revenue/conversion analytics.
export default function EnrolDetailsPage() {
  return (
    <div className="min-h-screen bg-base">
      <Nav />
      <Suspense fallback={null}>
        <PostPaymentEnrolment mode="manual" />
      </Suspense>
      <Footer />
    </div>
  );
}
