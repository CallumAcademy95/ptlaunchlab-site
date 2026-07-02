import Link from "next/link";
import { relatedEntries } from "@/app/lib/hub";

// ─────────────────────────────────────────────────────────────────────────────
// RelatedGuides — in-page interlinking for the Knowledge Hub (WS3 #4).
//
// Drop <RelatedGuides currentHref="/personal-trainer-salary-uk" /> onto any
// content page to surface sibling guides from the same topic cluster. Turns
// the flat set of SEO pages into an interlinked hub (better crawl depth +
// keeps readers moving through the topic). Server component, no client JS.
// ─────────────────────────────────────────────────────────────────────────────

export default function RelatedGuides({
  currentHref,
  heading = "Keep reading",
  limit = 3,
}: {
  currentHref: string;
  heading?: string;
  limit?: number;
}) {
  const items = relatedEntries(currentHref, limit);
  if (items.length === 0) return null;

  return (
    <section className="bg-base py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-2">Knowledge hub</p>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-none tracking-tight">
              {heading}
            </h2>
          </div>
          <Link href="/hub" className="text-gold text-sm font-semibold hover:underline shrink-0">
            All guides →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group bg-card border border-white/[0.07] rounded-2xl p-5 hover:border-gold/30 transition-colors"
            >
              {e.kind === "tool" && (
                <span className="inline-block text-[10px] uppercase tracking-wider text-gold border border-gold/30 rounded-full px-2 py-0.5 mb-2">
                  Free tool
                </span>
              )}
              <h3 className="text-white font-bold text-[15px] leading-snug mb-1.5 group-hover:text-gold transition-colors">
                {e.title}
              </h3>
              <p className="text-soft/60 text-[13px] leading-relaxed">{e.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
