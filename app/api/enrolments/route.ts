import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ZAPIER_WEBHOOK = process.env.ENROLMENT_ZAPIER_WEBHOOK_URL!;
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { learnerDetails: l, learningDetails: ln, agreement: a, paymentChoice, submittedAt } = body;

    if (!l?.fullName || !l?.email) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const submittedDate = new Date(submittedAt).toLocaleString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/London",
    });

    const paymentLabel = paymentChoice === "full"
      ? "Full Payment — £1,399"
      : "Deposit Plan — £599 + 5×£200";

    // ── Zapier → Google Sheets ─────────────────────────────────────────────
    const zapierPayload = {
      submitted_at:          submittedDate,
      payment_choice:        paymentLabel,
      title:                 l.title,
      full_name:             l.fullName,
      date_of_birth:         l.dateOfBirth,
      gender:                l.gender,
      national_insurance:    l.nationalInsurance,
      mobile:                l.mobile,
      email:                 l.email,
      address_line_1:        l.addressLine1,
      address_line_2:        l.addressLine2 || "",
      town:                  l.town,
      county:                l.county || "",
      postcode:              l.postcode,
      heard_about:           ln.heardAbout,
      highest_qualification: ln.highestQualification,
      gcse_english:          ln.gcseEnglish || "N/A",
      gcse_maths:            ln.gcseMaths   || "N/A",
      gcse_ict:              ln.gcseICT     || "N/A",
      employment_status:     ln.employmentStatus,
      signature_type:        a.signatureType,
      signed_at:             new Date(a.signedAt).toLocaleString("en-GB", { timeZone: "Europe/London" }),
      details_accurate:      a.checkboxes.detailsAccurate      ? "Yes" : "No",
      self_funded:           a.checkboxes.selfFunded            ? "Yes" : "No",
      cooling_off:           a.checkboxes.coolingOffUnderstood  ? "Yes" : "No",
      terms_agreed:          a.checkboxes.termsAgreed           ? "Yes" : "No",
      commit_to_learning:    a.checkboxes.commitToLearning      ? "Yes" : "No",
    };

    const zapierRes = await fetch(ZAPIER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(zapierPayload),
    });

    if (!zapierRes.ok) {
      console.error("Zapier webhook error:", zapierRes.status, await zapierRes.text());
    }

    // ── Build signature HTML for emails ───────────────────────────────────
    const sigHtml = a.signatureType === "drawn" && a.signature?.startsWith("data:")
      ? `<img src="${a.signature}" alt="Signature" style="max-width:100%;height:80px;background:#061F36;border-radius:8px;padding:8px;" />`
      : `<span style="font-family:Georgia,serif;font-size:22px;color:#F5C518;font-style:italic;">${a.signature || "—"}</span>`;

    const cbRow = (checked: boolean, text: string) =>
      `<tr><td style="width:24px;vertical-align:top;padding:4px 0;">${
        checked
          ? `<span style="display:inline-block;width:16px;height:16px;background:#F5C518;border-radius:3px;text-align:center;line-height:16px;font-size:11px;font-weight:bold;color:#072B4A;">✓</span>`
          : `<span style="display:inline-block;width:16px;height:16px;border:2px solid #3B82F6;border-radius:3px;"></span>`
      }</td><td style="padding:4px 0 4px 8px;color:#8CA3BF;font-size:13px;line-height:1.5;">${text}</td></tr>`;

    const sectionHead = (title: string) =>
      `<tr><td colspan="2" style="padding:18px 0 6px;"><div style="background:#0D3559;padding:6px 12px;border-radius:6px;"><strong style="color:#F5C518;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${title}</strong></div></td></tr>`;

    const dataRow = (label: string, value: string) =>
      `<tr><td style="color:#4A6280;font-size:12px;padding:3px 0;width:170px;vertical-align:top;">${label}</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:3px 0;">${value || "—"}</td></tr>`;

    // ── Admin notification email ───────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">New Learner Enrolment</div>
    </div>

    <!-- Alert banner -->
    <div style="background:#0D3559;padding:16px 28px;border-left:4px solid #F5C518;">
      <div style="font-size:18px;font-weight:700;color:#F5C518;">New Enrolment: ${l.title} ${l.fullName}</div>
      <div style="color:#8CA3BF;font-size:13px;margin-top:4px;">${submittedDate} &nbsp;·&nbsp; ${paymentLabel}</div>
    </div>

    <!-- Body -->
    <div style="background:#0A2A44;padding:24px 28px;border-radius:0 0 12px 12px;">
      <table style="width:100%;border-collapse:collapse;">

        ${sectionHead("Personal Information")}
        ${dataRow("Full Name", `${l.title} ${l.fullName}`)}
        ${dataRow("Date of Birth", l.dateOfBirth ? new Date(l.dateOfBirth + "T12:00:00").toLocaleDateString("en-GB") : "")}
        ${dataRow("Gender", l.gender)}
        ${dataRow("National Insurance", l.nationalInsurance)}

        ${sectionHead("Contact Details")}
        ${dataRow("Mobile", l.mobile)}
        ${dataRow("Email", l.email)}

        ${sectionHead("Home Address")}
        ${dataRow("Address", [l.addressLine1, l.addressLine2, l.town, l.county, l.postcode].filter(Boolean).join(", "))}

        ${sectionHead("Learning Information")}
        ${dataRow("How They Found Us", ln.heardAbout)}
        ${dataRow("Highest Qualification", ln.highestQualification)}
        ${dataRow("Employment Status", ln.employmentStatus)}
        ${dataRow("GCSE English / Maths / ICT", [ln.gcseEnglish || "N/A", ln.gcseMaths || "N/A", ln.gcseICT || "N/A"].join(" / "))}

        ${sectionHead("Learner Agreement — Declarations")}
        ${cbRow(a.checkboxes.detailsAccurate,      "All information provided is true and accurate")}
        ${cbRow(a.checkboxes.selfFunded,           "Understands this is self-funded")}
        ${cbRow(a.checkboxes.coolingOffUnderstood, "Has read and understood the cooling off and refund terms")}
        ${cbRow(a.checkboxes.commitToLearning,     "Commits to engaging with the learning process")}
        ${cbRow(a.checkboxes.termsAgreed,          "Has read and agreed to the Terms and Conditions")}

        ${sectionHead("Signature")}
        <tr><td colspan="2" style="padding:10px 0;">
          <div style="background:#061F36;border-radius:8px;padding:16px;border:1px solid #1A3A5C;">
            ${sigHtml}
            <div style="color:#4A6280;font-size:11px;margin-top:8px;">
              Signed: ${new Date(a.signedAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
              &nbsp;·&nbsp; Method: ${a.signatureType === "drawn" ? "Handwritten (digital canvas)" : "Typed full name"}
            </div>
          </div>
        </td></tr>

      </table>

      <!-- CTA -->
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #1A3A5C;text-align:center;">
        <div style="color:#8CA3BF;font-size:13px;margin-bottom:16px;">A signed PDF copy has been downloaded by the learner. The data above is your admin record.</div>
        <a href="mailto:${l.email}" style="display:inline-block;padding:12px 28px;background:#F5C518;color:#072B4A;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
          Reply to ${l.fullName.split(" ")[0]} →
        </a>
      </div>
    </div>

    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH
    </div>
  </div>
</body>
</html>`;

    // ── Student confirmation email ─────────────────────────────────────────
    const studentHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Enrolment Confirmation</div>
    </div>

    <!-- Body -->
    <div style="background:#0A2A44;padding:28px;border-radius:0 0 12px 12px;">
      <h2 style="color:#F5C518;font-size:22px;margin:0 0 8px;">You're enrolled, ${l.fullName.split(" ")[0]}.</h2>
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 20px;">
        We've received your enrolment form. This email is your official confirmation — keep it safe for your records.
      </p>

      <!-- Summary box -->
      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Your Enrolment Summary</div>
        <table style="width:100%;border-collapse:collapse;">
          ${dataRow("Name", `${l.title} ${l.fullName}`)}
          ${dataRow("Email", l.email)}
          ${dataRow("Mobile", l.mobile)}
          ${dataRow("Payment plan", paymentLabel)}
          ${dataRow("Enrolled on", submittedDate)}
        </table>
      </div>

      <!-- What happens next -->
      <div style="background:#061F36;border:1px solid #F5C518;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">What Happens Next</div>
        <ul style="color:#8CA3BF;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
          <li>Your payment is being processed via Stripe</li>
          <li>Once confirmed, you'll receive your course login details</li>
          <li>Your personal tutor will be assigned on day one</li>
          <li>You can start your first module the same day</li>
        </ul>
      </div>

      <!-- Signature copy -->
      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:16px;margin-bottom:24px;">
        <div style="color:#4A6280;font-size:11px;margin-bottom:8px;">Your signature on file:</div>
        ${sigHtml}
        <div style="color:#4A6280;font-size:11px;margin-top:8px;">
          Signed: ${new Date(a.signedAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
        </div>
      </div>

      <p style="color:#4A6280;font-size:13px;line-height:1.6;margin:0 0 20px;">
        If you have any questions before your course access is set up, email us at
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

    // ── Send emails ───────────────────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      await Promise.all([
        resend.emails.send({
          from: "PT Launch Lab Enrolments <onboarding@resend.dev>",
          to: ADMIN_EMAIL,
          subject: `New Enrolment: ${l.fullName} — ${paymentLabel}`,
          html: adminHtml,
        }),
        resend.emails.send({
          from: "PT Launch Lab <onboarding@resend.dev>",
          to: l.email,
          subject: "Your PT Launch Lab Enrolment Confirmation",
          html: studentHtml,
        }),
      ]);
    } else {
      console.warn("[enrolments] RESEND_API_KEY not set — skipping emails.");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Enrolment API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
