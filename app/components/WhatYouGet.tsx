const features = [
  {
    icon: "🏅",
    title: "NCFE Level 3 PT Qualification",
    body: "Fully accredited, Ofqual-regulated, and CIMSPA-recognised — accepted by every major gym group in the UK. PureGym, David Lloyd, Nuffield, JD Gyms, independents. This is the real thing, not a shortcut.",
    badge: null,
  },
  {
    icon: "👤",
    title: "Your Own Personal Tutor",
    body: "One tutor. Assigned to you from day one. They answer your questions, review your work, and keep you on track. No forums, no waiting days for an email. A real person who knows your name and where you're up to.",
    badge: "Included",
  },
  {
    icon: "💼",
    title: "Business Training Built In",
    body: "How to get clients. How to price yourself. How to market your services and build a PT income that grows month on month. This is what separates PTs who thrive from PTs who quietly quit six months after qualifying.",
    badge: null,
  },
  {
    icon: "🏋️",
    title: "Guaranteed Gym Interviews",
    body: "Complete the course and we arrange real interviews with real employers. Not a job board. Not a PDF of tips. Actual warm introductions to gyms that are actively hiring — because our founders are the people doing the hiring.",
    badge: "Guaranteed",
  },
  {
    icon: "📱",
    title: "Flexible Online Study",
    body: "100% online. Study in 8–16 weeks at whatever pace fits your life. No fixed lecture times, no commuting to a college. Study at 6am, lunchtime, or midnight — the platform works around you, not the other way around.",
    badge: null,
  },
  {
    icon: "💳",
    title: "Flexible Payment Options",
    body: "Pay in full for £1,399, or spread the cost with our deposit plan — £599 upfront then 5 × £200. We'd rather you get started and build a career than let money be the thing that holds you back.",
    badge: null,
  },
];

export default function WhatYouGet() {
  return (
    <section className="bg-[#0D3559] py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          Everything inside the programme
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight mb-4">
          We&apos;re not selling you a course.
          <br />
          <span className="text-[#F5C518]">We&apos;re building you a career.</span>
        </h2>
        <p className="text-[#8CA3BF] text-lg text-center mb-10 md:mb-16">
          Other courses give you the certificate. We give you the full picture — built by gym owners who&apos;ve hired 500+ trainers and know exactly what it takes to succeed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-[#072B4A] border border-[#3B82F6]/25 rounded-2xl p-5 md:p-7 hover:border-[#F5C518]/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{feat.icon}</span>
                {feat.badge && (
                  <span className="text-[10px] font-bold bg-[#F5C518] text-[#072B4A] px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {feat.badge}
                  </span>
                )}
              </div>
              <h3 className="text-white font-bold text-[17px] mb-3">{feat.title}</h3>
              <p className="text-[#8CA3BF] text-sm leading-relaxed">{feat.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
