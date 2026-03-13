import Image from "next/image";

// Gym partner logos
const gymPartners = [
  { name: "Leodis 24/7 Gym",      src: "/logos/leodis-gym.png"       },
  { name: "Iron Wolf Gym",         src: "/logos/iron-wolf-gym.png"    },
  { name: "1079 Fitness",          src: "/logos/1079-fitness.png"     },
  { name: "Ultimate Shred",        src: "/logos/ultimate-shred.png"   },
];

// Accreditation logos
const accreditations = [
  { name: "NCFE",   src: "/logos/ncfe.png"   },
  { name: "Ofqual", src: "/logos/ofqual.png" },
];

export default function GymPartners() {
  return (
    <section className="bg-[#112035] py-16 border-t border-[#3B82F6]/15">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">
          Partners &amp; Accreditations
        </p>
        <h2 className="text-white text-xl md:text-2xl font-bold mb-2">
          Backed by industry. Trusted by gyms.
        </h2>
        <p className="text-[#8CA3BF] text-sm mb-12 max-w-xl mx-auto">
          Our qualification is fully accredited and our graduates are welcomed into
          6 partner gyms across the UK.
        </p>

        {/* Gym partner logos */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
          {gymPartners.map((p) => (
            <div
              key={p.name}
              className="bg-white/95 rounded-xl p-4 w-36 h-20 flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105"
            >
              <div className="relative w-full h-full">
                <Image
                  src={p.src}
                  alt={p.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-xs mx-auto mb-10">
          <div className="flex-1 h-px bg-[#3B82F6]/20" />
          <span className="text-[#4A6280] text-xs tracking-widest uppercase">Accredited by</span>
          <div className="flex-1 h-px bg-[#3B82F6]/20" />
        </div>

        {/* Accreditation logos */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {accreditations.map((p) => (
            <div
              key={p.name}
              className="bg-white/95 rounded-xl p-4 w-36 h-20 flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105"
            >
              <div className="relative w-full h-full">
                <Image
                  src={p.src}
                  alt={p.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
