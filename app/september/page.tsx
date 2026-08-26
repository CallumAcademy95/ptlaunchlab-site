import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Accreditation from "../components/Accreditation";
import Reviews from "../components/Reviews";
import {
  septemberOfferState,
  formatOpens,
  formatCloses,
  SEPT99_ENTRY,
  SEPT99_MONTHLY,
  SEPT99_INSTALMENTS,
  SEPT99_TOTAL,
  SEPT99_SAVING,
  STANDARD_TOTAL,
  STANDARD_ENTRY,
} from "../lib/septemberOffer";

// NOINDEX, deliberately.
//
// This is a private offer to the PT Launch Lab email list. Indexing it would put
// a £1,099 price in front of partner-gym members, who are supposed to buy through
// their gym so the gym earns its £500. An indexed page is how a partner finds out
// we undercut them — from Google, rather than from us.
export const metadata: Metadata = {
  title: "Start for £99 | PT Launch Lab",
  description: "A private offer for the PT Launch Lab email list.",
  robots: { index: false, follow: false, nocache: true },
};

// Rendered per-request so the open/closed state is the real one. Without this the
// page would be baked at build time and keep selling after the offer closes.
export const dynamic = "force-dynamic";

const included = [
  "Every unit of the qualification, open from day one",
  "Your own tutor, marking your work and answering questions",
  "The mentorship community where the business side gets taught",
  "Study at your own pace, around the job you have now",
];

