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
        <p className="text-soft/65 text-base mb-12 max-w-xl mx-auto">
          {/*
            Two claims were removed here on 2026-08-25, and neither should come back.

            "accepted by every major gym group in the UK" — an objective claim
            about third parties that we cannot substantiate. "Every" would have
            to be true of all of them, and one operator saying otherwise is
            enough to make it false. The regulator status is the provable claim
            and it is the one that actually reassures a buyer.

            "not Focus Awards" — naming a competing awarding organisation to put
            it down. It invites a comparison the reader was not making, and the
            qualification's own credibility does the work without it.

            This component renders on 42 pages, so anything asserted here is
            asserted site-wide.
          */}
          NCFE Level 3 — Ofqual regulated and recognised across the UK fitness industry. A nationally recognised qualification, not an in-house certificate.
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
