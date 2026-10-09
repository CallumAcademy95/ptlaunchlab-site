import { permanentRedirect } from "next/navigation";

// /youtube-discount — RETIRED (October 2026 change-over).
//
// This page promised "subscribe and unlock £200 off". There are no discounts
// any more — the course is £999.99 in full or 10 × £99.99 a month for everyone —
// so the page's whole premise is gone. Rather than keep a subscribe page that
// would need its promise rewritten, old links (YouTube descriptions, pinned
// comments) are sent to /courses, which sets out the course and both prices.
export default function Page() {
  permanentRedirect("/courses");
}
