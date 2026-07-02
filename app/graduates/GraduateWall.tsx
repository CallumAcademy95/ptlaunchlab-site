"use client";
import { useMemo, useState } from "react";
import {
  GRADUATES,
  GRADUATE_SPECIALISMS,
  AVATAR_LABELS,
  filterGraduates,
  type Avatar,
} from "@/app/lib/graduates";

// ─────────────────────────────────────────────────────────────────────────────
// GraduateWall — the filterable graduate database UI (/graduates).
// Reads the shared Proof Engine DB and filters client-side (small dataset).
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_KEYS = Object.keys(AVATAR_LABELS) as Avatar[];

export default function GraduateWall() {
  const [avatar, setAvatar] = useState<Avatar | "all">("all");
  const [specialism, setSpecialism] = useState<string>("all");
  const [search, setSearch] = useState("");

  const results = useMemo(
    () => filterGraduates({ avatar, specialism, search }),
    [avatar, specialism, search]
  );

  const pill = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
      active
        ? "bg-gold text-base border-gold"
        : "bg-card text-white/80 border-white/[0.1] hover:border-gold/40"
    }`;

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Filters */}
      <div className="flex flex-col gap-5 mb-10">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAvatar("all")} className={pill(avatar === "all")}>
            Everyone
          </button>
          {AVATAR_KEYS.map((a) => (
            <button key={a} onClick={() => setAvatar(a)} className={pill(avatar === a)}>
              {AVATAR_LABELS[a]}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={specialism}
            onChange={(e) => setSpecialism(e.target.value)}
            className="bg-card border border-white/[0.1] rounded-lg px-4 py-2.5 text-sm text-white/90 focus:border-gold/50 outline-none"
            aria-label="Filter by specialism"
          >
            <option value="all">All specialisms</option>
            {GRADUATE_SPECIALISMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search graduates…"
            className="bg-card border border-white/[0.1] rounded-lg px-4 py-2.5 text-sm text-white/90 placeholder:text-soft/40 focus:border-gold/50 outline-none flex-1"
          />

          <span className="text-soft/50 text-sm shrink-0">
            {results.length} of {GRADUATES.length}
          </span>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <p className="text-soft/60 text-center py-16">
          No graduates match that filter yet — try widening it.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((g) => (
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
                <div className="flex items-center justify-between gap-2">
                  <p className="text-gold text-sm font-bold">{g.name}</p>
                  {g.avatar && (
                    <span className="text-[10px] uppercase tracking-wider text-soft/50 border border-white/[0.1] rounded-full px-2 py-0.5">
                      {AVATAR_LABELS[g.avatar]}
                    </span>
                  )}
                </div>
                <p className="text-soft/50 text-xs mt-1">
                  {g.previousJob ? `${g.previousJob} → ` : ""}
                  {g.course}
                </p>
                {g.incomeNote && <p className="text-white/70 text-xs mt-1">{g.incomeNote}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
