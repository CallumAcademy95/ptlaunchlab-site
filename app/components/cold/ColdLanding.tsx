import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import QuizApp from "@/app/quiz/QuizApp";

// ─────────────────────────────────────────────────────────────────────────────
// ColdLanding — short-form, quiz-first landing page for COLD Meta ads traffic.
//
// One job: get the quiz started. No VSL, no pricing, no comparison tables, no
// competing enrol/book-call CTAs. The only action above the fold is "Start the
// 60-second quiz", which scroll-jumps to the quiz embedded further down. The
// long-form sales pages (VSL, pricing, FAQs, guarantees) live on the /vsl/*
// retargeting pages for warm audiences — see the matching avatar page.tsx.
//
// Structure (per the cold-traffic brief):
//   1. Stripped header (logo only — no menu, no competing CTAs)
//   2. Hero        — headline + subhead + 4 trust bullets + ONE CTA
//   3. Trust strip — lightweight horizontal row
//   4. Founders    — the three of them, one short line of authority
//   5. Quiz        — embedded, starts on Q1, mobile-first, progress bar
//   6. Slim footer — legal links only (privacy required for ad policy)
// ─────────────────────────────────────────────────────────────────────────────

type Avatar = "starter" | "switcher" | "returner";

export interface ColdLandingProps {
  /** Pre-tags the quiz lead for segmented retargeting + tailored result copy. */
  avatar: Avatar;
  /** White portion of the hero H1. */
  headlineLead: string;
  /** Gold-accented portion of the hero H1 (renders on its own line). */
  headlineAccent: string;
  /** One-line hero subheadline framing the quiz. */
  subhead: string;
  /** Hero trust bullets. Defaults to the shared working-adult set. */
  bullets?: string[];
  /** CTA button label. */
  ctaLabel?: string;
}

const DEFAULT_BULLETS = [
  "Built for working adults — not college kids",
  "NCFE Level 3 · Ofqual regulated",
  "Built by gym owners who’ve hired 500+ PTs",
  "Honest answer either way",
];

const TRUST_ITEMS = [
  "5.0★ Google Reviews",
  "500+ PTs hired",
  "Tutor within 24 hours",
  "Study around full-time work",
  "Ofqual regulated",
];

const FOUNDERS = [
  { src: "/callum.webp", name: "Callum" },
  { src: "/miles.webp", name: "Miles" },
  { src: "/ryan.webp", name: "Ryan" },
];

function Check() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-gold shrink-0 mt-1">
      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ColdLanding({
  avatar,
  headlineLead,
  headlineAccent,
  subhead,
  bullets = DEFAULT_BULLETS,
  ctaLabel = "Start The 60-Second Quiz",
}: ColdLandingProps) {
  return (
    <div className="bg-base min-h-screen">
      {/* ── 1. STRIPPED HEADER — logo only, no competing nav ── */}
      <header className="border-b border-white/[0.06] bg-deep">
        <div className="max-w-5xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <Link href="/" aria-label="PT Launch Lab home" className="flex items-center">
            <Image src="/logo.svg" alt="PT Launch Lab" width={150} height={52} className="h-10 w-auto object-contain" priority />
          </Link>
          <span className="hidden sm:flex items-center gap-1.5 text-soft/70 text-xs font-medium">
            <span className="text-gold">&#9733;</span> 5.0 · Ofqual regulated
          </span>
        </div>
      </header>

      {/* ── 2. HERO ── */}
      <section className="relative overflow-hidden px-6 pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="absolute -left-40 top-0 w-[520px] h-[520px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute -right-28 -bottom-10 w-[440px] h-[440px] rounded-full bg-blue opacity-[0.07] blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-white leading-[0.95] tracking-tight mb-6">
            {headlineLead}
            <br />
            <span className="text-gold">{headlineAccent}</span>
          </h1>

          <p className="text-lg sm:text-xl text-soft/85 leading-relaxed mb-8 max-w-2xl mx-auto">
            {subhead}
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 max-w-xl mx-auto text-left mb-9">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-white text-[15px]">
                <Check />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <a
            href="#quiz"
            data-cta="hero-quiz"
            className="inline-block px-10 py-4 rounded-full bg-gold text-deep font-bold text-base sm:text-lg hover:brightness-110 transition-all shadow-lg shadow-gold/30"
          >
            {ctaLabel} &rarr;
          </a>
          <p className="text-soft/55 text-xs mt-4">
            60 seconds · No email needed to start · Honest result either way
          </p>
        </div>
      </section>

      {/* ── 3. TRUST STRIP ── */}
      <section className="border-y border-white/[0.06] bg-surface/60">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-soft/75 text-[13px] font-medium">
            {TRUST_ITEMS.map((t, i) => (
              <li key={t} className="flex items-center gap-x-6">
                <span>{t}</span>
                {i < TRUST_ITEMS.length - 1 && <span className="text-white/15 hidden sm:inline">·</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 4. FOUNDER AUTHORITY ── */}
      <section className="px-6 py-12 md:py-14">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center -space-x-4 mb-5">
            {FOUNDERS.map((f) => (
              <div key={f.name} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gold/50 ring-2 ring-base">
                <Image src={f.src} alt={f.name} fill className="object-cover object-top" sizes="80px" />
              </div>
            ))}
          </div>
          <p className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight tracking-tight mb-3">
            &ldquo;We built the PT course we wish existed when we started.&rdquo;
          </p>
          <p className="text-soft/70 text-sm">
            Callum, Miles &amp; Ryan — gym owners who&rsquo;ve personally hired 500+ PTs.
          </p>
        </div>
      </section>

      {/* ── 5. QUIZ ── */}
      <section id="quiz" className="scroll-mt-4 bg-surface/40 border-t border-white/[0.06] pb-16">
        <div className="max-w-2xl mx-auto px-6 pt-12 text-center">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">
            Your 60-second PT fit quiz
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-none tracking-tight mb-3">
            5 quick questions. <span className="text-gold">One honest answer.</span>
          </h2>
          <p className="text-soft/70 text-[15px]">
            No long forms. See whether PT is a realistic next step for your situation.
          </p>
        </div>
        <Suspense fallback={<div className="min-h-[420px]" />}>
          <QuizApp embedded avatar={avatar} />
        </Suspense>
      </section>

      {/* ── 6. SLIM FOOTER — legal only ── */}
      <footer className="bg-deep border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-faint text-xs">© {new Date().getFullYear()} PT Launch Lab Ltd. All rights reserved.</p>
          <nav className="flex items-center gap-5 text-faint text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
