"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

// Gated by the existing admin auth cookie via isProtectedAdminPath in
// middleware.ts — every /admin/* path already requires it, including the server
// action POSTs made from these pages.

export interface CreatePartnerUserState {
  error?: string;
  success?: string;
}

export interface MarkPaidState {
  error?: string;
  success?: string;
}

/**
 * Record a commission payment to a partner.
 *
 * Writes one pp_payouts row and attaches every enrolment it covered, so the
 * partner's Payments page can answer "what was this for" rather than showing an
 * unexplained lump.
 *
 * The date is entered rather than assumed to be today: partners get paid early
 * — every payout so far went out before the commission had formally released —
 * and a payment record with the wrong date is worse than no record.
 */
export async function markCommissionPaid(
  _prev: MarkPaidState,
  formData: FormData
): Promise<MarkPaidState> {
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const paidOn = String(formData.get("paidOn") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();

  if (!partnerId) return { error: "Missing partner." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return { error: "Enter the date the payment was sent." };

  const admin = getSupabaseAdmin();

  const { data: partner } = await admin
    .from("pp_partners")
    .select("id, gym_name")
    .eq("id", partnerId)
    .maybeSingle();
  if (!partner) return { error: "That partner no longer exists." };

  // Only commission that has actually released. Re-reading here rather than
  // trusting an id list from the form means a sale that released, or got
  // voided, between page render and submit is handled correctly.
  const { data: sales, error } = await admin
    .from("pp_sales")
    .select("id, commission_pence, commission_release_at")
    .eq("partner_id", partnerId)
    .eq("status", "confirmed")
    .neq("commission_status", "paid")
    .neq("commission_status", "voided")
    .not("commission_release_at", "is", null)
    .lte("commission_release_at", new Date().toISOString());

  if (error) {
    console.error("[admin/partners] payable lookup failed:", error);
    return { error: "Could not read what's payable. Nothing was changed." };
  }
  if (!sales?.length) return { error: "Nothing is payable for that partner right now." };

  const total = sales.reduce((t, s) => t + (s.commission_pence as number), 0);

  const { data: payout, error: payoutError } = await admin
    .from("pp_payouts")
    .insert({
      partner_id: partnerId,
      period_label: `Paid ${new Date(paidOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      total_pence: total,
      status: "paid",
      reference: reference || null,
      paid_at: `${paidOn}T00:00:00.000Z`,
    })
    .select("id")
    .single();

  if (payoutError || !payout) {
    console.error("[admin/partners] payout insert failed:", payoutError);
    return { error: "Could not record the payment. Nothing was changed." };
  }

  const { error: linkError } = await admin
    .from("pp_sales")
    .update({ commission_status: "paid", payout_id: payout.id })
    .in("id", sales.map((s) => s.id));

  if (linkError) {
    // Leave no payout with nothing attached — it would inflate the partner's
    // "already paid" total against enrolments still showing as owed.
    await admin.from("pp_payouts").delete().eq("id", payout.id);
    console.error("[admin/partners] payout link failed, rolled back:", linkError);
    return { error: "Could not attach the enrolments. Nothing was changed." };
  }

  revalidatePath("/admin/partners");
  const amount = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
    .format(total / 100);

  return {
    success: `Recorded ${amount} paid to ${partner.gym_name} on ${paidOn} — ${sales.length} enrolment${sales.length === 1 ? "" : "s"} settled.`,
  };
}

/**
 * URL-safe, no ambiguous characters to misread off a screen or an email.
 * They are forced to change it on first sign-in anyway.
 */
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function createPartnerUser(
  _prev: CreatePartnerUserState,
  formData: FormData
): Promise<CreatePartnerUserState> {
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "owner");

  if (!partnerId) return { error: "Choose a partner." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (role !== "owner" && role !== "staff") return { error: "Invalid role." };

  const admin = getSupabaseAdmin();

  const { data: partner, error: partnerError } = await admin
    .from("pp_partners")
    .select("id, gym_name, slug, landing_page_path")
    .eq("id", partnerId)
    .maybeSingle();

  if (partnerError || !partner) return { error: "That partner no longer exists." };

  const password = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no confirmation link — the welcome email carries the password
    user_metadata: { partner_slug: partner.slug },
  });

  if (createError || !created?.user) {
    // The most common failure by far, and the one worth naming precisely.
    if (createError?.message?.toLowerCase().includes("already")) {
      return { error: `${email} already has an account. Delete it first, or use another address.` };
    }
    console.error("[admin/partners] createUser failed:", createError);
    return { error: createError?.message || "Could not create the login." };
  }

  const { error: insertError } = await admin.from("pp_partner_users").insert({
    id: created.user.id,
    partner_id: partner.id,
    email,
    full_name: fullName || null,
    role,
    must_change_password: true,
  });

  if (insertError) {
    // Roll the auth user back — an auth.users row with no pp_partner_users row
    // can sign in but resolves to no partner, which is a confusing dead end.
    await admin.auth.admin.deleteUser(created.user.id);
    console.error("[admin/partners] pp_partner_users insert failed:", insertError);
    return { error: "Could not link that login to the partner. Nothing was created." };
  }

  const emailed = await sendWelcomeEmail({
    to: email,
    firstName: fullName.split(" ")[0] || null,
    gymName: partner.gym_name as string,
    password,
  });

  revalidatePath("/admin/partners");

  return {
    success: emailed
      ? `Login created for ${email}. The welcome email with their temporary password has been sent.`
      : `Login created for ${email}, but the welcome email failed to send. Temporary password: ${password}`,
  };
}

async function sendWelcomeEmail(args: {
  to: string;
  firstName: string | null;
  gymName: string;
  password: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[admin/partners] RESEND_API_KEY not set — skipping welcome email.");
    return false;
  }

  const greeting = args.firstName ? `Hi ${args.firstName},` : "Hi,";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Your partner portal is ready</div>
    </div>

    <div style="background:#0A2A44;padding:28px;border-radius:0 0 12px 12px;">
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 20px;">
        ${greeting} your partner portal for <strong style="color:#ffffff;">${args.gymName}</strong> is now live.
        It has your academy link and QR code, your enrolments as they come in, and what you're owed.
      </p>

      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Your sign-in details</div>
        <p style="color:#8CA3BF;font-size:13px;margin:0 0 6px;">Email</p>
        <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 14px;">${args.to}</p>
        <p style="color:#8CA3BF;font-size:13px;margin:0 0 6px;">Temporary password</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1px;font-family:monospace;margin:0;">${args.password}</p>
      </div>

      <p style="color:#8CA3BF;font-size:14px;line-height:1.6;margin:0 0 24px;">
        You'll be asked to choose your own password the first time you sign in. This one stops working after that.
      </p>

      <div style="text-align:center;">
        <a href="https://ptlaunchlab.co.uk/partners/login" style="display:inline-block;padding:14px 32px;background:#F5C518;color:#072B4A;font-weight:700;font-size:15px;border-radius:50px;text-decoration:none;">
          Sign in to your portal
        </a>
      </div>

      <p style="color:#4A6280;font-size:13px;line-height:1.6;margin:24px 0 0;">
        Any problems, reply to this email or call
        <a href="tel:01977365001" style="color:#F5C518;">01977 365001</a>.
      </p>
    </div>

    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH
    </div>
  </div>
</body>
</html>`;

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "PT Launch Lab Partnerships <partnerships@ptlaunchlab.co.uk>",
      to: args.to,
      subject: "Your PT Launch Lab partner portal",
      html,
    });
    return true;
  } catch (err) {
    console.error("[admin/partners] welcome email failed:", err);
    return false;
  }
}
