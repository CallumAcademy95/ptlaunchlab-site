import { notFound } from "next/navigation";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { yorkshireLocations, getLocationBySlug } from "@/app/lib/yorkshireLocations";

export async function generateStaticParams() {
  return yorkshireLocations.map((l) => ({ location: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const loc = getLocationBySlug(location);
  if (!loc) return {};
  return {
    title: `PT Courses in ${loc.name} | Online Personal Trainer Qualification | PT Launch Lab`,
    description: `Looking for a personal trainer course near ${loc.name}, ${loc.region}? PT Launch Lab offers an accredited online Level 3 PT qualification with real business mentorship. Study from ${loc.name} — start anytime.`,
  };
}

const stats = [
  { value: "12–16", label: "Weeks to qualify" },
  { value: "£1,399", label: "Full payment price" },
  { value: "500+", label: "PTs hired by our team" },
  { value: "100%", label: "Online — study anywhere" },
];

const included = [
  "Level 3 Personal Trainer qualification (NCFE, Ofqual, CIMSPA)",
  "Full business mentorship — not just exam prep",
  "How to get your first paying clients",
  "Pricing, packages and PT business setup",
  "Direct access to your personal tutor from day one",
  "Gym partnership support and interview prep",
  "Ongoing support after you qualify",
];

const faqs = [
  {
    q: "Can I study from {location}?",
    a: "Yes — the course is 100% online so you can study from {location} or anywhere in the UK. There are no fixed class times. You work through the material at your own pace.",
  },
  {
    q: "How long does the course take?",
    a: "Most students qualify in 12–16 weeks. You can study around your current job — there's no rush and no deadlines.",
  },
  {
    q: "What qualification do I get?",
    a: "You get a Level 3 Personal Trainer qualification accredited by NCFE and regulated by Ofqual. It's recognised by CIMSPA and accepted by gyms across the UK.",
  },
  {
    q: "How much does it cost?",
    a: "Full payment is £1,399. We also offer a deposit plan — £599 upfront then 5 monthly payments of £200. Finance through Payl8r is also available.",
  },
  {
    q: "What makes PT Launch Lab different?",
    a: "Most PT courses just get you qualified and leave you to figure out the rest. We teach you how to build a real business — how to get clients, what to charge, and how to turn your qualification into an income.",
  },
];

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const loc = getLocationBySlug(location);
  if (!loc) notFound();

  const nearby = yorkshireLocations
    .filter((l) => l.region === loc.region && l.slug !== loc.slug)
    .slice(0, 8);

  return (
    <>
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-[#072B4A] py-20 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-[#F5C518] opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[400px] h-[400px] rounded-full bg-[#3B82F6] opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">
              {loc.region} · Online PT Course
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              PT Courses in {loc.name}.<br />
              <span className="text-[#F5C518]">Qualify online. Build a career.</span>
            </h1>
            <p className="text-xl text-[#8CA3BF] leading-relaxed mb-4 max-w-2xl">
              Study your Level 3 Personal Trainer qualification from {loc.name} — 100% online, accredited by NCFE and Ofqual, with real business mentorship built in from day one.
            </p>
            <p className="text-lg text-[#8CA3BF] leading-relaxed mb-10 max-w-2xl">
              No fixed class times. No commuting. Study around your job and qualify in 12–16 weeks.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/enrol"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
              >
                Start Today →
              </a>
              <a
                href="/book-call"
                className="px-8 py-4 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-base hover:bg-[#F5C518] hover:text-[#072B4A] transition-all"
              >
                Book a Free Call
              </a>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="bg-[#0D3559] py-12 px-6 border-y border-[#3B82F6]/15">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[#F5C518] text-3xl font-bold mb-1">{s.value}</p>
                <p className="text-[#8CA3BF] text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY ONLINE */}
        <section className="bg-[#072B4A] py-20 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Why online works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                You don&apos;t need to travel.<br />
                <span className="text-[#F5C518]">You need to qualify.</span>
              </h2>
              <p className="text-[#8CA3BF] text-lg leading-relaxed mb-6">
                Whether you&apos;re in {loc.name} or anywhere else in {loc.region}, the course works around your life — not the other way around. Log in when it suits you, study at your own pace, and get support from your tutor whenever you need it.
              </p>
              <p className="text-[#8CA3BF] text-lg leading-relaxed">
                Most of our students study in the evenings and weekends while working full-time. By the time they hand in their notice, they already have clients lined up.
              </p>
            </div>
            <div className="space-y-4">
              {included.map((item) => (
                <div key={item} className="flex items-start gap-3 bg-[#0D3559] border border-[#3B82F6]/20 rounded-xl px-5 py-4">
                  <span className="text-[#F5C518] font-bold shrink-0 mt-0.5">✓</span>
                  <span className="text-[#E5E7EB] text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE DIFFERENCE */}
        <section className="bg-[#0D3559] py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">The PT Launch Lab difference</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
              Not just a qualification.<br />
              <span className="text-[#F5C518]">A career built from scratch.</span>
            </h2>
            <p className="text-xl text-[#8CA3BF] leading-relaxed mb-6">
              Most PT courses hand you a certificate and wish you luck. PT Launch Lab was built by gym owners who&apos;ve hired over 500 personal trainers. We know exactly what it takes to succeed — and we teach it.
            </p>
            <p className="text-xl text-[#8CA3BF] leading-relaxed mb-10">
              Business mentorship, client acquisition, pricing strategy — it&apos;s all in the core course. Not a paid extra. Not an afterthought.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/courses" className="px-7 py-3.5 rounded-full bg-[#F5C518] text-[#072B4A] font-bold hover:brightness-110 transition-all">
                See What&apos;s Included →
              </a>
              <a href="/about" className="px-7 py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold hover:bg-[#F5C518] hover:text-[#072B4A] transition-all">
                About PT Launch Lab
              </a>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-[#072B4A] py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Straightforward pricing.<br />
              <span className="text-[#F5C518]">No hidden fees.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: "Full Payment", price: "£1,399", sub: "One payment. Best value.", highlight: true },
                { label: "Deposit Plan", price: "£599 + 5×£200", sub: "£599 today, then £200/month", highlight: false },
                { label: "Finance", price: "Payl8r", sub: "12–18 month spread. Apply at checkout.", highlight: false },
              ].map((p) => (
                <div
                  key={p.label}
                  className={`rounded-2xl p-7 border ${p.highlight ? "bg-[#F5C518]/10 border-[#F5C518]/50" : "bg-[#0D3559] border-[#3B82F6]/20"}`}
                >
                  <p className={`text-xs font-semibold tracking-widest uppercase mb-3 ${p.highlight ? "text-[#F5C518]" : "text-[#4A6280]"}`}>
                    {p.label}
                  </p>
                  <p className="text-white text-2xl font-bold mb-2">{p.price}</p>
                  <p className="text-[#8CA3BF] text-sm">{p.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#0D3559] py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Common questions from<br />
              <span className="text-[#F5C518]">{loc.name} enquiries</span>
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-[#072B4A] border border-[#3B82F6]/20 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-3">
                    {faq.q.replace(/\{location\}/g, loc.name)}
                  </h3>
                  <p className="text-[#8CA3BF] text-sm leading-relaxed">
                    {faq.a.replace(/\{location\}/g, loc.name)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NEARBY AREAS */}
        {nearby.length > 0 && (
          <section className="bg-[#072B4A] py-16 px-6 border-t border-[#3B82F6]/15">
            <div className="max-w-5xl mx-auto">
              <p className="text-[#8CA3BF] text-sm text-center mb-6">
                Also serving these areas in {loc.region}:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {nearby.map((n) => (
                  <a
                    key={n.slug}
                    href={`/online-pt-qualification-uk/${n.slug}`}
                    className="px-4 py-2 rounded-full border border-[#3B82F6]/30 text-[#8CA3BF] text-sm hover:border-[#F5C518]/50 hover:text-white transition-all"
                  >
                    {n.name}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-[#0D3559] py-24 px-6 text-center border-t border-[#3B82F6]/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to start from {loc.name}?
            </h2>
            <p className="text-[#8CA3BF] text-lg mb-10">
              Book a free 15-minute call with the team. No pressure — just an honest conversation about whether this is right for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/enrol"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
              >
                Enrol Now →
              </a>
              <a
                href="/book-call"
                className="px-8 py-4 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold hover:bg-[#F5C518] hover:text-[#072B4A] transition-all"
              >
                Book a Free Call
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
