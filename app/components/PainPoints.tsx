const cards = [
  {
    icon: "😔",
    title: "You're stuck in the wrong job",
    body: "You don't enjoy it. You're doing it for security. And you don't want to risk leaving until you know something better will actually work.",
  },
  {
    icon: "🤔",
    title: "Too many courses, no clear answer",
    body: "You've looked. There are loads of options and you don't know who to trust, which qualification gyms respect, or which one will actually help you get work.",
  },
  {
    icon: "💸",
    title: "You don't want to waste money",
    body: "It's not a small decision. You want to know the course is legit, the support is real, and you'll have a clear path to earning as a PT before you commit.",
  },
];

export default function PainPoints() {
  return (
    <section className="bg-[#072B4A] py-24 border-t border-[#3B82F6]/15">
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
              className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-8 hover:border-[#F5C518]/60 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-4xl mb-6 block">{card.icon}</span>
              <h3 className="text-white font-bold text-xl mb-3">{card.title}</h3>
              <p className="text-[#8CA3BF] text-[15px] leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
