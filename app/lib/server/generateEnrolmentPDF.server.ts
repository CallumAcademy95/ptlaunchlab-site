// Server-side only — runs in API routes, never in the browser
import PDFDocument from "pdfkit";

// ── Colours ───────────────────────────────────────────────────────────────────
const DARK    = "#072B4A";
const MID     = "#0D3559";
const YELLOW  = "#F5C518";
const MUTED   = "#8CA3BF";
const BODY    = "#1E323F";
const WHITE   = "#FFFFFF";

// ── Page geometry (points — A4 = 595.28 × 841.89) ────────────────────────────
const PW   = 595.28;
const PH   = 841.89;
const M    = 51;          // 18 mm
const CW   = PW - M * 2; // content width

export interface EnrolmentPDFServerData {
  learnerDetails: {
    title: string; fullName: string; dateOfBirth: string; gender: string;
    nationalInsurance: string; mobile: string; email: string;
    addressLine1: string; addressLine2: string; town: string; county: string; postcode: string;
  };
  learningDetails: {
    heardAbout: string; highestQualification: string;
    gcseEnglish: string; gcseMaths: string; gcseICT: string; employmentStatus: string;
  };
  agreement: {
    checkboxes: {
      detailsAccurate: boolean; selfFunded: boolean;
      coolingOffUnderstood: boolean; termsAgreed: boolean; commitToLearning: boolean;
    };
    signature: string;       // base64 data URL (drawn) or plain text (typed)
    signatureType: "drawn" | "typed";
    signedAt: string;
  };
  paymentChoice: "full" | "deposit";
  submittedAt: string;
  gymReferral?: string;
  promoCode?: string;
  discountApplied?: number;
  amountPaid?: number;
}

