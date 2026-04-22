const logos = [
  { name: "NCFE", desc: "Awarding Organisation" },
  { name: "Ofqual Regulated", desc: "Government Regulated" },
  { name: "CIMSPA", desc: "Industry Recognised" },
  { name: "REPs", desc: "Register of Exercise Professionals" },
];

export default function Accreditation() {
  return (
    <section className="bg-surface py-20 border-t border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
          Accreditations
        </p>
        <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-4">
          Fully accredited.
          <br />
          <span className="text-gold">Industry recognised.</span>
        </h2>
        <p className="text-soft/65 text-base mb-12 max-w-lg mx-auto">
          Your qualification is regulated by Ofqual and accepted by every gym and insurance
          provider in the UK.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="px-6 py-4 rounded-xl border border-white/[0.08] bg-card hover:border-gold/30 transition-colors min-w-[150px] text-center group"
            >
              <p className="text-white font-bold text-sm group-hover:text-gold transition-colors">{logo.name}</p>
              <p className="text-soft/45 text-[11px] mt-1">{logo.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
