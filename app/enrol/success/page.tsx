import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import PurchasePixel from "./PurchasePixel";
import HandOff from "./HandOff";
import { getCheckoutSession } from "@/app/lib/stripeCheckout";
import { buildInviteUrl } from "@/app/lib/enrolmentInvite";
import { planTypeForSale } from "@/app/lib/coursePlan";

export const metadata: Metadata = {
  title: "Payment Received | PT Launch Lab",
  description: "Your PT Launch Lab payment is confirmed. Create your account to finish enrolling.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://ptlaunchlab.co.uk/enrol/success" },
};

// Must not be cached: the link is per-buyer and built from their session id.
export const dynamic = "force-dynamic";

const PRAXEL_ORIGIN = process.env.PRAXEL_ENROL_ORIGIN ?? "https://ptll.praxel.co.uk";

// Rebuilds the same signed link the webhook put in the buyer's email. Done here
// rather than passed through the URL so the signature is never something a
// browser could have tampered with on the way.
//
// Returns unsigned on any failure — a missing secret, an unreadable session, a
// session with no email. The page then tells them to use the emailed link,
// which is the path that always works. Guessing a link would be worse than
// admitting we can't build one: Praxel would refuse it and they'd think their
// payment had failed.
async function signedEnrolUrl(sessionId: string | undefined): Promise<{ url: string; signed: boolean }> {
  const fallback = { url: `${PRAXEL_ORIGIN}/enrol`, signed: false };
  const secret = process.env.PTLL_INVITE_SECRET;
  if (!sessionId || !secret) return fallback;

  try {
    const session = await getCheckoutSession(sessionId);
    const email = session?.customer_email || session?.customer_details?.email;
    if (!session || !email) return fallback;
    // Only a paid session earns a link. An `open` or `expired` one reaching
    // this page means they bounced out of Stripe, not that they bought.
    if (session.payment_status !== "paid") return fallback;

    const url = buildInviteUrl(
      PRAXEL_ORIGIN,
      {
        sid: session.id,
        email: email.toLowerCase(),
        name: session.customer_details?.name || session.metadata?.buyer_name || "",
        // Shape, never amount — the same rule the webhook follows.
        plan:
          planTypeForSale({
            mode: session.mode,
            amountTotalPence: session.amount_total ?? 0,
            metadataPlan: session.metadata?.plan,
          }) === "deposit"
            ? "deposit"
            : "PIF",
        amount: (session.amount_total ?? 0) / 100,
        gym: session.metadata?.gym_slug || undefined,
        promo: session.metadata?.promo_code || undefined,
        ts: Date.now(),
      },
      secret,
    );
    return { url, signed: true };
  } catch (err) {
    console.error("[enrol/success] could not build the Praxel link:", err);
    return fallback;
  }
}

export default async function EnrolSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const { url, signed } = await signedEnrolUrl(session_id);

  return (
    <div className="min-h-screen bg-base">
      {/* Fire browser-side fbq Purchase, dedup with the server CAPI event via
          the Stripe session_id from the URL. Kept even though the enrolment
          form has moved to Praxel: this is the browser half of the Purchase
          dedup pair, and dropping it would cut Meta's match coverage.
          useSearchParams requires a Suspense boundary in App Router. */}
      <Suspense fallback={null}>
        <PurchasePixel />
      </Suspense>
      <Nav />
      <HandOff enrolUrl={url} signed={signed} />
      <Footer />
    </div>
  );
}
