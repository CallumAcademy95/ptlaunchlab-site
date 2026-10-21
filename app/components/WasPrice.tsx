"use client";

import { useEffect, useState } from "react";
import { PRICE_DROP_NOTE, WAS_PRICE_LABEL, wasPriceActive } from "@/app/lib/priceDrop";

/**
 * "£1,599" struck through (and optionally the price-drop note), shown only
 * until WAS_PRICE_ENDS_MS. Decided in the browser after mount, so it switches
 * off on time even if the page was built before the end date.
 *
 * @param reserve  Until mount, render the same box invisibly so its space is
 *   held and nothing below it moves when it appears. The server and the first
 *   client render are identical (no hydration mismatch). Pass a build-time
 *   `wasPriceActive(...)` so pages built after the end date reserve nothing.
 */
export default function WasPrice({ note = false, className = "", reserve = false }: { note?: boolean; className?: string; reserve?: boolean }) {
  const [state, setState] = useState<"pending" | "on" | "off">("pending");
  useEffect(() => setState(wasPriceActive(Date.now()) ? "on" : "off"), []);
  if (state === "off" || (state === "pending" && !reserve)) return null;
  const placeholder = state === "pending";
  return (
    <span className={`inline-flex flex-col leading-tight ${placeholder ? "invisible" : ""} ${className}`} aria-hidden={placeholder || undefined}>
      {/* "Was" is real text, not just a strikethrough or aria-label: anything reading the page as
          text (AI assistants, search snippets) otherwise sees two prices side by side. */}
      <span className="opacity-60 text-[0.85em] font-semibold">
        <span className="font-normal">Was </span>
        <del>{WAS_PRICE_LABEL}</del>
      </span>
      {note && <span className="text-xs font-normal opacity-80 not-italic">{PRICE_DROP_NOTE}</span>}
    </span>
  );
}
