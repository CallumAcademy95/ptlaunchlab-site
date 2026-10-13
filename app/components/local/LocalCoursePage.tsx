import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import MoneyHero from "@/app/components/money/MoneyHero";
import PriceBlock from "@/app/components/home/PriceBlock";
import TwoWayCTA from "@/app/components/cta/TwoWayCTA";
import StickyCtaBar from "@/app/components/cta/StickyCtaBar";
import { faqPageSchema } from "@/app/lib/faqSchema";
import { breadcrumbTrail, courseSchema, type LocalPage } from "@/app/lib/localPages";
import { wasPriceActive } from "@/app/lib/priceDrop";

// One template for the three local course pages. All copy comes from
// app/lib/localPages.ts, which holds only the spec's confirmed facts.

/** Build-time hint, as in MoneyHero: hold the was-price space until the browser decides. */
const RESERVE_WAS_PRICE = wasPriceActive(Date.now());

export default function LocalCoursePage({ content: c }: { content: LocalPage }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema(c)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(c.faqs)) }} />
      <Breadcrumbs trail={breadcrumbTrail(c)} />
      <Nav />
      <main>
        <MoneyHero
          eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"
          headline={c.hero.headline}
          goldTail={c.hero.goldTail}
          subline={c.hero.subline}
          source={`local-${c.key}-hero`}
          image={c.hero.image}
        />

        {/* Local to {town}: the confirmed facts only */}
        <section className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Local to {c.town}
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed">{c.local.lead}</p>
            {c.local.partners && c.local.partners.length > 0 && (
              <div className="mt-8 bg-card border border-white/[0.07] rounded-2xl p-6 md:p-8">
                <h3 className="text-white font-bold text-xl mb-2">Partner gyms in West Yorkshire</h3>
                {c.local.partnersIntro && <p className="text-soft/70 mb-5">{c.local.partnersIntro}</p>}
                <ul className="space-y-3">
                  {c.local.partners.map((p) => (
                    <li key={p.name} className="flex items-baseline gap-3">
                      <span className="text-gold font-bold shrink-0" aria-hidden="true">→</span>
                      <span>
                        <span className="text-white font-semibold">{p.name}</span>
                        <span className="text-soft/70"> · {p.town}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* How it works from {town} */}
        <section className="bg-surface py-14 md:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-10 md:mb-14">
              How it works from {c.town}
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {c.how.map((step, i) => (
                <li key={step.title} className="bg-card border border-white/[0.07] rounded-2xl p-6 md:p-7">
                  <p className="font-display font-extrabold text-3xl text-gold mb-4">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-soft/70 text-sm leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <PriceBlock source={`local-${c.key}-pricing`} bg="base" reserveWasPrice={RESERVE_WAS_PRICE} />

        {/* FAQ: the same array feeds the FAQPage JSON-LD above */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">FAQ</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white text-center leading-none tracking-tight mb-10 md:mb-14">
              Questions from {c.town}
            </h2>
            <div className="space-y-5">
              {c.faqs.map((f) => (
                <div key={f.q} className="bg-card border border-white/[0.07] rounded-2xl p-6 md:p-7">
                  <h3 className="text-white font-bold text-lg mb-3">{f.q}</h3>
                  <p className="text-soft/70 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-base py-14 md:py-24 px-6 text-center border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-8">
              Ready to start from {c.town}?
            </h2>
            <TwoWayCTA source={`local-${c.key}-final`} className="justify-center" />
          </div>
        </section>
      </main>
      <StickyCtaBar watchSelector={`[data-cta-source='local-${c.key}-hero']`} source={`local-${c.key}-sticky`} />
      <Footer />
    </>
  );
}
