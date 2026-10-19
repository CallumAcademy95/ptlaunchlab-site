import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedGuides from "../components/RelatedGuides";
import { reviews } from "@/app/lib/reviewsData";
import { GOOGLE_PROFILE_URL } from "@/app/lib/contactDetails";
import { COURSE_PRICE_LABEL, MONTHLY_PLAN_LABEL } from "@/app/lib/pricing";

// Reviews page. Oct 2026 audit: "pt labs review(s)" showed us at ~position 8
// with nowhere for the search to land, and AI assistants look for a reviews
// page when they decide whether to recommend a provider. Every quote comes
// from reviewsData (verbatim from the Google profile). No Review or
// aggregateRating schema: self-published reviews aren't eligible for stars
// and siteSchema deliberately publishes no review counts.
const PAGE_URL = "https://ptlaunchlab.co.uk/reviews";

// Rob Fullam's review is about training at the gym, not the course, so it
// stays on the home carousel but isn't presented here as a course review.
const COURSE_REVIEWS = reviews.filter((r) => r.name !== "Rob Fullam");

export const metadata: Metadata = {
  title: "PT Launch Lab Reviews: What Learners Say About the Course",
  description:
    "Reviews of PT Launch Lab's NCFE Level 2 & 3 personal trainer course from learners who studied with us, quoted in full from our Google profile.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "PT Launch Lab Reviews",
    description: "What learners say about the PT Launch Lab NCFE Level 2 & 3 personal trainer course, in their own words.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const THEMES = [
  { title: "Support that keeps going", body: "The thing learners mention most is being able to get an answer when they're stuck, during the course and after they qualify." },
  { title: "Fits around a full-time job", body: "Several reviewers worked full time or had a young family and studied at their own pace online." },
  { title: "The business side", body: "Learners point to help with getting clients and setting up as a PT, which most courses leave out." },
];

export default function ReviewsPage() {
  return (
    <>
      <Breadcrumbs trail={[{ name: "Reviews", url: PAGE_URL }]} />
      <Nav />
      <main className="pt-[72px]">

        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">5.0★ Google rating</p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              PT Launch Lab reviews,{" "}
              <span className="text-gold">in learners&apos; own words.</span>
            </h1>
            <p className="text-xl text-soft/80 leading-relaxed mb-6">
              PT Launch Lab runs an online NCFE Level 2 &amp; 3 personal trainer course, with a personal tutor, business mentorship and a guaranteed gym introduction included. These are reviews from people who took it, copied in full from our Google profile. We haven&apos;t edited or shortened them.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={GOOGLE_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">Read them on Google →</a>
              <Link href="/graduates" className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">Meet our graduates</Link>
            </div>
          </div>
        </section>

        <section className="bg-surface border-y border-blue/15 py-12 px-6">
          <div className="max-w-5xl mx-auto grid gap-4 md:grid-cols-3">
            {THEMES.map((t) => (
              <div key={t.title} className="rounded-2xl border border-white/[0.07] bg-card p-5">
                <h2 className="text-white font-bold text-lg mb-2">{t.title}</h2>
                <p className="text-soft/80 text-sm leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-10">Every course review.</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {COURSE_REVIEWS.map((r) => (
                <figure key={r.name} className="rounded-2xl border border-white/[0.07] bg-card p-6">
                  <p className="text-gold text-sm mb-3" aria-label="5 stars">★★★★★</p>
                  <blockquote className="text-soft/85 text-sm leading-relaxed mb-4">&ldquo;{r.quote}&rdquo;</blockquote>
                  <figcaption className="text-white font-semibold text-sm">
                    {r.name} <span className="text-soft/50 font-normal">· {r.label}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface py-16 md:py-20 px-6 border-t border-blue/15">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-4">Thinking about the course?</h2>
            <p className="text-soft/70 text-lg mb-6">
              {COURSE_PRICE_LABEL} in full or {MONTHLY_PLAN_LABEL}, everything included. Book a free 15-minute call and ask us anything first.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book-call" className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">Book a Free Call →</Link>
              <Link href="/courses" className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">See the Course</Link>
            </div>
          </div>
        </section>

        <RelatedGuides currentHref="/reviews" />
      </main>
      <Footer />
    </>
  );
}
