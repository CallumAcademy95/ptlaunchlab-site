import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";

const PAGE_URL = "https://ptlaunchlab.co.uk/personal-trainer-salary-uk";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Personal Trainer Salary UK 2026: The Real Numbers | PT Launch Lab",
  description:
    "What UK personal trainers actually earn in 2026. Employed PTs £20-28k, self-employed £35-50k+, top end £80k+. Real rates by postcode from PureGym hiring managers and £500K PT business builders.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "article",
    title: "Personal Trainer Salary UK 2026: The Real Numbers",
    description: "Honest UK PT income breakdown: employed vs self-employed, postcode rates, what kills 80% of new PTs.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Personal Trainer Salary UK 2026: The Real Numbers",
  description:
    "Honest 2026 breakdown of UK personal trainer income — employed, self-employed, and online PT earnings, by postcode and career stage.",
  url: PAGE_URL,
  datePublished: `${TODAY}T12:00:00Z`,
  dateModified: `${TODAY}T12:00:00Z`,
  inLanguage: "en-GB",
  author: [
    { "@type": "Person", name: "Callum Brown", jobTitle: "Co-founder, PT Launch Lab", url: "https://ptlaunchlab.co.uk/about" },
    { "@type": "Person", name: "Ryan Robinson", jobTitle: "Co-founder, PT Launch Lab", url: "https://ptlaunchlab.co.uk/about" },
  ],
  publisher: {
    "@type": "Organization",
    name: "PT Launch Lab",
    url: "https://ptlaunchlab.co.uk",
    logo: { "@type": "ImageObject", url: "https://ptlaunchlab.co.uk/logo.png", width: 512, height: 512 },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
  image: { "@type": "ImageObject", url: "https://ptlaunchlab.co.uk/og-image.png", width: 1200, height: 630 },
};

