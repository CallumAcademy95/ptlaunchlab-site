import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

// Real graduates, photographed at Ultimate Shred with their certificates. These
// already run on the Google Business Profile. Names shown with permission
// (Callum, 2026-08-30) — an anonymous certificate reads as stock.
const GRADUATES = [
  // crop = 4:5 portrait framing, set per image to keep both the person and the
  // certificate in shot. Each was composed differently against the same wall.
  { src: "/gbp/learner-01.jpg", name: "Rebecca Davies", crop: "76% 42%" },
  { src: "/gbp/learner-03.jpg", name: "Regan Winn",     crop: "54% 46%" },
  { src: "/gbp/learner-08.jpg", name: "Samuel Brown",   crop: "52% 52%" },
] as const;
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
      {/* Wordmark only, deliberately not a link. This is a copy page: the
          reader arrived from one email about one offer, and every nav item is
          a way out of it. The site nav also carried a gold "Start Today" button
          hardcoded to /enrol, which sent £99 traffic to the £1,599 price. */}
      <header className="bg-deep px-6 pt-8">
        <div className="mx-auto max-w-3xl">
          <Image
            src="/logo.svg"
            alt="PT Launch Lab"
            width={160}
            height={56}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
      </header>
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
                Become a qualified<br className="hidden sm:block" /> personal trainer.{" "}
                <span className="block text-gold">£{SEPT99_ENTRY} to start.</span>
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
                NCFE Level 2 and Level 3, Ofqual regulated. Study online around the job
                you have now, with a tutor who knows your name. No classroom, no fixed
                hours, no credit check.
              </>
            )}
          </p>

          {/* Proof above the fold. The rating already existed on this page but sat
              below three full sections, inside a carousel. 60% of visitors never
              scroll past the fold, and a carousel hides what it does not show. */}
          {/* An avatar stack was tried here and dropped: these are wide gym photos,
              not portraits, so no square crop lands on a face at 44px. The proof
              band below the CTA carries the visual proof instead. */}
          {state !== "closed" && (
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-soft">
              <span aria-hidden className="text-gold">★★★★★</span>
              <span><span className="font-semibold text-white">5.0</span> from 19 verified reviews</span>
              <span className="text-faint">·</span>
              <span>Ofqual regulated · CIMSPA recognised</span>
            </p>
          )}
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

                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-soft">
                  {[
                    "Full refund within 14 days",
                    "No credit check, no finance company",
                    "Every unit open on day one",
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span aria-hidden className="text-gold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-faint">
                  Closes 11:59pm {formatCloses()}. After that the direct price returns to
                  £{STANDARD_TOTAL.toLocaleString()}, with £{STANDARD_ENTRY} to start.
                </p>
              </div>
            ) : (
              <div className="mt-7">
                <span
                  aria-disabled="true"
                  className="inline-block cursor-not-allowed border-2 border-gold/40 px-10 py-4 text-lg font-bold uppercase tracking-wide text-gold/60"
                >
                  Opens 7am {formatOpens()}
                </span>
                <p className="mt-4 text-sm text-faint">
                  Nothing to do yet. Come back Friday and this button goes live.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ─── Proof: the certificate itself ────────────────────── */}
        {/* The hero image has to prove the headline, and "become a qualified
            personal trainer" is proved by a person holding the qualification.
            Three, not one, because stacked proof outsells a single asset — and
            deliberately not a carousel, which hides most of what it holds.
            The Ofqual and CIMSPA marks are legible in shot, so these carry the
            accreditation claim without a line of copy. */}
        {state !== "closed" && (
          <section className="mx-auto max-w-3xl px-6 py-14">
            <h2 className="text-2xl font-bold sm:text-3xl">
              This is the certificate you finish with.
            </h2>
            <p className="mt-3 max-w-xl text-soft">
              Not a course completion badge. The NCFE Level 3 Diploma in Gym Instructing
              and Personal Training, Ofqual regulated and CIMSPA recognised.
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {GRADUATES.map((g) => (
                <li key={g.src}>
                  <div className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-card">
                    <Image
                      src={g.src}
                      alt={`${g.name} holding their NCFE Level 3 Diploma`}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                      style={{ objectPosition: g.crop }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{g.name}</p>
                  <p className="text-xs text-faint">NCFE Level 3 Diploma</p>
                </li>
              ))}
            </ul>
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
      {/* Legal only. The shared Footer carries the same six nav links as the
          header, which on a single-offer copy page are six more ways out.
          Terms and privacy stay because they have to. */}
      <footer className="bg-deep px-6 pb-14 pt-4">
        <div className="mx-auto max-w-3xl border-t border-white/10 pt-8 text-xs leading-relaxed text-faint">
          <p>© 2026 PT Launch Lab. All rights reserved.</p>
          <p className="mt-1">
            PT Launch Lab is the business mentorship provider. NCFE qualifications are
            delivered through Ultimate Shred Academy — NCFE Accredited Centre No. 9002788.
          </p>
          <p className="mt-4 flex gap-5">
            <a href="/terms" className="underline-offset-2 hover:text-white hover:underline">Terms &amp; Conditions</a>
            <a href="/privacy" className="underline-offset-2 hover:text-white hover:underline">Privacy Policy</a>
          </p>
        </div>
      </footer>
    </>
  );
}
