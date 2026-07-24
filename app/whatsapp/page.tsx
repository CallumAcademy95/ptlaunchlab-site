import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppEnquiry from "../components/WhatsAppEnquiry";

const BUSINESS_WA = "447418609039"; // Cloud-API line → Leads Central setter
const PREFILL = encodeURIComponent(
  "*New PT Launch Lab enquiry*\n\nHi — I'd like to know more about becoming a PT with PT Launch Lab."
);

export const metadata: Metadata = {
  title: "Message PT Launch Lab on WhatsApp",
  description:
    "Have a quick question about becoming a personal trainer? Message the PT Launch Lab team directly on WhatsApp — a real person replies, no pressure.",
  // Ad landing page — keep out of the index.
  robots: { index: false, follow: true },
};

export default function WhatsAppPage() {
  return (
    <>
      <Nav />
      <main className="pt-[72px]">
        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden min-h-[80vh]">
          <div className="absolute -left-48 top-0 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.07] blur-3xl pointer-events-none" />
          <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-14 md:gap-20 items-start">
            {/* Left — pitch */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/5 mb-8">
                <span className="text-gold text-[11px] font-bold tracking-widest uppercase">Talk to a real person</span>
              </div>
              <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-[0.95] tracking-tight mb-6">
                Got a question?
                <br />
                <span className="text-gold">Message us on WhatsApp.</span>
              </h1>
              <p className="text-xl text-soft/85 leading-relaxed mb-8 max-w-lg">
                No forms that vanish into a void, no waiting on hold. Send us a quick message and one of the team — Callum or Ryan — will reply personally. Ask us anything about the course, the cost, or whether PT is right for you.
              </p>

              <a
                href={`https://wa.me/${BUSINESS_WA}?text=${PREFILL}`}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="whatsapp-direct"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2.1-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 3 4.7 4.1.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>
                Open WhatsApp now
              </a>
              <p className="text-soft/55 text-xs mt-4">
                Prefer to fill in a few details first? Use the quick form → we&apos;ll pre-write the message for you.
              </p>

              <p className="text-soft/60 text-xs mt-8">
                ⭐ 5.0 · 19 Verified Google Reviews &nbsp;·&nbsp; Run by gym owners who&apos;ve hired 500+ trainers
              </p>
            </div>

            {/* Right — quick form → WhatsApp */}
            <div className="bg-card border border-white/[0.06] rounded-2xl p-6 md:p-8">
              <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">Quick enquiry</p>
              <h2 className="font-display font-extrabold text-2xl text-white leading-tight mb-6">
                Send us the details — we&apos;ll do the rest.
              </h2>
              <WhatsAppEnquiry />
            </div>
          </div>
        </section>

        <section className="bg-surface py-10 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-soft/75 text-base">
              Not into WhatsApp?{" "}
              <Link href="/book-call" className="text-gold hover:brightness-110 font-semibold">Book a free 15-min call</Link>{" "}
              or{" "}
              <Link href="/quiz" className="text-gold hover:brightness-110 font-semibold">take the 60-second quiz</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
