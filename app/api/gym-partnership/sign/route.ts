import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";
const BCC_EMAIL    = "submissions@albacomanagement.co.uk";

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
      pdfBase64, pdfFilename,
    } = body;

    if (!gymName || !repName || !repEmail || !pdfBase64 || !pdfFilename) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const signedDate = new Date(signedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const pdfAttachment = [
      { filename: pdfFilename, content: Buffer.from(pdfBase64, "base64") },
    ];

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

      <div style="background:#061F36;border:1px solid #F5C518;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">What Happens Next</div>
        <ul style="color:#8CA3BF;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
          <li>The PT Launch Lab team will be in touch shortly to confirm the partnership details</li>
          <li>We will notify you when learners are approaching qualification and ready for referral</li>
          <li>Learner CVs and profiles will be shared with you in advance of any interview introduction</li>
          <li>Your gym will be featured in our learner-facing materials as a partner employer</li>
        </ul>
      </div>

      <p style="color:#4A6280;font-size:13px;line-height:1.6;margin:0 0 20px;">
        Any questions? Contact us at
        <a href="mailto:info@ptlaunchlab.co.uk" style="color:#F5C518;">info@ptlaunchlab.co.uk</a>
        or call <a href="tel:01977365001" style="color:#F5C518;">01977 365001</a>.
      </p>

      <div style="text-align:center;">
        <a href="https://ptlaunchlab.co.uk" style="display:inline-block;padding:12px 28px;border:2px solid #F5C518;color:#F5C518;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
          ptlaunchlab.co.uk
        </a>
      </div>
    </div>

    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH · 01977 365001
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
          bcc: BCC_EMAIL,
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gym-partnership/sign]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
