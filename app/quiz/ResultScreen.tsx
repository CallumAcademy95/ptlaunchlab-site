'use client';

import Image from 'next/image';
import { results, ResultKey } from './quiz-config';
import FunnelPricingBlock from '@/app/components/FunnelPricingBlock';

type Avatar = 'starter' | 'switcher' | 'returner';

// ─────────────────────────────────────────────────────────────────────────────
// Result-page rebuild (2026-05-26)
//
// Flow is now identity-first, not transactional. Sequence:
//   1. Avatar pre-frame (existing — soft "we know how you got here")
//   2. BIG IDENTITY HEADLINE (Section 1)
//   3. PERSONAL VALIDATION   (Section 2 — emotional resonance)
//   4. OBJECTION COLLAPSE    (Section 3 — confidence builder)
//   5. FOUNDER STRIP         (Priority 11 — humans early)
//   6. WHY MOST PTS FAIL     (Priority 6 — contrast positioning)
//   7. FUTURE PACING         (Section 4 — 12-month vision)
//   8. WEBINAR               (Section 5)
//   9. WHAT HAPPENS NEXT     (Priority 10 — kill pressure fear)
//  10. RELATABLE SOCIAL PROOF (Priority 4 — avatar-specific)
//  11. PRICING BLOCK         (Priority 9 reframed inside the component)
//  12. NOT FOR EVERYONE      (Priority 12 — increases trust)
//  13. BOOK-A-CALL CTA       (warm — "Watch Your Pathway" already happened)
// ─────────────────────────────────────────────────────────────────────────────

const RESULT_ICONS: Record<ResultKey, React.ReactNode> = {
  onFloor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8 text-gold">
      <path d="M6 12h12M4 8v8M20 8v8M2 9v6M22 9v6" />
    </svg>
  ),
  online: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gold">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  ),
  hybrid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gold">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  alreadyQualified: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gold">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
};

// Avatar-specific pre-frame shown ABOVE the result reveal when the visitor
// arrived from an avatar landing page.
const AVATAR_PREFRAME: Record<Avatar, { eyebrow: string; headline: string; body: string }> = {
  starter: {
    eyebrow: 'We know how you got here',
    headline: 'You came in already half-decided.',
    body: "You live in the gym. Your mates already ask you for programmes. You just needed someone to tell you which qualification is actually legit and what comes next. The result below is the answer — built around the fact that you're closer to coaching than you think.",
  },
  switcher: {
    eyebrow: 'We know how you got here',
    headline: "You came in looking for a believable exit.",
    body: "Not a quit-on-Monday fantasy — a transition that fits a salary, a mortgage, a life you've already built. The result below is the path most career-changers like you actually take. It's gradual. It works around what you've got. It's real.",
  },
  returner: {
    eyebrow: 'We know how you got here',
    headline: "You came in quietly wondering if it's already too late.",
    body: "It's not. You've kept hold of fitness through everything — through kids, caring, rebuilding. The result below is the path that fits a life that doesn't pause for you. Kind, local, sustainable. Built around the school run, not against it.",
  },
};

// Avatar-specific CTA framing on the booking card.
const AVATAR_CTA: Record<Avatar, { eyebrow: string; headline: string; sub: string; button: string }> = {
  starter: {
    eyebrow: 'When you\'re ready',
    headline: 'Book Your Free 15-Min Career Call',
    sub: "15 minutes with the team. We'll tell you straight if PT is the right move — and exactly what your first step looks like.",
    button: 'Book My Career Call →',
  },
  switcher: {
    eyebrow: 'When you\'re ready',
    headline: 'Book Your Free 15-Min Transition Call',
    sub: "15 minutes with the team. We'll map your transition around your current salary, hours, and timeline — and tell you straight if the maths works.",
    button: 'Map My Transition →',
  },
  returner: {
    eyebrow: 'When you\'re ready',
    headline: 'Book a No-Pressure 15-Min Chat',
    sub: "15 minutes with the team. We'll listen, ask kind questions, and tell you honestly if this is the right fit for your life right now.",
    button: 'Book My No-Pressure Chat →',
  },
};

