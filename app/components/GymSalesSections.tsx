import Image from "next/image";
import type { GymSalesPage } from "@/app/lib/gymPartnerConfig";

// Sales-page sections for a gym academy page (spec 2026-10-28). Rendered by
// GymAcademyPage only when the gym's config has a salesPage block. Copy and
// photos come from the config; nothing here is gym-specific.

export function CoachingStory({ s, accent }: { s: GymSalesPage; accent: string }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-4">{s.coaching.heading}</h2>
        <p className="text-center text-lg text-gray-500 mb-12 max-w-2xl mx-auto">{s.coaching.intro}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {s.coaching.cards.map((card) => (
            <div key={card.title} className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image src={card.image} alt={card.imageAlt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-black text-black uppercase text-base mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-black rounded-2xl px-8 py-5 text-center mt-10">
          <p className="text-white font-black text-lg uppercase tracking-wide">
            <span style={{ color: accent }}>{s.coaching.closingLine}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export function MemberQuotes({ s, accent }: { s: GymSalesPage; accent: string }) {
  return (
    <section className="bg-black py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase text-center mb-12">{s.quotesHeading}</h2>
        <div className={s.quotes.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "max-w-2xl mx-auto"}>
          {s.quotes.map((q) => (
            <figure key={q.text} className="bg-white/10 border border-white/10 rounded-2xl p-7">
              <p className="text-2xl font-black mb-3" style={{ color: accent }} aria-hidden>&ldquo;</p>
              <blockquote className="text-white/85 text-base leading-relaxed mb-4">{q.text}</blockquote>
              <figcaption className="text-white/50 text-sm font-semibold">{q.attribution}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CoachPath({ s, accent, gymName }: { s: GymSalesPage; accent: string; gymName: string }) {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-12">{s.path.heading}</h2>
        <ol className="space-y-4">
          {s.path.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <span className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0" style={{ backgroundColor: accent }}>{i + 1}</span>
              <span className="text-black font-bold text-base pt-1.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-gray-400 text-xs text-center mt-6">
          An introduction is not a guarantee of work: whether {gymName} or any gym takes you on is its decision.
        </p>
      </div>
    </section>
  );
}

export function CommunityBand({ s, accent }: { s: GymSalesPage; accent: string }) {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image src={s.community.image} alt={s.community.imageAlt} fill sizes="100vw" className="object-cover opacity-50" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
        <p className="text-3xl md:text-5xl font-black text-white uppercase leading-tight">
          <span style={{ color: accent }}>{s.community.line}</span>
        </p>
      </div>
    </section>
  );
}
