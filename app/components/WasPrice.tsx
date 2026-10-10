"use client";

import { useEffect, useState } from "react";
import { PRICE_DROP_NOTE, WAS_PRICE_LABEL, wasPriceActive } from "@/app/lib/priceDrop";

/**
 * "£1,599" struck through (and optionally the price-drop note), shown only
 * until WAS_PRICE_ENDS_MS. Decided in the browser after mount, so it switches
 * off on time even if the page was built before the end date.
 */
export default function WasPrice({ note = false, className = "" }: { note?: boolean; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(wasPriceActive(Date.now())), []);
  if (!on) return null;
  return (
    <span className={`inline-flex flex-col leading-tight ${className}`}>
      <span className="line-through opacity-50 text-[0.6em] font-semibold" aria-label={`was ${WAS_PRICE_LABEL}`}>
        {WAS_PRICE_LABEL}
      </span>
      {note && <span className="text-[11px] font-normal opacity-70 not-italic">{PRICE_DROP_NOTE}</span>}
    </span>
  );
}
