import { permanentRedirect } from "next/navigation";

// /september — RETIRED (October 2026 change-over).
//
// This was the landing page for the September weekend offer (£99 entry +
// 5 × £200). There are no dated offers any more: the course is £999.99 in full
// or 10 × £99.99 a month for everyone, with rolling enrolment. Old links from
// that email campaign go straight to /enrol, where both options are.
export default function SeptemberPage() {
  permanentRedirect("/enrol");
}
