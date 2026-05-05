import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import StickyMobileCTA from "../components/StickyMobileCTA";

const PAGE_URL = "https://ptlaunchlab.co.uk/online-personal-trainer-course-uk";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Online Personal Trainer Course UK 2026: Honest Buyer's Guide | PT Launch Lab",
  description:
    "The complete UK guide to online personal trainer courses. Compare 10 providers (HFE, Train Fitness, OriGym, PT Launch Lab and more) on price, accreditation, mentorship and earnings. Written by gym owners who've hired 500+ PTs.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "article",
    title: "Online Personal Trainer Course UK 2026: Honest Buyer's Guide",
    description:
      "Compare 10 UK online PT courses on price, accreditation, mentorship and earnings. Written by gym owners who've hired 500+ PTs.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const providers = [
  { rank: 1, name: "PT Launch Lab", price: "£1,599", body: "Yorkshire gym-owner-run academy. NCFE Level 2 + 3, Ofqual-regulated, CIMSPA-recognised. Smaller than the nationals but built around the bit other courses skip — actually getting you employed and earning. Personal tutor in 24 hours, the £500 Skool mentorship community bundled in, and warm-introduction interviews to our UK gym network. Good fit if you want mentorship; not the cheapest, not the biggest brand.", isUs: true },
  { rank: 2, name: "HFE (Health & Fitness Education)", price: "£1,800–£2,500", body: "Probably the most recognised name in UK PT qualifications. Strong tutor support, big alumni network. Brochure on a CV looks great. Where they fall short: business and client-getting support is light. You finish qualified and on your own." },
  { rank: 3, name: "Train Fitness", price: "£1,500–£2,000", body: "Heavy on the practical side, in-person workshops in major cities, decent price point. Good if you genuinely want hands-on assessment confidence. Fully online route exists but it's not where they shine. Business mentorship is thin." },
  { rank: 4, name: "Future Fit Training", price: "£2,000+", body: "Older brand, well-respected, popular with the over-40s career-changer crowd in the SERPs for a reason — they handle that audience well. Expensive and heavy on theory. You'll know your anatomy. You won't necessarily know how to fill a diary." },
  { rank: 5, name: "OriGym", price: "from £999", body: "Big online operator, aggressive marketing, decent qualification. Real-world spend creeps higher with add-ons. Tutor support is real but spread thin across volume. Fine course, very generic experience." },
  { rank: 6, name: "Premier Global NASM", price: "£2,000+", body: "Premium brand, NASM badge carries weight in commercial gyms. The qualification you buy when you want the logo on your CV. Heavy academic load — not for everyone. Worth it if you're targeting high-end gyms." },
  { rank: 7, name: "Study Active", price: "£900–£1,400", body: "Online-first, mid-range price, Active IQ awarding body (also Ofqual-regulated, fine to hire from). Decent tutor support. We've hired good PTs from here. Less business support than us, less brand prestige than HFE." },
  { rank: 8, name: "Diverse Trainers", price: "£1,000–£1,500", body: "Smaller player, online-led, fair price. Quality is okay — we've interviewed candidates from Diverse and the qualification stands up. Limited mentorship side." },
  { rank: 9, name: "The Fitness Group", price: "£1,000–£1,800", body: "Long-running, Scottish-based, in-person and online options. Solid course. Less national reach for placements. Good if you're north of the border." },
  { rank: 10, name: "Online Learning College / £29–£299 courses", price: "£29–£299", body: "Don't. These are unregulated CPD certificates dressed up as qualifications. No Ofqual, no NCFE, no CIMSPA. We won't interview anyone holding only one of these. Insurers won't cover you. It's a PDF, not a career.", isWarning: true },
];