// Avatar-specific relatable social proof (Priority 4 — Hormozi value equation:
// "perceived likelihood of success" rises sharply when proof matches the
// visitor's own background).
const AVATAR_PROOF: Record<Avatar, { eyebrow: string; people: { name: string; from: string; quote: string }[] }> = {
  starter: {
    eyebrow: 'Others who landed here started exactly where you are',
    people: [
      { name: 'Declan Marsden',  from: 'Started with zero coaching experience', quote: "Officially passed my Level 3 today. If you're thinking about becoming a PT — do not hesitate to go to PT Launch Lab." },
      { name: 'Jordan Wills',    from: 'Late 20s, gym obsessed, no certificate', quote: "PT Launch Lab were really helpful throughout the process and have continued to help me get my PT business up and running. Highly recommended." },
      { name: 'Sam Brown',       from: 'Started while still at his other job',   quote: "Callum and Ryan helped me so much — not only with the course but with any other challenges too. Nothing was too much to ask. Could not recommend enough." },
    ],
  },
  switcher: {
    eyebrow: 'Real career-changers who walked this exact path',
    people: [
      { name: 'Rachel Waldock',  from: 'Career change after years in another field', quote: "From start to finish, the course was structured, supportive, and everything I needed to make the career change I'd been putting off for years. Couldn't be happier." },
      { name: 'Terri Altilar',   from: 'Studied around full-time work',              quote: "I work full time but PT Launch Lab allowed me to learn at my own rate while still having support every step of the way. The flexibility was incredible." },
      { name: 'Matthew Bell',    from: 'Transitioning into PT mid-career',           quote: "Fantastic from start to finish. The support didn't stop once I qualified — they've continued to offer guidance that's been invaluable as I build my business." },
    ],
  },
  returner: {
    eyebrow: 'Real returners and parents who said yes anyway',
    people: [
      { name: 'Rebecca Davies',       from: 'New parent, retrained around the baby', quote: "The support I received was second to none. After having my baby, I thought I'd struggle — but Callum and the team were so supportive every step of the way." },
      { name: 'Rebecca Sykes',        from: "Hadn't studied formally in years",       quote: "Absolutely amazing. I honestly wouldn't have been able to do it without the support from Callum all throughout. 100% recommend!" },
      { name: 'Annie Chomba-Kilbride',from: 'Returning after a quiet rebuild',        quote: "I've gained new skills, knowledge and confidence. I was able to learn at my own pace and was well supported throughout. Genuinely life-changing." },
    ],
  },
};

// Default proof shown when no avatar param is present
const DEFAULT_PROOF = {
  eyebrow: 'Real people who completed this exact path',
  people: [
    { name: 'Rachel Waldock', from: 'Level 2 & Level 3 PT',     quote: "From start to finish, the course was structured, supportive, and everything I needed to make the career change I'd been putting off for years." },
    { name: 'Declan Marsden', from: 'Level 3 Personal Training', quote: "Officially passed my Level 3 today. If you're thinking about becoming a PT — do not hesitate to go to PT Launch Lab." },
    { name: 'Sam Brown',      from: 'PT Launch Lab Student',     quote: "Callum and Ryan helped me so much — not only with the course but with any other challenges too. Nothing was too much to ask." },
  ],
};

interface Props {
  name: string;
  resultKey: ResultKey;
  avatar?: Avatar;
  onStartOver: () => void;
}