export default function SalaryPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Breadcrumbs trail={[{ name: "Personal Trainer Salary UK", url: PAGE_URL }]} />
      <Nav />
      <main className="pt-[72px]">

        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">UK PT Income Guide · 2026</p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              Personal trainer salary UK:{" "}
              <span className="text-gold">the honest 2026 numbers.</span>
            </h1>
            <p className="text-xl text-soft/80 leading-relaxed mb-6">
              A newly qualified personal trainer in the UK earns <strong className="text-white">£20,000–£28,000</strong> in their first year as an employed PT at a commercial chain. Self-employed PTs renting space hit <strong className="text-white">£35,000–£50,000+</strong> within 18 months. The top end — multi-stream PTs combining gym floor, online programmes, and group sessions — sits at <strong className="text-white">£80,000+</strong>.
            </p>
            <p className="text-lg text-soft/70 leading-relaxed mb-8">
              Geography decides the ceiling more than anything else. Below: real numbers from PT Launch Lab podcast guests who&apos;ve actually built six-figure businesses, hired hundreds of trainers, and run gyms across Yorkshire and the UK.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/quiz" className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">Take the 60-Second Quiz →</Link>
              <Link href="/online-personal-trainer-course-uk" className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">Compare UK PT Courses</Link>
            </div>
          </div>
        </section>

        <article className="bg-base px-6 pb-14">
          <div className="max-w-3xl mx-auto space-y-14 md:space-y-20">

            <section className="prose-section">
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
                The four PT income tiers (with real numbers).
              </h2>
              <p className="text-soft/80 text-lg leading-relaxed mb-6">
                Personal training income in the UK isn&apos;t one number — it&apos;s four very different career paths with very different ceilings.
              </p>
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                  <h3 className="text-white font-bold text-xl mb-2">Tier 1: Employed PT at a commercial chain <span className="text-gold">— £18k–£28k year one</span></h3>
                  <p className="text-soft/80 text-base leading-relaxed">The entry route most new PTs take. You&apos;re on payroll at PureGym, The Gym Group, Nuffield Health, or similar. Mac Livock — a current PureGym manager who appeared on EP8 — put it this way: &quot;When you&apos;ve started off, let&apos;s say 15 pound a client, or you start off at even £10 a client… you sat there and you&apos;re thinking, my next hour is going to be 35 quid but then this one&apos;s going to be a tenner.&quot; First year realistic take-home is rarely above £25k unless you grind 50-hour weeks.</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                  <h3 className="text-white font-bold text-xl mb-2">Tier 2: Self-employed PT renting gym space <span className="text-gold">— £30k–£60k</span></h3>
                  <p className="text-soft/80 text-base leading-relaxed">You pay rent to a gym (typically £25–£200 per week depending on location), and every session you book is yours. Ryan Robinson — co-founder of PT Launch Lab and the guest of EP6 — described his first rental setup: &quot;My rent at the time were £25 a week and I had to work 30 unpaid hours… I were doing £10 a session. Five sessions for 50 quid.&quot; That was 13 years ago. Today, the same self-employed model with a full book at £35–£40 per session lands you £40k–£55k take-home in year two or three.</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                  <h3 className="text-white font-bold text-xl mb-2">Tier 3: Online PT <span className="text-gold">— £0–£250k, wildly variable</span></h3>
                  <p className="text-soft/80 text-base leading-relaxed">This is where the Instagram-PT promises live. Ryan built his online PT business to <strong className="text-white">£500K</strong> annual turnover, the topic of EP6&apos;s full episode title — but the floor is usually £0 because most online PTs never get a single paying client. As Ryan said on EP10: &quot;When you&apos;re self-employed, all the hours are your hours to work because you have this prickling anxiety of if I&apos;m not working, what&apos;s the point of doing this?&quot; Six-figure online PT is real but requires 2–4 years of consistent content and a tested offer.</p>
                </div>
                <div className="rounded-2xl border border-gold/40 bg-gold/[0.04] p-6">
                  <h3 className="text-white font-bold text-xl mb-2">Tier 4: Multi-stream PT <span className="text-gold">— £60k–£120k+</span></h3>
                  <p className="text-soft/80 text-base leading-relaxed">The compounding route most successful long-term PTs end up on: 1-to-1 sessions, small group strength, online programmes, partnership commissions, and CPD-led income. Sohail Rashid (EP32, founder of Brawn) flagged this: &quot;PTs in PureGym, in Gym Group — they&apos;re now able to run small group strength training sessions where members are paying between eight and twelve pound per session. There&apos;s four to six people per session… the PT is increasing their utilisation and also their hourly rate.&quot; A 6-person small group at £10/head is £60/hour — better than most 1-to-1 rates.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
                What PureGym actually pays employed PTs.
              </h2>
              <div className="space-y-5 text-soft/80 text-base leading-relaxed">
                <p>If you join a commercial chain as a self-employed PT (the dominant model — most chains don&apos;t put PTs on PAYE), you&apos;ll typically pay rent of £25–£100 per week for floor access and member rights, then keep 100% of the PT income you bill. If you take a &quot;fitness instructor&quot; role first (often the entry point for new qualifiers), you&apos;re on minimum wage for floor hours plus commission.</p>
                <p>Mac Livock spent years as a floor PT at Ultimate Shred Academy in Pontefract before moving into management at PureGym. On EP8, he was direct about the realistic ceiling: <strong className="text-white">&quot;If you are wanting to earn the crazy money, you are going to have to move to the areas of Leeds, the Harrogates, the Nesbras — that sort of area — and you can charge the money because the affluence of the area is a lot, lot higher.&quot;</strong></p>
                <p>The structural problem with chain employment: you&apos;re allowed to pick up clients only on the gym floor itself. Mac again: &quot;The thing was, the only place as a PT you can pick up clients is in the gym. If you&apos;re not there when someone walks through the door, you&apos;re not picking them up as a client.&quot; The realistic first-year figure for a PureGym self-employed PT is £20k–£25k of actual take-home — rent and tax come out, and you&apos;re paying for your own pension, insurance, and any sick days.</p>
                <p>The chains that pay best on the entry tier are usually the premium ones (Nuffield Health, David Lloyd, Third Space) because their members can afford £50–£70/hour PT rates. The trade-off is they&apos;re harder to get into and demand higher CV standards.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
                Self-employed PT rates by postcode.
              </h2>
              <p className="text-soft/80 text-lg leading-relaxed mb-6">Postcode is the single biggest variable in UK PT income. From the rates discussed across PT Launch Lab podcast episodes:</p>
              <div className="space-y-3">
                {[
                  { region: "Hull, Castleford, Pontefract, Doncaster", range: "£25–£35", note: "Mac Livock on EP8: \"If you're talking like for example you look at Yorkshire as a whole, you've got Hull, Rotherford — that sort of area, you're going to be charging less.\"" },
                  { region: "Leeds, Manchester, Sheffield, Bradford, Wakefield", range: "£35–£45", note: "Mac again: \"Like I still only do 30 now, but I know friends in Leeds PT — as long as me, good PTs — they're 40 pound, which is fair, but the area is different.\"" },
                  { region: "Harrogate, Knaresborough, Cheshire (Wilmslow / Alderley Edge), Edinburgh", range: "£45–£60", note: "Affluent commuter belts." },
                  { region: "Central London (Mayfair, Chelsea, Canary Wharf, Hampstead)", range: "£60–£100+", note: "Premium gyms (Third Space, KX, Equinox) charge clients £100–£140/hour and pass £60–£80 to the PT." },
                ].map((r) => (
                  <div key={r.region} className="rounded-2xl border border-white/[0.07] bg-card p-5">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2">
                      <h3 className="text-white font-bold text-base flex-1">{r.region}</h3>
                      <span className="text-gold font-bold">{r.range} per session</span>
                    </div>
                    <p className="text-soft/70 text-sm leading-relaxed">{r.note}</p>
                  </div>
                ))}
              </div>
              <p className="text-soft/80 text-base leading-relaxed mt-6">A practical rule from the podcast: <strong className="text-white">&quot;20, 25 quid really nowadays is probably your base rate, and sticking at that&quot;</strong> (Mac, EP8). Anyone undercharging below £20/hour outside London is structurally unable to scale.</p>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
                The £500K stories: what top PTs really earn.
              </h2>
              <div className="space-y-5 text-soft/80 text-base leading-relaxed">
                <p>The upper end of UK PT income is built from compounding — not single hourly rates. Three patterns from the podcast:</p>
                <div className="rounded-2xl border-l-2 border-gold pl-5 py-2">
                  <p className="font-semibold text-white mb-2">Pattern 1: The £500K online PT.</p>
                  <p>Ryan Robinson built his online powerlifting and weight-loss coaching business to <strong>half a million pounds a year</strong> before stepping back. EP6 covers the full build; EP10 covers why he wound it down. The mechanic: a tested four-week programme, evergreen Instagram content (he posted client wins daily for years), a Facebook ads funnel, and a high-ticket continuation offer.</p>
                </div>
                <div className="rounded-2xl border-l-2 border-gold pl-5 py-2">
                  <p className="font-semibold text-white mb-2">Pattern 2: The multi-gym owner.</p>
                  <p>Miles (EP16) — a 30-year industry veteran with a chain of gyms — described how floor PTs at his sites who treat PT as a <em>business</em> rather than a job hit £60k–£90k once they layer 1-to-1, small group, and online onto each other.</p>
                </div>
                <div className="rounded-2xl border-l-2 border-gold pl-5 py-2">
                  <p className="font-semibold text-white mb-2">Pattern 3: The compounding hourly rate.</p>
                  <p>On EP32, Sohail explained how chain PTs are now reaching higher hourly rates by stacking format: small group strength training paid per-head turns one hour into £48–£72 of revenue versus £35 from a single 1-to-1.</p>
                </div>
                <p>What unites the £80k+ PTs is retention. As Sohail put it on EP32: <strong className="text-white">&quot;I&apos;ve still got clients today that have turned eight, ten years.&quot;</strong> A client kept for three years at £35/session (1×/week) is £5,460. Lose that client every six months and replace them, you make less than half.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
                What kills PT income (why 80% quit in 12 months).
              </h2>
              <p className="text-soft/80 text-lg leading-relaxed mb-6">Sohail Rashid stated it cleanly on EP32: <strong className="text-white">&quot;The average lifespan of a PT — particularly under 90 days, 12 months — means that not enough PTs get there. They never give themselves a chance.&quot;</strong> The industry quit-rate for newly qualified PTs is around 80% within 12–18 months. Five income-killers:</p>
              <ol className="space-y-5">
                {[
                  { title: "Undercharging", body: "Mac Livock (EP8): \"I charged really low when I started because how I had the wrong mentality… X amount of money, cheap price was better than nothing.\" £15/session leaves you working 50 hours to gross £750. The realistic UK base rate in 2026 is £25–£30/hour." },
                  { title: "No business systems", body: "EP10 (Ryan's £500K shutdown): \"The business skills is massive. As you move along and you get more clients, you have to get new skills.\" PTs without invoicing, contracts, no-show policies, or cashflow tracking burn out by month six." },
                  { title: "Gym-floor-only thinking", body: "Mac on EP8: \"The only place as a PT you can pick up clients is in the gym.\" If you don't post, don't email, don't run group sessions, you're capped at the foot traffic in your one gym." },
                  { title: "No client follow-up", body: "Ryan on EP6: \"Each time you do that opens another door, opens another window of opportunity to get more clients.\" PTs who ghost ex-clients lose 40–60% of their potential income from re-engagement and referrals." },
                  { title: "Saturation panic", body: "Callum on EP7: \"As of 2022, there is currently 69,000 registered PTs in the UK… every single industry is oversaturated.\" The 80% who quit blame saturation. The 20% who stay simply build a niche and a CV." },
                ].map((k, i) => (
                  <li key={k.title} className="flex gap-4">
                    <span className="font-display font-extrabold text-gold text-3xl leading-none shrink-0 w-10">{i + 1}.</span>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{k.title}</h3>
                      <p className="text-soft/80 text-sm leading-relaxed">{k.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
                Realistic 12-month income trajectory.
              </h2>
              <p className="text-soft/80 text-lg leading-relaxed mb-6">Month-by-month from the PT Launch Lab build-experience:</p>
              <div className="space-y-4">
                {[
                  { stage: "Months 1–3 (qualifying)", income: "£0–£500/mo", body: "You're studying NCFE Level 2 and Level 3. Some learners pick up shadow hours or practical clients (friends, family, free trial sessions). PT Launch Lab learners often pick up first paid sessions in month 2–3 because the practical units include real client coaching." },
                  { stage: "Months 3–6 (building base)", income: "£500–£1,500/mo", body: "First paying clients via gym floor or warm-introduction interviews. Realistic load: 4–8 sessions per week at £25–£35." },
                  { stage: "Months 6–12 (book filling)", income: "£1,500–£3,000/mo", body: "12–20 sessions/week. You've found your niche (women 35+, post-natal, strength, hybrid runners) and your social posts are converting. Most PTs hit a plateau here — the ones who push past it add small group or online." },
                  { stage: "Months 12–24 (established)", income: "£3,000–£5,000+/mo", body: "20–30 sessions/week, possibly with a small group offer added. Average UK self-employed PT take-home at this stage is £40k–£55k." },
                  { stage: "Year 3+", income: "£60k–£120k+", body: "If you've layered streams. Year 5+: the £500K Ryan-style scale becomes possible — but it's the 1-in-200 outcome, not the median.", highlight: true },
                ].map((s) => (
                  <div key={s.stage} className={`rounded-2xl border p-5 ${s.highlight ? "border-gold/40 bg-gold/[0.04]" : "border-white/[0.07] bg-card"}`}>
                    <div className="flex flex-col md:flex-row md:items-baseline md:gap-4 mb-2">
                      <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-1 md:mb-0">{s.stage}</p>
                      <p className="text-white font-bold flex-1">{s.income}</p>
                    </div>
                    <p className="text-soft/70 text-sm leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </article>

        <section className="bg-surface py-16 md:py-20 px-6 border-t border-blue/15">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-4">Ready to build your PT income?</h2>
            <p className="text-soft/70 text-lg mb-6">PT Launch Lab&apos;s NCFE Level 2 + Level 3 course is <strong className="text-white">£1,599 all-in</strong> — including the £500 Skool mentorship community where Callum, Ryan and Miles (the people quoted throughout this article) coach you weekly on the business side most courses ignore.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/quiz" className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">Take the 60-Second Quiz →</Link>
              <Link href="/book-call" className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">Book a Free 15-Min Call</Link>
            </div>
            <p className="text-soft/60 text-sm">
              For the full picture on becoming a UK personal trainer, read{" "}
              <Link href="/online-personal-trainer-course-uk" className="text-gold hover:underline font-semibold">our complete guide to UK PT courses →</Link>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
