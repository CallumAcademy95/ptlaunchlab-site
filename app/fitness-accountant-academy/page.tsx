import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COURSE_PRICE_LABEL } from "@/app/lib/pricing";
import { FitnessAccountantWordmark, TFA_BLUE } from "./Wordmark";

// The Fitness Accountant (Jay Johnston, Belfast): a partner who is an
// accountant, not a gym (Nov 2026). The same package model as PT Mentor Hub:
// the Level 2 & 3 course sold with his Business Launch Package for one price,
// pay in full ONLY (see PAY_IN_FULL_ONLY_PARTNERS). Attribution is gymSlug
// "the-fitness-accountant" on the enrol page.
//
// DRAFT (17 Nov 2026): Jay's own copy, sent 17 Nov, lightly edited. Not signed
// yet, so noindex, not in the sitemap, with a draft strip and dashed "to
// confirm" boxes where his graduate rates go. A bio-link page, not SEO.

const PAGE_URL = "https://ptlaunchlab.co.uk/fitness-accountant-academy";
const ENROL = "/fitness-accountant-academy/enrol";
const INSTAGRAM = "https://www.instagram.com/thefitnessaccountantmacc/";
const PODCAST_VIDEO_ID = "oznEK8qJLEw"; // Ep 36, "What Every New Personal Trainer Gets Wrong About Money"
const PODCAST_PAGE = "/podcast/what-every-new-personal-trainer-gets-wrong-about-money";

// Brand: his logo's black, white and blue. White on the blue is 4.6:1, so
// buttons are white on blue; small blue text on black uses the lighter tint.
const BLUE = TFA_BLUE;
const BLUE_TEXT = "#5B95F5";

export const metadata: Metadata = {
  title: "The Fitness Accountant Academy | Level 2 & 3 PT Course + Business Launch",
  description:
    "Qualify as a personal trainer with the NCFE Level 2 & 3, then get your business set up properly with The Fitness Accountant's Business Launch Package. One price.",
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: false },
};

const QUESTIONS = [
  "How do you register with HMRC?",
  "Should you be a sole trader or a limited company?",
  "What expenses can you claim?",
  "How much tax should you put aside?",
  "How do you make sure you're running your business properly?",
];

const COURSE = [
  { title: "NCFE Level 2 & Level 3", body: "Gym Instructing and Personal Training. Ofqual regulated and recognised across the UK fitness industry." },
  { title: "A personal tutor", body: "Introduced within 24 hours of enrolling. They keep you on track and review your work." },
  { title: "Online, at your own pace", body: "Practical units are assessed by video, so there is no centre to travel to. Most learners finish in 8–16 weeks." },
  { title: "A gym introduction", body: "When you qualify, we approach at least one gym on your behalf and introduce you." },
];

const PACKAGE = [
  { title: "A personalised consultation", body: "Based on your circumstances and your business ambitions." },
  { title: "Setting up your business correctly", body: "Guidance on the right set-up for you, including sole trader or limited company." },
  { title: "HMRC registration", body: "Registered and your tax affairs in order from the start." },
  { title: "Expenses you can legitimately claim", body: "What counts as a business expense for a PT, and what doesn't." },
  { title: "Bookkeeping and financial records", body: "Guidance on keeping your records simple and right." },
  { title: "Tax and National Insurance", body: "What you'll owe and how much to put aside, so the bill is never a surprise." },
  { title: "Your first Self Assessment return", body: "Prepared and submitted for you when it's due." },
  { title: "Personalised financial education", body: "So you understand how to manage your business going forward." },
];

const STEPS = [
  { title: "Enrol", body: "One payment, online. It takes a few minutes." },
  { title: "Qualify", body: "Your tutor is in touch within 24 hours. Study online at your own pace; most learners finish in 8–16 weeks." },
  { title: "Set up your business", body: "Your consultation with Jay: the right set-up, HMRC registration and your finances in order." },
  { title: "Run it properly", body: "Know what to claim, what to put aside and how to keep your records. Jay prepares and submits your first tax return when it's due." },
];

