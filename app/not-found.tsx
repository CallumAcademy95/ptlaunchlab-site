import type { Metadata } from "next";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

// Next serves its own bare-bones 404 when this file is absent — white page,
// no nav, no route back. Paid traffic lands here on any dead ad link or
// mistyped URL, so it needs the brand chrome and a way onward.
export const metadata: Metadata = {
  title: "Page not found — PT Launch Lab",
  description:
    "That page doesn't exist. Find the NCFE Level 3 Personal Trainer course, book a free call, or take the two-minute career quiz.",
  robots: { index: false, follow: true },
};

// Doubles as an internal-linking surface: the money pages plus the top
// informational pages, so a 404 passes crawl equity on instead of dead-ending.
const destinations = [
  {
    href: "/courses",
    title: "The Course",
    blurb: "NCFE Level 2 & 3, Ofqual regulated, 100% online.",
  },
  {
    href: "/book-call",
    title: "Discover Your Pathway",
    blurb: "A free call to work out whether PT is the right move.",
  },
  {
    href: "/quiz",
    title: "Free Career Quiz",
    blurb: "Two minutes to see which route fits your situation.",
  },
  {
    href: "/graduates",
    title: "Our Graduates",
    blurb: "Real people who qualified and changed careers.",
  },
  {
    href: "/personal-trainer-salary-uk",
    title: "PT Salary Guide",
    blurb: "What UK personal trainers actually earn.",
  },
  {
    href: "/podcast",
    title: "The Podcast",
    blurb: "Honest conversations about building a PT career.",
  },
];

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="pt-[72px] bg-deep min-h-screen">
        <section className="relative overflow-hidden px-6 py-24 md:py-32">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center">
            <p className="font-display font-extrabold text-7xl md:text-8xl text-gold/25 leading-none tracking-tight mb-6">
              404
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-tight tracking-tight mb-5">
              This page has left the building.
            </h1>
            <p className="text-soft text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              The link is broken or the page has moved. Nothing is lost — here
              is everything you were probably looking for.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/courses"
                className="px-6 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-gold/20"
              >
                View the Course →
              </a>
              <a
                href="/book-call"
                className="px-6 py-3.5 rounded-full border border-gold/50 text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
              >
                Discover Your Pathway
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <p className="text-faint text-xs font-semibold tracking-widest uppercase text-center mb-8">
              Popular pages
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((d) => (
                <a
                  key={d.href}
                  href={d.href}
                  className="group bg-card border border-white/[0.06] rounded-2xl p-6 hover:border-gold/40 transition-all"
                >
                  <p className="text-white font-semibold mb-2 group-hover:text-gold transition-colors">
                    {d.title}
                  </p>
                  <p className="text-soft/70 text-sm leading-relaxed">{d.blurb}</p>
                </a>
              ))}
            </div>

            <p className="text-faint text-sm text-center mt-10">
              Still stuck?{" "}
              <a href="/contact" className="text-gold hover:underline">
                Get in touch
              </a>{" "}
              and we&apos;ll point you the right way.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
