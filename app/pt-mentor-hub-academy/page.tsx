import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COURSE_PRICE_LABEL } from "@/app/lib/pricing";

// PT Mentor Hub: a mentor partner, not a gym (draft, Nov 2026). The same
// Level 2 & 3 course as every partner, sold with PT Mentor Hub's mentorship,
// pay in full ONLY (his model; see PAY_IN_FULL_ONLY_PARTNERS). Attribution is gymSlug "pt-mentor-hub" on the enrol
// page, which is what puts a sale in the partner portal. Deliberately not the
// gym academy template: that one is written around a gym floor.
//
// DRAFT until his agreement is signed. The mentoring, bio and results copy is
// PT Mentor Hub's own (sent 14 Nov 2026), lightly edited; the client photos
// are his. Not in the sitemap, noindex.

const PAGE_URL = "https://ptlaunchlab.co.uk/pt-mentor-hub-academy";
const ENROL = "/pt-mentor-hub-academy/enrol";
const INSTAGRAM = "https://www.instagram.com/pt_mentor_hub/";

// Brand: black, white and the logo's orange. Orange on black is 5.0:1; button
// text sits on the orange in black, because white on it is only 4.2:1.
const ORANGE = "#DB4A2B";

export const metadata: Metadata = {
  title: "PT Mentor Hub Academy | Level 2 & 3 PT Course + Mentorship",
  description:
    "Qualify as a personal trainer with the NCFE Level 2 & 3, plus three months of business mentoring from PT Mentor Hub. One price, studied online around your job.",
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: false },
};

const COURSE = [
  { title: "NCFE Level 2 & Level 3", body: "Gym Instructing and Personal Training. Ofqual regulated and recognised across the UK fitness industry." },
  { title: "A personal tutor", body: "Introduced within 24 hours of enrolling. They keep you on track and review your work." },
  { title: "Online, at your own pace", body: "Practical units are assessed by video, so there is no centre to travel to. Most learners finish in 8–16 weeks." },
  { title: "A gym introduction", body: "When you qualify, we approach at least one gym on your behalf and introduce you." },
];

const MENTORING = [
  { title: "1-to-1 introduction call", body: "We'll discuss your goals and where you want to take your PT business." },
  { title: "Personalised 12-week business roadmap", body: "A clear, practical plan designed to help you work towards your first 10 clients." },
  { title: "Monthly 1-to-1 check-in calls", body: "Review your progress, tackle challenges and keep you accountable." },
  { title: "Unlimited daily group mentoring", body: "Get support, advice and answers when you need them." },
];

const RESULTS = [
  { name: "Jacob", result: "Added £990 to his monthly income in his first 4 weeks", src: "/partners/pt-mentor-hub/jacob.jpg", w: 700, h: 933 },
  { name: "Jovan", result: "Added £750 to his monthly income in his first 4 weeks", src: "/partners/pt-mentor-hub/jovan.jpg", w: 700, h: 933 },
  { name: "Cameron", result: "Added 7 clients to his diary in his first 5 weeks", src: "/partners/pt-mentor-hub/cameron.jpg", w: 700, h: 864 },
];

const STEPS = [
  { title: "Enrol", body: "One payment, online. It takes a few minutes." },
  { title: "Qualify", body: "Your tutor is in touch within 24 hours. Study online at your own pace; most learners finish in 8–16 weeks." },
  { title: "Start as a PT", body: "Your three months of mentoring begin: an introduction call with Luke and your 12-week roadmap." },
  { title: "Build your business", body: "Monthly 1-to-1 check-ins and daily group sessions while you work towards your first 10 clients." },
];

const FAQ = [
  { q: "Who delivers the qualification?", a: "PT Launch Lab, an NCFE Accredited Centre (No. 9002788). You get exactly the same NCFE Level 2 and Level 3 qualifications as any of our learners." },
  { q: "Who does the mentoring?", a: "Luke at PT Mentor Hub. You get three months of practical business mentoring, normally £499 on its own." },
  { q: "When does the mentoring start?", a: "When you're working as a personal trainer, so you can put what you learn into practice straight away. Until then, your PT Launch Lab tutor supports you through the course." },
  { q: "Do I need any experience?", a: "No. The course starts at Level 2, the foundations, and builds to Level 3." },
  { q: "Can I do it around a full-time job?", a: "Yes. It's online and self-paced with no fixed class times. Most learners finish in 8–16 weeks." },
  { q: "What if I change my mind?", a: "You have a 14-day cooling-off period. Tell us within 14 days of paying and you get a full refund." },
];

