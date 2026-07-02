import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { HUB_CLUSTERS, entriesForCluster } from "@/app/lib/hub";

export const metadata: Metadata = {
  title: "PT Career Knowledge Hub — Guides, Tools & Answers | PT Launch Lab",
  description:
    "Everything you need to decide on a personal training career in the UK: how to qualify, what gyms accept, what PTs earn, and free tools to plan your move. Honest, no fluff.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/hub" },
  openGraph: {
    title: "PT Career Knowledge Hub — Guides, Tools & Answers",
    description:
      "Guides, tools and honest answers on becoming a personal trainer in the UK — organised by where you are in the journey.",
    url: "https://ptlaunchlab.co.uk/hub",
    type: "website",
  },
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="bg-base min-h-screen">
        {/* Hero */}
        <section className="bg-surface pt-32 pb-14">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">Knowledge hub</p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight max-w-3xl">
              Everything you need to
              <br />
              <span className="text-gold">make the call.</span>
            </h1>
            <p className="text-soft/70 text-lg mt-6 max-w-2xl">
              Straight answers on becoming a personal trainer in the UK — how to qualify, what gyms
              actually accept, what you can earn, and free tools to plan your move. Organised by where
              you are in the journey, not buried in a blog.
            </p>

            {/* Jump links */}
            <div className="flex flex-wrap gap-2 mt-8">
              {HUB_CLUSTERS.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-card text-white/80 border border-white/[0.1] hover:border-gold/40 transition-colors"
                >
                  {c.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Clusters */}
        <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
          {HUB_CLUSTERS.map((cluster) => {
            const entries = entriesForCluster(cluster.id);
            if (entries.length === 0) return null;
            return (
              <section key={cluster.id} id={cluster.id} className="scroll-mt-24">
                <div className="mb-6">
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-none tracking-tight">
                    {cluster.title}
                  </h2>
                  <p className="text-soft/60 text-[15px] mt-2">{cluster.blurb}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((e) => (
                    <Link
                      key={e.href}
                      href={e.href}
                      className="group bg-card border border-white/[0.07] rounded-2xl p-6 hover:border-gold/30 transition-colors flex flex-col"
                    >
                      {e.kind === "tool" && (
                        <span className="inline-block self-start text-[10px] uppercase tracking-wider text-gold border border-gold/30 rounded-full px-2 py-0.5 mb-2">
                          Free tool
                        </span>
                      )}
                      <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-gold transition-colors">
                        {e.title}
                      </h3>
                      <p className="text-soft/60 text-[13px] leading-relaxed flex-1">{e.blurb}</p>
                      <span className="text-gold text-sm font-semibold mt-4 inline-flex items-center gap-1">
                        Read
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <section className="bg-surface py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight tracking-tight">
              Done reading? Get your plan.
            </h2>
            <p className="text-soft/70 text-lg mt-4">
              Turn all of this into a realistic, personalised route in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/career-planner" className="bg-gold text-base font-bold px-8 py-4 rounded-full hover:brightness-110 transition">
                Get your Career Escape Plan
              </Link>
              <Link href="/courses" className="border border-white/[0.15] text-white font-semibold px-8 py-4 rounded-full hover:border-gold/50 transition">
                See the course
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
