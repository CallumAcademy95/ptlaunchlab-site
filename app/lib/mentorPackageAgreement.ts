/**
 * SINGLE SOURCE OF TRUTH for the Mentor Package Partner Agreement.
 *
 * For a mentor who SELLS a combined package (our NCFE Level 2 & 3 plus their
 * own mentoring) from their own page, pay in full only, and is paid a flat
 * commission per learner. First written for PT Mentor Hub (Luke Whiston),
 * Nov 2026. Contrast mentorPartnerAgreement.ts, where the mentor delivers
 * mentoring INCLUDED in our course for a per-call fee and sells nothing.
 *
 * The on-screen agreement at /mentor-partnership/package/sign, the signed PDF
 * and the public Commitment terms page (/pt-mentor-hub-academy/commitment-terms)
 * all render from this file. COMMITMENT_TERMS is Schedule 1 of the agreement
 * AND the public page, word for word, so the promise advertised to learners
 * can never drift from the one the mentor signed.
 *
 * Decisions (Callum, 16 Nov 2026): commission released when the learner's
 * 14-day cooling-off ends and paid within 7 days of release; exclusive among
 * PT course providers; Commitment terms written as defaults here and agreed
 * by signing.
 *
 * VERSIONING: bump MENTOR_PACKAGE_AGREEMENT_VERSION whenever the legal text
 * (including COMMITMENT_TERMS) changes.
 *
 *   v1.0 2026-11-16  first version, written for PT Mentor Hub.
 */

import type { Block, Clause } from "./partnershipAgreement";
import type { MentorAgreementParties } from "./mentorPartnerAgreement.ts";

export const MENTOR_PACKAGE_AGREEMENT_VERSION = "1.0";

export const MENTOR_PACKAGE_AGREEMENT_SUMMARY =
  "package sold pay in full only at £999.99 · £500 per learner, released when the 14-day cooling-off ends, paid within 7 days · the Commitment is the mentor's, delivered as mentoring, terms in Schedule 1 · exclusive among PT course providers · learner data as processor";

/** £ figures used in the text; kept here so tests can check them. */
export const PACKAGE_PRICE_LABEL = "£999.99";
export const PACKAGE_COMMISSION_LABEL = "£500";

const p = (text: string): Block => ({ kind: "p", text });
const b = (text: string): Block => ({ kind: "bullet", text });

/**
 * The Commitment's terms: Schedule 1 of the agreement and the public terms
 * page. Plain English, written to the learner, because learners read them.
 */
export const COMMITMENT_TERMS: { title: string; text: string }[] = [
  {
    title: "Who gives it",
    text: "The Commitment is given by PT Mentor Hub, not by PT Launch Lab. It is a promise of further mentoring, not of money back.",
  },
  {
    title: "Who it applies to",
    text: "Anyone who bought the PT Mentor Hub Academy package: the NCFE Level 2 and Level 3 qualifications with three months of PT Mentor Hub mentoring.",
  },
  {
    title: "To qualify",
    text: "You must achieve your Level 2 and Level 3 qualifications; start working as a personal trainer (employed or self-employed) and start your three months of mentoring within 12 months of qualifying; attend your introduction call and your monthly 1-to-1 check-ins, or rearrange them in advance; and work through the actions in your 12-week roadmap.",
  },
  {
    title: "Earning back your investment",
    text: `This means your income from personal training during your three months of mentoring adds up to at least the price you paid for the package (${PACKAGE_PRICE_LABEL}).`,
  },
  {
    title: "If you haven't",
    text: "Tell PT Mentor Hub within 30 days of your three months ending, with reasonable evidence of your personal training income in that period, such as invoices or booking and payment records. PT Mentor Hub will then continue your monthly 1-to-1 check-ins and group mentoring free of charge until your income reaches that amount, for as long as you keep working as a personal trainer and keep attending.",
  },
  {
    title: "What it isn't",
    text: "It is not a refund of any part of the package price, and it does not guarantee employment, clients or income. It does not affect your 14-day cooling-off right or your statutory rights.",
  },
];

