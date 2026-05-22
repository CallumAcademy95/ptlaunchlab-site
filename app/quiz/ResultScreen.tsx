'use client';

import { results, ResultKey } from './quiz-config';
import FunnelPricingBlock from '@/app/components/FunnelPricingBlock';

type Avatar = 'starter' | 'switcher' | 'returner';

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
// arrived from /become-a-personal-trainer-uk, /career-change-to-personal-trainer,
// or /retrain-as-a-personal-trainer. Leaves the existing 4 result types
// untouched — adds a tailored "we know who you are" framing layer around them.
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

// Avatar-specific CTA framing on the booking card. Same destination, different
// emotional register so the close matches the avatar's mental state.
const AVATAR_CTA: Record<Avatar, { eyebrow: string; headline: string; sub: string; button: string }> = {
  starter: {
    eyebrow: 'Step 2',
    headline: 'Book Your Free 15-Min Career Call',
    sub: "15 minutes with the team. We'll tell you straight if PT is the right move — and exactly what your first step looks like.",
    button: 'Book My Career Call →',
  },
  switcher: {
    eyebrow: 'Step 2',
    headline: 'Book Your Free 15-Min Transition Call',
    sub: "15 minutes with the team. We'll map your transition around your current salary, hours, and timeline — and tell you straight if the maths works.",
    button: 'Map My Transition →',
  },
  returner: {
    eyebrow: 'Step 2',
    headline: 'Book a No-Pressure 15-Min Chat',
    sub: "15 minutes with the team. We'll listen, ask kind questions, and tell you honestly if this is the right fit for your life right now.",
    button: 'Book My No-Pressure Chat →',
  },
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
    eyebrow: 'Step 2',
    headline: 'Book Your Free Strategy Call',
    sub: "15 minutes. No pressure. We'll map out your exact path into PT and answer every question you have.",
    button: 'Book Your Free Strategy Call →',
  };

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* AVATAR PRE-FRAME — only renders when the quiz was reached via an avatar page */}
      {preframe && (
        <div className="mb-8 bg-gradient-to-br from-card via-card to-base border border-gold/30 rounded-2xl p-6">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">{preframe.eyebrow}</p>
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight tracking-tight mb-3">
            {preframe.headline}
          </h3>
          <p className="text-soft/80 text-[15px] leading-relaxed">{preframe.body}</p>
        </div>
      )}

      {/* RESULT REVEAL */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-card mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-xs font-semibold tracking-widest uppercase">
            Your Result
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
          <p className="text-soft/70 leading-relaxed">{r.description}</p>
        </div>
      </div>

      {/* STEP SEQUENCE */}
      <div className="flex items-center gap-3 mb-8">
        {['Watch the training', 'Book your call', 'Build your PT career'].map((label, i) => (
          <div key={label} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-gold text-deep' : 'bg-card text-faint border border-white/[0.08]'}`}>
                {i + 1}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${i === 0 ? 'text-gold' : 'text-faint'}`}>
                {label}
              </span>
            </div>
            {i < 2 && <div className="h-px bg-white/[0.08] flex-1 mb-4" />}
          </div>
        ))}
      </div>

      {/* WEBINAR */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3">
              <span className="text-gold text-xs font-semibold tracking-widest uppercase">Step 1 &mdash; Free Webinar</span>
              <span className="text-faint text-xs">&middot; ~1 hr</span>
            </div>
            <h3 className="font-display font-extrabold text-white text-2xl sm:text-3xl leading-none tracking-tight">
              The 90 Day PT Plan
            </h3>
            <p className="text-soft/60 text-sm mt-1">
              Watch before your call &mdash; Miles breaks down the exact system.
            </p>
          </div>
        </div>

        <div className="relative mb-5">
          <div className="absolute -inset-1 rounded-2xl bg-gold/10 blur-sm" />
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-gold/20 bg-card"
            style={{ paddingTop: '56.25%' }}
          >
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
            'The lifetime value formula — and how to reverse-engineer paid ads from it',
            'Why hybrid PT (in-person + online + AI) is where the money is in the next 3 years',
            'How to generate leads on the gym floor with zero budget',
            'The Meta ads system: cost per click → cost per lead → cost per client',
            'Retention systems that add hundreds of pounds per client without extra work',
            'Building a daily 90-day system you can rinse and repeat',
          ].map((point) => (
            <li key={point} className="flex items-start gap-2 text-soft/60 text-sm">
              <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-gold shrink-0 mt-0.5">
                <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* NEXT STEP BOX */}
      <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mb-6">
        <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
          Your Recommended Next Step
        </p>
        <p className="text-white leading-relaxed text-sm">{r.nextStep}</p>
      </div>

      {/* PROMO PRICING BLOCK — 48h £200 discount unlocked by completing the quiz */}
      <FunnelPricingBlock />

      {/* BOOK A CALL CTA — avatar-tailored copy when known */}
      <div className="bg-card rounded-2xl p-6 border border-white/[0.07] mb-8">
        <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-1">{cta.eyebrow}</p>
        <h4 className="font-display font-extrabold text-white text-xl leading-none tracking-tight mb-1">{cta.headline}</h4>
        <p className="text-soft/60 text-sm mb-5">{cta.sub}</p>

        <ul className="space-y-2 mb-6">
          {[
            "We'll show you exactly how the course fits around your current job",
            "We'll be honest about what you can earn as a PT and how quickly",
            "We'll explain the guaranteed gym interview process and what it means for you",
            "We'll walk through the payment options so the cost makes sense",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2 text-soft/60 text-sm">
              <span className="text-gold shrink-0">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <a
          href={avatar ? `/book-call?avatar=${avatar}` : '/book-call'}
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).fbq) {
              (window as any).fbq('track', 'Schedule', avatar ? { content_category: avatar } : undefined);
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