export function generateEnrolmentPDFServer(
  data: EnrolmentPDFServerData
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

    const l   = data.learnerDetails;
    const ln  = data.learningDetails;
    const a   = data.agreement;
    const dt  = new Date(data.submittedAt);

    const dateStr   = dt.toISOString().slice(0, 10);
    const safeName  = l.fullName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-");
    const filename  = `PTLL-Enrolment-${safeName}-${dateStr}.pdf`;

    const displayDate = dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const refNum      = `PTLL-${dt.getTime().toString().slice(-7)}`;
    const paymentLabel = data.paymentChoice === "full"
      ? `Full Payment — £${data.amountPaid ?? "1,599"}`
      : `Deposit Plan — £${data.amountPaid ?? "599"} deposit + 5×£200`;

    let y = 0;
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
         .text(
           "PT Launch Lab  |  Unit 3, Royals Business Park, Pontefract WF8 4AH  |  info@ptlaunchlab.co.uk  |  01977 365001",
           M, PH - 20, { width: CW, align: "center", lineBreak: false }
         );
      doc.fillColor(MUTED).fontSize(6.5)
         .text(`Page ${pageNum}`, M, PH - 11, { width: CW, align: "right", lineBreak: false });
    }

    function sectionTitle(title: string) {
      ensureSpace(22);
      doc.rect(M, y, CW, 16).fill(MID);
      doc.fillColor(YELLOW).font("Helvetica-Bold").fontSize(8)
         .text(title, M + 6, y + 5, { width: CW - 12, lineBreak: false });
      y += 20;
    }

    function field(label: string, value: string) {
      const val = value || "—";
      doc.font("Helvetica-Bold").fontSize(9);
      const textHeight = doc.heightOfString(val, { width: CW - 62 });
      ensureSpace(textHeight + 8);
      doc.fillColor(MUTED).font("Helvetica").fontSize(8)
         .text(label, M, y, { width: 58, lineBreak: false });
      doc.fillColor(BODY).font("Helvetica-Bold").fontSize(9)
         .text(val, M + 62, y, { width: CW - 62 });
      y = doc.y + 3;
    }

    function cols2(pairs: [string, string][]) {
      const halfW = (CW - 8) / 2;
      for (let i = 0; i < pairs.length; i += 2) {
        ensureSpace(14);
        const [l1, v1] = pairs[i];
        const [l2, v2] = pairs[i + 1] ?? ["", ""];
        doc.fillColor(MUTED).font("Helvetica").fontSize(8)
           .text(l1, M, y, { width: 60, lineBreak: false });
        doc.fillColor(BODY).font("Helvetica-Bold").fontSize(9)
           .text(v1 || "—", M + 62, y, { width: halfW - 62, lineBreak: false });
        if (l2) {
          doc.fillColor(MUTED).font("Helvetica").fontSize(8)
             .text(l2, M + halfW + 8, y, { width: 60, lineBreak: false });
          doc.fillColor(BODY).font("Helvetica-Bold").fontSize(9)
             .text(v2 || "—", M + halfW + 70, y, { width: halfW - 62, lineBreak: false });
        }
        y += 13;
      }
    }

    function checkbox(checked: boolean, label: string) {
      doc.font("Helvetica").fontSize(8.5);
      const textH = doc.heightOfString(label, { width: CW - 20 });
      ensureSpace(textH + 10);
      // Box
      if (checked) {
        doc.rect(M, y, 10, 10).fill(YELLOW);
        doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
           .text("✓", M + 1, y + 1.5, { width: 8, align: "center", lineBreak: false });
      } else {
        doc.rect(M, y, 10, 10).stroke("#1E3A5C");
      }
      doc.fillColor(BODY).font("Helvetica").fontSize(8.5)
         .text(label, M + 16, y, { width: CW - 20 });
      y = doc.y + 4;
    }

    // ── Page 1 header ─────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 76).fill(DARK);
    doc.rect(0, 76, PW, 4).fill(YELLOW);

    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18)
       .text("PT LAUNCH LAB", M, 18, { lineBreak: false });
    doc.fillColor(WHITE).font("Helvetica").fontSize(10)
       .text("Learner Enrolment Agreement", M, 42, { lineBreak: false });

    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text(`Date: ${displayDate}`, M, 18, { width: CW, align: "right", lineBreak: false });
    doc.fillColor(MUTED).fontSize(8)
       .text(`Ref: ${refNum}`, M, 30, { width: CW, align: "right", lineBreak: false });
    doc.fillColor(MUTED).fontSize(8)
       .text(`Payment: ${paymentLabel}`, M, 42, { width: CW, align: "right", lineBreak: false });

    y = 92;

    // ── Section 1: Personal Information ──────────────────────────────────────
    sectionTitle("1.  PERSONAL INFORMATION");
    field("Full Name", `${l.title} ${l.fullName}`);
    cols2([
      ["Date of Birth", l.dateOfBirth ? new Date(l.dateOfBirth + "T12:00:00").toLocaleDateString("en-GB") : ""],
      ["Gender", l.gender],
      ["National Insurance", l.nationalInsurance],
      ["", ""],
    ]);
    y += 4;

    // ── Section 2: Contact Details ────────────────────────────────────────────
    sectionTitle("2.  CONTACT DETAILS");
    cols2([
      ["Mobile", l.mobile],
      ["Email", l.email],
    ]);
    y += 4;

    // ── Section 3: Home Address ───────────────────────────────────────────────
    sectionTitle("3.  HOME ADDRESS");
    field(
      "Address",
      [l.addressLine1, l.addressLine2, l.town, l.county, l.postcode].filter(Boolean).join(", ")
    );
    y += 4;

    // ── Section 4: Learning Information ──────────────────────────────────────
    sectionTitle("4.  LEARNING INFORMATION");
    field("How They Found Us", ln.heardAbout);
    field("Highest Qualification", ln.highestQualification);
    field("Employment Status", ln.employmentStatus);
    cols2([
      ["GCSE English",    ln.gcseEnglish  || "N/A"],
      ["GCSE Maths",      ln.gcseMaths    || "N/A"],
      ["GCSE ICT",        ln.gcseICT      || "N/A"],
      ["", ""],
    ]);
    y += 4;

    // ── Section 5: Declarations ───────────────────────────────────────────────
    sectionTitle("5.  LEARNER AGREEMENT — DECLARATIONS");
    const declarations: [boolean, string][] = [
      [a.checkboxes.detailsAccurate,      "I confirm that all information provided during this enrolment is true and accurate to the best of my knowledge."],
      [a.checkboxes.selfFunded,           "I understand that this is a self-funded course and I am responsible for the agreed course fees."],
      [a.checkboxes.coolingOffUnderstood, "I have read and understood the cooling off and refund terms, and acknowledge that different payment methods have different refund conditions."],
      [a.checkboxes.commitToLearning,     "I commit to engaging with the learning process, completing the required coursework, and participating fully in the course."],
      [a.checkboxes.termsAgreed,          "I have read and agree to the PT Launch Lab Terms and Conditions. I acknowledge that course access begins after payment is completed."],
    ];
    for (const [checked, label] of declarations) checkbox(checked, label);
    y += 6;

    // ── Section 6: Signature ──────────────────────────────────────────────────
    sectionTitle("6.  SIGNATURE");
    ensureSpace(80);

    if (a.signatureType === "drawn" && a.signature?.startsWith("data:")) {
      // Drawn signature — embed image
      doc.rect(M, y, CW, 60).fill("#061F36");
      try {
        const sigBuf = Buffer.from(a.signature.split(",")[1], "base64");
        doc.image(sigBuf, M + 8, y + 4, { width: CW - 16, height: 52 });
      } catch {
        doc.fillColor(YELLOW).font("Helvetica-Oblique").fontSize(20)
           .text("[ signature ]", M, y + 18, { width: CW, align: "center", lineBreak: false });
      }
      y += 65;
    } else {
      // Typed signature
      doc.rect(M, y, CW, 42).fill("#061F36");
      doc.fillColor(YELLOW).font("Helvetica-Oblique").fontSize(22)
         .text(a.signature || "—", M + 8, y + 10, { width: CW - 16, align: "center", lineBreak: false });
      y += 47;
    }

    const sigDate = new Date(a.signedAt).toLocaleString("en-GB", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text(`Signed on: ${sigDate}`, M, y + 3, { lineBreak: false });
    doc.fillColor(MUTED).fontSize(8)
       .text(`Signature method: ${a.signatureType === "drawn" ? "Handwritten (digital canvas)" : "Typed full name"}`,
         M, y + 13, { lineBreak: false });
    y += 24;

    // ── Footer on final page ──────────────────────────────────────────────────
    addFooter();

    doc.end();
  });
}
