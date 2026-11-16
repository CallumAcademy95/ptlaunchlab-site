/**
 * The mentor partner agreements the signing flow can issue. One signing page
 * component, one API route and one PDF renderer serve them all; each kind
 * brings its own clause text (its single source of truth), version and key
 * terms.
 *
 *   mentorship  /mentor-partnership/sign          mentor delivers mentoring
 *               included in our course, per-call fee (Axis, Oct 2026)
 *   package     /mentor-partnership/package/sign  mentor sells our course with
 *               their mentoring as a package, flat commission (PT Mentor Hub,
 *               Nov 2026)
 */

import type { Clause } from "./partnershipAgreement";
import {
  buildMentorAgreementClauses,
  MENTOR_AGREEMENT_SUMMARY,
  MENTOR_AGREEMENT_VERSION,
  MENTOR_KEY_TERMS_FOR_ACKNOWLEDGEMENT,
  type MentorAgreementParties,
} from "./mentorPartnerAgreement.ts";
import {
  buildMentorPackageAgreementClauses,
  MENTOR_PACKAGE_ACK_NOTE,
  MENTOR_PACKAGE_AGREEMENT_SUMMARY,
  MENTOR_PACKAGE_AGREEMENT_VERSION,
  MENTOR_PACKAGE_KEY_TERMS_FOR_ACKNOWLEDGEMENT,
} from "./mentorPackageAgreement.ts";

export type MentorAgreementKind = "mentorship" | "package";

export interface MentorAgreementDef {
  kind: MentorAgreementKind;
  /** e.g. "Business Mentorship Partner Agreement" — PDF header, emails, page. */
  title: string;
  version: string;
  summary: string;
  keyTerms: { clause: string; title: string; detail: string }[];
  /** Which clauses the key-terms box covered, recorded in the signed PDF. */
  ackNote: string;
  buildClauses: (party: MentorAgreementParties) => Clause[];
  /** Placeholder for the business name field. */
  businessPlaceholder: string;
  filenamePrefix: string;
}

export const MENTOR_AGREEMENTS: Record<MentorAgreementKind, MentorAgreementDef> = {
  mentorship: {
    kind: "mentorship",
    title: "Business Mentorship Partner Agreement",
    version: MENTOR_AGREEMENT_VERSION,
    summary: MENTOR_AGREEMENT_SUMMARY,
    keyTerms: MENTOR_KEY_TERMS_FOR_ACKNOWLEDGEMENT,
    ackNote:
      "Clause 2 (call fee and pilot), Clause 3 (representing PT Launch Lab), Clause 4 (exclusivity) and Clause 5 (learner data)",
    buildClauses: buildMentorAgreementClauses,
    businessPlaceholder: "e.g. Axis Systems",
    filenamePrefix: "ptll-mentor-partner-agreement",
  },
  package: {
    kind: "package",
    title: "Mentor Package Partner Agreement",
    version: MENTOR_PACKAGE_AGREEMENT_VERSION,
    summary: MENTOR_PACKAGE_AGREEMENT_SUMMARY,
    keyTerms: MENTOR_PACKAGE_KEY_TERMS_FOR_ACKNOWLEDGEMENT,
    ackNote: MENTOR_PACKAGE_ACK_NOTE,
    buildClauses: buildMentorPackageAgreementClauses,
    businessPlaceholder: "e.g. PT Mentor Hub",
    filenamePrefix: "ptll-mentor-package-agreement",
  },
};

/** Anything unrecognised is the original mentorship agreement. */
export function parseMentorAgreementKind(v: unknown): MentorAgreementKind {
  return v === "package" ? "package" : "mentorship";
}
