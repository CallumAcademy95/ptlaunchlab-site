import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import LiveRegisterForm from "./LiveRegisterForm";
import { EVENT, whenLabel, calendarUrl } from "./event";

// ─────────────────────────────────────────────────────────────────────────────
// /live — monthly live webinar/podcast registration page
//
// Event details live in ./event.ts (single source of truth, edited monthly).
// The stream link lives server-side in LIVE_STREAM_URL and is returned by
// /api/live-register after signup.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `PT Launch Lab LIVE — ${EVENT.title}`,
  description:
    "Join the free monthly PT Launch Lab live panel. Real gym owners, coaches and PTs, unfiltered, with a live audience Q&A. Mailing-list only — register free to get the watch link.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/live" },
  openGraph: {
    title: `PT Launch Lab LIVE — ${EVENT.title}`,
    description:
      "Free monthly live panel with gym owners, coaches and PTs. Live Q&A. Register to get the watch link.",
    url: "https://ptlaunchlab.co.uk/live",
    type: "website",
    images: [{ url: "/podcast-thumbnail.jpg" }],
  },
};

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: `PT Launch Lab LIVE — ${EVENT.title}`,
  description: EVENT.topic,
  startDate: EVENT.startIso,
  endDate: EVENT.endIso,
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "VirtualLocation",
    url: "https://ptlaunchlab.co.uk/live",
  },
  image: "https://ptlaunchlab.co.uk/podcast-thumbnail.jpg",
  organizer: {
    "@type": "Organization",
    name: "PT Launch Lab",
    url: "https://ptlaunchlab.co.uk",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    url: "https://ptlaunchlab.co.uk/live",
    validFrom: new Date().toISOString(),
  },
  performer: [
    ...EVENT.hosts.map((name) => ({ "@type": "Person", name })),
    ...EVENT.panellists.map((p) => ({ "@type": "Person", name: p.split("—")[0].trim() })),
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <Nav />
      <Breadcrumbs trail={[{ name: "Live", url: "https://ptlaunchlab.co.uk/live" }]} />

      <main className="bg-base text-white">
        {/* Hero + registration */}
        <section className="relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-5 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-gold text-[11px] font-bold tracking-widest uppercase mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              Live · Episode {String(EVENT.number).padStart(2, "0")} · Free to join
            </span>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight mb-5">
              {EVENT.title}
            </h1>
            <p className="text-soft/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-3">
              {EVENT.topic}
            </p>
            <p className="text-gold font-semibold text-base md:text-lg mb-9">{whenLabel}</p>

            <LiveRegisterForm calendarUrl={calendarUrl} whenLabel={whenLabel} />
          </div>
        </section>

        {/* What to expect */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-20 grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-5">On the panel</h2>
              <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Your hosts</p>
              <ul className="space-y-3 mb-7">
                {EVENT.hosts.map((p) => (
                  <li key={p} className="flex gap-3 text-soft/85 text-base leading-relaxed">
                    <span className="text-gold mt-1.5 shrink-0">●</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Guest panellists</p>
              <ul className="space-y-3">
                {EVENT.panellists.map((p) => (
                  <li key={p} className="flex gap-3 text-soft/85 text-base leading-relaxed">
                    <span className="text-gold mt-1.5 shrink-0">●</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-5">What we&apos;re tackling</h2>
              <ul className="space-y-3">
                {EVENT.talkingPoints.map((t) => (
                  <li key={t} className="flex gap-3 text-soft/85 text-base leading-relaxed">
                    <span className="text-gold font-bold mt-0.5 shrink-0">→</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Reassurance / how it works */}
        <section className="border-t border-white/[0.06] bg-card/40">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-20">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                { h: "Register free", b: "Pop your name and email in — we'll send the private watch link straight away, plus a link to submit a question for the panel." },
                { h: "Join us live", b: "Watch the panel live and drop your questions in the Q&A. We answer them on air." },
                { h: "Get the replay", b: "Miss it? It drops as a podcast episode a week later — we'll email you when it's up." },
              ].map((step, i) => (
                <div key={step.h}>
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold font-display font-extrabold text-lg">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.h}</h3>
                  <p className="text-soft/75 text-sm leading-relaxed">{step.b}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-soft/60 text-sm mt-12 max-w-xl mx-auto">
              This is a monthly live session, exclusive to our mailing list. Register once and you&apos;ll
              hear first about every future panel — plus new podcast episodes as they drop.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