const FAQ = [
  { q: "Who delivers the qualification?", a: "PT Launch Lab, an NCFE Accredited Centre (No. 9002788). You get exactly the same NCFE Level 2 and Level 3 qualifications as any of our learners." },
  { q: "Who does the business and tax side?", a: "Jay Johnston, The Fitness Accountant. He's both an accountant and a personal trainer, and specialises in the fitness industry." },
  { q: "When does the Business Launch Package start?", a: "When you're qualified and ready to start working as a PT. Until then, your PT Launch Lab tutor supports you through the course." },
  { q: "Does it include my first tax return?", a: "Yes. Jay prepares and submits your first Self Assessment tax return when it's due." },
  { q: "Do I need any experience?", a: "No. The course starts at Level 2, the foundations, and builds to Level 3." },
  { q: "Can I do it around a full-time job?", a: "Yes. It's online and self-paced with no fixed class times. Most learners finish in 8–16 weeks." },
  { q: "What if I change my mind?", a: "You have a 14-day cooling-off period. Tell us within 14 days of paying and you get a full refund." },
];

function EnrolButton({ label = "Enrol now" }: { label?: string }) {
  return (
    <Link
      href={ENROL}
      className="inline-flex items-center justify-center rounded-full px-7 py-3.5 font-bold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: BLUE }}
    >
      {label} →
    </Link>
  );
}

function ToConfirm({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-400/70 bg-amber-400/10 p-4 text-sm text-amber-200">
      <p className="font-bold uppercase tracking-widest text-[10px] mb-1">To confirm with The Fitness Accountant</p>
      {children}
    </div>
  );
}

