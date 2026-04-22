'use client';
import { trackEvent } from '@/app/lib/gtag';

export default function FinalCTA() {
  return (
    <section className="bg-base py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[900px] h-[500px] rounded-full bg-gold/[0.04] blur-[150px]" />
      </div>

      {/* Geometric accent */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="45%" y2="100%" stroke="#F5C518" strokeWidth="1" />
        <line x1="15%" y1="0" x2="60%" y2="100%" stroke="#F5C518" strokeWidth="0.6" />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-5">Ready to make the move?</p>
        <h2 className="font-display font-extrabold text-6xl md:text-8xl text-white leading-none tracking-tight mb-6">
          The gap between the job
          <br />
          <span className="text-gold">you tolerate</span>
          <br />
          and the career you want
          <br />
          <span className="text-gold">is smaller than you think.</span>
        </h2>
        <p className="text-soft/65 text-lg max-w-2xl mx-auto mb-5 leading-relaxed">
          You don&apos;t need to quit your job tomorrow. You don&apos;t need to have it all figured out. You just need to take the first step — with a provider that&apos;ll be with you from that step all the way to your first session as a qualified PT.
        </p>
        <p className="text-soft/55 text-base max-w-xl mx-auto mb-12 leading-relaxed">
          Every month you wait is another month you&apos;re not earning in a career you love. If we can get you qualified in 8–16 weeks, around your current job, with guaranteed gym interviews at the end — is there a reason not to start?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <a
            href="/book-call"
            onClick={() => trackEvent('book_call_click', { location: 'final_cta' })}
            className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-2xl shadow-gold/25"
          >
            Discover Your Pathway →
          </a>
          <a
            href="/enrol"
            onClick={() => trackEvent('enrol_click', { location: 'final_cta' })}
            className="px-10 py-4 rounded-full border border-gold/50 text-gold font-semibold text-base hover:bg-gold hover:text-deep transition-all"
          >
            Start Today
          </a>
        </div>
        <p className="text-faint text-xs mb-8">Free 15-min call · No pressure · Straight answers</p>

        <div className="w-12 h-px bg-white/[0.1] mx-auto mb-6" />
        <p className="text-faint text-xs tracking-wide">
          NCFE Level 3 · Ofqual Regulated · CIMSPA Recognised · Personal Tutor Included · Guaranteed Gym Interviews · Study in 8–16 Weeks
        </p>
      </div>
    </section>
  );
}
