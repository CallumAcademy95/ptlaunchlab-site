import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import RelatedGuides from "@/app/components/RelatedGuides";
import MidContentCTA from "@/app/components/MidContentCTA";
import TwoWayCTA from "@/app/components/cta/TwoWayCTA";
import { COURSE_PRICE_LABEL, MONTHLY_PAYMENTS, MONTHLY_PRICE_LABEL } from "@/app/lib/pricing";

// "Near me" guide. Until Oct 2026 this page was the home page's sections with
// a different hero, and Google left it "crawled - currently not indexed". It
// now answers the near-me question on its own terms: the course is online,
// how the practical side works without a local centre, where you work after,
// and what to check about any local course. Facts match /courses and the
// online guide (8–16 weeks, video-assessed practicals, the gym introduction).
const PAGE_URL = "https://ptlaunchlab.co.uk/personal-trainer-course-near-me";

export const metadata: Metadata = {
  title: "Personal Trainer Course Near Me: Study Online, Level 3 NCFE",
  description:
    "Looking for a PT course near you? Our NCFE Level 2 & 3 is fully online, with practicals assessed by video at a gym you already use, so it's available anywhere in the UK. How it works, and what to check about any local course.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Personal Trainer Course Near Me: How It Works Where You Live",
    description: "A fully online NCFE Level 2 & 3 PT course, with practicals assessed by video and a guaranteed gym introduction near you.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const FAQ = [
  {
    q: "Is there a personal trainer course near me?",
    a: "If you're in the UK, yes. PT Launch Lab's NCFE Level 2 & 3 personal trainer course is fully online, so you study from home and do your practical work at a gym you already train in. There's no classroom to travel to.",
  },
  {
    q: "Do I have to go to a training centre for the practical assessment?",
    a: "No. The practical units are assessed by video: you film yourself coaching real movements, your tutor reviews the footage and either passes it or gives you feedback. NCFE, Focus Awards and Active IQ all accept video-assessed practical work.",
  },
  {
    q: "Can I do it while working full time?",
    a: "Yes. It's self-paced with no fixed class times, and most learners finish in 8–16 weeks around a job or family. You get a personal tutor within 24 hours of enrolling to keep you on track.",
  },
  {
    q: "Will gyms near me accept an online qualification?",
    a: "Yes, if it's Ofqual-regulated. Gyms hire on the qualification and how you are on the gym floor, not on whether you studied in a classroom. Our course is the NCFE Level 2 Gym Instructing and Level 3 Personal Training, Ofqual-regulated and CIMSPA-recognised.",
  },
  {
    q: "How much does it cost?",
    a: `${COURSE_PRICE_LABEL} paid in full, or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL} with no interest. That includes the qualification, a personal tutor, the Mentorship Hub and a guaranteed gym introduction.`,
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const COMPARE = [
  { what: "Getting there", local: "Travel to a centre for workshop days, often weekends", online: "Nothing to travel to" },
  { what: "Timetable", local: "Fixed dates you have to book time off for", online: "Self-paced, around your job" },
  { what: "Practical assessment", local: "A tutor watches you in person", online: "You film your coaching and your tutor reviews it" },
  { what: "Cost", local: "Usually higher, plus travel", online: "Usually lower, nothing extra to get there" },
  { what: "Meeting other learners", local: "Easier, you're in a room together", online: "Harder, so pick a course with real tutor contact" },
];

const CHECKS = [
  { title: "Is it Ofqual-regulated?", body: "Ask for the awarding body (NCFE, Active IQ, Focus Awards) and the exact qualification title, then check it on the Ofqual register. Cheap unregulated certificates won't get you insured or hired." },
  { title: "Are Level 2 and Level 3 both included?", body: "You need both to work as a PT. Some courses quote a low price for Level 3 and sell Level 2 separately." },
  { title: "What's the full price, in writing?", body: "Get one total before you pay, including any exam, resit or practical-day fees." },
  { title: "Who is your tutor, and how fast do they reply?", body: "A named person you can message beats a support inbox, whether the course is local or online." },
  { title: "What happens after you qualify?", body: "Ask whether they help you find work and get your first clients, or whether the support ends with the certificate." },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs trail={[{ name: "Personal Trainer Course Near Me", url: PAGE_URL }]} />
      <Nav />
      <main className="pt-[72px]">

        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">Personal Trainer Course Near Me</p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              A personal trainer course near you,{" "}
              <span className="text-gold">wherever you live.</span>
            </h1>
            <p className="text-xl text-soft/80 leading-relaxed mb-6">
              PT Launch Lab&apos;s NCFE Level 2 &amp; 3 personal trainer course is <strong className="text-white">fully online</strong>. You study from home, do your practical work at a gym you already use, and send it to your tutor by video. So wherever you are in the UK, there&apos;s no centre to travel to and no fixed timetable.
            </p>
            <p className="text-base text-soft/70 leading-relaxed mb-8">
              When you qualify, we introduce you to a gym: one in our partner network, or one near you that we approach on your behalf.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <TwoWayCTA source="guide-hero" />
            </div>
          </div>
        </section>

        <article className="bg-base px-6 pb-14">
          <div className="max-w-3xl mx-auto space-y-14 md:space-y-20">

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">Local classroom or online?</h2>
              <p className="text-soft/80 text-lg leading-relaxed mb-6">Most people searching for a course near them are weighing up the two. Here&apos;s the honest comparison.</p>
              <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-card text-white">
                    <tr><th className="p-4"> </th><th className="p-4">Local classroom course</th><th className="p-4">Online course</th></tr>
                  </thead>
                  <tbody className="text-soft/80">
                    {COMPARE.map((r) => (
                      <tr key={r.what} className="border-t border-white/[0.07]">
                        <th className="p-4 text-white font-semibold">{r.what}</th>
                        <td className="p-4">{r.local}</td>
                        <td className="p-4">{r.online}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-soft/80 text-base leading-relaxed mt-6">
                If you want more detail, our <Link href="/online-personal-trainer-course-uk" className="text-gold hover:underline font-semibold">comparison of 10 UK PT course providers</Link> covers in-person and online options side by side.
              </p>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">How the practical side works without a centre.</h2>
              <div className="space-y-5 text-soft/80 text-base leading-relaxed">
                <p><strong className="text-white">You learn the theory online.</strong> Anatomy, programming, nutrition and the business side, at your own pace, with a personal tutor introduced within 24 hours of enrolling.</p>
                <p><strong className="text-white">You practise in a gym you already use.</strong> Coach a friend or family member through real sessions: inductions, programmes, technique.</p>
                <p><strong className="text-white">You film it and your tutor assesses it.</strong> Your tutor watches the footage and either signs it off or tells you what to fix. NCFE accepts video-assessed practical work, and gyms hire PTs assessed this way.</p>
                <p><strong className="text-white">Most learners qualify in 8–16 weeks</strong> around a full-time job.</p>
              </div>
            </section>

            <MidContentCTA
              headline="Not sure it'll work where you live?"
              body="Book a free 15-minute call. Tell us where you are and what you do now, and we'll tell you honestly how the course and the gym introduction would work for you."
              ctaText="Book a Free Call →"
              ctaHref="/book-call"
            />

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">Where you&apos;ll work once you qualify.</h2>
              <div className="space-y-5 text-soft/80 text-base leading-relaxed">
                <p>A course near you matters most at the end, when you need a gym to work in. That&apos;s why every PT Launch Lab learner gets a <strong className="text-white">guaranteed gym introduction</strong> when they qualify: we approach at least one gym for you, either from our partner network or a gym local to you.</p>
                <p>It&apos;s a warm introduction from people who have hired 500+ PTs, not a job-board listing. Whether the gym interviews you and offers you the job is their call, and we prepare you for that conversation.</p>
                <p>
                  Based in Yorkshire? Our home is in Pontefract. See our pages for{" "}
                  <Link href="/personal-trainer-course-pontefract" className="text-gold hover:underline font-semibold">Pontefract</Link> and{" "}
                  <Link href="/personal-trainer-course-west-yorkshire" className="text-gold hover:underline font-semibold">West Yorkshire</Link>.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">What to check about any course near you.</h2>
              <div className="space-y-3">
                {CHECKS.map((c, i) => (
                  <div key={c.title} className="flex gap-4 rounded-2xl border border-white/[0.07] bg-card p-5">
                    <span className="font-display font-extrabold text-gold text-3xl leading-none shrink-0 w-8">{i + 1}.</span>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{c.title}</h3>
                      <p className="text-soft/80 text-sm leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">Common questions.</h2>
              <div className="space-y-3">
                {FAQ.map(({ q, a }) => (
                  <div key={q} className="rounded-2xl border border-white/[0.07] bg-card p-5">
                    <h3 className="text-white font-bold text-base mb-2">{q}</h3>
                    <p className="text-soft/80 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
              <p className="text-soft/80 text-base leading-relaxed mt-6">
                Want to hear from people who did it? Read our <Link href="/reviews" className="text-gold hover:underline font-semibold">learner reviews</Link>.
              </p>
            </section>

          </div>
        </article>

        <RelatedGuides currentHref="/personal-trainer-course-near-me" />
      </main>
      <Footer />
    </>
  );
}
