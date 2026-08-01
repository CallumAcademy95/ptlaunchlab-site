/**
 * SINGLE SOURCE OF TRUTH for the Gym Partnership Agreement.
 *
 * Both the on-screen agreement at /gym-partnership/sign and the signed PDF that
 * gets emailed to the partner are rendered from this file. Nothing else may
 * carry clause text.
 *
 * WHY: up to v2.0 the sign page rendered its own hard-coded clause array while
 * the PDF generator carried a completely different document. A gym read a
 * "guaranteed interview" agreement whose Clause 6 said no fees were payable in
 * either direction, then received a PDF containing the £500 commission, a
 * clawback and a 12-month non-circumvention restraint it had never seen. Terms
 * that onerous are not incorporated unless the signer had fair notice of them
 * before signing, so the clauses that protect PT Launch Lab were the ones most
 * at risk — while the clause the gym actually saw contradicted the £500 the
 * landing page promises. This module exists so the two can never drift again.
 *
 * VERSIONING: bump PARTNERSHIP_AGREEMENT_VERSION whenever the legal text
 * changes and stamp it onto the partner record. Partners stay on the terms they
 * actually signed — they are never moved to a new version retroactively.
 *
 *   v1.0            original terms, commission released 30 days after enrolment.
 *                   8 partners signed this (pp_partners.commission_terms =
 *                   'on_enrolment'). Leave them alone.
 *   v2.0 2026-07-27 instalment-2 commission hold + clawback. PDF only — never
 *                   shown on screen. See the WHY note above.
 *   v3.0 2026-08-01 screen and PDF unified on this file. £500 stated inclusive
 *                   of VAT; "successfully enrolled learner" defined; fee-change
 *                   notice period; liability cap with the UCTA carve-out;
 *                   non-circumvention narrowed to learner non-solicitation and
 *                   misuse of confidential information, with an express carve-out
 *                   for the gym employing or renting to its own trainers; notices,
 *                   assignment, force majeure, third-party rights, severability,
 *                   waiver and electronic-execution clauses added.
 *
 * Commission RELEASE MECHANICS are unchanged between v2.0 and v3.0, so v3.0
 * signers keep commission_terms = 'instalment_2'. No migration is needed.
 */

export const PARTNERSHIP_AGREEMENT_VERSION = "3.0";

/** Short label for the admin email / partner record. */
export const PARTNERSHIP_AGREEMENT_SUMMARY =
  "unified screen+PDF terms · £500 inc. VAT · instalment-2 hold + clawback · narrowed non-circumvention";

/** The referral fee, in pence. Mirrors pp_partners.fee_per_learner_pence. */
export const DEFAULT_FEE_PER_LEARNER_PENCE = 50_000;

// ─── Document model ───────────────────────────────────────────────────────────

export type Block =
  | { kind: "p"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "sub"; text: string };

export interface Clause {
  number: string;
  title: string;
  blocks: Block[];
}

export interface AgreementParties {
  /** Gym name with " Ltd" already appended where appropriate. */
  gymFullName: string;
  companyNumber: string;
  registeredAddress: string;
  /** Partner's contact email — used in the Notices clause. */
  repEmail: string;
  /** Pre-formatted, e.g. "1 August 2026". */
  signedDate: string;
}

const p = (text: string): Block => ({ kind: "p", text });
const b = (text: string): Block => ({ kind: "bullet", text });
const s = (text: string): Block => ({ kind: "sub", text });

/**
 * Clauses the signer must positively acknowledge before the signature is
 * accepted. These are the terms a court would expect to have been drawn to the
 * signer's attention: the ones that take money back off the partner or restrict
 * what it may do. Surfaced in the UI acknowledgement and recorded on submit.
 */