export default function SeptemberOfferPage() {
  const state = septemberOfferState();

  return (
    <>
      <Nav />
      <main className="bg-deep text-white">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 sm:pt-24">
          {state === "open" && (
            <p className="mb-5 inline-block border border-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Open now · closes 11:59pm {formatCloses()}
            </p>
          )}
          {state === "before" && (
            <p className="mb-5 inline-block border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-soft">
              Opens 7am, {formatOpens()}
            </p>
          )}
          {state === "closed" && (
            <p className="mb-5 inline-block border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-soft">
              This offer has closed
            </p>
          )}

          <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">
            {state === "closed" ? (
              <>The £{SEPT99_ENTRY} weekend has ended</>
            ) : (
              <>
                Start your PT qualification for{" "}
                <span className="text-gold">£{SEPT99_ENTRY}</span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-soft">
            {state === "closed" ? (
              <>
                It ran from Friday to 11:59pm on Sunday and is no longer available.
                The standard options are below, and the qualification is the same one.
              </>
            ) : (
              <>
                The NCFE Level 3 Diploma in Gym Instructing and Personal Training.
                £{SEPT99_ENTRY} to start, then {SEPT99_INSTALMENTS} monthly payments of £{SEPT99_MONTHLY}.
                £{SEPT99_TOTAL.toLocaleString()} in total, against our normal direct price of £{STANDARD_TOTAL.toLocaleString()}.
              </>
            )}
          </p>
        </section>

        {/* ─── The numbers ──────────────────────────────────────── */}
        {state !== "closed" && (
          <section className="mx-auto max-w-3xl px-6 pb-4">
            <div className="border border-white/10 bg-card">
              <div className="border-b border-white/10 px-7 py-7">
                <p className="text-5xl font-bold leading-none text-gold sm:text-6xl">
                  £{SEPT99_ENTRY} to start
                </p>
                <p className="mt-3 text-lg text-white">
                  then {SEPT99_INSTALMENTS} monthly payments of £{SEPT99_MONTHLY}
                </p>
              </div>
              <dl className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-7 py-5">
                  <dt className="text-xs uppercase tracking-[0.12em] text-faint">Total</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">£{SEPT99_TOTAL.toLocaleString()}</dd>
                </div>
                <div className="px-7 py-5">
                  <dt className="text-xs uppercase tracking-[0.12em] text-faint">Normal direct price</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-soft">£{STANDARD_TOTAL.toLocaleString()}</dd>
                </div>
                <div className="px-7 py-5">
                  <dt className="text-xs uppercase tracking-[0.12em] text-faint">You save</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-gold">£{SEPT99_SAVING}</dd>
                </div>
              </dl>
            </div>

            {state === "open" ? (
              <div className="mt-7">
                <Link
                  href="/enrol?offer=sept99"
                  className="inline-block bg-gold px-10 py-4 text-lg font-bold uppercase tracking-wide text-deep transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  Start today for £{SEPT99_ENTRY}
                </Link>
                <p className="mt-4 text-sm text-faint">
                  Closes 11:59pm {formatCloses()}. After that the direct price returns to
                  £{STANDARD_TOTAL.toLocaleString()}, with £{STANDARD_ENTRY} to start.
                </p>
              </div>
            ) : (
              <p className="mt-7 text-sm text-faint">
                The link goes live at 7am on {formatOpens()}.
              </p>
            )}
          </section>
        )}

        {/* ─── What's included ──────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">What you get on day one</h2>
          <p className="mt-3 text-soft">
            Everything opens the moment you are in. Paying monthly does not drip-feed the course.
          </p>
          <ul className="mt-7 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-soft">
                <span aria-hidden="true" className="mt-1 text-gold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── Closed: the standard route ───────────────────────── */}
        {state === "closed" && (
          <section className="mx-auto max-w-3xl px-6 pb-14">
            <div className="border border-white/10 bg-card px-7 py-8">
              <h2 className="text-2xl font-bold">The standard options</h2>
              <p className="mt-3 text-soft">
                Pay in full at £{STANDARD_TOTAL.toLocaleString()}, or start with £{STANDARD_ENTRY} and
                spread the rest over {SEPT99_INSTALMENTS} monthly payments of £{SEPT99_MONTHLY}.
              </p>
              <Link
                href="/enrol"
                className="mt-6 inline-block bg-gold px-8 py-3.5 font-bold uppercase tracking-wide text-deep transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                See enrolment options
              </Link>
            </div>
          </section>
        )}

        <Accreditation />
        <Reviews />

        {/* ─── What the commitment actually is ──────────────────── */}
        {/*
          Deliberately placed AFTER the proof, not before it. An earlier draft
          put an affordability section third — straight after the offer — which
          brought the reader back to money worry at the exact moment they were
          weighing it up, and read as "prove you can afford us". Same facts,
          same transparency; it just belongs after they believe the thing is
          worth having.
        */}
        {state !== "closed" && (
          <section className="mx-auto max-w-3xl px-6 py-14">
            <div className="border-l-2 border-gold/50 pl-6">
              <h2 className="text-2xl font-bold sm:text-3xl">What you are committing to</h2>
              <div className="mt-5 space-y-4 text-soft">
                <p>
                  After the £{SEPT99_ENTRY} you pay today, there are {SEPT99_INSTALMENTS} monthly
                  payments of £{SEPT99_MONTHLY}, starting 30 days after you enrol. That is
                  £{SEPT99_TOTAL.toLocaleString()} in total.
                </p>
                <p>
                  No interest, no credit check, no finance company. The payments are collected
                  automatically from the card you enrol with.
                </p>
                <p>
                  The five payments run whether you finish the course in three months or ten, and
                  your certificate is claimed from NCFE once the balance is paid.
                </p>
                <p className="text-white">
                  The £{SEPT99_ENTRY} makes it easier to start. Be comfortable with
                  £{SEPT99_MONTHLY} a month for the five months after that, and you can begin
                  without finding £{STANDARD_TOTAL.toLocaleString()} up front.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── Final CTA ────────────────────────────────────────── */}
        {state === "open" && (
          <section className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Closes 11:59pm {formatCloses()}
            </h2>
            <Link
              href="/enrol?offer=sept99"
              className="mt-7 inline-block bg-gold px-10 py-4 text-lg font-bold uppercase tracking-wide text-deep transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              Start today for £{SEPT99_ENTRY}
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
