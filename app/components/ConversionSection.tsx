'use client';
import { trackEvent } from '@/app/lib/gtag';

export default function ConversionSection() {
  return (
    <section id="book-call" className="bg-[#072B4A] py-14 md:py-28 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Two ways to get started.
        </h2>
        <p className="text-[#8CA3BF] text-lg max-w-xl mx-auto mb-8 md:mb-16">
          Both lead to the same place — a qualification, a career, and a team behind you every step of the way.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Deposit Plan */}
          <div className="bg-[#0D3559] border-2 border-[#F5C518]/80 rounded-2xl p-6 md:p-8 text-left flex flex-col shadow-xl shadow-[#F5C518]/10">
            <div className="inline-block mb-6">
              <span className="bg-[#F5C518] text-[#072B4A] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                Most Popular
              </span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Start With a Deposit</h3>
            <p className="text-[#F5C518] font-bold text-lg mb-4">£599 today, then 5 × £200</p>
            <p className="text-[#8CA3BF] text-[15px] leading-relaxed mb-7">
              Put down a deposit to secure your place and get immediate access to your course and tutor. Split the remaining cost over a payment plan that fits your budget. You don&apos;t need the full amount to start today.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Immediate course access on deposit",
                "Personal tutor assigned within 24 hours",
                "Start your first module today",
                "Spread the remaining cost over 5 months",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#F5C518] text-sm font-medium">
                  <span className="text-[#F5C518] font-bold">✓</span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="/enrol"
              onClick={() => trackEvent('enrol_click', { method: 'deposit' })}
              className="block w-full text-center py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 mb-3"
            >
              Reserve Your Place With a Deposit →
            </a>
            <p className="text-[#4A6280] text-xs text-center">Total course fee: £1,599. Start immediately.</p>
          </div>

          {/* Right — Pay in Full */}
          <div className="bg-[#0D3559] border-2 border-[#3B82F6]/70 rounded-2xl p-6 md:p-8 text-left flex flex-col shadow-xl shadow-[#3B82F6]/10">
            <div className="inline-block mb-6">
              <span className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                Best Value
              </span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Pay in Full</h3>
            <p className="text-[#F5C518] font-bold text-lg mb-4">£1,599 — everything included</p>
            <p className="text-[#8CA3BF] text-[15px] leading-relaxed mb-7">
              One payment. Immediate access to everything — your tutor, your qualification content, your business training, and your guaranteed interview pipeline. No instalments, no additional fees.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "One payment, fully covered",
                "Full course access from day one",
                "Personal tutor, business training, guaranteed interviews",
                "Best value — no additional fees",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="/enrol"
              onClick={() => trackEvent('enrol_click', { method: 'full' })}
              className="block w-full text-center py-4 rounded-full border-2 border-[#F5C518] text-[#F5C518] font-bold text-base hover:bg-[#F5C518] hover:text-[#072B4A] transition-all mb-3"
            >
              Enrol in Full Today →
            </a>
            <p className="text-[#4A6280] text-xs text-center">Start within 24 hours. Everything included.</p>
          </div>
        </div>

        {/* Objection handler beneath cards */}
        <div className="mt-10 text-center">
          <p className="text-[#8CA3BF] text-base mb-3">
            Not sure which option is right for you?
          </p>
          <a
            href="/book-call"
            onClick={() => trackEvent('book_call_click', { location: 'conversion_section' })}
            className="inline-flex items-center gap-2 text-[#F5C518] font-semibold hover:underline"
          >
            Book a free 15-minute call — straight answers, no sales pressure →
          </a>
        </div>
      </div>
    </section>
  );
}
