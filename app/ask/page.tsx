import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AskQuestionForm from "./AskQuestionForm";
import { EVENT, whenLabel } from "../live/event";

// ─────────────────────────────────────────────────────────────────────────────
// /ask — submit a question for the live panel
//
// Linked from the registration confirmation + reminder emails (NOT from the
// signup form, to keep that low-friction). noindex: it's a utility page for
// registered subscribers, not a marketing/SEO surface.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Ask the Panel — PT Launch Lab LIVE",
  description: "Submit a question for the next PT Launch Lab live panel. We answer the best ones on air.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://ptlaunchlab.co.uk/ask" },
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="bg-base text-white">
        <section>
          <div className="max-w-3xl mx-auto px-5 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
            <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-gold text-[11px] font-bold tracking-widest uppercase mb-6">
              Ask the panel · Episode {String(EVENT.number).padStart(2, "0")}
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
              Got a question for the panel?
            </h1>
            <p className="text-soft/80 text-lg max-w-2xl mx-auto leading-relaxed mb-2">
              Drop it below and we&apos;ll answer the best ones live on{" "}
              <span className="text-white font-semibold">{whenLabel}</span>.
            </p>
            <p className="text-soft/65 text-base max-w-2xl mx-auto leading-relaxed mb-9">
              {EVENT.topic}
            </p>
            <AskQuestionForm />
            <p className="text-soft/55 text-sm mt-8">
              Not registered yet?{" "}
              <a href="/live" className="text-gold font-semibold hover:underline">
                Save your free seat →
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
