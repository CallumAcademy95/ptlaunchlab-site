// Client-side only — call from browser context
import { CALLUM_SIGNATURE_B64 } from "./callumSignature";

export interface PartnershipAgreementPDFData {
  gymName: string;
  companyNumber: string;
  registeredAddress: string;
  repName: string;
  repPosition: string;
  repEmail: string;
  gymSignature: string;          // base64 data URL from canvas
  gymSignatureType: "drawn" | "typed";
  signedAt: string;              // ISO date string — day the page was opened
}

export async function generatePartnershipAgreementPDFBase64(
  data: PartnershipAgreementPDFData
): Promise<{ base64: string; filename: string }> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const PH = 297;
  const M = 18;
  const CW = PW - M * 2;
  let y = 0;

  const signedDate = new Date(data.signedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const gymFullName = `${data.gymName} Ltd`;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function ensureSpace(h: number) {
    if (y + h > PH - 22) { addFooter(); doc.addPage(); y = 20; }
  }

  function addFooter() {
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.setFont("helvetica", "normal");
    doc.text("PT Launch Lab Ltd · Company No: 16596168 · Confidential", M, PH - 8);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, PW - M, PH - 8, { align: "right" });
  }

  function sectionHeader(title: string) {
    ensureSpace(12);
    doc.setFillColor(7, 43, 74);
    doc.rect(M, y, CW, 7.5, "F");
    doc.setTextColor(245, 197, 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title, M + 3, y + 5.2);
    y += 10;
  }

  function body(text: string, indent = 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text, CW - indent);
    ensureSpace(lines.length * 4.8);
    doc.text(lines, M + indent, y);
    y += lines.length * 4.8 + 1.5;
  }

  function bullet(text: string, indent = 6) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text, CW - indent - 4);
    ensureSpace(lines.length * 4.8);
    doc.text("•", M + indent, y);
    doc.text(lines, M + indent + 4, y);
    y += lines.length * 4.8 + 1;
  }

  function subbullet(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, CW - 18);
    ensureSpace(lines.length * 4.5);
    doc.text("○", M + 12, y);
    doc.text(lines, M + 16, y);
    y += lines.length * 4.5 + 1;
  }

  function gap(h = 4) { y += h; }

  // ── Header ─────────────────────────────────────────────────────────────────
  doc.setFillColor(7, 43, 74);
  doc.rect(0, 0, PW, 36, "F");
  doc.setFillColor(245, 197, 24);
  doc.rect(0, 36, PW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PT LAUNCH LAB LTD", M, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Gym Partnership Agreement", M, 22);

  doc.setFontSize(7);
  doc.setTextColor(140, 163, 191);
  doc.text(`Date: ${signedDate}`, PW - M, 14, { align: "right" });
  doc.text(`Ref: PTA-${new Date(data.signedAt).getTime().toString().slice(-7)}`, PW - M, 20, { align: "right" });

  y = 48;

  // ── 1. PARTIES ─────────────────────────────────────────────────────────────
  sectionHeader("1.  PARTIES");
  body(`This Agreement is made on the ${signedDate}`);
  gap(2);
  body("BETWEEN:");
  gap(1);
  body('(1)  PT Launch Lab Ltd, a company registered in England & Wales (Company No: 16596168), whose registered office is at Ultimate Shred Academy Unit 3, Royal Business Park, King St, Pontefract, United Kingdom, WF8 4AH (\u201cPT Launch Lab\u201d)');
  gap(2);
  body("AND");
  gap(1);
  body(`(2)  ${gymFullName}, a company registered in England & Wales (Company No: ${data.companyNumber}), whose registered office is at ${data.registeredAddress} ("Partner Gym")`);
  gap(3);

  // ── 2. PURPOSE ─────────────────────────────────────────────────────────────
  sectionHeader("2.  PURPOSE");
  body("2.1  This Agreement governs the relationship between PT Launch Lab and the Partner Gym in respect of the provision of a white-label personal training academy solution.");
  gap(2);
  body("2.2  The Partner Gym shall act solely as a distribution and referral partner, and shall not be responsible for delivery, education, compliance, or qualification of learners.");
  gap(3);

  // ── 3. SERVICES ────────────────────────────────────────────────────────────
  sectionHeader("3.  SERVICES PROVIDED BY PT LAUNCH LAB");
  body("3.1  PT Launch Lab shall provide:");
  bullet("End-to-end PT education (Level 2 & Level 3 or equivalent)");
  bullet("Mentorship and support");
  bullet("Learner onboarding, screening, and communication");
  bullet("Compliance and quality assurance");
  bullet("White-label branding including:");
  subbullet("Custom URLs");
  subbullet("QR codes");
  subbullet("Gym-branded marketing materials");
  gap(2);
  body("3.2  The Partner Gym shall not be required to provide staffing, administration, or operational support.");
  gap(3);

  // ── 4. REFERRALS ───────────────────────────────────────────────────────────
  sectionHeader("4.  REFERRALS & TRACKING");
  body("4.1  All learner referrals shall be tracked via:");
  bullet("Unique tracking URLs");
  bullet("QR codes");
  bullet("Assigned digital attribution systems");
  gap(2);
  body("4.2  A referral shall be deemed valid where a learner:");
  bullet("Registers via the Partner Gym's unique tracking mechanism; and");
  bullet("Completes enrolment and payment");
  gap(3);

  // ── 5. PAYMENT ─────────────────────────────────────────────────────────────
  sectionHeader("5.  PAYMENT TERMS");
  body("5.1  PT Launch Lab shall pay the Partner Gym:");
  bullet("£500 per successfully enrolled learner (or such amount as agreed in writing)");
  gap(2);
  body("5.2  Commission accrues on the date a valid referral completes enrolment in accordance with Clause 4.2. Accrued commission shall become payable:");
  bullet("Where the learner pays the course fee in full at the point of enrolment: 30 days after enrolment and payment confirmation; or");
  bullet("Where the learner enrols on a deposit and instalment plan: 30 days after the second scheduled instalment has been successfully collected");
  gap(2);
  body("5.3  The Partner Gym may view its accrued and released commission at any time via the PT Launch Lab partner portal. Commission shown as accrued is not payable until released in accordance with Clause 5.2.");
  gap(2);
  body("5.4  All payments shall be made:");
  bullet("To the bank account details supplied in writing by the Partner Gym");
  bullet("By bank transfer unless otherwise agreed");
  gap(2);
  body("5.5  PT Launch Lab reserves the right to withhold payment where:");
  bullet("A refund has been issued, or a cancellation, payment reversal or chargeback has occurred; or");
  bullet("Fraudulent or invalid enrolment is identified");
  gap(2);
  body("5.6  Clawback — Where commission has already been paid in respect of a learner who is subsequently refunded, who cancels within any statutory cooling-off period, or whose payment is reversed or charged back, the Partner Gym shall repay the corresponding commission. Where the learner is refunded in part, the sum repayable shall be reduced in the same proportion as the refund bears to the total course fee.");
  gap(2);
  body("5.7  PT Launch Lab may recover any sum due under Clause 5.6 by offsetting it against commission otherwise payable to the Partner Gym, and shall notify the Partner Gym in writing of any offset applied. Where no further commission is expected to become payable within 60 days, the Partner Gym shall repay the sum within 30 days of written demand.");
  gap(3);

  // ── 6. IP ──────────────────────────────────────────────────────────────────
  sectionHeader("6.  INTELLECTUAL PROPERTY");
  body("6.1  Ownership — All Intellectual Property Rights in and to training materials, course content, systems, processes, frameworks, marketing assets, technology platforms, and branding concepts (excluding Partner Gym brand) shall remain the sole and exclusive property of PT Launch Lab.");
  gap(2);
  body("6.2  Licence to Partner Gym — PT Launch Lab grants the Partner Gym a non-exclusive, non-transferable, revocable licence to use PT Launch Lab materials solely for the purpose of promoting the partnership.");
  gap(2);
  body("6.3  Restrictions — The Partner Gym shall not, without prior written consent:");
  bullet("Copy, reproduce, modify, or distribute PT Launch Lab IP");
  bullet("Create derivative works");
  bullet("Reverse engineer systems or processes");
  bullet("Use materials outside the scope of this Agreement");
  bullet("Represent PT Launch Lab IP as its own");
  gap(2);
  body("6.4  Post-Termination — Upon termination, all rights granted shall immediately cease. The Partner Gym must remove all materials, cease use of URLs, QR codes, and branding, and not hold itself out as affiliated.");
  gap(2);
  body("6.5  Injunctive Relief — PT Launch Lab shall be entitled to seek injunctive relief and immediate legal remedy without proof of damages for any breach of this clause.");
  gap(3);

  // ── 7. RELATIONSHIP ────────────────────────────────────────────────────────
  sectionHeader("7.  RELATIONSHIP OF PARTIES");
  body("7.1  Nothing in this Agreement shall create a partnership in law, joint venture, or employment relationship.");
  gap(2);
  body("7.2  The Partner Gym acts as an independent contractor.");
  gap(3);

  // ── 8. LIABILITY ───────────────────────────────────────────────────────────
  sectionHeader("8.  LIABILITY");
  body("8.1  PT Launch Lab shall retain full responsibility for course delivery, compliance, and qualification standards.");
  gap(2);
  body("8.2  The Partner Gym shall not be liable for educational outcomes, learner performance, or regulatory matters.");
  gap(3);

  // ── 9. CONFIDENTIALITY ─────────────────────────────────────────────────────
  sectionHeader("9.  CONFIDENTIALITY");
  body("9.1  Both parties agree to keep confidential: commercial terms, business processes, and learner data (subject to GDPR).");
  gap(2);
  body("9.2  This clause shall survive termination.");
  gap(3);

  // ── 10. DATA PROTECTION ────────────────────────────────────────────────────
  sectionHeader("10.  DATA PROTECTION (UK GDPR)");
  body("10.1  Both parties shall comply with UK GDPR and the Data Protection Act 2018.");
  gap(2);
  body("10.2  PT Launch Lab shall act as data controller for learner data unless otherwise agreed.");
  gap(3);

  // ── 11. TERM & TERMINATION ─────────────────────────────────────────────────
  sectionHeader("11.  TERM & TERMINATION");
  body("11.1  This Agreement shall commence on the date signed and continue until terminated.");
  gap(2);
  body("11.2  Either party may terminate this Agreement by giving 30 days' written notice to the other party.");
  gap(2);
  body("11.3  Termination shall not affect accrued payment rights or outstanding obligations.");
  gap(3);

  // ── 12. EFFECT OF TERMINATION ──────────────────────────────────────────────
  sectionHeader("12.  EFFECT OF TERMINATION");
  body("Upon termination: all licences granted shall immediately cease; outstanding payments due shall be settled in accordance with Clause 5; both parties shall return or destroy confidential information.");
  gap(3);

  // ── 13. NON-DISPARAGEMENT ──────────────────────────────────────────────────
  sectionHeader("13.  NON-DISPARAGEMENT");
  body("Neither party shall make statements that damage the reputation of the other, or misrepresent the partnership.");
  gap(3);

  // ── 14-17. STANDARD CLAUSES ────────────────────────────────────────────────
  sectionHeader("14 – 17.  ENTIRE AGREEMENT · VARIATION · GOVERNING LAW · JURISDICTION");
  body("14.  This Agreement constitutes the entire agreement and supersedes any prior discussions or agreements.");
  gap(2);
  body("15.  No variation shall be valid unless in writing and signed by both parties.");
  gap(2);
  body("16 & 17.  This Agreement shall be governed by and construed in accordance with the laws of England & Wales. The parties submit to the exclusive jurisdiction of the courts of England & Wales.");
  gap(3);

  // ── 18. NON-CIRCUMVENTION ──────────────────────────────────────────────────
  sectionHeader("18.  NON-CIRCUMVENTION");
  body("18.1  The Partner Gym irrevocably agrees that it shall not, whether directly or indirectly, during the term of this Agreement and for 12 months following termination, circumvent, avoid, bypass, or obviate PT Launch Lab in relation to services substantially similar to those provided under this Agreement.");
  gap(2);
  body("18.2  Prohibited Actions — Without limitation, the Partner Gym shall not:");
  bullet("Establish, operate, or promote its own personal training education, certification, or academy programme materially similar to the PT Launch Lab offering;");
  bullet("Engage, contract with, or introduce any third-party provider to deliver services that replicate or compete with the PT Launch Lab model;");
  bullet("Directly or indirectly solicit, recruit, enrol, or attempt to enrol any learner introduced through PT Launch Lab outside of this Agreement;");
  bullet("Use any knowledge, systems, processes, marketing strategies, commercial structures, or intellectual property obtained through this partnership to replicate or compete with the PT Launch Lab business model;");
  bullet("Facilitate or assist any third party in undertaking any of the activities described above.");
  gap(2);
  body("18.3  Non-Circumvention of Learners — The Partner Gym shall not, during the term or for 12 months thereafter, contact, solicit, or transact directly with any learner introduced via PT Launch Lab for the purpose of offering competing education, mentorship, or qualification services.");
  gap(2);
  body("18.4  The Partner Gym acknowledges that PT Launch Lab has invested substantial time, expertise, and commercial resource into developing its business model, systems, and intellectual property, and that the restrictions in this clause are reasonable, necessary, and proportionate.");
  gap(2);
  body("18.5  Remedies — Any breach of this clause would cause irreparable harm to PT Launch Lab. Damages alone may not be an adequate remedy. PT Launch Lab shall be entitled to seek injunctive relief, specific performance, and/or any other equitable remedies, and to recover any losses, damages, or profits arising from such breach.");
  gap(2);
  body("18.6  Severability — If any provision of this clause is found to be unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, or deemed severed without affecting the validity of the remaining provisions.");
  gap(5);

  // ── EXECUTION ──────────────────────────────────────────────────────────────
  ensureSpace(90);
  sectionHeader("EXECUTION — SIGNED BY AUTHORISED REPRESENTATIVES");
  gap(3);

  const colL = M;
  const colR = M + CW / 2 + 4;
  const sigW = (CW / 2) - 6;

  // Left block — PT Launch Lab
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(7, 43, 74);
  doc.text("For and on behalf of PT Launch Lab Ltd", colL, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text("Name:      Callum Brown", colL, y); y += 5;
  doc.text("Position:   Director", colL, y); y += 5;
  doc.text(`Date:        ${signedDate}`, colL, y); y += 5;
  doc.text("Signature:", colL, y); y += 3;

  // Callum's pre-embedded signature
  try {
    doc.addImage(CALLUM_SIGNATURE_B64, "PNG", colL, y, 50, 18, undefined, "FAST");
  } catch {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.setTextColor(7, 43, 74);
    doc.text("Callum Brown", colL, y + 10);
  }

  const sigY = y - 18; // remember y before signature for right column alignment

  // Right block — Partner Gym
  const rightY = sigY - 18; // align to same start
  let ry = rightY + 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(7, 43, 74);
  doc.text(`For and on behalf of ${gymFullName}`, colR, ry);
  ry += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(`Name:      ${data.repName}`, colR, ry); ry += 5;
  doc.text(`Position:   ${data.repPosition}`, colR, ry); ry += 5;
  doc.text(`Date:        ${signedDate}`, colR, ry); ry += 5;
  doc.text("Signature:", colR, ry); ry += 3;

  // Gym rep signature
  if (data.gymSignature && data.gymSignature.startsWith("data:")) {
    try {
      const ext = data.gymSignatureType === "drawn" ? "PNG" : "PNG";
      doc.addImage(data.gymSignature, ext, colR, ry, sigW, 18, undefined, "FAST");
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(data.repName, colR, ry + 10);
    }
  } else {
    // Typed signature
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(data.gymSignature, colR, ry + 10);
  }

  y = Math.max(y + 22, ry + 22);
  gap(4);

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, PW - M, y);
  gap(4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `This document was electronically signed on ${signedDate} and constitutes a binding legal agreement under the laws of England & Wales.`,
    M, y, { maxWidth: CW }
  );

  addFooter();

  const base64 = doc.output("datauristring").split(",")[1];
  const gymSlug = data.gymName.toLowerCase().replace(/\s+/g, "-");
  const filename = `ptll-partnership-agreement-${gymSlug}-${new Date(data.signedAt).toISOString().slice(0, 10)}.pdf`;

  return { base64, filename };
}
