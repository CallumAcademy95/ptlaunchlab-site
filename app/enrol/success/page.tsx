import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import PurchasePixel from "./PurchasePixel";

export const metadata: Metadata = {
  title: "Enrolment Confirmed | PT Launch Lab",
  description: "Your PT Launch Lab enrolment is confirmed. Here's what happens in the next 24 hours.",
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

      <section className="pt-[128px] pb-16 md:pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-gold">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-4">
            Payment received
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-[0.95] tracking-tight mb-6">
            You&apos;re in.
          </h1>
          <p className="text-lg md:text-xl text-soft/85 mb-10 leading-relaxed">
            Welcome to PT Launch Lab. Your enrolment is confirmed and we&apos;re
            already getting your account set up. Keep an eye on your inbox over
            the next 24 hours.
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-24 px-6">
        <div className="max-w-3xl mx-auto bg-card border border-white/10 rounded-2xl p-6 md:p-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-8 text-center">
            What happens next
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">1</span>
              <div>
                <p className="text-white font-semibold mb-1">Welcome email (within minutes)</p>
                <p className="text-soft text-sm leading-relaxed">
                  Confirmation, receipt, and your enrolment paperwork — all in
                  one email from <strong className="text-white/80">info@ptlaunchlab.co.uk</strong>.
                  Check spam if you don&apos;t see it.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">2</span>
              <div>
                <p className="text-white font-semibold mb-1">Tutor assigned (within 24 hours)</p>
                <p className="text-soft text-sm leading-relaxed">
                  Your personal NCFE tutor reaches out to introduce themselves
                  and walk you through your learning plan.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">3</span>
              <div>
                <p className="text-white font-semibold mb-1">Mentorship community access</p>
                <p className="text-soft text-sm leading-relaxed">
                  Invite link to the private mentorship community — that&apos;s
                  where you get business support, weekly Q&amp;A and access to
                  Callum, Miles and Ryan.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">4</span>
              <div>
                <p className="text-white font-semibold mb-1">First module unlocked</p>
                <p className="text-soft text-sm leading-relaxed">
                  Once your tutor is assigned, your first NCFE module is
                  unlocked and you can start whenever you&apos;re ready.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-soft text-sm mb-4">
            Need anything before you hear from us?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://wa.me/447418609039"
              className="px-6 py-3 rounded-full bg-card border border-white/10 text-white text-sm hover:border-gold/40 transition-colors"
            >
              WhatsApp us
            </a>
            <a
              href="mailto:info@ptlaunchlab.co.uk"
              className="px-6 py-3 rounded-full bg-card border border-white/10 text-white text-sm hover:border-gold/40 transition-colors"
            >
              info@ptlaunchlab.co.uk
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
