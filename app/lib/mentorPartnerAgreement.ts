/**
 * SINGLE SOURCE OF TRUTH for the Business Mentorship Partner Agreement.
 *
 * Both the on-screen agreement at /mentor-partnership/sign and the signed PDF
 * emailed to both parties are rendered from this file, the same way the gym
 * agreement works (see partnershipAgreement.ts for why the two must never
 * carry separate copies of the clause text).
 *
 * Scope is deliberately narrow: exclusivity, representing PT Launch Lab,
 * learner data, materials and ending it. Fees are NOT in here — they are agreed
 * separately in writing and set after the 90-day pilot review.
 *
 * VERSIONING: bump MENTOR_AGREEMENT_VERSION whenever the legal text changes.
 *
 *   v1.0 2026-10-12  first version, written for Axis Systems (Josh Clarke).
 */

import type { Block, Clause } from "./partnershipAgreement";

export type { Block, Clause };

export const MENTOR_AGREEMENT_VERSION = "1.0";

export const MENTOR_AGREEMENT_SUMMARY =
  "exclusivity to PTLL among PT course providers · learner data as processor · represents PTLL · no fees in this agreement";

export interface MentorAgreementParties {
  /** Trading or company name, e.g. "Axis Systems" or "Axis Systems Ltd". */
  businessName: string;
  /** Optional — blank for a sole trader. */
  companyNumber: string;
  address: string;
  /** Name of the person signing. */
  repName: string;
  repEmail: string;
  /** Pre-formatted, e.g. "12 October 2026". */
  signedDate: string;
}

const p = (text: string): Block => ({ kind: "p", text });
const b = (text: string): Block => ({ kind: "bullet", text });

/** Shown above the agreement and positively acknowledged before signing. */
export const MENTOR_KEY_TERMS_FOR_ACKNOWLEDGEMENT = [
  {
    clause: "Clause 4",
    title: "Exclusivity",
    detail:
      "While this agreement runs, you won't provide business mentorship to, or partner with, any other provider of personal training or gym instructing courses or qualifications. Your own coaching and consultancy business is not affected: you can keep working with any coach who comes to you directly.",
  },
  {
    clause: "Clause 5",
    title: "Learner data",
    detail:
      "Learner details we share (name, email, phone and whether they've paid) are ours. You use them only to deliver the mentorship, keep them secure, never pass them on, tell us within 48 hours of any breach, and delete them when the agreement ends.",
  },
  {
    clause: "Clause 3",
    title: "Representing PT Launch Lab",
    detail:
      "With our learners you represent PT Launch Lab and follow our brand and conduct standards. Any paid offer of your own is always optional and never presented as something the included mentorship is missing.",
  },
];

