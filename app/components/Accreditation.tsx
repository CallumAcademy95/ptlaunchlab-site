const logos = ["NCFE", "Ofqual Regulated", "CIMSPA", "REPs"];

export default function Accreditation() {
  return (
    <section className="bg-[#072B4A] py-20 border-t border-[#3B82F6]/15">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
          Fully accredited. Industry recognised.
        </h2>
        <p className="text-[#8CA3BF] text-base mb-12 max-w-xl mx-auto">
          Your qualification is regulated by Ofqual and accepted by every gym and insurance
          provider in the UK.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {logos.map((logo) => (
            <div
              key={logo}
              className="px-6 py-4 rounded-xl border border-[#3B82F6]/20 bg-white/5 text-white font-semibold text-sm min-w-[130px] text-center hover:border-[#F5C518]/40 transition-colors"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
