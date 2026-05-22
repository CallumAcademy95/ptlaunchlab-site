"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// PromoBar
//
// Sticky top banner that surfaces the 48h £200 funnel-promo countdown once
// active. Polls /api/funnel-promo/status on mount; if active, renders a
// fixed gold bar above the page with live countdown + a high-intent CTA.
// Renders nothing if the promo is not active (so it adds no chrome for
// visitors who haven't converted yet).
// ─────────────────────────────────────────────────────────────────────────────

type Status =
  | { active: true; source: string; expiresAt: number; secondsRemaining: number }
  | { active: false };

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PromoBar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Poll on mount, then re-poll every 30s in case the cookie was just set
  // mid-page (HeroLeadForm submission, prospectus modal, etc).
  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch("/api/funnel-promo/status", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: Status) => { if (!cancelled) setStatus(data); })
        .catch(() => { if (!cancelled) setStatus({ active: false }); });
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // 1s countdown ticker only when active
  useEffect(() => {
    if (!status || !status.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  if (!status || !status.active) return null;

  const secondsRemaining = Math.max(0, Math.floor((status.expiresAt - now) / 1000));
  if (secondsRemaining <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gold text-deep shadow-lg shadow-gold/20">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-bold tracking-widest uppercase shrink-0 hidden sm:inline">
            £200 off your course · expires in
          </span>
          <span className="text-[11px] font-bold tracking-widest uppercase shrink-0 sm:hidden">
            £200 off ·
          </span>
          <span className="font-display font-extrabold text-lg sm:text-xl tabular-nums">
            {formatCountdown(secondsRemaining)}
          </span>
        </div>
        <Link
          href="/book-call"
          data-cta="promo-bar"
          className="shrink-0 px-4 py-1.5 rounded-full bg-deep text-gold text-xs font-bold hover:brightness-110 transition-all"
        >
          Book Your Call →
        </Link>
      </div>
    </div>
  );
}
