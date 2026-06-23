import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import LiveRegisterForm from "./LiveRegisterForm";
import {
  EVENT,
  whenLabel,
  calendarUrl,
  sessionLabel,
  SERIES_NAME,
  SERIES_TAGLINE,
  type Speaker,
} from "./event";

// ─────────────────────────────────────────────────────────────────────────────
// /live — monthly live webinar/podcast registration page
//
// Event details live in ./event.ts (single source of truth, edited monthly).
// The stream link lives server-side in LIVE_STREAM_URL and is returned by
// /api/live-register after signup.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `${SERIES_NAME} — ${EVENT.title}`,
  description:
    "Join the free monthly PT Launch Lab live panel. Real gym owners, coaches and PTs, unfiltered, with a live audience Q&A. Mailing-list only — register free to get the watch link.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/live" },
  openGraph: {
    title: `${SERIES_NAME} — ${EVENT.title}`,
    description:
      "Free monthly live panel with gym owners, coaches and PTs. Live Q&A. Register to get the watch link.",
    url: "https://ptlaunchlab.co.uk/live",
    type: "website",
    images: [{ url: "/podcast-thumbnail.jpg" }],
  },
};

const allSpeakers = [...EVENT.hosts, ...EVENT.panellists];

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: `${SERIES_NAME} — ${EVENT.title}`,
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
  performer: allSpeakers.map((s) => ({ "@type": "Person", name: s.name })),
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SpeakerCard({ s }: { s: Speaker }) {
  return (
    <div className="flex flex-col items-center text-center">
      {s.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.photo}
          alt={s.name}
          className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover border-2 border-gold/40 mb-3"
        />
      ) : (
        <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-2 border-gold/40 bg-gold/10 mb-3 flex items-center justify-center">
          <span className="font-display font-extrabold text-2xl md:text-3xl text-gold">
            {initials(s.name)}
          </span>
        </div>
      )}
      <p className="text-white font-bold text-base leading-tight">{s.name}</p>
      <p className="text-gold/90 text-sm mt-0.5">{s.org}</p>
    </div>
  );
}

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
              Monthly live series · Free to join
            </span>

            <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight mb-4">
              {SERIES_NAME}
            </h1>
            <p className="text-soft/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              {SERIES_TAGLINE}
            </p>

            {/* This session */}
            <div className="mb-9">
              <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">{sessionLabel}</p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight mb-3">
                {EVENT.title}
              </h2>
              <p className="text-soft/75 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-2">
                {EVENT.topic}
              </p>
              <p className="text-gold font-semibold text-base md:text-lg">{whenLabel}</p>
            </div>

            <LiveRegisterForm calendarUrl={calendarUrl} whenLabel={whenLabel} />
          </div>
        </section>

        {/* Featured speakers */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-20">
            <div className="text-center mb-10">
              <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-2">Featured speakers</h2>
              <p className="text-soft/70 text-base">
                {allSpeakers.length} fitness industry leaders. One live discussion. No fluff.
              </p>
            </div>

            <p className="text-gold text-[11px] font-bold tracking-widest uppercase text-center mb-6">Your hosts</p>
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
              {EVENT.hosts.map((s) => (
                <SpeakerCard key={s.name} s={s} />
              ))}
            </div>

            <p className="text-gold text-[11px] font-bold tracking-widest uppercase text-center mb-6">Guest panellists</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-9">
              {EVENT.panellists.map((s) => (
                <SpeakerCard key={s.name} s={s} />
              ))}
            </div>
          </div>
        </section>

        {/* Questions we'll be discussing */}
        <section className="border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-5 py-14 md:py-20">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-7 text-center">
              Questions we&apos;ll be discussing
            </h2>
            <ul className="space-y-4">
              {EVENT.talkingPoints.map((t) => (
                <li
                  key={t}
                  className="flex gap-4 items-start bg-card border border-white/[0.06] rounded-xl px-5 py-4"
                >
                  <span className="text-gold font-bold text-lg mt-0.5 shrink-0">→</span>
                  <span className="text-soft/90 text-base md:text-lg leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
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