/** Shown above the agreement and positively acknowledged before signing. */
export const MENTOR_PACKAGE_KEY_TERMS_FOR_ACKNOWLEDGEMENT = [
  {
    clause: "Clause 2",
    title: "The package",
    detail: `PT Launch Lab sells the package (our NCFE Level 2 & 3 plus your three months of mentoring) through its own checkout on your page, at ${PACKAGE_PRICE_LABEL} paid in full. No monthly or instalment plan unless we both agree it in writing. You deliver the mentoring to every learner who buys.`,
  },
  {
    clause: "Clause 3",
    title: "Your commission",
    detail: `${PACKAGE_COMMISSION_LABEL} for every learner who buys through your page. It is released when the learner's 14-day cooling-off period ends and paid to your bank within 7 days of release. No delivery costs come out of it. If a learner is refunded, the commission on that enrolment is returned.`,
  },
  {
    clause: "Clause 4",
    title: "Your Commitment",
    detail: "The 'earn back your investment' promise is yours. It is delivered only as further mentoring at your cost, never as a refund, and on the terms in Schedule 1, which you agree by signing.",
  },
  {
    clause: "Clauses 5 & 7",
    title: "Marketing and exclusivity",
    detail: "No promises of earnings, clients or jobs beyond the Commitment, and never advertise payment plans, finance or 'pay later'. While this agreement runs, you don't promote or partner with any other PT course provider.",
  },
  {
    clause: "Clause 8",
    title: "Learner data",
    detail: "Learner details we share are ours. You use them only to deliver the mentoring and the Commitment, keep them secure, tell us within 24 hours of any breach, and delete them within 14 days when the mentoring ends.",
  },
];

/** The sentence recorded in the signed PDF as evidence of fair notice. */
export const MENTOR_PACKAGE_ACK_NOTE =
  "Clause 2 (the package), Clause 3 (commission), Clause 4 and Schedule 1 (the Commitment), Clauses 5 and 7 (marketing and exclusivity) and Clause 8 (learner data)";

