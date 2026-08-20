import { ADDRESS_ONE_LINE, CONTACT_EMAIL, PHONE_NATIONAL } from "@/app/lib/contactDetails";

// Client-side only — call from browser context, not server components/API routes

export interface EnrolmentPDFData {
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
    signature: string;
    signatureType: "drawn" | "typed";
    signedAt: string;
  };
  paymentChoice: "full" | "deposit" | "manual";
  submittedAt: string;
}

async function buildEnrolmentPDF(data: EnrolmentPDFData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210, PH = 297;
  const M = 18;
  const CW = PW - M * 2;
  let y = 0;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(7, 43, 74);
  doc.rect(0, 0, PW, 36, "F");
  doc.setFillColor(245, 197, 24);
  doc.rect(0, 36, PW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PT LAUNCH LAB", M, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Learner Enrolment Agreement", M, 22);

  const dt = new Date(data.submittedAt);
  doc.setFontSize(7);
  doc.setTextColor(140, 163, 191);
  doc.text(
    `Date: ${dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    PW - M, 14, { align: "right" }
  );
  doc.text(`Ref: PTLL-${dt.getTime().toString().slice(-7)}`, PW - M, 20, { align: "right" });
  doc.text(
    `Payment: ${data.paymentChoice === "manual" ? "Manual entry (admin/NCFE capture)" : data.paymentChoice === "full" ? "Full Payment \u2014 \u00a31,399" : "Deposit Plan \u2014 \u00a3599 + 5\u00d7\u00a3200"}`,
    PW - M, 26, { align: "right" }
  );

  y = 48;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function ensureSpace(h: number) {
    if (y + h > PH - 20) {
      addFooter();
      doc.addPage();
      y = 20;
    }
  }

  function sectionTitle(title: string) {
    ensureSpace(12);
    doc.setFillColor(13, 53, 89);
    doc.rect(M, y, CW, 7.5, "F");
    doc.setTextColor(245, 197, 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(title, M + 3, y + 5.2);
    y += 10;
  }

  function field(label: string, value: string, labelW = 58) {
    ensureSpace(7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 163, 191);
    doc.text(label, M, y);
    doc.setTextColor(30, 50, 70);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(value || "\u2014", CW - labelW);
    doc.text(lines, M + labelW, y);
    y += Math.max((lines as string[]).length * 5, 6);
  }

  function cols2(pairs: [string, string][]) {
    const half = CW / 2;
    for (let i = 0; i < pairs.length; i += 2) {
      ensureSpace(7);
      const [l1, v1] = pairs[i];
      const [l2, v2] = pairs[i + 1] ?? ["", ""];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 163, 191);
      doc.text(l1, M, y);
      doc.setTextColor(30, 50, 70);
      doc.setFont("helvetica", "bold");
      doc.text(v1 || "\u2014", M + 32, y);
      if (l2) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(140, 163, 191);
        doc.text(l2, M + half, y);
        doc.setTextColor(30, 50, 70);
        doc.setFont("helvetica", "bold");
        doc.text(v2 || "\u2014", M + half + 32, y);
      }
      y += 6;
    }
  }

  function checkbox(checked: boolean, label: string) {
    ensureSpace(10);
    doc.setDrawColor(30, 60, 90);
    doc.setLineWidth(0.4);
    if (checked) {
      doc.setFillColor(245, 197, 24);
      doc.rect(M, y - 4.5, 4.5, 4.5, "FD");
      doc.setTextColor(7, 43, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("v", M + 0.9, y - 0.6);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(M, y - 4.5, 4.5, 4.5, "FD");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 50, 70);
    const lines = doc.splitTextToSize(label, CW - 9);
    doc.text(lines, M + 7, y - 1);
    y += (lines as string[]).length * 5 + 2;
  }

  function addFooter() {
    doc.setFillColor(7, 43, 74);
    doc.rect(0, PH - 14, PW, 14, "F");
    doc.setFillColor(245, 197, 24);
    doc.rect(0, PH - 14, PW, 1.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(140, 163, 191);
    doc.text(
      `PT Launch Lab  |  ${ADDRESS_ONE_LINE}  |  ${CONTACT_EMAIL}  |  ${PHONE_NATIONAL}`,
      PW / 2, PH - 8.5, { align: "center" }
    );
    doc.text(
      "This document constitutes a binding learner enrolment agreement. Generated automatically upon submission.",
      PW / 2, PH - 4, { align: "center" }
    );
  }

  // ── Section 1: Personal Information ──────────────────────────────────────
  const l = data.learnerDetails;
  sectionTitle("1. Personal Information");
  field("Full Name", `${l.title} ${l.fullName}`);
  cols2([
    ["Date of Birth", l.dateOfBirth ? new Date(l.dateOfBirth + "T12:00:00").toLocaleDateString("en-GB") : ""],
    ["Gender", l.gender],
    ["National Insurance No.", l.nationalInsurance],
    ["", ""],
  ]);
  y += 2;

  // ── Section 2: Contact Details ────────────────────────────────────────────
  sectionTitle("2. Contact Details");
  cols2([
    ["Mobile", l.mobile],
    ["Email", l.email],
  ]);
  y += 2;

  // ── Section 3: Home Address ───────────────────────────────────────────────
  sectionTitle("3. Home Address");
  field(
    "Address",
    [l.addressLine1, l.addressLine2, l.town, l.county, l.postcode].filter(Boolean).join(", ")
  );
  y += 2;

  // ── Section 4: Learning Information ──────────────────────────────────────
  const ln = data.learningDetails;
  sectionTitle("4. Learning Information");
  field("How They Found Us", ln.heardAbout);
  field("Highest Qualification", ln.highestQualification);
  field("Employment Status", ln.employmentStatus);
  cols2([
    ["GCSE English", ln.gcseEnglish || "N/A"],
    ["GCSE Maths", ln.gcseMaths || "N/A"],
    ["GCSE ICT / Digital", ln.gcseICT || "N/A"],
    ["", ""],
  ]);
  y += 2;

  // ── Section 5: Learner Agreement ──────────────────────────────────────────
  sectionTitle("5. Learner Agreement \u2014 Declarations");
  const cbItems: [boolean, string][] = [
    [data.agreement.checkboxes.detailsAccurate,      "I confirm that all information provided during this enrolment is true and accurate to the best of my knowledge."],
    [data.agreement.checkboxes.selfFunded,           "I understand that this is a self-funded course and I am responsible for the agreed course fees."],
    [data.agreement.checkboxes.coolingOffUnderstood, "I have read and understood the cooling off and refund terms, and acknowledge that different payment methods have different refund conditions."],
    [data.agreement.checkboxes.commitToLearning,     "I commit to engaging with the learning process, completing the required coursework, and participating fully in the course."],
    [data.agreement.checkboxes.termsAgreed,          "I have read and agree to the PT Launch Lab Terms and Conditions. I acknowledge that course access begins after payment is completed."],
  ];
  for (const [checked, label] of cbItems) checkbox(checked, label);
  y += 4;

  // ── Section 6: Signature ──────────────────────────────────────────────────
  sectionTitle("6. Signature");
  if (data.agreement.signatureType === "drawn" && data.agreement.signature.startsWith("data:")) {
    ensureSpace(44);
    doc.setFillColor(6, 31, 54);
    doc.setDrawColor(30, 60, 90);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 38, 2, 2, "FD");
    doc.addImage(data.agreement.signature, "PNG", M + 4, y + 3, CW - 8, 32);
    y += 41;
  } else {
    ensureSpace(24);
    doc.setFillColor(6, 31, 54);
    doc.setDrawColor(30, 60, 90);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 20, 2, 2, "FD");
    doc.setTextColor(245, 197, 24);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(18);
    doc.text(data.agreement.signature || "\u2014", PW / 2, y + 13, { align: "center" });
    y += 23;
  }

  const sigDate = new Date(data.agreement.signedAt).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 163, 191);
  doc.text(`Signed on: ${sigDate}`, M, y + 2);
  doc.text(
    `Signature method: ${data.agreement.signatureType === "drawn" ? "Handwritten (digital canvas)" : "Typed full name"}`,
    M, y + 7
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  addFooter();

  // ── Return doc + filename parts ────────────────────────────────────────────
  const safeName = l.fullName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-");
  const dateStr = dt.toISOString().slice(0, 10);
  return { doc, safeName, dateStr };
}

/** Downloads the signed PDF to the learner's browser */
export async function generateEnrolmentPDF(data: EnrolmentPDFData): Promise<void> {
  const { doc, safeName, dateStr } = await buildEnrolmentPDF(data);
  doc.save(`PTLL-Enrolment-${safeName}-${dateStr}.pdf`);
}

/** Returns the PDF as base64 for attaching to emails */
export async function generateEnrolmentPDFBase64(data: EnrolmentPDFData): Promise<{ base64: string; filename: string }> {
  const { doc, safeName, dateStr } = await buildEnrolmentPDF(data);
  const base64 = doc.output("datauristring").split(",")[1];
  return { base64, filename: `PTLL-Enrolment-${safeName}-${dateStr}.pdf` };
}
