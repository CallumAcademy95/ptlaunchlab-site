const AwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="8" r="5"/>
    <path d="M9 14.5 8 22l4-2 4 2-1-7.5"/>
  </svg>
);

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 3v18h18"/>
    <path d="m7 17 4-4 4 4 4-7"/>
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="m2 12 5.25 5c.83.8 2.17.8 3 0L12 15l1.75 2c.83.8 2.17.8 3 0L22 12"/>
    <path d="M7 17V7l3-3h4l5 5"/>
    <path d="m12 15 2-2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <path d="M1 10h22"/>
  </svg>
);

const features = [
  {
    Icon: AwardIcon,
    title: "NCFE Level 3 PT Qualification",
    body: "Fully accredited, Ofqual-regulated, and CIMSPA-recognised — accepted by every major gym group in the UK. PureGym, David Lloyd, Nuffield, JD Gyms, independents. This is the real thing, not a shortcut.",
    badge: null,
  },
  {
    Icon: PersonIcon,
    title: "Your Own Personal Tutor",
    body: "One tutor. Assigned to you from day one. They answer your questions, review your work, and keep you on track. No forums, no waiting days for an email. A real person who knows your name and where you're up to.",
    badge: "Included",
  },
  {
    Icon: ChartIcon,
    title: "Business Training Built In",
    body: "How to get clients. How to price yourself. How to market your services and build a PT income that grows month on month. This is what separates PTs who thrive from PTs who quietly quit six months after qualifying.",
    badge: null,
  },
  {
    Icon: HandshakeIcon,
    title: "Guaranteed Gym Interviews",
    body: "Complete the course and we arrange real interviews with real employers. Not a job board. Not a PDF of tips. Actual warm introductions to gyms that are actively hiring — because our founders are the people doing the hiring.",
    badge: "Guaranteed",
  },
  {
    Icon: CalendarIcon,
    title: "Flexible Online Study",
    body: "100% online. Study in 8–16 weeks at whatever pace fits your life. No fixed lecture times, no commuting to a college. Study at 6am, lunchtime, or midnight — the platform works around you, not the other way around.",
    badge: null,
  },
  {
    Icon: CardIcon,
    title: "Flexible Payment Options",
    body: "Pay in full for £1,599, or spread the cost with our deposit plan — £599 upfront then 5 × £200. We'd rather you get started and build a career than let money be the thing that holds you back.",
    badge: null,
  },
];

export default function WhatYouGet() {
  return (
    <section className="bg-base py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">
          Everything inside the programme
        </p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white text-center leading-none tracking-tight mb-4">
          We&apos;re not selling you a course.
          <br />
          <span className="text-gold">We&apos;re building you a career.</span>
        </h2>
        <p className="text-soft/65 text-lg text-center mb-10 md:mb-16 max-w-xl mx-auto">
          Other courses give you the certificate. We give you the full picture — built by gym owners who&apos;ve hired 500+ trainers and know exactly what it takes to succeed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-card border border-white/[0.07] rounded-2xl p-6 hover:border-gold/25 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:bg-gold/15 transition-colors">
                  <feat.Icon />
                </div>
                {feat.badge && (
                  <span className="text-[10px] font-bold bg-gold text-deep px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {feat.badge}
                  </span>
                )}
              </div>
              <h3 className="text-white font-bold text-[16px] mb-2.5">{feat.title}</h3>
              <p className="text-soft/65 text-sm leading-relaxed">{feat.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