export function buildMentorPackageAgreementClauses(party: MentorAgreementParties): Clause[] {
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
      title: "The Package",
      blocks: [
        p("2.1  The parties sell one combined package (the “Package”), made up of:"),
        b("the NCFE Level 2 Certificate in Gym Instructing and Level 3 Diploma in Personal Training, delivered by PT Launch Lab (the “Qualification”); and"),
        b("three months of business mentoring, delivered by the Mentor Partner (the “Mentoring”)."),
        p(
          `2.2  The Package is sold only through PT Launch Lab’s checkout on the Mentor Partner’s page on PT Launch Lab’s website, at ${PACKAGE_PRICE_LABEL} paid in full. No monthly or instalment plan is offered for the Package unless both parties agree it in writing. PT Launch Lab sets the price and may change it on 30 days’ written notice.`
        ),
        p(
          "2.3  PT Launch Lab is the seller of the Package to the learner and takes payment. It is responsible for the Qualification, assessment, learner administration, the learner’s cooling-off rights and refunds, and customer service about the course."
        ),
        p("2.4  The Mentor Partner shall provide each learner who buys the Package with:"),
        b("a 1-to-1 introduction call;"),
        b("a personalised 12-week business roadmap;"),
        b("monthly 1-to-1 check-in calls during the three months; and"),
        b("access to its daily group mentoring sessions during the three months."),
        p(
          "2.5  The three months start when the learner begins working as a personal trainer and asks to start, and must be available to the learner for at least 12 months after the learner achieves the Qualification. The Mentor Partner shall hold the introduction call within 14 days of the learner’s request."
        ),
        p(
          "2.6  If learner numbers grow beyond what the Mentor Partner can deliver to the standard in Clause 2.4, it shall tell PT Launch Lab promptly and the parties will agree how to manage enrolments. The Mentor Partner shall not reduce what is in Clause 2.4 for any learner who has already bought the Package."
        ),
      ],
    },

    {
      number: "3",
      title: "Commission",
      blocks: [
        p(
          `3.1  PT Launch Lab shall pay the Mentor Partner ${PACKAGE_COMMISSION_LABEL} for each learner who buys the Package through the Mentor Partner’s page (a “Package Sale”). The amount is inclusive of VAT, if any, and covers the Mentoring and the Mentor Partner’s marketing of the Package.`
        ),
        p(
          "3.2  A Package Sale is identified by PT Launch Lab’s checkout records for the Mentor Partner’s page. PT Launch Lab’s partner portal shows each Package Sale and its status."
        ),
        p(
          "3.3  Commission on a Package Sale is released when the learner’s 14-day cooling-off period ends without the learner cancelling, and paid by bank transfer, to the account the Mentor Partner sets in the partner portal, within 7 days of release."
        ),
        p(
          "3.4  No commission is due on a sale cancelled within the cooling-off period. If a learner is refunded after commission has been paid, the commission on that enrolment is returned, by deduction from later payments or by repayment within 30 days."
        ),
        p(
          "3.5  The Qualification’s delivery costs, awarding body fees and payment processing fees are PT Launch Lab’s and are never deducted from commission. The Mentor Partner bears its own costs, including the Mentoring, its marketing and any fee it pays others under Clause 6."
        ),
      ],
    },

    {
      number: "4",
      title: "The Mentor Partner’s Commitment",
      blocks: [
        p(
          "4.1  The Mentor Partner offers learners this commitment: “If you don’t earn back your investment within your first three months as a PT, we continue mentoring you for free until you do” (the “Commitment”)."
        ),
        p(
          "4.2  The Commitment is given by the Mentor Partner alone and is delivered only as further Mentoring, at the Mentor Partner’s cost. It never entitles a learner to a refund of any part of the Package price from PT Launch Lab."
        ),
        p(
          "4.3  The Commitment applies on the terms in Schedule 1, which PT Launch Lab publishes alongside it. Any statement of the Commitment shall refer to those terms and shall not imply guaranteed employment, clients or income. Changes to Schedule 1 must be agreed by both parties in writing and apply only to learners who buy after the change."
        ),
      ],
    },

    {
      number: "5",
      title: "Marketing & Representing PT Launch Lab",
      blocks: [
        p(
          "5.1  The Mentor Partner shall describe the Qualification only in wording PT Launch Lab has provided or approved, including the awarding body, regulated status and centre number."
        ),
        p("5.2  The Mentor Partner shall not:"),
        b("promise or guarantee earnings, client numbers, employment or business results, other than the Commitment on its Schedule 1 terms;"),
        b("advertise or mention credit, finance, “pay later”, “interest-free” or instalment options, or name any payment provider;"),
        b("use testimonials or results unless they are genuine, the person has consented, and the claim can be evidenced;"),
        b("set up a stand or promote in any gym, college or other venue without the operator’s permission; or"),
        b("enter into any commitment, or incur any cost, on PT Launch Lab’s behalf."),
        p(
          "5.3  The Mentor Partner’s advertising shall comply with the CAP Code and consumer protection law. PT Launch Lab may ask for any advertisement using its name or the Qualification to be changed or withdrawn, and the Mentor Partner shall do so within 48 hours."
        ),
      ],
    },

    {
      number: "6",
      title: "Introductions & Referral Fees",
      blocks: [
        p(
          "Any fee the Mentor Partner offers others for introductions, such as gym managers, is its own arrangement, paid from its own commission. The Mentor Partner is responsible for making sure each such person has their employer’s approval and that the arrangement is lawful and agreed in writing."
        ),
      ],
    },

    {
      number: "7",
      title: "Exclusivity",
      blocks: [
        p(
          "7.1  During the term of this Agreement, the Mentor Partner shall not, directly or indirectly, promote, or enter into any partnership, referral or white-label arrangement with, any other provider of personal training or gym instructing courses or qualifications in the United Kingdom."
        ),
        p("7.2  Nothing in Clause 7.1 restricts the Mentor Partner from:"),
        b("running its own mentoring business, and working with any personal trainer who comes to it directly and not through another course or qualification provider;"),
        b("creating and publishing its own content, podcasts or educational material under its own name."),
        p(
          "7.3  This Agreement does not restrict PT Launch Lab from working with other mentors or partners. The restriction in Clause 7.1 lasts only for the term of this Agreement and goes no further than is reasonable to protect PT Launch Lab’s business."
        ),
      ],
    },

    {
      number: "8",
      title: "Learner Data (UK GDPR)",
      blocks: [
        p("8.1  Both parties shall comply with the UK GDPR and the Data Protection Act 2018."),
        p(
          "8.2  PT Launch Lab is the controller of the personal data of learners who buy the Package. When the Mentor Partner receives or handles that data to deliver the Mentoring and the Commitment, it does so as PT Launch Lab’s processor."
        ),
        p(
          "8.3  PT Launch Lab will share only what the Mentoring needs: normally a learner’s name, email address and phone number. The Mentor Partner shall:"
        ),
        b("use the data only to deliver the Mentoring and the Commitment, and only on PT Launch Lab’s documented instructions, including this Agreement;"),
        b("not use the data for its own or anyone else’s marketing unless a learner separately gives the Mentor Partner their own consent directly;"),
        b("not sell, share or disclose the data to anyone else, or put it into any tool other than the calendar, video-call, messaging and group-session tools it uses to deliver the Mentoring, without PT Launch Lab’s written consent;"),
        b("limit access to the data to the person signing this Agreement and anyone else PT Launch Lab approves in writing, and ensure anyone with access is bound by confidentiality;"),
        b("keep the data secure, with password-protected devices and accounts using two-factor sign-in;"),
        b("not transfer the data outside the UK without adequate safeguards under the UK GDPR;"),
        b("tell PT Launch Lab within 24 hours of becoming aware of any loss, leak or misuse of learner data;"),
        b("pass to PT Launch Lab straight away any request from a learner to see, correct or delete their data, or to stop being contacted, and stop contacting a learner who asks; and"),
        b("help PT Launch Lab respond to regulatory enquiries and breaches, and provide the information it reasonably needs to show these obligations are met."),
        p(
          "8.4  When a learner’s Mentoring (including any under the Commitment) ends, when this Agreement ends, or earlier on PT Launch Lab’s written request, the Mentor Partner shall delete that learner’s data received from PT Launch Lab within 14 days and confirm by email that it has done so."
        ),
        p(
          "8.5  Where a learner chooses to become a paying client of the Mentor Partner beyond the Package, the Mentor Partner may keep the details that learner gives it for that relationship, as its own controller and under its own privacy notice."
        ),
      ],
    },

    {
      number: "9",
      title: "Confidentiality",
      blocks: [
        p(
          "9.1  Each party shall keep confidential any information about the other’s business, learners, pricing, systems and plans that it receives under this Agreement, and use it only for the purposes of this Agreement."
        ),
        p(
          "9.2  This does not apply to information that is already public, that the receiving party already lawfully held, or that must be disclosed by law, a court, or a regulatory or awarding body."
        ),
      ],
    },

    {
      number: "10",
      title: "Brand & Materials",
      blocks: [
        p(
          "10.1  During the term, each party may use the other’s name, logo and the materials the other supplies, including the Mentor Partner’s photographs, story and client results, to market the Package. Each party keeps ownership of its own methods, materials and brand."
        ),
        p(
          "10.2  The Mentor Partner confirms that every person shown in the client results it supplies has consented to their use, and that each result is genuine and can be evidenced."
        ),
      ],
    },

    {
      number: "11",
      title: "Complaints",
      blocks: [
        p(
          "PT Launch Lab handles complaints about the Qualification. The Mentor Partner handles complaints about the Mentoring and the Commitment in the first instance and keeps PT Launch Lab informed. As the seller of the Package, PT Launch Lab has the final say on how any learner complaint is resolved."
        ),
      ],
    },

    {
      number: "12",
      title: "Independent Contractor",
      blocks: [
        p(
          "The Mentor Partner is an independent contractor, not an employee, worker or agent of PT Launch Lab. It is responsible for its own tax, National Insurance and insurance, including professional indemnity insurance for the Mentoring, and decides how and when it delivers its work, within this Agreement."
        ),
      ],
    },

    {
      number: "13",
      title: "Term & Termination",
      blocks: [
        p(
          "13.1  This Agreement starts on the date signed and continues until ended under this clause. There is no minimum term."
        ),
        p("13.2  Either party may end this Agreement at any time by giving 30 days’ written notice."),
        p(
          "13.3  Either party may end it immediately by written notice if the other materially breaches Clause 4, 5, 7 or 8, or becomes insolvent or ceases to trade."
        ),
        p(
          "13.4  When this Agreement ends, the Mentor Partner shall still deliver the Mentoring, and honour the Commitment, for every learner who bought the Package before the end date, and commission on those sales remains payable under Clause 3. If the Mentor Partner does not, PT Launch Lab may arrange equivalent mentoring for those learners and recover its reasonable cost from commission due or by invoice."
        ),
        p(
          "13.5  When it ends, PT Launch Lab will take down or redirect the Mentor Partner’s page, and the Mentor Partner shall stop marketing the Package and describing itself as PT Launch Lab’s partner."
        ),
        p("13.6  Clauses 3, 4.2, 8, 9, 11, 13.4 and 14, and Schedule 1, survive termination."),
      ],
    },

    {
      number: "14",
      title: "General",
      blocks: [
        p(
          `14.1  Notices — notices must be in writing and may be sent by email: to PT Launch Lab at info@ptlaunchlab.co.uk, and to the Mentor Partner at ${repEmail}. Email notice is deemed given on the next business day.`
        ),
        p(
          "14.2  Neither party may assign this Agreement without the other’s written consent. A person who is not a party has no right to enforce it under the Contracts (Rights of Third Parties) Act 1999."
        ),
        p(
          "14.3  This Agreement is the entire agreement between the parties on its subject. Changes must be in writing and agreed by both parties."
        ),
        p(
          "14.4  If any provision is found unenforceable, it applies with the minimum change needed to make it enforceable, and the rest continues in force."
        ),
        p(
          "14.5  This Agreement may be signed electronically, and a drawn or typed electronic signature has the same effect as a handwritten one."
        ),
        p(
          "14.6  This Agreement is governed by the laws of England & Wales, and the courts of England & Wales have exclusive jurisdiction."
        ),
      ],
    },

    {
      number: "Schedule 1",
      title: "The Commitment Terms",
      blocks: COMMITMENT_TERMS.map((t) => p(`${t.title}: ${t.text}`)),
    },
  ];
}