const audienceMap = [
  { audience: "Cheapest legit qualification only", pick: "Study Active or budget OriGym (£600–£900)", reason: "Regulated NCFE or Active IQ Level 3 paper, insured, you can work. No frills, no business support. Fine if you already have a job lined up." },
  { audience: "Career changer leaving a corporate job", pick: "PT Launch Lab or Future Fit", reason: "Our core audience. The gap between qualifying and earning is what kills careers — that's why we bundle business mentorship and gym introductions. Future Fit handles the over-40s market well too — slower, more theory-heavy, more academic." },
  { audience: "Already in a gym, want to upgrade from gym instructor to full PT", pick: "Train Fitness or Study Active", reason: "You've already got the floor experience and the network. You just need the Level 3 paper. Pay for the paper, skip the mentorship layer." },
  { audience: "Wants a prestige brand on the CV", pick: "HFE or Premier Global NASM", reason: "If you're aiming at high-end commercial gyms, third-space chains, or central London studios, the badge carries weight. Premier Global with the NASM tag in particular opens doors. £2,000+ for the privilege." },
  { audience: "Wants practical / in-person experience", pick: "Train Fitness or OriGym", reason: "Both run in-person workshops in major UK cities. If you genuinely don't trust online video assessment for practical work — fair enough — these are the routes." },
  { audience: "Already self-employed PT, just needs the paper", pick: "Study Active or budget OriGym", reason: "You know how to coach. You know how to fill a diary. You just got caught without the formal Level 3. Cheap, fast, regulated, done." },
  { audience: "Wants help getting first clients", pick: "PT Launch Lab", reason: "This is the bit we built the whole course around. Mac Livock from PureGym said it on EP8: \"you can't just qualify and be stuck — there's no point if you can't get clients.\" The mentorship community, the gym warm-introductions, the post-qualification support — that's the bit other courses don't ship." },
  { audience: "Older career changer (40+)", pick: "Future Fit or PT Launch Lab", reason: "Future Fit has built up a strong reputation with this demographic for a reason. We're younger as a brand but our tutor team is patient with returners — and the 40+ PTs we hire often outperform the 22-year-olds because they bring life experience the kids haven't got yet." },
  { audience: "Wants to qualify fast (4–6 weeks)", pick: "Almost any online provider", reason: "All the regulated online courses can be done in 4–6 weeks if you've got the hours. Just don't believe the \"qualified in 2 weeks\" marketing — that's a sales line, not a study plan." },
];