export function buildMentorAgreementClauses(party: MentorAgreementParties): Clause[] {
  const { businessName, companyNumber, address, repName, repEmail, signedDate } = party;
  const identity = companyNumber.trim()
    ? `${businessName}, a company registered in England & Wales (Company No: ${companyNumber.trim()}), whose registered office is at ${address}`
    : `${repName}, trading as ${businessName}, of ${address}`;

  return [
    {
      number: "1",
      title: "Parties",
      blocks: [
        p(`This Agreement is made on the ${signedDate}`),
        p("BETWEEN:"),
        p(
          "(1)  PT Launch Lab Ltd, a company registered in England & Wales (Company No: 16596168), whose registered office is at Unit 3, Royals Business Park, King St, Pontefract, United Kingdom, WF8 4AH (“PT Launch Lab”)"
        ),
        p("AND"),
        p(`(2)  ${identity} (“the Mentor Partner”)`),
      ],
    },

    {
      number: "2",
      title: "Purpose",
      blocks: [
        p(
          "2.1  The Mentor Partner provides business mentorship to PT Launch Lab’s learners as part of PT Launch Lab’s course. This includes the Dream Customer Profile work, 1:1 calls, coaching systems and recorded education, as agreed between the parties from time to time."
        ),
        p(
          "2.2  This Agreement covers how the Mentor Partner works with PT Launch Lab and its learners: exclusivity, representation, learner data, materials and ending the arrangement."
        ),
        p(
          "2.3  Fees and any revenue share are not set by this Agreement. They are agreed separately in writing. Until they are, neither party owes the other any payment under this Agreement."
        ),
        p(
          "2.4  PT Launch Lab remains responsible for the course, qualification, assessment, learner administration and customer service. The Mentor Partner is not responsible for these."
        ),
      ],
    },

    {
      number: "3",
      title: "Representing PT Launch Lab",
      blocks: [
        p(
          "3.1  When working with PT Launch Lab’s learners, the Mentor Partner represents PT Launch Lab and shall follow its reasonable brand and conduct standards, as notified in writing from time to time."
        ),
        p("3.2  The Mentor Partner shall not:"),
        b("Make any statement or promise about the course, qualification, assessments, awarding body or certification;"),
        b("Guarantee earnings, client numbers or business results to any learner;"),
        b("Enter into any commitment, or incur any cost, on PT Launch Lab’s behalf;"),
        b("Encourage any learner to pause, withdraw from or not complete their PT Launch Lab course."),
        p(
          "3.3  Any paid service the Mentor Partner offers a learner shall be presented as optional. The Mentor Partner shall not suggest that the mentorship included in the course is incomplete without it, and shall not pressure a learner to buy."
        ),
        p(
          "3.4  During the term, the Mentor Partner may describe itself as PT Launch Lab’s business mentorship partner, and PT Launch Lab may use the Mentor Partner’s name and likeness to describe the mentorship included in its course."
        ),
      ],
    },

    {
      number: "4",
      title: "Exclusivity",
      blocks: [
        p(
          "4.1  During the term of this Agreement, the Mentor Partner shall not, directly or indirectly, provide business mentorship, coaching or similar services to, or enter into any partnership, referral or white-label arrangement with, any other provider of personal training or gym instructing courses or qualifications in the United Kingdom."
        ),
        p("4.2  Nothing in Clause 4.1 restricts the Mentor Partner from:"),
        b("Running its own coaching and consultancy business, and working with any coach, personal trainer or business owner who comes to it directly and not through another course or qualification provider;"),
        b("Creating and publishing its own content, podcasts or educational material under its own name."),
        p(
          "4.3  This Agreement does not restrict PT Launch Lab from working with other mentors, coaches or partners."
        ),
        p(
          "4.4  The parties agree that the restriction in Clause 4.1 lasts only for the term of this Agreement and goes no further than is reasonable to protect PT Launch Lab’s business."
        ),
      ],
    },

    {
      number: "5",
      title: "Learner Data (UK GDPR)",
      blocks: [
        p(
          "5.1  Both parties shall comply with the UK GDPR and the Data Protection Act 2018."
        ),
        p(
          "5.2  PT Launch Lab is the controller of the personal data of its learners. When the Mentor Partner receives or handles that data to deliver the mentorship included in the course, it does so as PT Launch Lab’s processor."
        ),
        p(
          "5.3  PT Launch Lab will share only what the mentorship needs: normally a learner’s name, email address, phone number and payment status. The Mentor Partner shall:"
        ),
        b("Use the data only to deliver the mentorship, and only on PT Launch Lab’s documented instructions, including this Agreement;"),
        b("Not use the data to market its own services, or anyone else’s, except as agreed in writing with PT Launch Lab;"),
        b("Not sell, share or disclose the data to any third party, other than service providers it needs to deliver the mentorship (such as email, calendar and video-call tools) that are bound by data protection terms no less protective than these;"),
        b("Keep the data secure, including using strong passwords and two-factor authentication on accounts that hold it, and ensure anyone who handles it is bound by confidentiality;"),
        b("Not transfer the data outside the UK without adequate safeguards under the UK GDPR;"),
        b("Notify PT Launch Lab without undue delay, and in any event within 48 hours, of becoming aware of any personal data breach affecting learner data;"),
        b("Help PT Launch Lab respond to data subject requests, regulatory enquiries and breaches, and provide the information PT Launch Lab reasonably needs to show these obligations are met."),
        p(
          "5.4  When this Agreement ends, or earlier on PT Launch Lab’s written request, the Mentor Partner shall delete or return all learner data within 30 days and confirm in writing that it has done so."
        ),
        p(
          "5.5  Where a learner chooses to become a paying client of the Mentor Partner directly, the Mentor Partner may keep the details that learner gives it for that client relationship, as its own controller and under its own privacy notice. Clause 5.3 continues to apply to data received from PT Launch Lab."
        ),
      ],
    },

    {
      number: "6",
      title: "Confidentiality",
      blocks: [
        p(
          "6.1  Each party shall keep confidential any information about the other’s business, learners, pricing, systems and plans that it receives under this Agreement, and use it only for the purposes of this Agreement."
        ),
        p(
          "6.2  This does not apply to information that is already public, that the receiving party already lawfully held, or that must be disclosed by law, a court, or a regulatory or awarding body."
        ),
      ],
    },

    {
      number: "7",
      title: "Materials",
      blocks: [
        p(
          "7.1  The Mentor Partner keeps ownership of its own methods, frameworks, templates and paid products."
        ),
        p(
          "7.2  The Mentor Partner grants PT Launch Lab a non-exclusive, royalty-free, perpetual licence to keep using, for its own learners, any material made for the mentorship included in the course, such as worksheets, recordings and templates. This licence continues after the Agreement ends."
        ),
      ],
    },

    {
      number: "8",
      title: "Complaints",
      blocks: [
        p(
          "PT Launch Lab handles complaints about the course. The Mentor Partner handles complaints about its mentorship in the first instance, keeps PT Launch Lab informed, and PT Launch Lab has the final say on how any learner complaint is resolved."
        ),
      ],
    },

    {
      number: "9",
      title: "Independent Contractor",
      blocks: [
        p(
          "The Mentor Partner is an independent contractor, not an employee, worker or agent of PT Launch Lab. It is responsible for its own tax, National Insurance and insurance, and decides how and when it delivers its work, within this Agreement."
        ),
      ],
    },

    {
      number: "10",
      title: "Term & Termination",
      blocks: [
        p(
          "10.1  This Agreement starts on the date signed and continues until ended under this clause. There is no minimum term."
        ),
        p(
          "10.2  Either party may end this Agreement at any time by giving 30 days’ written notice."
        ),
        p(
          "10.3  Either party may end it immediately by written notice if the other materially breaches Clause 3, 4 or 5, or becomes insolvent or ceases to trade."
        ),
        p(
          "10.4  When it ends, the Mentor Partner shall stop describing itself as PT Launch Lab’s partner and shall comply with Clause 5.4. Paid work already started with a learner is finished as agreed with that learner."
        ),
        p("10.5  Clauses 5, 6, 7, 8 and 11 survive termination."),
      ],
    },

    {
      number: "11",
      title: "General",
      blocks: [
        p(
          `11.1  Notices — notices must be in writing and may be sent by email: to PT Launch Lab at info@ptlaunchlab.co.uk, and to the Mentor Partner at ${repEmail}. Email notice is deemed given on the next business day.`
        ),
        p(
          "11.2  Neither party may assign this Agreement without the other’s written consent. A person who is not a party has no right to enforce it under the Contracts (Rights of Third Parties) Act 1999."
        ),
        p(
          "11.3  This Agreement, together with any fees agreed in writing under Clause 2.3, is the entire agreement between the parties on its subject. Changes must be in writing and agreed by both parties."
        ),
        p(
          "11.4  If any provision is found unenforceable, it applies with the minimum change needed to make it enforceable, and the rest continues in force."
        ),
        p(
          "11.5  This Agreement may be signed electronically, and a drawn or typed electronic signature has the same effect as a handwritten one."
        ),
        p(
          "11.6  This Agreement is governed by the laws of England & Wales, and the courts of England & Wales have exclusive jurisdiction."
        ),
      ],
    },
  ];
}
