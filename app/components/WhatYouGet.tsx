const features = [
  { icon: "📱", title: "Learn on your phone",             body: "Everything's in the Merve app. Study whenever you've got a spare moment — track your progress, see what's coming next, no classrooms or fixed hours.", badge: null },
  { icon: "📚", title: "12 focused modules",              body: "Nutrition, anatomy, programming, client coaching — just what you need to do the job, nothing you don't. Built to get you qualified and confident fast.", badge: null },
  { icon: "💼", title: "Business training built in",      body: "How to get clients. Marketing, sales, content creation — the stuff most courses don't bother teaching. This isn't an optional extra. It's the whole point.", badge: null },
  { icon: "👤", title: "Your own personal tutor",         body: "They know your name, where you're stuck, and what you need next. Direct support whenever you need it — not a help desk ticket system.", badge: "Included" },
  { icon: "🏋️", title: "Guaranteed gym interviews",       body: "Once you qualify, we guarantee interviews with our partner gyms. We've hired 500+ PTs ourselves — we know exactly what gyms look for.", badge: "Guaranteed" },
  { icon: "🎯", title: "Mentorship from Ryan & the team", body: "Direct access to the people who built Ultimate Shred to £500k+ in revenue. They keep you on track and tell you what's working right now.", badge: "Exclusive" },
];

export default function WhatYouGet() {
  return (
    <section className="bg-[#0D3559] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          What&apos;s inside the system
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight mb-4">
          We&apos;re not selling you a course.
          <br />
          <span className="text-[#F5C518]">We&apos;re building you a career.</span>
        </h2>
        <p className="text-[#8CA3BF] text-lg text-center mb-16">
          Everything inside The PT Launch Method™ — built by gym owners who&apos;ve hired 500+ trainers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-[#072B4A] border border-[#3B82F6]/25 rounded-2xl p-7 hover:border-[#F5C518]/40 transition-all duration-300"
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
