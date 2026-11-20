/**
 * SINGLE SOURCE OF TRUTH for the Accountancy Package Partner Agreement.
 *
 * For an accountant who SELLS a combined package (our NCFE Level 2 & 3 plus
 * their own business launch accountancy services) from their own page, pay in
 * full only, for a flat commission per learner. First written for The Fitness
 * Accountant (Jay Johnston, Belfast), Nov 2026. Modelled on
 * mentorPackageAgreement.ts (PT Mentor Hub), with three differences:
 *   - no Commitment / Schedule 1: Jay's page makes no earn-back promise;
 *   - professional standards (Clause 4): the accountancy is the Partner's own
 *     regulated service under its own engagement letter, with its own AML
 *     checks and insurance, and PT Launch Lab gives no tax advice;
 *   - learner data: PT Launch Lab's contact details are processed for us, but
 *     what a learner gives the Partner for the accountancy is the Partner's own
 *     (it has legal record-keeping duties as an accountant).
 *
 * The on-screen agreement at /mentor-partnership/accountancy/sign and the
 * signed PDF render from this file.
 *
 * VERSIONING: bump ACCOUNTANCY_PACKAGE_AGREEMENT_VERSION whenever the legal
 * text changes.
 *
 *   v1.0 2026-11-20  first version, written for The Fitness Accountant.
 */

import type { Block, Clause } from "./partnershipAgreement";
import type { MentorAgreementParties } from "./mentorPartnerAgreement.ts";
import { PACKAGE_COMMISSION_LABEL, PACKAGE_PRICE_LABEL } from "./mentorPackageAgreement.ts";

export const ACCOUNTANCY_PACKAGE_AGREEMENT_VERSION = "1.0";

export const ACCOUNTANCY_PACKAGE_AGREEMENT_SUMMARY =
  "package sold pay in full only at £999.99 · £500 per learner, released when the 14-day cooling-off ends, paid within 7 days · the accountancy is the partner's own regulated service, no earnings or tax-saving promises · exclusive among PT course providers · contact data as processor";

const p = (text: string): Block => ({ kind: "p", text });
const b = (text: string): Block => ({ kind: "bullet", text });

/** Shown above the agreement and positively acknowledged before signing. */
export const ACCOUNTANCY_PACKAGE_KEY_TERMS_FOR_ACKNOWLEDGEMENT = [
  {
    clause: "Clause 2",
    title: "The package",
    detail: `PT Launch Lab sells the package (our NCFE Level 2 & 3 plus your Business Launch Package) through its own checkout on your page, at ${PACKAGE_PRICE_LABEL} paid in full. No monthly or instalment plan unless we both agree it in writing. You deliver the Business Launch Package to every learner who buys, once they qualify.`,
  },
  {
    clause: "Clause 3",
    title: "Your commission",
    detail: `${PACKAGE_COMMISSION_LABEL} for every learner who buys through your page. It is released when the learner's 14-day cooling-off period ends and paid to your bank within 7 days of release. No delivery costs come out of it. If a learner is refunded, the commission on that enrolment is returned.`,
  },
  {
    clause: "Clause 4",
    title: "Your professional service",
    detail: "The accountancy is your own service, under your own engagement letter, ID and anti-money-laundering checks, professional rules and insurance. PT Launch Lab gives no tax or accounting advice and isn't responsible for yours.",
  },
  {
    clause: "Clauses 5 & 7",
    title: "Marketing and exclusivity",
    detail: "No promises of earnings, clients, jobs or tax savings, and never advertise payment plans, finance or 'pay later'. While this agreement runs, you don't promote or partner with any other PT course provider. Your accountancy practice is unaffected.",
  },
  {
    clause: "Clause 8",
    title: "Learner data",
    detail: "The contact details we share are ours: use them only to start the learner's Business Launch Package, keep them secure and tell us within 24 hours of any breach. What a learner gives you for the accountancy itself is yours, under your own privacy notice.",
  },
];