function EnrolButton({ label = "Enrol now" }: { label?: string }) {
  return (
    <Link
      href={ENROL}
      className="inline-flex items-center justify-center rounded-full px-7 py-3.5 font-bold text-black transition-opacity hover:opacity-90"
      style={{ backgroundColor: ORANGE }}
    >
      {label} →
    </Link>
  );
}

export default function PtMentorHubAcademyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="text-center text-xs font-semibold py-2 px-4 text-black" style={{ backgroundColor: ORANGE }}>
        Draft preview for PT Mentor Hub. Not yet open for enrolments.
      </div>

      {/* HERO */}
      <header className="px-6 pt-10 pb-16 md:pt-14 md:pb-24 relative overflow-hidden">
        <div
          className="absolute -right-40 -top-40 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: ORANGE }}
        />
        <div className="relative max-w-5xl mx-auto">
          <Image src="/gym-logos/pt-mentor-hub-long.png" alt="PT Mentor Hub" width={363} height={136} priority className="h-14 md:h-16 w-auto mb-10" />
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: ORANGE }}>PT Mentor Hub Academy</p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-none tracking-tight mb-6 max-w-3xl">
            Don&apos;t just become qualified.{" "}
            <span style={{ color: ORANGE }}>Become a PT with the support to build a business.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 leading-relaxed max-w-2xl mb-8">
            The NCFE Level 2 &amp; 3 personal trainer qualification, plus three months of practical business mentoring from PT Mentor Hub. Together, for one price.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <EnrolButton />
            <a href={INSTAGRAM} target="_blank" rel="noopener" className="rounded-full border border-white/30 px-7 py-3.5 font-bold hover:border-white transition-colors">
              Ask us on Instagram
            </a>
          </div>
          <p className="text-sm text-white/60">
            <strong className="text-white">{COURSE_PRICE_LABEL}</strong> · Qualification and mentorship included
          </p>
        </div>
      </header>

      {/* THE GAP */}
      <section className="bg-white text-black px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-6">
            The qualification teaches you to coach. <span style={{ color: "#B23A20" }}>Nobody teaches you the rest.</span>
          </h2>
          <div className="space-y-4 text-lg text-black/75 leading-relaxed">
            <p>Most new PTs finish their course knowing how to write a programme, then get stuck on everything else: finding clients, what to charge, how to sell a session without feeling awkward.</p>
            <p>That&apos;s the part PT Mentor Hub works on. Instead of qualifying and then working the business out on your own, you get three months of mentoring to help you start building it.</p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-12 text-center">Everything in one place.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-white/50">The qualification</p>
              <h3 className="font-display font-extrabold text-2xl mb-6">Delivered by PT Launch Lab</h3>
              <ul className="space-y-5">
                {COURSE.map((c) => (
                  <li key={c.title} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ORANGE }} />
                    <div>
                      <p className="font-bold">{c.title}</p>
                      <p className="text-sm text-white/65 leading-relaxed">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border p-7" style={{ borderColor: ORANGE, backgroundColor: "rgba(219,74,43,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: ORANGE }}>The mentorship</p>
              <h3 className="font-display font-extrabold text-2xl mb-3">From PT Mentor Hub</h3>
              <p className="text-white/80 leading-relaxed mb-6">
                Your qualification gets you started. PT Mentor Hub helps you build the business. Three months of mentoring (normally £499), starting when you&apos;re working as a PT, so you can put what you learn into practice straight away.
              </p>
              <ul className="space-y-5">
                {MENTORING.map((m) => (
                  <li key={m.title} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ORANGE }} />
                    <div>
                      <p className="font-bold">{m.title}</p>
                      <p className="text-sm text-white/65 leading-relaxed">{m.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMMITMENT: PT Mentor Hub's own; its terms are still being agreed */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 md:p-10 text-black" style={{ backgroundColor: ORANGE }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3">Our commitment</p>
          <p className="font-display font-extrabold text-2xl md:text-3xl leading-tight mb-4">
            If you don&apos;t earn back your investment within your first three months as a PT, we continue mentoring you for free until you do.
          </p>
          <p className="text-sm font-medium text-black/75">
            No guesswork. No being left to figure it all out alone. Just a clear plan, practical support and someone in your corner who understands what it takes to build a PT business.
          </p>
          <p className="text-xs text-black/60 mt-4">Commitment given by PT Mentor Hub. Terms apply.</p>
        </div>
      </section>

      {/* MEET YOUR MENTOR */}
      <section className="bg-white text-black px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[340px_1fr] gap-10 items-center">
          <Image src="/partners/pt-mentor-hub/luke.jpg" alt="Luke, founder of PT Mentor Hub" width={900} height={1200} className="w-full max-w-[340px] mx-auto h-auto rounded-3xl" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#B23A20" }}>Meet your mentor</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-none tracking-tight mb-6">
              Luke has helped hundreds of PTs build successful businesses. <span style={{ color: "#B23A20" }}>Now he&apos;ll help you build yours.</span>
            </h2>
            <div className="space-y-4 text-black/75 leading-relaxed">
              <p>Luke has spent the last 12 years in the fitness industry, building a successful face-to-face personal training business and managing gyms and fitness operations across Virgin Active, PureGym and David Lloyd.</p>
              <p>Most recently he was Head of Personal Training for PureGym Denmark. He stepped away from that role to build PT Mentor Hub, helping personal trainers turn their qualifications into successful, sustainable businesses.</p>
              <p>He knows what it takes to attract clients, sell your services and build a PT business, and how to turn that into practical actions that get results. His goal is simple: help you avoid the trial and error, take action with confidence and build a PT business you&apos;re proud of.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: ORANGE }}>Results</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-12 text-center">PTs who&apos;ve been through PT Mentor Hub.</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {RESULTS.map((r) => (
              <figure key={r.name} className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.04]">
                <Image src={r.src} alt={`${r.name}, a PT mentored by PT Mentor Hub`} width={r.w} height={r.h} className="w-full aspect-[3/4] object-cover" />
                <figcaption className="p-5">
                  <p className="font-bold text-lg">{r.name}</p>
                  <p className="text-sm text-white/70 leading-relaxed">{r.result}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-white/45 text-center mt-6">Individual results. What you earn depends on your effort, location and circumstances.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white text-black px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-12 text-center">How it works.</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-black/10 p-6">
                <span className="font-display font-extrabold text-4xl leading-none" style={{ color: "#B23A20" }}>{i + 1}</span>
                <p className="font-bold text-lg mt-3 mb-1">{s.title}</p>
                <p className="text-sm text-black/65 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICE */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ORANGE }}>Your investment</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-10">One price. Both included.</h2>
          <div className="max-w-md mx-auto rounded-3xl p-8 text-black text-left" style={{ backgroundColor: ORANGE }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Pay in full</p>
            <p className="font-display font-extrabold text-6xl leading-none mb-5">{COURSE_PRICE_LABEL}</p>
            <ul className="space-y-2 text-sm font-medium">
              <li>✓ NCFE Level 2 &amp; Level 3 qualification</li>
              <li>✓ Three months of PT Mentor Hub mentoring (normally £499)</li>
              <li>✓ Personal tutor and a gym introduction</li>
              <li>✓ One payment, nothing further to pay</li>
            </ul>
          </div>
          <p className="text-sm text-white/60 mt-6 mb-8">Enrol and start any day.</p>
          <EnrolButton label="Secure your place" />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-none tracking-tight mb-8">Common questions.</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-bold mb-1.5">{q}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-16 md:py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-4">
            Ready to start? <span style={{ color: ORANGE }}>So are we.</span>
          </h2>
          <p className="text-white/65 mb-8">{COURSE_PRICE_LABEL}, one payment. Qualification and mentorship included.</p>
          <EnrolButton />
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-white/10 text-center text-xs text-white/40 leading-relaxed">
        PT Mentor Hub Academy · Qualification delivered by PT Launch Lab, NCFE Accredited Centre No. 9002788 · Ofqual regulated
        <br />
        <a href="/terms" className="hover:text-white/70">Terms</a> · <a href="/privacy" className="hover:text-white/70">Privacy</a>
      </footer>
    </div>
  );
}
