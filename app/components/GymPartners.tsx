import Image from "next/image";

// ─── Replace src with real logo paths once uploaded to /public/logos/ ────────
const partners = [
  { name: "Leodis Gym",    src: "/logos/leodis-gym.png"    },
  { name: "Iron Wolf Gym", src: "/logos/iron-wolf-gym.png" },
  { name: "1079 Fitness",  src: "/logos/1079-fitness.png"  },
];

export default function GymPartners() {
  return (
    <section className="bg-[#112035] py-16 border-t border-[#3B82F6]/15">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">
          Gym Partners
        </p>
        <h2 className="text-white text-xl md:text-2xl font-bold mb-2">
          Part of a growing gym network across the UK.
        </h2>
        <p className="text-[#8CA3BF] text-sm mb-12 max-w-xl mx-auto">
          Our graduates get access to guaranteed interviews with our partner gyms.
          These are real relationships — not just a list of names.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {partners.map((p) => (
            <div
              key={p.name}
              className="relative h-14 w-36 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={p.src}
                alt={p.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
