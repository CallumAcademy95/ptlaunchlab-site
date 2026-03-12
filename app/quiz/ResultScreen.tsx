'use client';

import { results, ResultKey } from './quiz-config';

const ICON: Record<ResultKey, string> = {
  onFloor:          '🏋️',
  online:           '💻',
  hybrid:           '⚡',
  alreadyQualified: '🎯',
};

interface Props {
  name: string;
  resultKey: ResultKey;
  onStartOver: () => void;
}

export default function ResultScreen({ name, resultKey, onStartOver }: Props) {
  const r = results[resultKey];

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── RESULT REVEAL ── */}
      <div className="mb-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F5C518]/30 bg-[#112035] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-pulse" />
          <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
            Your Result
          </span>
        </div>

        <p className="text-[#8CA3BF] text-base mb-2">
          Based on your answers, {name}…
        </p>

        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
          <span className="mr-3">{ICON[resultKey]}</span>
          <span className="text-[#F5C518]">{r.title}</span>
        </h2>

        <p className="text-white/70 text-lg font-medium mb-5">{r.tagline}</p>

        <div className="bg-[#112035] rounded-2xl p-5 border border-white/5">
          <p className="text-[#8CA3BF] leading-relaxed">{r.description}</p>
        </div>
      </div>

      {/* ── STEP SEQUENCE ── */}
      <div className="flex items-center gap-3 mb-8">
        {['Watch the training', 'Book your call', 'Build your PT career'].map((label, i) => (
          <div key={label} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-[#F5C518] text-[#091524]' : 'bg-[#112035] text-[#4A6280] border border-white/10'}`}>
                {i + 1}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${i === 0 ? 'text-[#F5C518]' : 'text-[#4A6280]'}`}>
                {label}
              </span>
            </div>
            {i < 2 && <div className="h-px bg-white/10 flex-1 mb-4" />}
          </div>
        ))}
      </div>

      {/* ── WEBINAR ── */}
      <div className="mb-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/20 mb-3">
              <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Step 1 — Free Webinar</span>
              <span className="text-[#4A6280] text-xs">· ~1 hr</span>
            </div>
            <h3 className="text-white font-bold text-2xl sm:text-3xl leading-tight">
              The 90 Day PT Plan
            </h3>
            <p className="text-[#8CA3BF] text-sm mt-1">
              Watch before your call — Miles breaks down the exact system.
            </p>
          </div>
        </div>

        {/* Video — prominent, with glow */}
        <div className="relative mb-5">
          <div className="absolute -inset-1 rounded-2xl bg-[#F5C518]/10 blur-sm" />
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-[#F5C518]/20 bg-[#112035]"
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

        {/* What you'll learn */}
        <p className="text-white text-sm font-semibold mb-3">What you'll learn:</p>
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
            <li key={point} className="flex items-start gap-2 text-[#8CA3BF] text-sm">
              <span className="text-[#F5C518] mt-0.5 shrink-0">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── NEXT STEP BOX ── */}
      <div className="bg-[#F5C518]/5 border border-[#F5C518]/20 rounded-2xl p-5 mb-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-2">
          Your Recommended Next Step
        </p>
        <p className="text-white leading-relaxed text-sm">{r.nextStep}</p>
      </div>

      {/* ── BOOK A CALL CTA ── */}
      <div className="bg-[#112035] rounded-2xl p-6 border border-white/5 mb-8">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-1">Step 2</p>
        <h4 className="text-white font-bold text-xl mb-1">Book Your Free Strategy Call</h4>
        <p className="text-[#8CA3BF] text-sm mb-5">
          15 minutes. No pressure. We'll map out your exact path into PT and answer every question you have.
        </p>

        {/* What to expect */}
        <ul className="space-y-2 mb-6">
          {[
            "We'll break down the cost and show you exactly how to make it work financially",
            "We'll map out how to transition out of your job — without gambling your income",
            "We'll show you how our students get their first clients before they even qualify",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2 text-[#8CA3BF] text-sm">
              <span className="text-[#F5C518] mt-0.5 shrink-0">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <a
          href="https://success.signup-lauchlab.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#F5C518] text-[#091524] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
        >
          Book Your Free Strategy Call →
        </a>

        <p className="text-center text-[#4A6280] text-xs mt-3">
          Free · 15 min · No obligation
        </p>
      </div>

      {/* Retake */}
      <div className="border-t border-white/5 pt-6 text-center">
        <button
          onClick={onStartOver}
          className="text-[#4A6280] text-sm hover:text-white transition-colors"
        >
          ↺ Retake the quiz
        </button>
      </div>
    </div>
  );
}
