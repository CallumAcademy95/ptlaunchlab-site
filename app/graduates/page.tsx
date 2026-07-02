import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import GraduateWall from "./GraduateWall";

export const metadata: Metadata = {
  title: "PT Launch Lab Graduates — Real People, Real Careers | PT Launch Lab",
  description:
    "Meet the people who qualified with PT Launch Lab — career changers, gym starters and parents returning to fitness. Filter by where they came from and see who's just like you.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/graduates" },
  openGraph: {
    title: "PT Launch Lab Graduates — Real People, Real Careers",
    description:
      "Career changers, gym starters and returners who qualified and built coaching businesses with PT Launch Lab. Find someone who started exactly where you are.",
    url: "https://ptlaunchlab.co.uk/graduates",
    type: "website",
  },
};

export default function Page() {
  return (
    <>
      <Nav />

      <main className="bg-base min-h-screen">
        {/* Hero */}
        <section className="bg-surface pt-32 pb-16">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
              Real graduates
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight max-w-3xl">
              Find someone who started
              <br />
              <span className="text-gold">exactly where you are.</span>
            </h1>
            <p className="text-soft/70 text-lg mt-6 max-w-2xl">
              Career changers, gym starters and parents returning to fitness — all qualified with
              PT Launch Lab. Filter by where they came from and see the proof that&apos;s relevant to you,
              not a generic wall of five-star ratings.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 16 16" className="w-4 h-4 text-gold fill-current">
                    <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z" />
                  </svg>
                ))}
              </div>
              <span className="text-white text-sm font-semibold">5.0</span>
              <span className="text-soft/60 text-sm">· Verified Google reviews</span>
            </div>
          </div>
        </section>

        {/* Filterable wall */}
        <section className="py-16">
          <GraduateWall />
        </section>

        {/* CTA */}
        <section className="bg-surface py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight tracking-tight">
              Your story could be next.
            </h2>
            <p className="text-soft/70 text-lg mt-4">
              See where a career in personal training could take you — get your free, personalised
              plan in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                href="/career-planner"
                className="bg-gold text-base font-bold px-8 py-4 rounded-full hover:brightness-110 transition"
              >
                Get your Career Escape Plan
              </Link>
              <Link
                href="/courses"
                className="border border-white/[0.15] text-white font-semibold px-8 py-4 rounded-full hover:border-gold/50 transition"
              >
                See the course
              </Link>
            </div>
            <p className="text-soft/50 text-sm mt-8">
              Already qualified with us?{" "}
              <Link href="/graduates/share" className="text-gold hover:underline font-semibold">
                Share your story →
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
