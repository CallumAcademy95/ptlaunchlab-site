import Image from "next/image";
import { gymPartners } from "@/app/lib/gymPartnersData";

// Social proof for gym owners: the gyms already working with us, from the same
// shared list the home page uses, so a new partner appears here automatically.
// White (`mono`) logos keep a dozen different brands calm on navy. No count in
// the heading: the list includes long-standing gyms as well as signed partners.
const LOGO_HEIGHT = 40;

export default function PartnerGymsStrip() {
  return (
    <section className="bg-surface py-12 md:py-16 border-b border-white/[0.06]" aria-labelledby="partner-gyms-heading">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-faint text-[11px] font-semibold tracking-widest uppercase mb-3">Partner gyms</p>
        <h2 id="partner-gyms-heading" className="font-display font-extrabold text-2xl md:text-3xl text-white leading-none tracking-tight mb-8">
          Gyms already working with us
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14">
          {gymPartners.map((p) => {
            const [w, h] = p.monoSize ?? [LOGO_HEIGHT * 2, LOGO_HEIGHT];
            const width = Math.round((w / h) * LOGO_HEIGHT);
            return (
              <li key={p.name} className="opacity-80 hover:opacity-100 transition-opacity">
                <Image src={p.mono ?? p.src} alt={p.name} width={width} height={LOGO_HEIGHT} className="h-10 w-auto object-contain" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