export const KEY_TERMS_FOR_ACKNOWLEDGEMENT = [
  {
    clause: "Clause 5",
    title: "£500 per learner, inclusive of VAT",
    detail:
      "You are paid £500 for each learner who enrols through your gym. That figure is inclusive of VAT — nothing is added on top.",
  },
  {
    clause: "Clause 5.4",
    title: "When the money is released",
    detail:
      "If the learner pays in full, commission is paid 30 days after enrolment. If they are on an instalment plan, it is held until their second instalment clears, then paid 30 days after that. You can see accrued and released commission in the partner portal at any time.",
  },
  {
    clause: "Clauses 5.8–5.9",
    title: "Clawback on refunds and chargebacks",
    detail:
      "If a learner is refunded, cancels, or their payment is reversed after you have been paid, the commission on that enrolment is repayable. We normally recover it by offsetting against your next commission.",
  },
  {
    clause: "Clause 14",
    title: "Learner non-solicitation",
    detail:
      "During the partnership and for 6 months after it ends, you agree not to sell competing PT education or certification to learners we introduced. This does not stop you employing them, renting them floor space, or running your own gym however you like.",
  },
];

// ─── The Agreement ────────────────────────────────────────────────────────────

export function buildAgreementClauses(party: AgreementParties): Clause[] {
  const { gymFullName, companyNumber, registeredAddress, repEmail, signedDate } = party;

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
        p(
          `(2)  ${gymFullName}, a company registered in England & Wales (Company No: ${companyNumber}), whose registered office is at ${registeredAddress} (“Partner Gym”)`
        ),
      ],
    },

    {
      number: "2",
      title: "Purpose",
      blocks: [
        p(
          "2.1  This Agreement governs the relationship between PT Launch Lab and the Partner Gym in respect of the provision of a white-label personal training academy solution."
        ),
        p(
          "2.2  The Partner Gym shall act solely as a distribution and referral partner, and shall not be responsible for delivery, education, compliance, or qualification of learners."
        ),
        p(
          "2.3  In summary, and without limiting the clauses that follow: PT Launch Lab builds and runs a personal training academy under the Partner Gym’s branding at no cost to the Partner Gym, the Partner Gym promotes it to its members and network, and PT Launch Lab pays the Partner Gym a fee for each learner who enrols through it. The detailed terms are set out below and prevail over this summary."
        ),
      ],
    },

    {
      number: "3",
      title: "Services Provided by PT Launch Lab",
      blocks: [
        p("3.1  PT Launch Lab shall provide, at no cost to the Partner Gym:"),
        b("End-to-end PT education (Level 2 & Level 3 or equivalent)"),
        b("Mentorship and support for enrolled learners"),
        b("Learner onboarding, screening, and communication"),
        b("Compliance and quality assurance, and management of the awarding body relationship"),
        b("Access to the PT Launch Lab partner portal, showing referrals, enrolments and commission"),
        b("White-label branding including:"),
        s("A branded academy landing page"),
        s("A unique tracking URL"),
        s("QR codes"),
        s("Gym-branded marketing materials"),
        p(
          "3.2  Set-up — PT Launch Lab shall make the Partner Gym’s branded academy page, unique tracking URL and QR code available within 14 days of the later of (a) the date of this Agreement and (b) the date the Partner Gym supplies its logo and brand assets."
        ),
        p(
          "3.3  Reporting — PT Launch Lab shall record each valid referral and enrolment in the partner portal, and shall keep the Partner Gym’s accrued, released and paid commission visible there."
        ),
        p(
          "3.4  The Partner Gym shall not be required to provide staffing, administration, or operational support, and shall pay no fee, subscription or charge to PT Launch Lab under this Agreement."
        ),
        p(
          "3.5  PT Launch Lab retains full responsibility for course delivery, learner outcomes, regulatory compliance and its relationship with the awarding organisation."
        ),
        p(
          "3.6  No volume guarantee — PT Launch Lab does not guarantee that any particular number of learners will enrol through the Partner Gym, and gives no warranty as to the revenue the Partner Gym will earn under this Agreement."
        ),
      ],
    },

    {
      number: "4",
      title: "Referrals, Attribution & Tracking",
      blocks: [
        p("4.1  All learner referrals shall be tracked via:"),
        b("Unique tracking URLs"),
        b("QR codes"),
        b("Partner-specific promotional codes"),
        b("Assigned digital attribution systems"),
        p("4.2  A referral shall be deemed valid where a learner:"),
        b("Registers via the Partner Gym’s unique tracking mechanism or promotional code; and"),
        b("Enrols within 90 days of that first registration"),
        p(
          "4.3  Successfully enrolled learner — for the purposes of Clause 5, a learner is “successfully enrolled” where that learner has (a) been validly referred under Clause 4.2; (b) completed PT Launch Lab’s enrolment process; and (c) either paid the course fee in full or paid the required deposit and entered into a written instalment agreement with PT Launch Lab."
        ),
        p(
          "4.4  Attribution — where a learner cannot be attributed to a single partner, or could be attributed to more than one, PT Launch Lab shall determine attribution acting reasonably and in good faith, and shall record its determination in the partner portal."
        ),
        p(
          "4.5  Queries — the Partner Gym may query any referral, enrolment or commission record by written notice within 30 days of it appearing in the partner portal. PT Launch Lab shall respond within 14 days. Records not queried within that period shall be taken as agreed, save in the case of manifest error."
        ),
      ],
    },

    {
      number: "5",
      title: "Payment Terms",
      blocks: [
        p(
          "5.1  Fee — PT Launch Lab shall pay the Partner Gym £500 for each successfully enrolled learner (the “Fee”), as defined in Clause 4.3."
        ),
        p(
          "5.2  VAT — the Fee is inclusive of VAT and of any other tax or duty. Where the Partner Gym is registered for VAT, the Fee shall be treated as VAT-inclusive and the Partner Gym shall be responsible for accounting to HM Revenue & Customs for any VAT due on it. No amount is payable by PT Launch Lab in addition to the Fee."
        ),
        p(
          "5.3  Change to the Fee — PT Launch Lab may vary the Fee for future referrals by giving the Partner Gym not less than 30 days’ written notice. Any variation applies only to learners who enrol after that notice period expires, and does not affect commission already accrued. The Partner Gym may terminate under Clause 12.2 if it does not accept a variation."
        ),
        p(
          "5.4  Accrual and release — commission accrues on the date a valid referral becomes a successfully enrolled learner. Accrued commission shall become payable:"
        ),
        b(
          "Where the learner pays the course fee in full at the point of enrolment: 30 days after enrolment and payment confirmation; or"
        ),
        b(
          "Where the learner enrols on a deposit and instalment plan: 30 days after the second scheduled instalment has been successfully collected"
        ),
        p(
          "5.5  The Partner Gym may view its accrued and released commission at any time via the PT Launch Lab partner portal. Commission shown as accrued is not payable until released in accordance with Clause 5.4."
        ),
        p("5.6  All payments shall be made:"),
        b("To the bank account details supplied in writing by the Partner Gym"),
        b("By bank transfer unless otherwise agreed"),
        b("With a remittance statement identifying the learners to which the payment relates"),
        p("5.7  PT Launch Lab reserves the right to withhold payment where:"),
        b(
          "A refund has been issued, or a cancellation, payment reversal or chargeback has occurred; or"
        ),
        b("Fraudulent or invalid enrolment is identified"),
        p(
          "5.8  Clawback — where commission has already been paid in respect of a learner who is subsequently refunded, who cancels within any statutory cooling-off period, or whose payment is reversed or charged back, the Partner Gym shall repay the corresponding commission. Where the learner is refunded in part, the sum repayable shall be reduced in the same proportion as the refund bears to the total course fee."
        ),
        p(
          "5.9  PT Launch Lab may recover any sum due under Clause 5.8 by offsetting it against commission otherwise payable to the Partner Gym, and shall notify the Partner Gym in writing of any offset applied. Where no further commission is expected to become payable within 60 days, the Partner Gym shall repay the sum within 30 days of written demand."
        ),
        p(
          "5.10  Late payment — where PT Launch Lab fails to pay released commission by its due date, the Partner Gym may charge interest and recover its costs in accordance with the Late Payment of Commercial Debts (Interest) Act 1998."
        ),
        p(
          "5.11  Records — PT Launch Lab shall keep accurate records of referrals, enrolments and commission for six years, and shall on reasonable written request (no more than twice in any 12-month period) provide the Partner Gym with a statement of the referrals and commission relating to it."
        ),
      ],
    },

    {
      number: "6",
      title: "Intellectual Property",
      blocks: [
        p(
          "6.1  Ownership — all Intellectual Property Rights in and to training materials, course content, systems, processes, frameworks, marketing assets, technology platforms, and branding concepts (excluding the Partner Gym’s own brand) shall remain the sole and exclusive property of PT Launch Lab."
        ),
        p(
          "6.2  Licence to the Partner Gym — PT Launch Lab grants the Partner Gym a non-exclusive, non-transferable, revocable licence to use PT Launch Lab materials solely for the purpose of promoting the partnership."
        ),
        p(
          "6.3  Licence to PT Launch Lab — the Partner Gym grants PT Launch Lab a non-exclusive, royalty-free, revocable licence to use the Partner Gym’s name, logo and brand assets solely for the purpose of producing and operating the white-label academy and promoting the partnership. PT Launch Lab shall seek the Partner Gym’s prior written approval before using any new branding or imagery not previously agreed."
        ),
        p("6.4  Restrictions — the Partner Gym shall not, without prior written consent:"),
        b("Copy, reproduce, modify, or distribute PT Launch Lab IP"),
        b("Create derivative works"),
        b("Reverse engineer systems or processes"),
        b("Use materials outside the scope of this Agreement"),
        b("Represent PT Launch Lab IP as its own"),
        p(
          "6.5  Post-termination — upon termination, the licences in Clauses 6.2 and 6.3 shall immediately cease. Each party must remove the other’s materials and branding, and the Partner Gym must cease use of the tracking URLs and QR codes and not hold itself out as affiliated with PT Launch Lab."
        ),
        p(
          "6.6  Injunctive relief — PT Launch Lab shall be entitled to seek injunctive relief for any breach of this clause, in addition to any other remedy available to it."
        ),
      ],
    },

    {
      number: "7",
      title: "Relationship of Parties",
      blocks: [
        p(
          "7.1  Nothing in this Agreement shall create a partnership in law, joint venture, agency, or employment relationship between the parties."
        ),
        p("7.2  The Partner Gym acts as an independent contractor."),
        p(
          "7.3  Neither party has authority to enter into commitments, incur liabilities, or make representations on behalf of the other."
        ),
      ],
    },

    {
      number: "8",
      title: "Liability",
      blocks: [
        p(
          "8.1  PT Launch Lab shall retain full responsibility for course delivery, compliance, and qualification standards."
        ),
        p(
          "8.2  The Partner Gym shall not be liable for educational outcomes, learner performance, or regulatory matters."
        ),
        p(
          "8.3  Neither party shall be liable to the other for any indirect or consequential loss, or for loss of profit, revenue, business, anticipated savings, goodwill, or business opportunity, however arising."
        ),
        p(
          "8.4  Subject to Clauses 8.5 and 8.6, each party’s total aggregate liability arising out of or in connection with this Agreement shall not exceed the greater of (a) £1,000 and (b) the total commission paid or payable to the Partner Gym under this Agreement in the 12 months preceding the event giving rise to the claim."
        ),
        p(
          "8.5  Nothing in this Agreement shall exclude or limit either party’s liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any other liability which cannot lawfully be excluded or limited."
        ),
        p(
          "8.6  Clause 8.4 does not limit PT Launch Lab’s obligation to pay commission properly due under Clause 5, or the Partner Gym’s obligation to repay commission under Clause 5.8."
        ),
      ],
    },

    {
      number: "9",
      title: "Confidentiality",
      blocks: [
        p(
          "9.1  Each party agrees to keep confidential all non-public information disclosed by the other in connection with this Agreement, including commercial terms, business processes, systems, and learner data, and not to disclose it to any third party without the other’s prior written consent."
        ),
        p("9.2  Clause 9.1 does not apply to information which:"),
        b("Is or becomes public other than through a breach of this Agreement"),
        b("Was lawfully in the receiving party’s possession before disclosure"),
        b("Is independently developed without reference to the disclosing party’s information"),
        b("Is required to be disclosed by law, a court, or a regulatory or awarding body"),
        p("9.3  This clause shall survive termination of this Agreement."),
      ],
    },

    {
      number: "10",
      title: "Data Protection (UK GDPR)",
      blocks: [
        p(
          "10.1  Both parties shall comply with the UK GDPR and the Data Protection Act 2018."
        ),
        p(
          "10.2  PT Launch Lab shall act as data controller for learner data. Each party acts as an independent controller in respect of personal data it determines the purposes and means of processing for; neither acts as processor for the other."
        ),
        p(
          "10.3  Personal data shared between the parties shall be limited to what is strictly necessary for the purposes of this Agreement, and handled in accordance with each party’s privacy notice."
        ),
        p(
          "10.4  Each party shall provide the other with reasonable assistance in responding to data subject requests, regulatory enquiries, and personal data breaches connected with this Agreement, and shall notify the other without undue delay of any breach affecting data shared under it."
        ),
      ],
    },

    {
      number: "11",
      title: "Non-Disparagement",
      blocks: [
        p(
          "Neither party shall make statements that damage the reputation of the other, or misrepresent the nature of the partnership."
        ),
      ],
    },

    {
      number: "12",
      title: "Term & Termination",
      blocks: [
        p(
          "12.1  This Agreement shall commence on the date signed and continue until terminated in accordance with this clause. There is no fixed end date and no minimum term."
        ),
        p(
          "12.2  Either party may terminate this Agreement at any time by giving 30 days’ written notice to the other party, without cause and without liability for doing so."
        ),
        p("12.3  Either party may terminate immediately on written notice if the other:"),
        b(
          "Materially breaches this Agreement and, where the breach is capable of remedy, fails to remedy it within 14 days of written notice requiring it to do so; or"
        ),
        b("Becomes insolvent, enters administration or liquidation, or ceases to trade"),
        p(
          "12.4  Termination shall not affect accrued payment rights or any obligation outstanding at the date of termination."
        ),
      ],
    },

    {
      number: "13",
      title: "Effect of Termination",
      blocks: [
        p(
          "13.1  Upon termination: the licences granted under Clauses 6.2 and 6.3 shall immediately cease; each party shall return or destroy the other’s confidential information; and the Partner Gym shall cease use of all tracking URLs, QR codes and PT Launch Lab branding."
        ),
        p(
          "13.2  Commission accrued before termination remains payable in accordance with Clause 5, including the release timing in Clause 5.4 and the clawback in Clauses 5.8 and 5.9, which continue to apply after termination."
        ),
        p(
          "13.3  Clauses 5.8, 5.9, 6, 8, 9, 10, 11, 14 and 17 to 24 survive termination."
        ),
      ],
    },

    {
      number: "14",
      title: "Non-Solicitation & Protection of Confidential Information",
      blocks: [
        p(
          "14.1  Learner non-solicitation — during the term of this Agreement and for 6 months following its termination, the Partner Gym shall not directly or indirectly solicit, or attempt to solicit, any learner introduced to it through this Agreement for the purpose of supplying that learner with personal training education, certification, or qualification services which compete with those PT Launch Lab supplies or has supplied to that learner."
        ),
        p(
          "14.2  Use of confidential information — during the term of this Agreement and for 6 months following its termination, the Partner Gym shall not use PT Launch Lab’s confidential information, systems, processes or materials to establish or operate a competing personal training education programme, or enable any third party to do so. This obligation restricts the use of PT Launch Lab’s confidential information and intellectual property only."
        ),
        p(
          "14.3  What this clause does not restrict — for the avoidance of doubt, and notwithstanding Clauses 14.1 and 14.2, nothing in this Agreement restricts the Partner Gym from:"
        ),
        b(
          "Employing, engaging, renting floor space to, or otherwise doing business with any learner in the ordinary course of operating its gym — which is an intended outcome of this Agreement;"
        ),
        b("Operating, marketing or expanding its gym business in any way;"),
        b("Training or developing its own staff, including in-house induction and CPD;"),
        b(
          "Entering into arrangements with other education or training providers, whether during the term or after termination."
        ),
        p(
          "14.4  The Partner Gym acknowledges that PT Launch Lab has invested substantial time, expertise and commercial resource into developing its business model, systems and intellectual property, and that the restrictions in Clauses 14.1 and 14.2 go no further than is reasonable and necessary to protect PT Launch Lab’s legitimate business interests."
        ),
        p(
          "14.5  Remedies — PT Launch Lab shall be entitled to seek injunctive relief and any other equitable remedy for breach of Clauses 14.1 or 14.2, in addition to damages."
        ),
        p(
          "14.6  Severability — if any part of this clause is found to be unenforceable but would be enforceable if some part of it were deleted or its duration or scope reduced, it shall apply with such modification as is necessary to make it enforceable."
        ),
      ],
    },

    {
      number: "15",
      title: "Anti-Bribery",
      blocks: [
        p(
          "Each party shall comply with all applicable anti-bribery and anti-corruption laws, including the Bribery Act 2010, and shall not engage in any activity or practice which would constitute an offence under it."
        ),
      ],
    },

    {
      number: "16",
      title: "Assignment",
      blocks: [
        p(
          "16.1  Neither party may assign, transfer, or subcontract its rights or obligations under this Agreement without the other party’s prior written consent, such consent not to be unreasonably withheld or delayed."
        ),
        p(
          "16.2  PT Launch Lab may assign this Agreement to a group company, or to a purchaser of all or substantially all of its business or assets, on written notice to the Partner Gym."
        ),
      ],
    },

    {
      number: "17",
      title: "Force Majeure",
      blocks: [
        p(
          "Neither party shall be liable for any delay or failure to perform its obligations (other than an obligation to pay money already due) caused by an event beyond its reasonable control. The affected party shall notify the other promptly. If the event continues for more than 60 days, either party may terminate this Agreement on written notice."
        ),
      ],
    },

    {
      number: "18",
      title: "Notices",
      blocks: [
        p(
          "18.1  Any notice under this Agreement must be in writing and may be given by email or by post."
        ),
        p(
          "18.2  Notices to PT Launch Lab shall be sent to info@ptlaunchlab.co.uk or to Unit 3, Royals Business Park, King St, Pontefract, WF8 4AH."
        ),
        p(
          `18.3  Notices to the Partner Gym shall be sent to ${repEmail} or to its registered office at ${registeredAddress}.`
        ),
        p(
          "18.4  Either party may change its notice details by giving written notice to the other. Notice by email is deemed given on the next business day after sending."
        ),
      ],
    },

    {
      number: "19",
      title: "Third Party Rights",
      blocks: [
        p(
          "A person who is not a party to this Agreement has no right under the Contracts (Rights of Third Parties) Act 1999 to enforce any of its terms."
        ),
      ],
    },

    {
      number: "20",
      title: "Severability",
      blocks: [
        p(
          "If any provision of this Agreement is found to be invalid or unenforceable, it shall be modified to the minimum extent necessary to make it enforceable or, if that is not possible, severed. The remaining provisions shall continue in full force and effect."
        ),
      ],
    },

    {
      number: "21",
      title: "Waiver",
      blocks: [
        p(
          "No failure or delay by either party in exercising any right under this Agreement shall operate as a waiver of that right, and no single or partial exercise shall prevent any further exercise of it."
        ),
      ],
    },

    {
      number: "22",
      title: "Entire Agreement & Variation",
      blocks: [
        p(
          "22.1  This Agreement constitutes the entire agreement between the parties in relation to its subject matter and supersedes all prior discussions, representations, marketing materials, and agreements. Each party acknowledges that it has not relied on any statement not set out in this Agreement, save that nothing in this clause excludes liability for fraud or fraudulent misrepresentation."
        ),
        p(
          "22.2  No variation of this Agreement shall be valid unless it is in writing and signed by an authorised representative of each party. A change to the Fee made under Clause 5.3 is an exception and takes effect in accordance with that clause."
        ),
      ],
    },

    {
      number: "23",
      title: "Electronic Signature & Counterparts",
      blocks: [
        p(
          "23.1  The parties agree that this Agreement may be executed electronically and that an electronic signature, whether drawn or typed, has the same legal effect as a manuscript signature."
        ),
        p(
          "23.2  This Agreement may be executed in counterparts, each of which shall constitute an original and which together shall constitute one agreement."
        ),
      ],
    },

    {
      number: "24",
      title: "Governing Law & Jurisdiction",
      blocks: [
        p(
          "This Agreement, and any dispute or claim arising out of or in connection with it, shall be governed by and construed in accordance with the laws of England & Wales. The parties submit to the exclusive jurisdiction of the courts of England & Wales."
        ),
      ],
    },
  ];
}
