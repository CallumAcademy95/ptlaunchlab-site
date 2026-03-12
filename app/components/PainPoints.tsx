const cards = [
  {
    icon: "😔",
    title: "You dread Monday morning",
    body: "You're turning up to a job that drains you. You're good at what you do — but none of it means anything to you anymore.",
  },
  {
    icon: "🔒",
    title: "You feel completely stuck",
    body: "You know fitness is what you're meant to do. But you don't know how to turn that passion into something that pays the bills.",
  },
  {
    icon: "🔥",
    title: "You've lost your spark",
    body: "Training used to energise you. Now it's the only hour of the day you feel like yourself — and you want to build a life around it.",
  },
];

export default function PainPoints() {
  return (
    <section className="bg-[#0A0E1A] py-24 border-t border-[#3B82F6]/15">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          Does this sound familiar?
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16 leading-tight">
          You&apos;re good at your job.
          <br />
          You&apos;re just in the wrong one.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-[#141B2D] border border-[#3B82F6]/25 rounded-2xl p-8 hover:border-[#F5C518]/60 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-4xl mb-6 block">{card.icon}</span>
              <h3 className="text-white font-bold text-xl mb-3">{card.title}</h3>
              <p className="text-[#9CA3AF] text-[15px] leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