const faqs = [
  { q: "Can you actually get a personal trainer qualification 100% online?", a: "Yes. Since COVID this has become the standard route in the UK, not the exception. The theory units have always worked online. The practical units are now assessed by video — you film yourself coaching real movements, your tutor reviews the footage, you get a pass or feedback. NCFE, Focus Awards and Active IQ all accept video-assessed practical work. We hire PTs assessed this way every month at Ultimate Shred Academy and the standard holds up." },
  { q: "Is 35, 40 or 50 too old to become a personal trainer?", a: "No. Career-changer PTs in their 40s often outperform 22-year-olds because they bring real-world experience — selling, conversation, life context — that kids haven't got yet. Future Fit's website fills up with over-40s for a reason. If you've got the energy to coach a session and the patience to learn, age is not the blocker. The blocker is whether you'll do the work to get clients in your first 90 days." },
  { q: "How much does the average UK personal trainer earn?", a: "Employed PT at a commercial gym (PureGym, The Gym Group, etc.) starts £20,000–£28,000. Self-employed PT renting a slot at a commercial gym typically lands £35,000–£50,000+ within 18 months once their book fills up. Top end — own studio, online product, group programmes — clears £80,000+. Mac Livock from PureGym made the point on EP8: in low-affluence areas you'll charge £30–£40 an hour; in Leeds, Harrogate, central London you can charge £50–£70+. Your postcode shapes your ceiling." },
  { q: "Do gyms actually recognise online PT qualifications?", a: "Yes — if it's Ofqual-regulated. Mac Livock, who runs hiring for a major PureGym site, told us on EP8 that what they look for is the qualification on paper, then the personality on the floor: \"we said we were ready to give you the job before you'd even started.\" The qualification gets your CV opened. The interview is about whether you'll talk to members. No commercial gym in the UK cares whether the Ofqual-regulated NCFE Level 3 was earned in a classroom or on Zoom." },
  { q: "What's the difference between Level 2 and Level 3 PT?", a: "Level 2 makes you a Gym Instructor — you can run the gym floor, deliver inductions, supervise members on equipment. Level 3 makes you a full Personal Trainer — you can take 1-1 paying clients, write programmes, do consultations. You need both to legally call yourself a PT and get insured. Most decent courses (us included) bundle Level 2 and Level 3 together at one price. If a course only quotes Level 3, ask whether Level 2 is already included or sold separately." },
  { q: "How quickly can I start earning?", a: "Realistically 3–6 months from enrolment to first paid clients. Some learners start earning during the course — particularly if they're already working in a gym. Ryan's story on EP6 is the honest version: he built his book one client at a time on the gym floor, undercut on price at the start to fill empty hours, then raised rates as demand grew. Anyone selling you \"qualify Monday, earning £500 a week by Friday\" is selling you Instagram, not a career." },
  { q: "Do I need a uni degree to become a personal trainer?", a: "No. The Level 3 NCFE is the UK industry standard and a degree is not required by any commercial gym, insurance provider or governing body. Sport science degrees are useful if you want to specialise (S&C, rehab, elite athletes) but they are not the route 95% of working PTs took. If you've already got a degree in something unrelated, it's irrelevant — go straight to Level 3." },
  { q: "What's the best UK online PT course in 2026?", a: "The honest answer is \"depends on your audience\" — see the ranking section above. If you want the qualification plus the help getting your first clients, we'd back ours (PT Launch Lab, £1,599). If you want a prestige brand on the CV for commercial gym applications, HFE or Premier Global NASM. If you just want the cheapest legitimate paper, Study Active. There is no single \"best.\" There's a best for you. Anyone who tells you their course is the best for everyone is selling, not advising." },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Online Personal Trainer Course UK 2026: Honest Buyer's Guide",
  description:
    "Comprehensive guide to UK online personal trainer courses. Compares 10 providers on price, accreditation, mentorship and earnings — from a UK gym-owner perspective.",
  url: PAGE_URL,
  datePublished: `${TODAY}T12:00:00Z`,
  dateModified: `${TODAY}T12:00:00Z`,
  inLanguage: "en-GB",
  author: [
    { "@type": "Person", name: "Callum Brown", jobTitle: "Co-founder, PT Launch Lab" },
    { "@type": "Person", name: "Ryan Robinson", jobTitle: "Co-founder, PT Launch Lab" },
  ],
  publisher: { "@id": "https://ptlaunchlab.co.uk/#org" },
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
  image: "https://ptlaunchlab.co.uk/og-image.png",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "UK Online Personal Trainer Courses Compared",
  description: "Honest verdicts on 10 UK online personal trainer course providers from gym owners who've hired 500+ PTs.",
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  itemListElement: providers.map((p) => ({
    "@type": "ListItem",
    position: p.rank,
    name: p.name,
    description: p.body,
  })),
};

