const features = [
  { icon: "📱", title: "Study on your phone",             body: "Delivered through the Merve app. Study at your pace, your schedule — no classrooms, no fixed hours, no commute.", badge: null },
  { icon: "📚", title: "12 structured modules",           body: "Covering everything from anatomy and nutrition to exercise prescription and programme design. Built to get you qualified and confident.", badge: null },
  { icon: "💼", title: "Business training built in",      body: "Learn how to get clients, set your rates, build your brand, and run your PT business from day one — not as an afterthought.", badge: null },
  { icon: "👤", title: "Your own personal tutor",         body: "Not a chatbot. Not a generic support line. A real tutor assigned to you throughout your entire qualification.", badge: "Included" },
  { icon: "🏋️", title: "Guaranteed gym interviews",       body: "Once you qualify, we guarantee gym interviews. We've hired 500+ PTs ourselves — we know what gyms look for and we prepare you for it.", badge: "Guaranteed" },
  { icon: "🎯", title: "Mentorship from Callum, Miles & Ryan", body: "We've done this. We guide you through the exact steps we took to build a full-time income as independent personal trainers.", badge: "Exclusive" },
];

export default function WhatYouGet() {
  return (
    <section className="bg-[#112035] py-24">
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
              className="bg-[#091524] border border-[#3B82F6]/25 rounded-2xl p-7 hover:border-[#F5C518]/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{feat.icon}</span>
                {feat.badge && (
                  <span className="text-[10px] font-bold bg-[#F5C518] text-[#091524] px-2.5 py-1 rounded-full uppercase tracking-wide">
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
