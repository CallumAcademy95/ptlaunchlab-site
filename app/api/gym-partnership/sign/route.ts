import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { generatePartnershipAgreementPDFServer } from "@/app/lib/server/generatePartnershipAgreementPDF.server";
import { PHONE_NATIONAL, PHONE_TEL } from "@/app/lib/contactDetails";
import {
  PARTNERSHIP_AGREEMENT_VERSION,
  PARTNERSHIP_AGREEMENT_SUMMARY,
} from "@/app/lib/partnershipAgreement";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

const rateLimiter = createRateLimiter(3, 60_000);

export async function POST(req: NextRequest) {
  if (!rateLimiter(getIP(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      gymName, companyNumber, registeredAddress,
      repName, repPosition, repEmail,
      signatureType, signedAt,
      acknowledgedKeyTerms,
    } = body;

    if (!gymName || !repName || !repEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Generate PDF server-side ──────────────────────────────────────────
    const { buffer: pdfBuffer, filename: pdfFilename } = await generatePartnershipAgreementPDFServer({
      gymName, companyNumber, registeredAddress,
      repName, repPosition, repEmail,
      gymSignature: body.gymSignature ?? "",
      gymSignatureType: body.gymSignatureType ?? "typed",
      signedAt,
      acknowledgedKeyTerms: acknowledgedKeyTerms === true,
    });
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfAttachment = [{ filename: pdfFilename, content: pdfBuffer }];

    const signedDate = new Date(signedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const dataRow = (label: string, value: string) =>
      `<tr>
        <td style="color:#4A6280;font-size:12px;padding:4px 0;width:170px;vertical-align:top;">${label}</td>
        <td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${value || "—"}</td>
      </tr>`;

    const sectionHead = (title: string) =>
      `<tr><td colspan="2" style="padding:18px 0 6px;"><div style="background:#0D3559;padding:6px 12px;border-radius:6px;"><strong style="color:#F5C518;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${title}</strong></div></td></tr>`;

    // ── Admin notification email ─────────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">

    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Gym Partnership Agreement Signed</div>
    </div>

    <div style="background:#0D3559;padding:16px 28px;border-left:4px solid #F5C518;">
      <div style="font-size:18px;font-weight:700;color:#F5C518;">New Partner: ${gymName}</div>
      <div style="color:#8CA3BF;font-size:13px;margin-top:4px;">Signed ${signedDate} by ${repName}</div>
    </div>

    <div style="background:#0A2A44;padding:24px 28px;border-radius:0 0 12px 12px;">
      <table style="width:100%;border-collapse:collapse;">
        ${sectionHead("Gym / Company")}
        ${dataRow("Gym Name", gymName)}
        ${dataRow("Company Number", companyNumber)}
        ${dataRow("Registered Address", registeredAddress)}

        ${sectionHead("Authorised Signatory")}
        ${dataRow("Name", repName)}
        ${dataRow("Position", repPosition)}
        ${dataRow("Email", repEmail)}

        ${sectionHead("Signature")}
        ${dataRow("Method", signatureType === "drawn" ? "Handwritten (digital canvas)" : "Typed full name")}
        ${dataRow("Date Signed", signedDate)}
        ${dataRow("Agreement Version", `v${PARTNERSHIP_AGREEMENT_VERSION} — ${PARTNERSHIP_AGREEMENT_SUMMARY}`)}
        ${dataRow("Key Terms Acknowledged", acknowledgedKeyTerms === true ? "Yes — ticked before signing" : "NO — check how this was submitted")}
      </table>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #1A3A5C;">
        <p style="color:#8CA3BF;font-size:13px;margin:0 0 16px;">The signed PDF is attached. A copy has also been sent to ${repEmail}.</p>
        <a href="mailto:${repEmail}" style="display:inline-block;padding:12px 28px;background:#F5C518;color:#072B4A;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
          Reply to ${repName.split(" ")[0]} →
        </a>
      </div>
    </div>

    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH
    </div>
  </div>
</body>
</html>`;

    // ── Gym confirmation email ────────────────────────────────────────────────
    const gymHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Partnership Agreement Confirmed</div>
    </div>

    <div style="background:#0A2A44;padding:28px;border-radius:0 0 12px 12px;">
      <h2 style="color:#F5C518;font-size:22px;margin:0 0 8px;">Welcome to the partnership, ${repName.split(" ")[0]}.</h2>
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Your signed PT Launch Lab Gym Partnership Agreement is attached to this email. Please save a copy for your records.
      </p>

      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Agreement Details</div>
        <table style="width:100%;border-collapse:collapse;">
          ${dataRow("Gym", gymName)}
          ${dataRow("Signed by", repName)}
          ${dataRow("Position", repPosition)}
          ${dataRow("Date", signedDate)}
        </table>
      </div>

      <div style="background:#061F36;border:1px solid #F5C518;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Your Commercial Terms</div>
        <ul style="color:#8CA3BF;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
          <li><strong style="color:#ffffff;">£500 for every learner who enrols through your gym</strong> — inclusive of VAT, nothing added on top (Clause 5.1–5.2)</li>
          <li>Paid 30 days after enrolment if the learner pays in full. If they are on an instalment plan, it is held until their second instalment clears, then paid 30 days after that (Clause 5.4)</li>
          <li>If a learner is refunded, cancels or their payment is reversed, the commission on that enrolment is returned — normally offset against your next payment (Clauses 5.8–5.9)</li>
          <li>You can see accrued, released and paid commission any time in your partner portal</li>
        </ul>
      </div>

      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">What Happens Next</div>
        <ul style="color:#8CA3BF;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
          <li>Send us your logo and brand assets — we build your white-label academy page, tracking link and QR code within 14 days (Clause 3.2)</li>
          <li>You will receive partner portal login details to track referrals, enrolments and commission</li>
          <li>Send us your bank details so commission can be paid when it is released</li>
          <li>Promote your academy link and QR code in your gym and across your socials — every enrolment through it earns you £500</li>
        </ul>
      </div>

      <p style="color:#4A6280;font-size:13px;line-height:1.6;margin:0 0 20px;">
        Any questions? Contact us at
        <a href="mailto:info@ptlaunchlab.co.uk" style="color:#F5C518;">info@ptlaunchlab.co.uk</a>
        or call <a href="tel:${PHONE_TEL}" style="color:#F5C518;">${PHONE_NATIONAL}</a>.
      </p>

      <div style="text-align:center;">
        <a href="https://ptlaunchlab.co.uk" style="display:inline-block;padding:12px 28px;border:2px solid #F5C518;color:#F5C518;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
          ptlaunchlab.co.uk
        </a>
      </div>
    </div>

    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH · ${PHONE_NATIONAL}
    </div>
  </div>
</body>
</html>`;

    if (process.env.RESEND_API_KEY) {
      await Promise.all([
        // Admin copy
        resend.emails.send({
          from: "PT Launch Lab Partnerships <partnerships@ptlaunchlab.co.uk>",
          to: ADMIN_EMAIL,

          subject: `Gym Partnership Signed: ${gymName} — ${repName}`,
          html: adminHtml,
          attachments: pdfAttachment,
        }),
        // Gym copy
        resend.emails.send({
          from: "PT Launch Lab <partnerships@ptlaunchlab.co.uk>",
          to: repEmail,
          subject: "Your PT Launch Lab Partnership Agreement",
          html: gymHtml,
          attachments: pdfAttachment,
        }),
      ]);
    } else {
      console.warn("[gym-partnership/sign] RESEND_API_KEY not set — skipping emails.");
    }

    // ── Zapier → Google Drive ─────────────────────────────────────────────
    const gymZapierWebhook = process.env.GYM_PARTNERSHIP_SIGN_ZAPIER_WEBHOOK_URL;
    if (gymZapierWebhook) {
      fetch(gymZapierWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gym_name:           gymName,
          company_number:     companyNumber,
          registered_address: registeredAddress,
          rep_name:           repName,
          rep_position:       repPosition,
          rep_email:          repEmail,
          signed_at:          signedDate,
          // Which set of terms this gym actually signed. Partners on v1.0 keep
          // the original 30-day commission; v2.0+ carry the instalment-2 hold.
          agreement_version:  PARTNERSHIP_AGREEMENT_VERSION,
          acknowledged_key_terms: acknowledgedKeyTerms === true,
          pdf_filename:       pdfFilename,
          pdf_base64:         pdfBase64,
        }),
      }).catch((err) => console.error("[gym-partnership/sign] Zapier webhook error:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gym-partnership/sign]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
