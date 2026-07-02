import Link from "next/link";
import { graduatesForAvatar, AVATAR_LABELS, type Avatar } from "@/app/lib/graduates";

// ─────────────────────────────────────────────────────────────────────────────
// ProofStrip — reusable avatar-matched social proof (Proof Engine, WS3 #2).
//
// Drop <ProofStrip avatar="switcher" /> into any landing page / avatar page and
// it renders proof from graduates who match that avatar first. This is the
// compounding piece: one graduate DB, matched proof everywhere. Server
// component (no client JS) so it's cheap to sprinkle across many pages.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProofStrip({
  avatar,
  count = 3,
  heading,
  eyebrow = "Real graduates",
}: {
  avatar: Avatar;
  count?: number;
  heading?: string;
  eyebrow?: string;
}) {
  const grads = graduatesForAvatar(avatar, count);
  if (grads.length === 0) return null;

  const title = heading ?? `People who were exactly where you are`;

  return (
    <section className="bg-base py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-3">
            {eyebrow} · {AVATAR_LABELS[avatar]}
          </p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grads.map((g) => (
            <div
              key={g.id}
              className="bg-card border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4 hover:border-gold/20 transition-colors"
            >
              {g.videoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] aspect-video">
                  <iframe
                    src={g.videoUrl}
                    title={`${g.name} — ${g.course}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gold fill-current">
                      <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z" />
                    </svg>
                  ))}
                </div>
              )}

              <p className="text-white/85 text-sm leading-relaxed flex-1">
                &ldquo;{g.quote}&rdquo;
              </p>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-gold text-sm font-bold">{g.name}</p>
                <p className="text-soft/50 text-xs mt-0.5">
                  {g.previousJob ? `${g.previousJob} → ` : ""}
                  {g.course}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/graduates"
            className="inline-flex items-center gap-2 text-gold text-sm font-semibold hover:underline"
          >
            See more graduates like you
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
