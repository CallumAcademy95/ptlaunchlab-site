// Server-side only — runs in API routes, never in the browser
//
// This file is a RENDERER ONLY. Every word of clause text comes from
// app/lib/mentorPartnerAgreement.ts, which is the same source the on-screen
// agreement at /mentor-partnership/sign renders. Do not add clause text here.
import PDFDocument from "pdfkit";
import { CALLUM_SIGNATURE_B64 } from "../callumSignature";
import {
  buildMentorAgreementClauses,
  MENTOR_AGREEMENT_VERSION,
} from "../mentorPartnerAgreement";

// ── Colours ───────────────────────────────────────────────────────────────────
const DARK   = "#072B4A";
const YELLOW = "#F5C518";
const MUTED  = "#8CA3BF";
const BODY   = "#1E1E1E";
const WHITE  = "#FFFFFF";

// ── Page geometry (points — A4 = 595.28 × 841.89) ────────────────────────────
const PW = 595.28;
const PH = 841.89;
const M  = 51;
const CW = PW - M * 2;

export interface MentorAgreementPDFServerData {
  businessName: string;
  companyNumber: string;
  address: string;
  repName: string;
  repPosition: string;
  repEmail: string;
  signature: string;             // base64 data URL (drawn) or plain text (typed)
  signatureType: "drawn" | "typed";
  signedAt: string;
  /** Whether the signer ticked the key-terms acknowledgement on screen. */
  acknowledgedKeyTerms?: boolean;
}

export function generateMentorAgreementPDFServer(
  data: MentorAgreementPDFServerData
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
    const slug     = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `ptll-mentor-partner-agreement-${slug}-${new Date(data.signedAt).toISOString().slice(0, 10)}.pdf`;

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
       .text("Business Mentorship Partner Agreement", M, 42, { lineBreak: false });

    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text(`Date: ${signedDate}`, M, 18, { width: CW, align: "right", lineBreak: false });
    doc.fillColor(MUTED).fontSize(8)
       .text(`Ref: PTM-${new Date(data.signedAt).getTime().toString().slice(-7)}`,
         M, 30, { width: CW, align: "right", lineBreak: false });
    doc.fillColor(MUTED).fontSize(8)
       .text(`Version ${MENTOR_AGREEMENT_VERSION}`,
         M, 42, { width: CW, align: "right", lineBreak: false });

    y = 92;

    // ── Clauses — rendered from the shared source ─────────────────────────────
    const clauses = buildMentorAgreementClauses({
      businessName: data.businessName,
      companyNumber: data.companyNumber,
      address: data.address,
      repName: data.repName,
      repEmail: data.repEmail,
      signedDate,
    });

    for (const clause of clauses) {
      sectionHeader(`${clause.number}.  ${clause.title.toUpperCase()}`);
      clause.blocks.forEach((block, i) => {
        switch (block.kind) {
          case "p":
            bodyText(block.text);
            if (i < clause.blocks.length - 1) gap(2);
            break;
          case "bullet":
            bullet(block.text);
            break;
          case "sub":
            subbullet(block.text);
            break;
        }
      });
      gap(4);
    }
    gap(4);

    // ── EXECUTION ─────────────────────────────────────────────────────────────
    ensureSpace(140);
    sectionHeader("EXECUTION — SIGNED BY AUTHORISED REPRESENTATIVES");
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
      const callumBuf = Buffer.from(CALLUM_SIGNATURE_B64.replace(/^data:[^,]*,/, ""), "base64");
      doc.image(callumBuf, colL, y, { width: 100, height: 28 });
    } catch {
      doc.fillColor(DARK).font("Helvetica-Oblique").fontSize(16)
         .text("Callum Brown", colL, y + 6, { width: 120, lineBreak: false });
    }
    const leftBottomY = y + 32;

    // ── Right: Mentor Partner ────────────────────────────────────────────────────
    let ry = startY;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8.5)
       .text(`For and on behalf of ${data.businessName}`, colR, ry, { width: sigW, lineBreak: false });
    ry += 14;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Name:       ${data.repName}`, colR, ry, { lineBreak: false }); ry += 11;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Position:    ${data.repPosition}`, colR, ry, { lineBreak: false }); ry += 11;
    doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
       .text(`Date:          ${signedDate}`, colR, ry, { lineBreak: false }); ry += 11;
    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text("Signature:", colR, ry, { lineBreak: false }); ry += 4;

    if (data.signatureType === "drawn" && data.signature?.startsWith("data:")) {
      try {
        const sigBuf = Buffer.from(data.signature.split(",")[1], "base64");
        doc.image(sigBuf, colR, ry, { width: sigW, height: 28 });
      } catch {
        doc.fillColor(BODY).font("Helvetica-Oblique").fontSize(16)
           .text(data.repName, colR, ry + 6, { width: sigW, lineBreak: false });
      }
    } else {
      doc.fillColor(BODY).font("Helvetica-Oblique").fontSize(16)
         .text(data.signature || data.repName, colR, ry + 6, { width: sigW, lineBreak: false });
    }
    const rightBottomY = ry + 32;

    y = Math.max(leftBottomY, rightBottomY) + 10;

    // Divider + execution note
    doc.moveTo(M, y).lineTo(PW - M, y).stroke("#CCCCCC");
    y += 6;

    // Evidence that the key clauses were drawn to the signer's attention.
    if (data.acknowledgedKeyTerms) {
      doc.fillColor(BODY).font("Helvetica").fontSize(7.5)
         .text(
           `Before signing, ${data.repName} was shown a summary of the key terms — Clause 2 (call fee and pilot), Clause 3 (representing PT Launch Lab), Clause 4 (exclusivity) and Clause 5 (learner data) — was required to scroll to the end of the Agreement, and confirmed having read it and being authorised to sign.`,
           M, y, { width: CW }
         );
      y = doc.y + 4;
    }

    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5)
       .text(
         `This document was electronically signed on ${signedDate} and constitutes a binding legal agreement under the laws of England & Wales. Agreement version ${MENTOR_AGREEMENT_VERSION}.`,
         M, y, { width: CW }
       );

    addFooter();
    doc.end();
  });
}