export default function OnlinePtCourseUkPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <Breadcrumbs trail={[{ name: "Online Personal Trainer Course UK", url: PAGE_URL }]} />

      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[400px] h-[400px] rounded-full bg-blue opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">
              The Honest Buyer's Guide · Updated 2026
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              Online Personal Trainer Course UK:{" "}
              <span className="text-gold">the honest 2026 guide.</span>
            </h1>
            <p className="text-xl text-soft/80 leading-relaxed mb-6">
              An online personal trainer course in the UK is an Ofqual-regulated Level 3 qualification — usually awarded by NCFE or Focus Awards — that you can complete 100% online in 4 to 16 weeks. It bundles the Level 2 Gym Instructor and Level 3 Personal Trainer units, lets you legally take paying clients, and gets you onto the CIMSPA register.
            </p>
            <p className="text-xl text-soft/80 leading-relaxed mb-8">
              Prices range from around £600 at the cheap-but-legit end up to £2,800 for premium blended courses.{" "}
              <span className="text-white font-semibold">We've hired more than 500 PTs across our gyms — pick your course on honesty, not the brochure.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quiz"
                className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
              >
                Take the 60-Second Quiz →
              </Link>
              <Link
                href="/courses"
                className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
              >
                See Our Course
              </Link>
            </div>
          </div>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="bg-surface border-y border-blue/15 py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">In this guide</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-soft/80 text-sm list-decimal list-inside">
              <li><a href="#providers" className="hover:text-gold transition-colors">10 UK providers compared</a></li>
              <li><a href="#recognition" className="hover:text-gold transition-colors">Are online PT courses recognised?</a></li>
              <li><a href="#cost" className="hover:text-gold transition-colors">How much do they cost?</a></li>
              <li><a href="#duration" className="hover:text-gold transition-colors">How long does it take?</a></li>
              <li><a href="#online-vs-inperson" className="hover:text-gold transition-colors">Online vs in-person</a></li>
              <li><a href="#checklist" className="hover:text-gold transition-colors">7-point quality checklist</a></li>
              <li><a href="#ranking" className="hover:text-gold transition-colors">Best course by audience</a></li>
              <li><a href="#faq" className="hover:text-gold transition-colors">FAQ</a></li>
            </ol>
          </div>
        </section>

        {/* SECTION 2: COMPARISON */}
        <section id="providers" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-4">
              10 UK providers, compared.
            </h2>
            <p className="text-soft/70 text-lg mb-10">
              We've hired from all of these. Here's the honest read.
            </p>
            <div className="space-y-5">
              {providers.map((p) => (
                <div
                  key={p.rank}
                  className={`rounded-2xl border p-6 transition-all ${
                    p.isUs
                      ? "border-gold/50 bg-gold/[0.04]"
                      : p.isWarning
                      ? "border-red-500/30 bg-red-950/10"
                      : "border-white/[0.07] bg-card"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="text-white font-bold text-xl flex items-center gap-3">
                      <span className={`text-sm font-display ${p.isUs ? "text-gold" : "text-soft/40"}`}>{p.rank}.</span>
                      {p.name}
                      {p.isUs && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold font-semibold tracking-widest uppercase">us</span>
                      )}
                    </h3>
                    <span className={`text-sm font-semibold ${p.isWarning ? "text-red-400" : "text-gold"}`}>{p.price}</span>
                  </div>
                  <p className="text-soft/80 text-sm leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: RECOGNITION */}
        <section id="recognition" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Are online PT courses recognised?
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-5">
              In the UK there's a clear hierarchy and it's worth knowing it before you spend a penny.
            </p>
            <div className="space-y-5 text-soft/80 text-base leading-relaxed">
              <p>
                <strong className="text-gold">Ofqual</strong> is the government regulator. They sit above everyone else and decide which qualifications count as actual regulated qualifications. If a course is Ofqual-regulated, it's on the national framework. If it's not, it isn't.
              </p>
              <p>
                <strong className="text-gold">NCFE</strong> and <strong className="text-gold">Focus Awards</strong> are the two awarding bodies that dominate the PT space. Both are Ofqual-regulated. When you see "NCFE Level 3 Personal Trainer," that's the qualification employers and insurers actually recognise. Active IQ is the third name you'll see and it's also legitimate.
              </p>
              <p>
                <strong className="text-gold">CIMSPA</strong> is the industry body — it's the chartered institute that maintains the public register of PTs in the UK. A CIMSPA-recognised course meets the employer standard. Most commercial gyms (PureGym included) want to see CIMSPA on your paperwork.
              </p>
              <p>
                <strong className="text-gold">REPs</strong> is the legacy register that CIMSPA largely replaced. Older PTs still talk about it. Don't worry about it — focus on CIMSPA.
              </p>
              <p>
                The trap is the £29 course on Online Learning College or similar. It will say "approved" or "endorsed." Those words mean nothing in this industry. Ask the question: who is the awarding body, and are they Ofqual-regulated? If the answer isn't NCFE, Focus Awards, Active IQ or another Ofqual name — walk away.
              </p>
              <p className="text-white font-semibold border-l-2 border-gold pl-4">
                If your course isn't Ofqual-regulated, you don't have a personal trainer qualification — you have a PDF.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: COST */}
        <section id="cost" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              How much do they cost?
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-8">
              There are four real price tiers in the UK market and what you get changes sharply at each level.
            </p>
            <div className="space-y-5">
              {[
                { tier: "£29–£300", label: "Unregulated CPD", body: "Online Learning College and similar. Marketed hard on Google with \"become a PT for £29\" headlines. The blunt truth: it won't get you hired, won't get you insured, and won't get you on the CIMSPA register. Warning sign: the awarding body isn't named, or it's a name you've never heard of. Don't.", warning: true },
                { tier: "£600–£1,000", label: "Cheaper end of legit", body: "Genuine Ofqual-regulated NCFE or Focus Awards courses, basic tutor support over email, no business training, no mentorship after qualifying. You get the paper. Good if you already have a job lined up at a gym and just need the badge. We've interviewed PTs from this tier and the better ones do okay — but they almost always say they wished they'd had more help with the business side." },
                { tier: "£1,000–£1,800", label: "The sweet spot", body: "This is where PT Launch Lab sits at £1,599. You get a proper personal tutor (assigned within 24 hours), Level 2 + Level 3 bundled, real assignments with feedback, and ideally business and client-getting support built in. We bundle the £500 Skool mentorship community into the £1,599. Most providers price that as a separate £500–£3,000 product, or skip it entirely and leave you on your own day one. Warning sign at this tier: vague \"from £999\" pricing that climbs once you're in.", highlight: true },
                { tier: "£2,000–£2,800", label: "Premium", body: "HFE, Premier Global NASM, Future Fit. Often blended with in-person practical days. You're paying for brand recognition, intensive tutor contact, and sometimes the prestige of a name like NASM on your CV. Honest read: sometimes it's worth it (commercial gym career, want the badge). Often it's not — you're paying £1,000+ extra for marketing spend, not for a better qualification. Same Level 3 unit at the end." },
              ].map((t) => (
                <div
                  key={t.tier}
                  className={`rounded-2xl border p-6 ${
                    t.highlight
                      ? "border-gold/50 bg-gold/[0.04]"
                      : t.warning
                      ? "border-red-500/30 bg-red-950/10"
                      : "border-white/[0.07] bg-card"
                  }`}
                >
                  <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                    <h3 className="font-display font-bold text-xl text-white">{t.tier}</h3>
                    <span className={`text-xs font-semibold tracking-widest uppercase ${t.warning ? "text-red-400" : "text-gold"}`}>{t.label}</span>
                  </div>
                  <p className="text-soft/80 text-sm leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-soft/70 text-base leading-relaxed">
              Pay attention to payment plans too. We do <strong className="text-white">£1,599 full or a £599 deposit + 5×£200 split</strong>, plus Payl8r finance. If a course only quotes a monthly figure and never the total, that's a tell.
            </p>
          </div>
        </section>

        {/* SECTION 5: DURATION */}
        <section id="duration" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              How long does it take?
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-5">
              Honestly: <strong className="text-gold">4 to 16 weeks part-time</strong>, depending on your hours. Most of our learners finish in 8 to 12 weeks comfortably.
            </p>
            <div className="space-y-5 text-soft/80 text-base leading-relaxed">
              <p>
                The "qualify in 2 weeks" fast-track marketing you'll see on some sites — Ryan, Callum and Miles all push back hard on this on the podcast. It's possible to physically complete the units in two weeks if you do nothing else. It's not how anyone actually retains the information. You'd walk onto a gym floor unable to programme a session for a real human being. Most fast-trackers we've interviewed for jobs at Ultimate Shred Academy can't deliver a confident consultation.
              </p>
              <p>
                The realistic schedule: <strong className="text-white">6 to 10 hours of study per week</strong>. That's an hour or two on weeknights and a longer block at the weekend. Most of our learners are working full-time when they enrol — we built the course around that. You can pause, you can come back. The Ofqual qualification doesn't expire while you're studying.
              </p>
              <p>
                Two practical numbers to anchor on: if you're doing 6 hours a week, plan for around 10 weeks. If you can give it 10 hours a week, you'll be done inside 6.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: ONLINE VS IN-PERSON */}
        <section id="online-vs-inperson" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Online vs in-person.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-8">
              We've trained PTs both ways and hired from both routes. The honest pros and cons:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { title: "Online wins on cost", body: "A fully online Level 2 + 3 sits £400–£800 cheaper than the equivalent blended course. No travel, no hotel for residential weekends, no time off work." },
                { title: "Online wins on flexibility", body: "Almost everyone enrolling on a PT course is changing career while still holding down their current job. You can't take three weeks off work to sit in a classroom. Online lets you study at 6am or 10pm. That's the only realistic route for most career changers." },
                { title: "In-person wins on practical confidence", body: "There's no replacement for a tutor watching you cue a deadlift in real time. This used to be a huge gap. It isn't anymore — every quality online course now uses video assessment for the practical units. You film yourself coaching, the tutor reviews it, you get notes. It works." },
                { title: "In-person wins on networking", body: "Sitting in a room with 20 other trainee PTs builds connections you don't get from a Zoom. Some of the best hires we've made came as referrals between people who studied in the same room. We mitigate this on the online side with our Skool mentorship community." },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/[0.07] bg-card p-6">
                  <h3 className="text-gold font-bold text-base mb-2">{c.title}</h3>
                  <p className="text-soft/80 text-sm leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border-l-2 border-gold pl-5 py-2">
              <p className="text-soft/80 text-base leading-relaxed mb-3">
                The bigger point Sohail Rashid made on the podcast: <strong className="text-white">AI is not coming for the in-person PT. It's coming for the generic online programme.</strong> The reason people pay £40–£60 an hour for a coach isn't to be told what to do — they can get that from ChatGPT for free. They're paying for a human in the room who turns up, holds them accountable, and notices when they're off. That's the job. Whether you study online or in person, that's what you're training for.
              </p>
              <p className="text-soft/80 text-base leading-relaxed">
                If you're working full-time and changing career, do it online. If you've got the time and money for blended, blended is genuinely better — but it's not £800 better.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: CHECKLIST */}
        <section id="checklist" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              7-point quality checklist.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-8">
              Seven non-negotiables. Miss any of these and you're buying the wrong thing.
            </p>
            <ol className="space-y-6">
              {[
                { title: "Ofqual-regulated NCFE or Focus Awards Level 3", body: "Not \"approved by.\" Not \"endorsed by.\" Regulated by Ofqual, awarded by NCFE, Focus Awards or Active IQ. If the website doesn't show the awarding body in the first scroll, that's a flag. We won't interview anyone holding a non-regulated qualification, and neither will PureGym, The Gym Group, or any commercial chain." },
                { title: "A real personal tutor, named, contactable, with a face", body: "Not a chat support box that pings 9–5 with generic answers. Ask the question before you enrol: who is my tutor, when do I get assigned to them, how quickly do they respond? At PT Launch Lab you're allocated a tutor within 24 hours of enrolment. That's the bar." },
                { title: "Business training built into the curriculum", body: "This is the bit 80% of UK courses skip and it's why 80% of qualified PTs quit inside 12 months. The Level 3 syllabus teaches you exercise science. It does not teach you how to get a client. Sohail Rashid put it bluntly on the podcast: \"How PTs win clients on the gym floor hasn't changed since 2005, and the average lifespan of a PT is under 12 months — they never give themselves a chance.\" If your course doesn't cover client acquisition, pricing, retention and basic marketing, you'll be one of those statistics." },
                { title: "Mentorship after qualification", body: "Most courses end on day one of your career. The hardest 90 days are the next ones. We bundle the £500 Skool business mentorship community into our £1,599 fee at no extra cost — Miles, Ryan and Callum all hang out in there, and the gym owners running the network have hired 500+ PTs between them. If your course says \"your support ends when you pass,\" that's the wrong course." },
                { title: "Real gym connections and an interview pipeline", body: "This is where most courses fail loudly. They sell the qualification, then wave you off into a market with 69,000 registered PTs (the 2022 figure Ryan referenced on the \"Is It Still Worth It?\" episode). At PT Launch Lab you get warm-introduction interviews to our UK gym network — we vouch for you to gym managers we already know. Most providers can't offer that because they don't run gyms." },
                { title: "Clear, transparent pricing", body: "£1,599 is £1,599. Not \"from £999\" with a £600 unit upgrade hidden in the second-page checkout. Watch out for \"exam fees\" charged separately, \"registration fees,\" and re-sit fees that aren't listed up front. Ask for the total all-in number in writing before you pay." },
                { title: "Reviews from people who've actually used the qualification", body: "Not \"great course, learned loads, lovely tutors.\" That's a Trustpilot review from someone who's just bought the thing. You want reviews from people 6 and 12 months post-qualification, working as PTs, who can tell you whether the course actually got them earning. That's the only review that matters." },
              ].map((item, i) => (
                <li key={item.title} className="flex gap-4">
                  <span className="font-display font-extrabold text-gold text-3xl leading-none shrink-0 w-10">{i + 1}.</span>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-soft/80 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SECTION 8: AUDIENCE RANKING */}
        <section id="ranking" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Best course by audience.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-8">
              Best course depends entirely on who you are. Here's the honest map.
            </p>
            <div className="space-y-4">
              {audienceMap.map((a) => (
                <div key={a.audience} className="rounded-2xl border border-white/[0.07] bg-card p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-baseline md:gap-4 mb-3">
                    <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-1 md:mb-0">If you're</p>
                    <h3 className="text-white font-bold text-base md:text-lg flex-1">{a.audience}</h3>
                  </div>
                  <p className="text-white text-sm font-semibold mb-2">→ {a.pick}</p>
                  <p className="text-soft/70 text-sm leading-relaxed">{a.reason}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/10 p-6">
              <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-2">If you're</p>
              <h3 className="text-white font-bold text-base mb-2">Looking for the cheapest possible PT certificate, full stop</h3>
              <p className="text-white text-sm font-semibold mb-2">→ Don't.</p>
              <p className="text-soft/70 text-sm leading-relaxed">£29 unregulated courses are a trap. There's no audience this is the right answer for.</p>
            </div>
          </div>
        </section>

        {/* SECTION 9: FAQ */}
        <section id="faq" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-8">
              FAQ.
            </h2>
            <div className="space-y-6">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-white/[0.07] bg-card p-6">
                  <h3 className="text-gold font-bold text-base md:text-lg mb-3">{f.q}</h3>
                  <p className="text-soft/80 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO WROTE THIS */}
        <section className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Who wrote this & why.
            </h2>
            <div className="space-y-4 text-soft/80 text-base leading-relaxed">
              <p>
                This guide was written by <strong className="text-white">Callum Brown and Ryan Robinson</strong>, co-founders of PT Launch Lab. We run gyms (Ultimate Shred Academy in Pontefract among them) and we've hired more than 500 personal trainers between us across the last decade.
              </p>
              <p>
                We wrote it because the existing online comparisons of UK PT courses are mostly written by the providers themselves or by affiliate sites earning commission on enrolments. That's why every "best course" list ranks the writer's preferred provider at #1.
              </p>
              <p>
                Yes, we sell our own course (£1,599, NCFE Level 2 + 3, listed honestly above). But we also know exactly when our course isn't the right fit — and we'd rather send you to HFE or Premier Global if that's what you actually need than oversell to you and watch you quit the industry inside 12 months. That happens to 80% of new PTs. We're trying to lower that number.
              </p>
              <p>
                If something in this guide is wrong or out of date, email{" "}
                <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">info@ptlaunchlab.co.uk</a>
                {" "}— we'll fix it.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface py-20 px-6 text-center border-t border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-4">
              Ready to start?
            </h2>
            <p className="text-soft/70 text-lg mb-8">
              Take our 60-second quiz to see if PT Launch Lab is the right fit. If it isn't, we'll tell you which provider above is.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quiz"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20"
              >
                Take the 60-Second Quiz →
              </Link>
              <Link
                href="/book-call"
                className="px-8 py-4 rounded-full border border-gold text-gold font-semibold hover:bg-gold hover:text-deep transition-all"
              >
                Book a Free 15-Min Call
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}