/** The sentence recorded in the signed PDF as evidence of fair notice. */
export const ACCOUNTANCY_PACKAGE_ACK_NOTE =
  "Clause 2 (the package), Clause 3 (commission), Clause 4 (professional service), Clauses 5 and 7 (marketing and exclusivity) and Clause 8 (learner data)";

export function buildAccountancyPackageAgreementClauses(party: MentorAgreementParties): Clause[] {
  const { businessName, companyNumber, address, repName, repEmail, signedDate } = party;
  // Jay is in Belfast: a company may be registered in Northern Ireland, so the
  // jurisdiction of registration isn't assumed.
  const identity = companyNumber.trim()
    ? `${businessName}, a company registered in the United Kingdom (Company No: ${companyNumber.trim()}), whose registered office is at ${address}`
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
        p(`(2)  ${identity} (“the Partner”)`),
      ],
    },

    {
      number: "2",
      title: "The Package",
      blocks: [
        p("2.1  The parties sell one combined package (the “Package”), made up of:"),
        b("the NCFE Level 2 Certificate in Gym Instructing and Level 3 Diploma in Personal Training, delivered by PT Launch Lab (the “Qualification”); and"),
        b("the Partner’s Business Launch Package, delivered by the Partner (the “Business Launch Package”)."),
        p(
          `2.2  The Package is sold only through PT Launch Lab’s checkout on the Partner’s page on PT Launch Lab’s website, at ${PACKAGE_PRICE_LABEL} paid in full. No monthly or instalment plan is offered for the Package unless both parties agree it in writing. PT Launch Lab sets the price and may change it on 30 days’ written notice.`
        ),
        p(
          "2.3  PT Launch Lab is the seller of the Package to the learner and takes payment. It is responsible for the Qualification, assessment, learner administration, the learner’s cooling-off rights and refunds, and customer service about the course."
        ),
        p("2.4  The Partner shall provide each learner who buys the Package with:"),
        b("a personalised consultation about the learner’s circumstances and business plans;"),
        b("guidance on setting up their business correctly, including whether to trade as a sole trader or a limited company;"),
        b("registration with HMRC for self-employment;"),
        b("guidance on the business expenses they can legitimately claim;"),
        b("guidance on bookkeeping and keeping financial records;"),
        b("guidance on tax and National Insurance, including how much to set aside;"),
        b("preparation and submission of their first Self Assessment tax return as a personal trainer; and"),
        b("personalised financial education on managing their business."),
        p(
          "2.5  The Business Launch Package starts when the learner has achieved the Qualification and asks to start, and must be available to the learner for at least 12 months after the learner achieves the Qualification. The Partner shall hold the consultation within 14 days of the learner’s request. The first Self Assessment return is the one covering the tax year in which the learner starts self-employment as a personal trainer, and the Partner shall submit it by its filing deadline provided the learner has given the Partner the records it needs at least 30 days before that deadline."
        ),
        p(
          "2.6  For a learner who lives and works in the Republic of Ireland, the Partner shall provide the equivalent services for Revenue in place of HMRC, including registration for income tax and the learner’s first income tax return as a personal trainer."
        ),
        p(
          "2.7  Any service a learner wants beyond Clause 2.4, such as ongoing accountancy or business mentoring, is a separate arrangement between the learner and the Partner, at the Partner’s prices, and is not part of the Package. PT Launch Lab takes no share of it."
        ),
        p(
          "2.8  If learner numbers grow beyond what the Partner can deliver to the standard in Clause 2.4, it shall tell PT Launch Lab promptly and the parties will agree how to manage enrolments. The Partner shall not reduce what is in Clause 2.4 for any learner who has already bought the Package."
        ),
      ],
    },

    {
      number: "3",
      title: "Commission",
      blocks: [
        p(
          `3.1  PT Launch Lab shall pay the Partner ${PACKAGE_COMMISSION_LABEL} for each learner who buys the Package through the Partner’s page (a “Package Sale”). The amount is inclusive of VAT, if any, and covers the Business Launch Package and the Partner’s marketing of the Package.`
        ),
        p(
          "3.2  A Package Sale is identified by PT Launch Lab’s checkout records for the Partner’s page. PT Launch Lab’s partner portal shows each Package Sale and its status."
        ),
        p(
          "3.3  Commission on a Package Sale is released when the learner’s 14-day cooling-off period ends without the learner cancelling, and paid by bank transfer, to the account the Partner sets in the partner portal, within 7 days of release."
        ),
        p(
          "3.4  No commission is due on a sale cancelled within the cooling-off period. If a learner is refunded after commission has been paid, the commission on that enrolment is returned, by deduction from later payments or by repayment within 30 days."
        ),
        p(
          "3.5  The Qualification’s delivery costs, awarding body fees and payment processing fees are PT Launch Lab’s and are never deducted from commission. The Partner bears its own costs, including the Business Launch Package, its marketing and any fee it pays others under Clause 6."
        ),
      ],
    },

    {
      number: "4",
      title: "The Partner’s Professional Service",
      blocks: [
        p(
          "4.1  The Business Launch Package is the Partner’s own professional service. The Partner shall deliver it with reasonable skill and care, under its own engagement letter with each learner, and in line with the law and the rules of any professional or supervisory body it belongs to."
        ),
        p(
          "4.2  The Partner is responsible for the identity and anti-money-laundering checks the law requires before acting for a learner, and confirms it is supervised for anti-money-laundering purposes as the law requires and holds professional indemnity insurance for its services."
        ),
        p(
          "4.3  If the Partner cannot lawfully act for a learner, it shall tell PT Launch Lab within 7 days of finding out. PT Launch Lab will then offer the learner a refund of " +
            PACKAGE_COMMISSION_LABEL +
            " for the Business Launch Package, and the commission on that enrolment is not payable, or is returned under Clause 3.4."
        ),
        p(
          "4.4  PT Launch Lab does not give tax, accounting or financial advice and is not responsible for the Partner’s advice or services. The Partner shall not present its advice as PT Launch Lab’s."
        ),
      ],
    },

    {
      number: "5",
      title: "Marketing & Representing PT Launch Lab",
      blocks: [
        p(
          "5.1  The Partner shall describe the Qualification only in wording PT Launch Lab has provided or approved, including the awarding body, regulated status and centre number."
        ),
        p("5.2  The Partner shall not:"),
        b("promise or guarantee earnings, client numbers, employment, business results or tax savings;"),
        b("advertise or mention credit, finance, “pay later”, “interest-free” or instalment options, or name any payment provider;"),
        b("use testimonials or results unless they are genuine, the person has consented, and the claim can be evidenced;"),
        b("set up a stand or promote in any gym, college or other venue without the operator’s permission; or"),
        b("enter into any commitment, or incur any cost, on PT Launch Lab’s behalf."),
        p(
          "5.3  The Partner’s advertising shall comply with the CAP Code and consumer protection law. PT Launch Lab may ask for any advertisement using its name or the Qualification to be changed or withdrawn, and the Partner shall do so within 48 hours."
        ),
      ],
    },

    {
      number: "6",
      title: "Introductions & Referral Fees",
      blocks: [
        p(
          "Any fee the Partner offers others for introductions, such as gym managers, is its own arrangement, paid from its own commission. The Partner is responsible for making sure each such person has their employer’s approval and that the arrangement is lawful and agreed in writing."
        ),
      ],
    },

    {
      number: "7",
      title: "Exclusivity",
      blocks: [
        p(
          "7.1  During the term of this Agreement, the Partner shall not, directly or indirectly, promote, or enter into any partnership, referral or white-label arrangement with, any other provider of personal training or gym instructing courses or qualifications in the United Kingdom or the Republic of Ireland."
        ),
        p("7.2  Nothing in Clause 7.1 restricts the Partner from:"),
        b("running its own accountancy practice, and acting for any client, including personal trainers who come to it directly and not through another course or qualification provider;"),
        b("creating and publishing its own content, podcasts or educational material under its own name."),
        p(
          "7.3  This Agreement does not restrict PT Launch Lab from working with other partners. The restriction in Clause 7.1 lasts only for the term of this Agreement and goes no further than is reasonable to protect PT Launch Lab’s business."
        ),
      ],
    },

    {
      number: "8",
      title: "Learner Data (UK GDPR)",
      blocks: [
        p("8.1  Both parties shall comply with the UK GDPR and the Data Protection Act 2018."),
        p(
          "8.2  PT Launch Lab is the controller of the personal data of learners who buy the Package. PT Launch Lab will share only what the Partner needs to contact the learner and start the Business Launch Package: normally a learner’s name, email address and phone number. The Partner handles that data as PT Launch Lab’s processor and shall:"
        ),
        b("use it only to contact the learner about, and start, their Business Launch Package, and only on PT Launch Lab’s documented instructions, including this Agreement;"),
        b("not use it for its own or anyone else’s marketing unless a learner separately gives the Partner their own consent directly;"),
        b("not sell, share or disclose it to anyone else without PT Launch Lab’s written consent;"),
        b("limit access to it to the person signing this Agreement and the Partner’s staff who need it, and ensure anyone with access is bound by confidentiality;"),
        b("keep it secure, with password-protected devices and accounts using two-factor sign-in;"),
        b("not transfer it outside the UK without adequate safeguards under the UK GDPR;"),
        b("tell PT Launch Lab within 24 hours of becoming aware of any loss, leak or misuse of it; and"),
        b("pass to PT Launch Lab straight away any request from a learner about that data, and stop contacting a learner who asks."),
        p(
          "8.3  When a learner engages the Partner under its engagement letter, the information the learner gives the Partner to deliver the Business Launch Package, and any further services, is held by the Partner as its own controller, under its own privacy notice and its legal and professional record-keeping duties."
        ),
        p(
          "8.4  If a learner has not engaged the Partner within 12 months of achieving the Qualification, when this Agreement ends, or earlier on PT Launch Lab’s written request, the Partner shall delete the data it received from PT Launch Lab for any learner who has not engaged it, within 14 days, and confirm by email that it has done so."
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
          "9.2  This does not apply to information that is already public, that the receiving party already lawfully held, or that must be disclosed by law, a court, or a regulatory, supervisory or awarding body."
        ),
      ],
    },

    {
      number: "10",
      title: "Brand & Materials",
      blocks: [
        p(
          "10.1  During the term, each party may use the other’s name, logo and the materials the other supplies, including the Partner’s photographs and story, to market the Package. Each party keeps ownership of its own methods, materials and brand."
        ),
        p(
          "10.2  The Partner confirms that any client result or testimonial it supplies is genuine, can be evidenced, and is used with the client’s consent."
        ),
      ],
    },

    {
      number: "11",
      title: "Complaints",
      blocks: [
        p(
          "PT Launch Lab handles complaints about the Qualification. The Partner handles complaints about the Business Launch Package under its own complaints procedure and professional rules, and keeps PT Launch Lab informed. As the seller of the Package, PT Launch Lab has the final say on any refund of the Package price."
        ),
      ],
    },

    {
      number: "12",
      title: "Independent Contractor",
      blocks: [
        p(
          "The Partner is an independent contractor, not an employee, worker or agent of PT Launch Lab. It is responsible for its own tax, National Insurance and insurance, and decides how and when it delivers its work, within this Agreement."
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
          "13.4  When this Agreement ends, the Partner shall still deliver the Business Launch Package to every learner who bought the Package before the end date, and commission on those sales remains payable under Clause 3. If the Partner does not, PT Launch Lab may arrange equivalent services for those learners and recover its reasonable cost from commission due or by invoice."
        ),
        p(
          "13.5  When it ends, PT Launch Lab will take down or redirect the Partner’s page, and the Partner shall stop marketing the Package and describing itself as PT Launch Lab’s partner."
        ),
        p("13.6  Clauses 3, 4, 8, 9, 11, 13.4 and 14 survive termination."),
      ],
    },

    {
      number: "14",
      title: "General",
      blocks: [
        p(
          `14.1  Notices — notices must be in writing and may be sent by email: to PT Launch Lab at info@ptlaunchlab.co.uk, and to the Partner at ${repEmail}. Email notice is deemed given on the next business day.`
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
  ];
}
