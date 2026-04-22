'use client';
import { trackEvent } from '@/app/lib/gtag';

export default function ConversionSection() {
  return (
    <section id="book-call" className="bg-base py-14 md:py-28 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[500px] rounded-full bg-gold/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
          Ready to start?
        </p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-none tracking-tight mb-5">
          Two ways to get started.
        </h2>
        <p className="text-soft/65 text-lg max-w-xl mx-auto mb-10 md:mb-16">
          Both lead to the same place — a qualification, a career, and a team behind you every step of the way.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Deposit Plan */}
          <div className="bg-card rounded-2xl p-6 md:p-8 text-left flex flex-col shadow-2xl shadow-black/30 relative border-2 border-gold/50">
            <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="inline-block mb-5">
              <span className="bg-gold text-deep text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                Most Popular
              </span>
            </div>
            <h3 className="font-display font-extrabold text-3xl text-white tracking-tight mb-1">Start With a Deposit</h3>
            <p className="text-gold font-bold text-lg mb-4">£599 today, then 5 × £200</p>
            <p className="text-soft/65 text-[15px] leading-relaxed mb-7">
              Put down a deposit to secure your place and get immediate access to your course and tutor. Split the remaining cost over a payment plan that fits your budget. You don&apos;t need the full amount to start today.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Immediate course access on deposit",
                "Personal tutor assigned within 24 hours",
                "Start your first module today",
                "Spread the remaining cost over 5 months",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-gold/15 flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-gold">
                      <path d="M2 6l3 3 5-5"/>
                    </svg>
                  </span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="/enrol"
              onClick={() => trackEvent('enrol_click', { method: 'deposit' })}
              className="block w-full text-center py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-xl shadow-gold/20 mb-3"
            >
              Reserve Your Place With a Deposit →
            </a>
            <p className="text-faint text-xs text-center">Total course fee: £1,599. Start immediately.</p>
          </div>

          {/* Pay in Full */}
          <div className="bg-card rounded-2xl p-6 md:p-8 text-left flex flex-col border border-white/[0.08] shadow-2xl shadow-black/20">
            <div className="inline-block mb-5">
              <span className="bg-blue text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                Best Value
              </span>
            </div>
            <h3 className="font-display font-extrabold text-3xl text-white tracking-tight mb-1">Pay in Full</h3>
            <p className="text-gold font-bold text-lg mb-4">£1,599 — everything included</p>
            <p className="text-soft/65 text-[15px] leading-relaxed mb-7">
              One payment. Immediate access to everything — your tutor, your qualification content, your business training, and your guaranteed interview pipeline. No instalments, no additional fees.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "One payment, fully covered",
                "Full course access from day one",
                "Personal tutor, business training, guaranteed interviews",
                "Best value — no additional fees",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-blue/15 flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-blue">
                      <path d="M2 6l3 3 5-5"/>
                    </svg>
                  </span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="/enrol"
              onClick={() => trackEvent('enrol_click', { method: 'full' })}
              className="block w-full text-center py-4 rounded-full border-2 border-gold/50 text-gold font-bold text-base hover:bg-gold hover:text-deep transition-all mb-3"
            >
              Enrol in Full Today →
            </a>
            <p className="text-faint text-xs text-center">Start within 24 hours. Everything included.</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-soft/55 text-base mb-3">
            Not sure which option is right for you?
          </p>
          <a
            href="/book-call"
            onClick={() => trackEvent('book_call_click', { location: 'conversion_section' })}
            className="inline-flex items-center gap-2 text-gold font-semibold hover:underline"
          >
            Book a free 15-minute call — straight answers, no sales pressure →
          </a>
        </div>
      </div>
    </section>
  );
}
