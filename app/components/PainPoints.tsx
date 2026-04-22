const cards = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14M5 21h14"/>
        <path d="M6 3v3.5C6 9.5 12 12 12 12S6 14.5 6 17.5V21"/>
        <path d="M18 3v3.5C18 9.5 12 12 12 12s6 2.5 6 5.5V21"/>
      </svg>
    ),
    title: "You're stuck in a job that's fine. But fine isn't enough.",
    body: "You're capable, you're driven — and you spend more time helping mates with their training than you do caring about your actual career. You know fitness is where you belong. You just haven't made the move yet.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="m21 21-3.5-3.5"/>
      </svg>
    ),
    title: "You've looked at PT courses, but they all feel the same.",
    body: "Level 3 here, Level 3 there. Some are cheap and feel flimsy. Some are expensive and you can't tell what you're actually getting. None of them answer the question that actually matters: \"Will I get clients and make money?\"",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M2 11h20M6 7V5a2 2 0 0 1 4 0v2M14 7V5a2 2 0 0 1 4 0v2"/>
      </svg>
    ),
    title: "You're worried it won't work out financially.",
    body: "Spending over a thousand pounds on a course when you've got bills to pay is a serious decision. You need to know it's going to lead somewhere real — not just a certificate and a hope for the best.",
  },
];

export default function PainPoints() {
  return (
    <section className="bg-base py-14 md:py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">
          If any of this sounds like you, keep reading
        </p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white text-center mb-10 md:mb-16 leading-none tracking-tight">
          You&apos;re not lacking ambition.
          <br />
          <span className="text-gold">You&apos;re lacking the</span>
          <br />
          <span className="text-gold">right next step.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-card border border-white/[0.07] rounded-2xl p-6 md:p-8 hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-6 group-hover:bg-gold/15 transition-colors">
                {card.icon}
              </div>
              <h3 className="text-white font-bold text-[17px] mb-3 leading-snug">{card.title}</h3>
              <p className="text-soft/70 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
