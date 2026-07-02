import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import ShareStory from "./ShareStory";

export const metadata: Metadata = {
  title: "Share Your Story — PT Launch Lab Graduates",
  description:
    "Qualified with PT Launch Lab? Share your story to inspire the next person thinking about a career in personal training.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/graduates/share" },
  robots: { index: false, follow: true }, // capture page — keep it out of search
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="bg-base min-h-screen">
        <section className="bg-surface pt-32 pb-14">
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
              Graduates
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-none tracking-tight">
              Share your story.
            </h1>
            <p className="text-soft/70 text-lg mt-5">
              You were once where they are now. A couple of honest paragraphs about your journey can
              be the thing that helps the next person finally make the move. It takes two minutes.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-2xl mx-auto px-6">
            <ShareStory />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
