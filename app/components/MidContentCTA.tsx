import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// MidContentCTA — drop-in CTA block for inserting halfway through a long-form
// article or podcast transcript. Catches engaged readers at peak attention
// rather than waiting for them to reach the bottom-of-page CTA.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  /** Optional override headline. Default tuned for podcast transcripts. */
  headline?: string;
  /** Optional override body. */
  body?: string;
  /** Primary CTA label. */
  ctaText?: string;
  /** Primary CTA destination. */
  ctaHref?: string;
  /** Optional secondary link (e.g. "Compare courses"). */
  secondary?: { text: string; href: string };
  /** Visual variant — default is the gold pill, "compact" is a slimmer line. */
  variant?: "default" | "compact";
};

export default function MidContentCTA({
  headline = "Considering becoming a PT?",
  body = "We're the PT academy run by the gym owners on this podcast. Take the 60-second quiz to see if it's the right fit for you.",
  ctaText = "Take the 60-Second Quiz →",
  ctaHref = "/quiz",
  secondary,
  variant = "default",
}: Props) {
  if (variant === "compact") {
    return (
      <aside
        data-mid-content-cta
        className="not-prose my-10 rounded-xl border border-gold/30 bg-gold/[0.04] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <p className="text-white text-sm flex-1 leading-relaxed">
          <span className="text-gold font-bold">{headline}</span> {body}
        </p>
        <Link
          href={ctaHref}
          data-cta="midcontent-compact"
          className="px-5 py-2.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all whitespace-nowrap text-center"
        >
          {ctaText}
        </Link>
      </aside>
    );
  }

  return (
    <aside
      data-mid-content-cta
      className="not-prose my-12 rounded-2xl border border-gold/40 bg-gradient-to-br from-card to-base shadow-lg shadow-gold/[0.06] p-6 md:p-8"
    >
      <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">
        Quick check
      </p>
      <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-3">
        {headline}
      </h3>
      <p className="text-soft text-base leading-relaxed mb-5">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={ctaHref}
          data-cta="midcontent-primary"
          className="px-6 py-3 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all text-center"
        >
          {ctaText}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            data-cta="midcontent-secondary"
            className="px-6 py-3 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all text-center"
          >
            {secondary.text}
          </Link>
        )}
      </div>
    </aside>
  );
}
