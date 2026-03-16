const cards = [
  {
    icon: "😩",
    title: "You're stuck in a job that's fine. But fine isn't enough.",
    body: "You're capable, you're driven — and you spend more time helping mates with their training than you do caring about your actual career. You know fitness is where you belong. You just haven't made the move yet.",
  },
  {
    icon: "🔍",
    title: "You've looked at PT courses, but they all feel the same.",
    body: "Level 3 here, Level 3 there. Some are cheap and feel flimsy. Some are expensive and you can't tell what you're actually getting. None of them answer the question that actually matters: \"Will I get clients and make money?\"",
  },
  {
    icon: "💰",
    title: "You're worried it won't work out financially.",
    body: "Spending over a thousand pounds on a course when you've got bills to pay is a serious decision. You need to know it's going to lead somewhere real — not just a certificate and a hope for the best.",
  },
];

export default function PainPoints() {
  return (
    <section className="bg-[#072B4A] py-14 md:py-24 border-t border-[#3B82F6]/15">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          If any of this sounds like you, keep reading
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-10 md:mb-16 leading-tight">
          You&apos;re not lacking ambition.
          <br />
          You&apos;re lacking the right next step.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-6 md:p-8 hover:border-[#F5C518]/60 transition-all duration-300 hover:-translate-y-1"
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