export default function ResultScreen({ name, resultKey, avatar, onStartOver }: Props) {
  const r = results[resultKey];
  const preframe = avatar ? AVATAR_PREFRAME[avatar] : null;
  const cta = avatar ? AVATAR_CTA[avatar] : {
    eyebrow: "When you're ready",
    headline: 'Book Your Free 15-Min Strategy Call',
    sub: "15 minutes. No pressure. We'll map out your exact path into PT and answer every question you have.",
    button: 'Book Your Free 15-Min Call →',
  };
  const proof = avatar ? AVATAR_PROOF[avatar] : DEFAULT_PROOF;

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* AVATAR PRE-FRAME — emotional softener for avatar-tagged visitors */}
      {preframe && (
        <div className="mb-8 bg-gradient-to-br from-card via-card to-base border border-gold/30 rounded-2xl p-6">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">{preframe.eyebrow}</p>
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight tracking-tight mb-3">
            {preframe.headline}
          </h3>
          <p className="text-soft/80 text-[15px] leading-relaxed">{preframe.body}</p>
        </div>
      )}

      {/* SECTION 1 — BIG IDENTITY HEADLINE */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-card mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-xs font-semibold tracking-widest uppercase">
            Your best-fit path
          </span>
        </div>

        <p className="text-soft/60 text-base mb-4">
          Based on your answers, {name}&hellip;
        </p>

        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            {RESULT_ICONS[resultKey]}
          </div>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-gold leading-none tracking-tight">
            {r.title}
          </h2>
        </div>

        <p className="text-white/70 text-lg font-medium mb-5">{r.tagline}</p>

        <div className="bg-card rounded-2xl p-5 border border-white/[0.07]">
          <p className="text-white/85 leading-relaxed text-[15px]">{r.identitySubhead}</p>
        </div>
      </div>

      {/* SECTION 2 — PERSONAL VALIDATION (emotional resonance) */}
      <div className="mb-10 bg-card rounded-2xl p-6 border border-white/[0.07]">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Why this path fits</p>
        <p className="text-white/85 leading-relaxed text-base mb-4">{r.personalValidation.intro}</p>
        <ul className="space-y-2.5 mb-4">
          {r.personalValidation.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-soft/85 text-[15px] leading-relaxed">
              <span className="text-gold shrink-0 mt-1">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-white/70 text-[15px] leading-relaxed italic">{r.personalValidation.close}</p>
      </div>

      {/* SECTION 3 — OBJECTION COLLAPSE (confidence builder) */}
      <div className="mb-10 bg-gold/[0.04] rounded-2xl p-6 border border-gold/20">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">You&apos;re not behind</p>
        <p className="text-white/85 leading-relaxed text-base mb-4">{r.objectionCollapse.intro}</p>
        <ul className="space-y-2.5 mb-4">
          {r.objectionCollapse.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-soft/85 text-[15px] leading-relaxed">
              <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-gold shrink-0 mt-1.5">
                <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-white text-[15px] leading-relaxed font-medium">{r.objectionCollapse.close}</p>
      </div>

      {/* FOUNDERS — humans early (Priority 11) */}
      <div className="mb-10 bg-card rounded-2xl p-6 border border-white/[0.07]">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-4 text-center">The team behind this</p>
        <div className="flex justify-center gap-6 mb-4">
          {[
            { src: '/callum.webp', name: 'Callum', role: 'Head of Education' },
            { src: '/miles.webp',  name: 'Miles',  role: 'Business Mentor' },
            { src: '/ryan.webp',   name: 'Ryan',   role: 'Co-Founder' },
          ].map((f) => (
            <div key={f.name} className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gold/40">
                <Image src={f.src} alt={f.name} fill className="object-cover object-top" sizes="80px" />
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-bold">{f.name}</p>
                <p className="text-soft/60 text-[10px] leading-tight">{f.role}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-soft/70 text-sm text-center leading-relaxed">
          Three founders. 30+ years coaching combined. 500+ PTs hired through our gym network.
          The course is built by the people who do the hiring.
        </p>
      </div>

      {/* WHY MOST PTS FAIL — contrast positioning (Priority 6) */}
      <div className="mb-10 bg-card rounded-2xl p-6 border border-white/[0.07]">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Why most newly-qualified PTs never make it</p>
        <p className="text-white/85 text-base leading-relaxed mb-4">
          Most PT courses hand you a certificate and walk away. That&apos;s why{' '}
          <span className="text-white font-semibold">80% of newly-qualified UK PTs quit inside 18 months</span> —
          not because they couldn&apos;t train people, but because nobody taught them how to:
        </p>
        <ul className="space-y-2 mb-4">
          {[
            'find their first 10 clients',
            'price their sessions so the maths actually works',
            'build the confidence to charge what they\'re worth',
            'turn a qualification into consistent monthly income',
          ].map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-soft/80 text-sm">
              <span className="text-red-400/60 shrink-0">✕</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-white text-base leading-relaxed mb-3 font-medium">
            PT Launch Lab was built differently.
          </p>
          <ul className="space-y-2">
            {[
              'real coaching confidence (not just textbook theory)',
              'business and marketing skills built into the course',
              'a client-acquisition playbook that actually works',
              'long-term career support — long after you qualify',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-white/90 text-sm">
                <span className="text-gold shrink-0">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION 4 — FUTURE PACING (12-month vision) */}
      <div className="mb-10 bg-gradient-to-br from-card via-card to-base rounded-2xl p-6 border border-gold/30">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">What this could look like</p>
        <p className="text-white text-base leading-relaxed mb-4">{r.futurePacing.intro}</p>
        <ul className="space-y-3">
          {r.futurePacing.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-white/90 text-[15px] leading-relaxed">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gold shrink-0 mt-0.5">
                <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION 5 — WEBINAR */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-4">
          <span className="text-gold text-xs font-semibold tracking-widest uppercase">Watch Your Recommended Pathway</span>
        </div>
        <h3 className="font-display font-extrabold text-white text-2xl sm:text-3xl leading-none tracking-tight mb-2">
          The 90 Day PT Plan
        </h3>
        <p className="text-soft/60 text-sm mb-5 leading-relaxed">
          Miles breaks down the exact system — watch before your call so the 15 minutes are spent on you, not the basics.
        </p>

        <div className="relative mb-5">
          <div className="absolute -inset-1 rounded-2xl bg-gold/10 blur-sm" />
          <div className="relative w-full rounded-2xl overflow-hidden border border-gold/20 bg-card" style={{ paddingTop: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/jBT_ez9-aAk?rel=0&modestbranding=1"
              title="The 90 Day PT Plan — Free Webinar"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        <p className="text-white text-sm font-semibold mb-3">What you&apos;ll learn:</p>
        <ul className="space-y-2">
          {[
            'How to define your ideal client so deeply you speak directly to their fears',
            'The lifetime value formula — and how to reverse-engineer it',
            'Why hybrid PT (in-person + online) is where the money is in the next 3 years',
            'How to generate leads on the gym floor with zero budget',
            'Retention systems that add hundreds of pounds per client without extra work',
          ].map((point) => (
            <li key={point} className="flex items-start gap-2 text-soft/65 text-sm">
              <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-gold shrink-0 mt-1">
                <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* WHAT HAPPENS NEXT — kills pressure fear (Priority 10) */}
      <div className="mb-10 bg-card rounded-2xl p-6 border border-white/[0.07]">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-4">What happens next?</p>
        <ol className="space-y-3">
          {[
            { n: '1', t: 'You\'ve already completed your PT pathway quiz' },
            { n: '2', t: 'Watch the personalised recommendation video above' },
            { n: '3', t: 'Book a free 15-minute call (when you\'re ready — not before)' },
            { n: '4', t: 'Speak to a course advisor — honest answers, no script' },
            { n: '5', t: 'Decide whether PT Launch Lab is the right fit for you' },
          ].map((step, i) => (
            <li key={step.n} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-deep/40 text-soft/70 border border-white/[0.08]'}`}>
                {step.n}
              </div>
              <p className="text-white/85 text-sm leading-relaxed pt-1">{step.t}</p>
            </li>
          ))}
        </ol>
        <p className="text-soft/60 text-xs mt-4 leading-relaxed">
          No pressure. No hard sell. You decide, in your own time, whether this is the right move.
        </p>
      </div>

      {/* RELATABLE SOCIAL PROOF — avatar-specific (Priority 4) */}
      <div className="mb-10">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-4 text-center">{proof.eyebrow}</p>
        <div className="space-y-3">
          {proof.people.map((p) => (
            <div key={p.name} className="bg-card rounded-2xl p-5 border border-white/[0.07]">
              <p className="text-white/85 text-[14px] leading-relaxed mb-3">&ldquo;{p.quote}&rdquo;</p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-gold text-sm font-bold">{p.name}</p>
                  <p className="text-soft/60 text-xs">{p.from}</p>
                </div>
                <span className="text-gold text-xs">★★★★★</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING BLOCK — Priority 9 reframing now lives inside FunnelPricingBlock */}
      <FunnelPricingBlock />

      {/* NOT FOR EVERYONE — counterintuitively raises trust (Priority 12) */}
      <div className="mb-10 bg-card/60 rounded-2xl p-6 border border-white/[0.07]">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Honest moment</p>
        <h4 className="font-display font-extrabold text-white text-xl sm:text-2xl leading-tight tracking-tight mb-3">
          PT Launch Lab is probably <span className="text-gold">not</span> right for you if…
        </h4>
        <ul className="space-y-2.5">
          {[
            "you're chasing overnight success or a quick win",
            "you don't actually enjoy fitness or working with people",
            "you expect clients to land in your lap the day you qualify",
            "you want a certificate but no real responsibility",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-soft/75 text-sm leading-relaxed">
              <span className="text-soft/40 shrink-0 mt-1">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-soft/70 text-sm mt-4 leading-relaxed">
          If any of that&apos;s you — be honest with yourself, save the money. If none of it is, keep reading.
        </p>
      </div>

      {/* RECOMMENDED NEXT STEP — short bridge into the CTA */}
      <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mb-6">
        <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
          Your recommended next step
        </p>
        <p className="text-white leading-relaxed text-sm">{r.nextStep}</p>
      </div>

      {/* BOOK A CALL CTA — warm tier */}
      <div className="bg-card rounded-2xl p-6 border border-white/[0.07] mb-8">
        <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-1">{cta.eyebrow}</p>
        <h4 className="font-display font-extrabold text-white text-xl leading-none tracking-tight mb-1">{cta.headline}</h4>
        <p className="text-soft/65 text-sm mb-5">{cta.sub}</p>

        <ul className="space-y-2 mb-6">
          {[
            "We'll show you exactly how the course fits around your current job",
            "We'll be honest about what you can earn as a PT and how quickly",
            "We'll explain the guaranteed gym interview process and what it means for you",
            "We'll walk through the payment options so the cost makes sense",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2 text-soft/65 text-sm">
              <span className="text-gold shrink-0">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <a
          href={avatar ? `/book-call?avatar=${avatar}` : '/book-call'}
          onClick={() => {
            if (typeof window !== 'undefined' && (window as { fbq?: (...args: unknown[]) => void }).fbq) {
              (window as { fbq: (...args: unknown[]) => void }).fbq('track', 'Schedule', avatar ? { content_category: avatar } : undefined);
            }
          }}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/20"
        >
          {cta.button}
        </a>

        <p className="text-center text-faint text-xs mt-3">
          Free &middot; 15 min &middot; No obligation
        </p>
      </div>

      <div className="border-t border-white/[0.06] pt-6 text-center">
        <button
          onClick={onStartOver}
          className="text-faint text-sm hover:text-white transition-colors"
        >
          &#8635; Retake the quiz
        </button>
      </div>
    </div>
  );
}
