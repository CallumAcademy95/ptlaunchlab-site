"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { scrubBookingUrl } from "@/app/lib/booking/privacy";

// Vercel Web Analytics with booking secrets scrubbed: /book/* URLs carry ?t=
// (signed lead link) and /book/manage/<token>, which must never leave the site.
const beforeSend = (event: BeforeSendEvent): BeforeSendEvent => ({ ...event, url: scrubBookingUrl(event.url) });

export default function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
