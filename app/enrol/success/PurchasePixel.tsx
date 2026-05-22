"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Fires the browser-side fbq Purchase event paired by event_id with the
// server-side CAPI Purchase event fired by /api/stripe-webhook. The Stripe
// checkout session id is the shared id — Meta dedups the two on
// (event_name='Purchase', event_id=<stripe session id>) within 7 days.
//
// We don't have access to the purchase amount on this server-rendered page
// without an extra Stripe API call, and the dedup will pick the CAPI event's
// value either way (server-side wins when present). So the browser event
// fires without a value field — its job is just to mark the conversion in
// the browser context for the cases where CAPI fails or is delayed.

export default function PurchasePixel() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!sessionId) return;
    if (typeof window === "undefined") return;
    const win = window as { fbq?: (...args: unknown[]) => void; dataLayer?: Record<string, unknown>[] };
    if (typeof win.fbq === "function") {
      win.fbq(
        "track",
        "Purchase",
        { currency: "GBP", content_name: "ptll_course" },
        { eventID: sessionId },
      );
    }
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({
      event: "purchase_browser_confirm",
      transaction_id: sessionId,
    });
  }, [sessionId]);

  return null;
}