export default function FitnessAccountantAcademyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-amber-400 text-black text-center text-xs font-bold px-4 py-2">
        Draft preview for The Fitness Accountant. Not public yet.
      </div>

      {/* HERO */}
      <header className="px-6 pt-10 pb-16 md:pt-14 md:pb-24 relative overflow-hidden">
        <div
          className="absolute -right-40 -top-40 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ backgroundColor: BLUE }}
        />
        <div className="relative max-w-5xl mx-auto">
          <div className="mb-10">
            <FitnessAccountantWordmark />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BLUE_TEXT }}>The Fitness Accountant Academy</p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-none tracking-tight mb-6 max-w-3xl">
            Get qualified as a PT.{" "}
            <span style={{ color: BLUE_TEXT }}>Then get your business started properly.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 leading-relaxed max-w-2xl mb-8">
            The NCFE Level 2 &amp; 3 personal trainer qualification, plus The Fitness Accountant&apos;s Business Launch Package: your business set up, registered with HMRC and your finances in order. Together, for one price.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <EnrolButton />
            <a href={INSTAGRAM} target="_blank" rel="noopener" className="rounded-full border border-white/30 px-7 py-3.5 font-bold hover:border-white transition-colors">
              Ask Jay on Instagram
            </a>
          </div>
          <p className="text-sm text-white/60">
            <strong className="text-white">{COURSE_PRICE_LABEL}</strong> · Qualification and Business Launch Package included
          </p>
        </div>
      </header>

      {/* THE GAP: Jay's own questions */}
      <section className="bg-white text-black px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-6">
            Qualifying is the first step. <span style={{ color: BLUE }}>But what happens next?</span>
          </h2>
          <ul className="space-y-3 text-lg text-black/80 mb-6">
            {QUESTIONS.map((q) => (
              <li key={q} className="flex gap-3">
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: BLUE }} />
                {q}
              </li>
            ))}
          </ul>
          <p className="text-lg text-black/75 leading-relaxed">
            That&apos;s where Jay comes in. Rather than trying to figure it all out yourself, he helps you get your business established and understand how to manage your finances.
          </p>
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
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: BLUE }} />
                    <div>
                      <p className="font-bold">{c.title}</p>
                      <p className="text-sm text-white/65 leading-relaxed">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border p-7" style={{ borderColor: BLUE, backgroundColor: "rgba(30,110,240,0.10)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BLUE_TEXT }}>The Business Launch Package</p>
              <h3 className="font-display font-extrabold text-2xl mb-3">From The Fitness Accountant</h3>
              <p className="text-white/80 leading-relaxed mb-6">
                Normally £500 on its own. Starts when you&apos;re qualified, so your business is set up properly from day one.
              </p>
              <ul className="space-y-5">
                {PACKAGE.map((m) => (
                  <li key={m.title} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: BLUE }} />
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

      {/* MEET JAY */}
      <section className="bg-white text-black px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[340px_1fr] gap-10 items-center">
          <Image src="/partners/fitness-accountant/jay.jpg" alt="Jay Johnston, founder of The Fitness Accountant" width={600} height={800} className="w-full max-w-[340px] mx-auto h-auto rounded-3xl" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BLUE }}>Why work with Jay</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-none tracking-tight mb-6">
              Not just an accountant who understands numbers. <span style={{ color: BLUE }}>A PT who understands your industry.</span>
            </h2>
            <div className="space-y-4 text-black/75 leading-relaxed">
              <p>Jay Johnston is both an accountant and a personal trainer, so he understands the industry from both sides. He knows what it&apos;s like to work in fitness, and he understands the financial and tax responsibilities that come with running your own business.</p>
              <p>Based in Belfast, The Fitness Accountant specialises in the fitness industry: personal trainers, gym owners and fitness businesses. His background in training and in accountancy is what lets him specialise, so you&apos;re working with someone who already knows how a PT business runs.</p>
              <p>His aim is to help you avoid the common financial mistakes, understand your responsibilities and build good financial habits from the beginning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PODCAST */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: BLUE_TEXT }}>Hear from Jay</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-4 text-center">What every new PT gets wrong about money.</h2>
          <p className="text-white/65 text-center max-w-2xl mx-auto mb-10">
            Jay on the PT Launch Lab podcast: the first three things to do on day one, sole trader or limited company, what you can put through the business, and why cash in hand catches up with you.
          </p>
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 aspect-video bg-white/[0.04]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${PODCAST_VIDEO_ID}?rel=0`}
              title="What Every New Personal Trainer Gets Wrong About Money, with Jay Johnston"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="text-sm text-white/50 text-center mt-4">
            <Link href={PODCAST_PAGE} className="underline hover:text-white">Read the full episode</Link>
          </p>
        </div>
      </section>

      {/* GRADUATE RATES */}
      <section className="bg-white text-black px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BLUE }}>After your package</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-6">
            Graduate rates, <span style={{ color: BLUE }}>because you came through PT Launch Lab.</span>
          </h2>
          <p className="text-lg text-black/75 leading-relaxed mb-8">
            When your package is complete, you can keep working with Jay at a discount.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-black/10 p-6">
              <p className="font-bold text-lg mb-1">1-to-1 business mentoring</p>
              <p className="text-sm text-black/65 leading-relaxed mb-4">Ongoing support from Jay as your business grows.</p>
              <div className="bg-black rounded-xl"><ToConfirm>Graduate price, and the usual price it&apos;s discounted from.</ToConfirm></div>
            </div>
            <div className="rounded-2xl border border-black/10 p-6">
              <p className="font-bold text-lg mb-1">Jay as your accountant</p>
              <p className="text-sm text-black/65 leading-relaxed mb-4">Keep Jay on to look after your accounts and tax returns year after year.</p>
              <div className="bg-black rounded-xl"><ToConfirm>Graduate price, and the usual price it&apos;s discounted from.</ToConfirm></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-12 text-center">How it works.</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <span className="font-display font-extrabold text-4xl leading-none" style={{ color: BLUE_TEXT }}>{i + 1}</span>
                <p className="font-bold text-lg mt-3 mb-1">{s.title}</p>
                <p className="text-sm text-white/65 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICE */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BLUE_TEXT }}>Your investment</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-10">One price. Both included.</h2>
          <div className="max-w-md mx-auto rounded-3xl p-8 text-white text-left" style={{ backgroundColor: BLUE }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Pay in full</p>
            <p className="font-display font-extrabold text-6xl leading-none mb-5">{COURSE_PRICE_LABEL}</p>
            <ul className="space-y-2 text-sm font-medium">
              <li>✓ NCFE Level 2 &amp; Level 3 qualification</li>
              <li>✓ The Fitness Accountant&apos;s Business Launch Package (normally £500)</li>
              <li>✓ Your first Self Assessment return prepared and submitted</li>
              <li>✓ Personal tutor and a gym introduction</li>
              <li>✓ One payment, nothing further to pay</li>
            </ul>
          </div>
          <p className="text-sm text-white/60 mt-6 mb-8">You&apos;ve invested in getting qualified. Now invest in getting your business started properly.</p>
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
            Qualify, then start <span style={{ color: BLUE_TEXT }}>on the right foot.</span>
          </h2>
          <p className="text-white/65 mb-8">{COURSE_PRICE_LABEL}, one payment. Qualification and Business Launch Package included.</p>
          <EnrolButton />
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-white/10 text-center text-xs text-white/40 leading-relaxed">
        The Fitness Accountant Academy · Qualification delivered by PT Launch Lab, NCFE Accredited Centre No. 9002788 · Ofqual regulated
        <br />
        Business Launch Package provided by The Fitness Accountant, Belfast.
        <br />
        <a href="/terms" className="hover:text-white/70">Terms</a> · <a href="/privacy" className="hover:text-white/70">Privacy</a>
      </footer>
    </div>
  );
}
