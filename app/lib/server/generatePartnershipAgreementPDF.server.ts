// Server-side only — runs in API routes, never in the browser
import PDFDocument from "pdfkit";
import { CALLUM_SIGNATURE_B64 } from "../callumSignature";

// ── Colours ───────────────────────────────────────────────────────────────────
const DARK   = "#072B4A";
const MID    = "#0D3559";
const YELLOW = "#F5C518";
const MUTED  = "#8CA3BF";
const BODY   = "#1E1E1E";
const WHITE  = "#FFFFFF";

// ── Page geometry (points — A4 = 595.28 × 841.89) ────────────────────────────
const PW = 595.28;
const PH = 841.89;
const M  = 51;
const CW = PW - M * 2;

export interface PartnershipAgreementPDFServerData {
  gymName: string;
  companyNumber: string;
  registeredAddress: string;
  repName: string;
  repPosition: string;
  repEmail: string;
  gymSignature: string;          // base64 data URL (drawn) or plain text (typed)
  gymSignatureType: "drawn" | "typed";
  signedAt: string;
}

export function generatePartnershipAgreementPDFServer(
  data: PartnershipAgreementPDFServerData
): Promise<{ buffer: Buffer; filename: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve({ buffer, filename });
    });
    doc.on("error", reject);

    const signedDate = new Date(data.signedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    const gymFullName = `${data.gymName}${data.gymName.toLowerCase().endsWith("ltd") ? "" : " Ltd"}`;
    const gymSlug     = data.gymName.toLowerCase().replace(/\s+/g, "-");
    const filename    = `ptll-partnership-agreement-${gymSlug}-${new Date(data.signedAt).toISOString().slice(0, 10)}.pdf`;

    let y      = 0;
    let pageNum = 1;

    // ── Helpers ───────────────────────────────────────────────────────────────
    function ensureSpace(h: number) {
      if (y + h > PH - 48) {
        addFooter();
        doc.addPage();
        pageNum++;
        y = 28;
      }
    }

    function addFooter() {
      doc.rect(0, PH - 28, PW, 28).fill(DARK);
      doc.rect(0, PH - 28, PW, 2).fill(YELLOW);
      doc.fillColor(MUTED).font("Helvetica").fontSize(7)
         .text("PT Launch Lab Ltd · Company No: 16596168 · Confidential",
           M, PH - 21, { width: CW, align: "center", lineBreak: false });
      doc.fillColor(MUTED).fontSize(7)
         .text(`Page ${pageNum}`, M, PH - 12, { width: CW, align: "right", lineBreak: false });
    }

    function sectionHeader(title: string) {
      ensureSpace(22);
      doc.rect(M, y, CW, 15).fill(DARK);
      doc.fillColor(YELLOW).font("Helvetica-Bold").fontSize(8)
         .text(title, M + 6, y + 4.5, { width: CW - 12, lineBreak: false });
      y += 19;
    }

    function bodyText(text: string, indent = 0) {
      const opts = { width: CW - indent };
      doc.font("Helvetica").fontSize(9);
      const h = doc.heightOfString(text, opts);
      ensureSpace(h + 6);
      doc.fillColor(BODY).font("Helvetica").fontSize(9)
         .text(text, M + indent, y, opts);
      y = doc.y + 4;
    }

    function bullet(text: string) {
      const opts = { width: CW - 16 };
      doc.font("Helvetica").fontSize(9);
      const h = doc.heightOfString(text, opts);
      ensureSpace(h + 5);
      doc.fillColor(BODY).font("Helvetica").fontSize(9)
         .text("•", M + 8, y, { width: 8, lineBreak: false });
      doc.fillColor(BODY).font("Helvetica").fontSize(9)
         .text(text, M + 18, y, opts);
      y = doc.y + 3;
    }

    function subbullet(text: string) {
      const opts = { width: CW - 28 };
      doc.font("Helvetica").fontSize(8.5);
      const h = doc.heightOfString(text, opts);
      ensureSpace(h + 4);
      doc.fillColor(MUTED).font("Helvetica").fontSize(8.5)
         .text("○", M + 18, y, { width: 8, lineBreak: false });
      doc.fillColor(MUTED).font("Helvetica").fontSize(8.5)
         .text(text, M + 28, y, opts);
      y = doc.y + 2;
    }

    function gap(h = 6) { y += h; }

    // ── Page 1 header ─────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 76).fill(DARK);
    doc.rect(0, 76, PW, 4).fill(YELLOW);

    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18)
       .text("PT LAUNCH LAB LTD", M, 18, { lineBreak: false });
    doc.fillColor(WHITE).font("Helvetica").fontSize(10)
       .text("Gym Partnership Agreement", M, 42, { lineBreak: false });

    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text(`Date: ${signedDate}`, M, 18, { width: CW, align: "right", lineBreak: false });
    doc.fillColor(MUTED).fontSize(8)
       .text(`Ref: PTA-${new Date(data.signedAt).getTime().toString().slice(-7)}`,
         M, 30, { width: CW, align: "right", lineBreak: false });

    y = 92;

    // ── 1. PARTIES ────────────────────────────────────────────────────────────
    sectionHeader("1.  PARTIES");
    bodyText(`This Agreement is made on the ${signedDate}`);
    gap(2);
    bodyText("BETWEEN:");
    gap(1);
    bodyText(`(1)  PT Launch Lab Ltd, a company registered in England & Wales (Company No: 16596168), whose registered office is at Unit 3, Royals Business Park, King St, Pontefract, United Kingdom, WF8 4AH (\u201cPT Launch Lab\u201d)`);
    gap(2);
    bodyText("AND");
    gap(1);
    bodyText(`(2)  ${gymFullName}, a company registered in England & Wales (Company No: ${data.companyNumber}), whose registered office is at ${data.registeredAddress} (\u201cPartner Gym\u201d)`);
    gap(4);

    // ── 2. PURPOSE ────────────────────────────────────────────────────────────
    sectionHeader("2.  PURPOSE");
    bodyText("2.1  This Agreement governs the relationship between PT Launch Lab and the Partner Gym in respect of the provision of a white-label personal training academy solution.");
    gap(2);
    bodyText("2.2  The Partner Gym shall act solely as a distribution and referral partner, and shall not be responsible for delivery, education, compliance, or qualification of learners.");
    gap(4);

    // ── 3. SERVICES ──────────────────────────────────────────────────────────
    sectionHeader("3.  SERVICES PROVIDED BY PT LAUNCH LAB");
    bodyText("3.1  PT Launch Lab shall provide:");
    bullet("End-to-end PT education (Level 2 & Level 3 or equivalent)");
    bullet("Mentorship and support");
    bullet("Learner onboarding, screening, and communication");
    bullet("Compliance and quality assurance");
    bullet("White-label branding including:");
    subbullet("Custom URLs");
    subbullet("QR codes");
    subbullet("Gym-branded marketing materials");
    gap(2);
    bodyText("3.2  The Partner Gym shall not be required to provide staffing, administration, or operational support.");
    gap(4);

    // ── 4. REFERRALS ─────────────────────────────────────────────────────────
    sectionHeader("4.  REFERRALS & TRACKING");
    bodyText("4.1  All learner referrals shall be tracked via:");
    bullet("Unique tracking URLs");
    bullet("QR codes");
    bullet("Assigned digital attribution systems");
    gap(2);
    bodyText("4.2  A referral shall be deemed valid where a learner:");
    bullet("Registers via the Partner Gym\u2019s unique tracking mechanism; and");
    bullet("Completes enrolment and payment");
    gap(4);

    // ── 5. PAYMENT ───────────────────────────────────────────────────────────
    sectionHeader("5.  PAYMENT TERMS");
    bodyText("5.1  PT Launch Lab shall pay the Partner Gym:");
    bullet("\u00a3500 per successfully enrolled learner (or such amount as agreed in writing)");
    gap(2);
    bodyText("5.2  Payment shall be made:");
    bullet("30 days after learner enrolment and payment confirmation");
    gap(2);
    bodyText("5.3  All payments shall be made:");
    bullet("To the bank account details supplied in writing by the Partner Gym");
    bullet("By bank transfer unless otherwise agreed");
    gap(2);
    bodyText("5.4  PT Launch Lab reserves the right to withhold payment where:");
    bullet("A refund has been issued; or");
    bullet("Fraudulent or invalid enrolment is identified");
    gap(4);

    // ── 6. INTELLECTUAL PROPERTY ─────────────────────────────────────────────
    sectionHeader("6.  INTELLECTUAL PROPERTY");
    bodyText("6.1  Ownership \u2014 All Intellectual Property Rights in and to training materials, course content, systems, processes, frameworks, marketing assets, technology platforms, and branding concepts (excluding Partner Gym brand) shall remain the sole and exclusive property of PT Launch Lab.");
    gap(2);
    bodyText("6.2  Licence to Partner Gym \u2014 PT Launch Lab grants the Partner Gym a non-exclusive, non-transferable, revocable licence to use PT Launch Lab materials solely for the purpose of promoting the partnership.");
    gap(2);
    bodyText("6.3  Restrictions \u2014 The Partner Gym shall not, without prior written consent:");
    bullet("Copy, reproduce, modify, or distribute PT Launch Lab IP");
    bullet("Create derivative works");
    bullet("Reverse engineer systems or processes");
    bullet("Use materials outside the scope of this Agreement");
    bullet("Represent PT Launch Lab IP as its own");
    gap(2);
    bodyText("6.4  Post-Termination \u2014 Upon termination, all rights granted shall immediately cease. The Partner Gym must remove all materials, cease use of URLs, QR codes, and branding, and not hold itself out as affiliated.");
    gap(2);
    bodyText("6.5  Injunctive Relief \u2014 PT Launch Lab shall be entitled to seek injunctive relief and immediate legal remedy without proof of damages for any breach of this clause.");
    gap(4);

    // ── 7. RELATIONSHIP ──────────────────────────────────────────────────────
    sectionHeader("7.  RELATIONSHIP OF PARTIES");
    bodyText("7.1  Nothing in this Agreement shall create a partnership in law, joint venture, or employment relationship.");
    gap(2);
    bodyText("7.2  The Partner Gym acts as an independent contractor.");
    gap(4);

    // ── 8. LIABILITY ─────────────────────────────────────────────────────────
    sectionHeader("8.  LIABILITY");
    bodyText("8.1  PT Launch Lab shall retain full responsibility for course delivery, compliance, and qualification standards.");
    gap(2);
    bodyText("8.2  The Partner Gym shall not be liable for educational outcomes, learner performance, or regulatory matters.");
    gap(4);

    // ── 9. CONFIDENTIALITY ───────────────────────────────────────────────────
    sectionHeader("9.  CONFIDENTIALITY");
    bodyText("9.1  Both parties agree to keep confidential: commercial terms, business processes, and learner data (subject to GDPR).");
    gap(2);
    bodyText("9.2  This clause shall survive termination.");
    gap(4);

    // ── 10. DATA PROTECTION ──────────────────────────────────────────────────
    sectionHeader("10.  DATA PROTECTION (UK GDPR)");
    bodyText("10.1  Both parties shall comply with UK GDPR and the Data Protection Act 2018.");
    gap(2);
    bodyText("10.2  PT Launch Lab shall act as data controller for learner data unless otherwise agreed.");
    gap(4);

    // ── 11. TERM & TERMINATION ───────────────────────────────────────────────
    sectionHeader("11.  TERM & TERMINATION");
    bodyText("11.1  This Agreement shall commence on the date signed and continue until terminated.");
    gap(2);
    bodyText("11.2  Either party may terminate this Agreement by giving 30 days\u2019 written notice to the other party.");
    gap(2);
    bodyText("11.3  Termination shall not affect accrued payment rights or outstanding obligations.");
    gap(4);

    // ── 12. EFFECT OF TERMINATION ────────────────────────────────────────────
    sectionHeader("12.  EFFECT OF TERMINATION");
    bodyText("Upon termination: all licences granted shall immediately cease; outstanding payments due shall be settled in accordance with Clause 5; both parties shall return or destroy confidential information.");
    gap(4);

    // ── 13. NON-DISPARAGEMENT ────────────────────────────────────────────────
    sectionHeader("13.  NON-DISPARAGEMENT");
    bodyText("Neither party shall make statements that damage the reputation of the other, or misrepresent the partnership.");
    gap(4);

    // ── 14–17. STANDARD CLAUSES ──────────────────────────────────────────────
    sectionHeader("14 \u2013 17.  ENTIRE AGREEMENT \u00b7 VARIATION \u00b7 GOVERNING LAW \u00b7 JURISDICTION");
    bodyText("14.  This Agreement constitutes the entire agreement and supersedes any prior discussions or agreements.");
    gap(2);
    bodyText("15.  No variation shall be valid unless in writing and signed by both parties.");
    gap(2);
    bodyText("16 & 17.  This Agreement shall be governed by and construed in accordance with the laws of England & Wales. The parties submit to the exclusive jurisdiction of the courts of England & Wales.");
    gap(4);

    // ── 18. NON-CIRCUMVENTION ────────────────────────────────────────────────
    sectionHeader("18.  NON-CIRCUMVENTION");
    bodyText("18.1  The Partner Gym irrevocably agrees that it shall not, whether directly or indirectly, during the term of this Agreement and for 12 months following termination, circumvent, avoid, bypass, or obviate PT Launch Lab in relation to services substantially similar to those provided under this Agreement.");
    gap(2);
    bodyText("18.2  Prohibited Actions \u2014 Without limitation, the Partner Gym shall not:");
    bullet("Establish, operate, or promote its own personal training education, certification, or academy programme materially similar to the PT Launch Lab offering;");
    bullet("Engage, contract with, or introduce any third-party provider to deliver services that replicate or compete with the PT Launch Lab model;");
    bullet("Directly or indirectly solicit, recruit, enrol, or attempt to enrol any learner introduced through PT Launch Lab outside of this Agreement;");
    bullet("Use any knowledge, systems, processes, marketing strategies, commercial structures, or intellectual property obtained through this partnership to replicate or compete with the PT Launch Lab business model;");
    bullet("Facilitate or assist any third party in undertaking any of the activities described above.");
    gap(2);
    bodyText("18.3  Non-Circumvention of Learners \u2014 The Partner Gym shall not, during the term or for 12 months thereafter, contact, solicit, or transact directly with any learner introduced via PT Launch Lab for the purpose of offering competing education, mentorship, or qualification services.");
    gap(2);
    bodyText("18.4  The Partner Gym acknowledges that PT Launch Lab has invested substantial time, expertise, and commercial resource into developing its business model, systems, and intellectual property, and that the restrictions in this clause are reasonable, necessary, and proportionate.");
    gap(2);
    bodyText("18.5  Remedies \u2014 Any breach of this clause would cause irreparable harm to PT Launch Lab. Damages alone may not be an adequate remedy. PT Launch Lab shall be entitled to seek injunctive relief, specific performance, and/or any other equitable remedies, and to recover any losses, damages, or profits arising from such breach.");
    gap(2);
    bodyText("18.6  Severability \u2014 If any provision of this clause is found to be unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, or deemed severed without affecting the validity of the remaining provisions.");
    gap(8);

    // ── EXECUTION ─────────────────────────────────────────────────────────────
    ensureSpace(120);
    sectionHeader("EXECUTION \u2014 SIGNED BY AUTHORISED REPRESENTATIVES");
    gap(4);

    const colL  = M;
    const colR  = M + CW / 2 + 6;
    const sigW  = CW / 2 - 12;
    const startY = y;

    // ── Left: PT Launch Lab ───────────────────────────────────────────────────
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8.5)
       .text("For and on behalf of PT Launch Lab Ltd", colL, y, { width: sigW, lineBreak: false });
    y += 14;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Name:       Callum Brown`, colL, y, { lineBreak: false }); y += 11;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Position:    Director`, colL, y, { lineBreak: false }); y += 11;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Date:          ${signedDate}`, colL, y, { lineBreak: false }); y += 11;
    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text("Signature:", colL, y, { lineBreak: false }); y += 4;

    // Callum's pre-embedded signature
    try {
      const callumBuf = Buffer.from(CALLUM_SIGNATURE_B64, "base64");
      doc.image(callumBuf, colL, y, { width: 100, height: 28 });
    } catch {
      doc.fillColor(DARK).font("Helvetica-Oblique").fontSize(16)
         .text("Callum Brown", colL, y + 6, { width: 120, lineBreak: false });
    }
    const leftBottomY = y + 32;

    // ── Right: Partner Gym ────────────────────────────────────────────────────
    let ry = startY;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8.5)
       .text(`For and on behalf of ${gymFullName}`, colR, ry, { width: sigW, lineBreak: false });
    ry += 14;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Name:       ${data.repName}`, colR, ry, { lineBreak: false }); ry += 11;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Position:    ${data.repPosition}`, colR, ry, { lineBreak: false }); ry += 11;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Date:          ${signedDate}`, colR, ry, { lineBreak: false }); ry += 11;
    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text("Signature:", colR, ry, { lineBreak: false }); ry += 4;

    if (data.gymSignatureType === "drawn" && data.gymSignature?.startsWith("data:")) {
      try {
        const gymSigBuf = Buffer.from(data.gymSignature.split(",")[1], "base64");
        doc.image(gymSigBuf, colR, ry, { width: sigW, height: 28 });
      } catch {
        doc.fillColor(BODY).font("Helvetica-Oblique").fontSize(16)
           .text(data.repName, colR, ry + 6, { width: sigW, lineBreak: false });
      }
    } else {
      doc.fillColor(BODY).font("Helvetica-Oblique").fontSize(16)
         .text(data.gymSignature || data.repName, colR, ry + 6, { width: sigW, lineBreak: false });
    }
    const rightBottomY = ry + 32;

    y = Math.max(leftBottomY, rightBottomY) + 10;

    // Divider + footer note
    doc.moveTo(M, y).lineTo(PW - M, y).stroke("#CCCCCC");
    y += 6;
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5)
       .text(
         `This document was electronically signed on ${signedDate} and constitutes a binding legal agreement under the laws of England & Wales.`,
         M, y, { width: CW }
       );

    addFooter();
    doc.end();
  });
}
