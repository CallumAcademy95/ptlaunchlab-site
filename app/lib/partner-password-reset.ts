// Self-serve password reset for partners.
//
// Uses auth.admin.generateLink to mint a recovery token, then sends it in our
// own email rather than calling resetPasswordForEmail. Two reasons: Supabase's
// template would arrive looking nothing like everything else we send, and the
// redirect allow-list becomes one more piece of dashboard config that silently
// breaks the flow when someone forgets it.
//
// The token is single-use and expires on Supabase's own recovery timeout.

import { Resend } from "resend";
import { getSupabaseAdmin } from "./supabase-admin";

const SITE = "https://ptlaunchlab.co.uk";

/**
 * Send a reset link, if that address belongs to a partner.
 *
 * Always resolves the same way whatever happens. Telling an anonymous caller
 * whether an address exists turns this endpoint into a way of enumerating which
 * gyms we work with.
 */
export async function sendPartnerPasswordReset(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!clean.includes("@")) return;

  const admin = getSupabaseAdmin();

  // Only partners. A Supabase user who isn't in pp_partner_users has no
  // business receiving a partner-portal reset.
  const { data: user } = await admin
    .from("pp_partner_users")
    .select("id, full_name, partner:pp_partners!inner(gym_name)")
    .eq("email", clean)
    .maybeSingle();

  if (!user) {
    console.log(`[partner-reset] no partner login for ${clean} — nothing sent`);
    return;
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: clean,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("[partner-reset] could not generate a recovery token:", error);
    return;
  }

  const link = `${SITE}/partners/reset-password?token=${encodeURIComponent(data.properties.hashed_token)}`;
  const partner = Array.isArray(user.partner) ? user.partner[0] : user.partner;
  const firstName = String(user.full_name ?? "").trim().split(/\s+/)[0] || null;

  if (!process.env.RESEND_API_KEY) {
    console.error("[partner-reset] RESEND_API_KEY not set — reset link NOT sent.");
    return;
  }

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "PT Launch Lab Partnerships <partnerships@ptlaunchlab.co.uk>",
      to: clean,
      replyTo: "info@ptlaunchlab.co.uk",
      subject: "Reset your PT Launch Lab portal password",
      html: resetEmail({
        firstName,
        gymName: (partner as { gym_name: string })?.gym_name ?? "your gym",
        link,
      }),
    });
  } catch (err) {
    console.error("[partner-reset] send failed:", err);
  }
}

function resetEmail(args: { firstName: string | null; gymName: string; link: string }) {
  const hi = args.firstName ? `Hi ${args.firstName},` : "Hi,";
  const p = `margin:0 0 16px;color:#1E2A38;font-size:15px;line-height:1.65;`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#0B1F38;padding:22px 32px;">
      <span style="color:#F5C518;font-size:13px;font-weight:800;letter-spacing:.14em;">PT LAUNCH LAB</span>
    </div>
    <div style="padding:32px;">
      <p style="${p}">${hi}</p>
      <p style="${p}">
        Someone asked to reset the password on the <strong>${args.gymName}</strong> partner portal
        account. Use the button below to choose a new one.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${args.link}"
           style="display:inline-block;padding:15px 38px;background:#F5C518;color:#0B1F38;font-weight:700;font-size:15px;border-radius:50px;text-decoration:none;">
          Choose a new password
        </a>
      </div>
      <p style="${p}">
        The link works once and expires shortly, so use it now rather than saving it for later.
      </p>
      <p style="margin:24px 0 0;color:#7A8899;font-size:14px;line-height:1.6;">
        <strong style="color:#1E2A38;">If this wasn't you</strong>, ignore this email — nothing has
        changed and your password still works. If it keeps happening, call us on
        <a href="tel:01977365001" style="color:#0B1F38;font-weight:600;">01977 365001</a>.
      </p>
    </div>
    <div style="background:#0B1F38;padding:18px 32px;text-align:center;">
      <div style="color:#7C90A8;font-size:12px;">PT Launch Lab · Pontefract WF8 4AH</div>
    </div>
  </div>
</body></html>`;
}
