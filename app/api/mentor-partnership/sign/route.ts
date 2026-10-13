import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { generateMentorAgreementPDFServer } from "@/app/lib/server/generateMentorAgreementPDF.server";
import {
  MENTOR_AGREEMENT_VERSION,
  MENTOR_AGREEMENT_SUMMARY,
} from "@/app/lib/mentorPartnerAgreement";
import { ADDRESS_ONE_LINE } from "@/app/lib/contactDetails";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

const rateLimiter = createRateLimiter(3, 60_000);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: NextRequest) {
  if (!rateLimiter(getIP(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

    const businessName  = str(body.businessName, 120);
    const companyNumber = str(body.companyNumber, 20);
    const address       = str(body.address, 300);
    const repName       = str(body.repName, 120);
    const repPosition   = str(body.repPosition, 80);
    const repEmail      = str(body.repEmail, 200);
    const signatureType = body.signatureType === "typed" ? "typed" : "drawn";
    const signature     = typeof body.signature === "string" ? body.signature.slice(0, 200_000) : "";
    const signedAt      = Number.isNaN(Date.parse(body.signedAt)) ? new Date().toISOString() : body.signedAt;
    const acknowledged  = body.acknowledgedKeyTerms === true;

    if (!businessName || !address || !repName || !repEmail || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!EMAIL_RE.test(repEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!acknowledged) {
      return NextResponse.json({ error: "Please confirm you have read the agreement" }, { status: 400 });
    }

    const { buffer: pdfBuffer, filename: pdfFilename } = await generateMentorAgreementPDFServer({
      businessName, companyNumber, address,
      repName, repPosition, repEmail,
      signature, signatureType,
      signedAt,
      acknowledgedKeyTerms: acknowledged,
    });
    const attachments = [{ filename: pdfFilename, content: pdfBuffer }];

    const signedDate = new Date(signedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const row = (label: string, value: string) =>
      `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;width:170px;vertical-align:top;">${label}</td>` +
      `<td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${esc(value) || "—"}</td></tr>`;

    const shell = (heading: string, inner: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">${heading}</div>
    </div>
    <div style="background:#0A2A44;padding:24px 28px;border-radius:0 0 12px 12px;">${inner}</div>
    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · ${ADDRESS_ONE_LINE}
    </div>
  </div>
</body></html>`;

    const adminHtml = shell(
      "Business Mentorship Partner Agreement Signed",
      `<table style="width:100%;border-collapse:collapse;">
        ${row("Business", businessName)}
        ${row("Company number", companyNumber || "Sole trader / not given")}
        ${row("Address", address)}
        ${row("Signed by", repName)}
        ${row("Position", repPosition)}
        ${row("Email", repEmail)}
        ${row("Method", signatureType === "drawn" ? "Drawn signature" : "Typed full name")}
        ${row("Date signed", signedDate)}
        ${row("Version", `v${MENTOR_AGREEMENT_VERSION} — ${MENTOR_AGREEMENT_SUMMARY}`)}
        ${row("Key terms acknowledged", acknowledged ? "Yes — ticked before signing" : "NO")}
      </table>
      <p style="color:#8CA3BF;font-size:13px;margin:20px 0 0;">The signed PDF is attached. A copy has also been sent to ${esc(repEmail)}.</p>`
    );

    const signerHtml = shell(
      "Business Mentorship Partner Agreement",
      `<h2 style="color:#F5C518;font-size:22px;margin:0 0 8px;">Thanks, ${esc(repName.split(" ")[0])}.</h2>
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Your signed agreement with PT Launch Lab is attached. Please keep a copy for your records.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Business", businessName)}
        ${row("Signed by", repName)}
        ${row("Date", signedDate)}
        ${row("Version", `v${MENTOR_AGREEMENT_VERSION}`)}
      </table>
      <p style="color:#4A6280;font-size:13px;line-height:1.6;margin:20px 0 0;">
        Any questions, email <a href="mailto:info@ptlaunchlab.co.uk" style="color:#F5C518;">info@ptlaunchlab.co.uk</a>.
      </p>`
    );

    if (!process.env.RESEND_API_KEY) {
      console.error("[mentor-partnership/sign] RESEND_API_KEY not set — agreement not delivered.");
      return NextResponse.json({ error: "Email is not configured. Please contact info@ptlaunchlab.co.uk." }, { status: 503 });
    }

    const results = await Promise.all([
      resend.emails.send({
        from: "PT Launch Lab Partnerships <partnerships@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        subject: `Mentor Partner Agreement Signed: ${businessName} — ${repName}`,
        html: adminHtml,
        attachments,
      }),
      resend.emails.send({
        from: "PT Launch Lab <partnerships@ptlaunchlab.co.uk>",
        to: repEmail,
        subject: "Your PT Launch Lab Mentor Partner Agreement",
        html: signerHtml,
        attachments,
      }),
    ]);
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error("[mentor-partnership/sign] email failed:", failed.error);
      return NextResponse.json({ error: "We couldn't send the signed copy. Please contact info@ptlaunchlab.co.uk." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mentor-partnership/sign]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
