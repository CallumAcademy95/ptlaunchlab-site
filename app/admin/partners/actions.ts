"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { getBankDetails, saveBankDetails } from "@/app/lib/partner-bank";
import { RESOURCE_BUCKET, RESOURCE_CATEGORIES } from "@/app/lib/partner-resources";
import { PLAYBOOK_TYPES } from "@/app/lib/partner-playbook-types";

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

export interface UploadResourceState {
  error?: string;
  success?: string;
}

export interface ResetPasswordState {
  error?: string;
  success?: string;
}

/**
 * Issue a partner a fresh temporary password and email it.
 *
 * There is no self-serve reset yet, so without this a locked-out gym owner
 * needs a trip to the Supabase dashboard — which in practice means they wait.
 * Sets must_change_password so the temporary one stops working the moment they
 * choose their own.
 */
export async function resetPartnerPassword(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { error: "Missing user." };

  const admin = getSupabaseAdmin();

  const { data: user } = await admin
    .from("pp_partner_users")
    .select("id, email, full_name, partner:pp_partners!inner(gym_name)")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return { error: "That login no longer exists." };
  const partner = Array.isArray(user.partner) ? user.partner[0] : user.partner;

  const password = generateTempPassword();

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
  if (updateError) {
    console.error("[admin/partners] password reset failed:", updateError);
    return { error: updateError.message || "Could not reset that password." };
  }

  const { error: flagError } = await admin
    .from("pp_partner_users")
    .update({ must_change_password: true })
    .eq("id", userId);
  if (flagError) console.error("[admin/partners] must_change_password not set:", flagError);

  const emailed = await sendWelcomeEmail({
    to: user.email as string,
    firstName: String(user.full_name ?? "").split(" ")[0] || null,
    gymName: (partner as { gym_name: string }).gym_name,
    password,
    isReset: true,
  });

  revalidatePath("/admin/partners");
  return {
    success: emailed
      ? `New password emailed to ${user.email}.`
      : `Password reset but the email failed. Temporary password: ${password}`,
  };
}

const MAX_RESOURCE_BYTES = 50 * 1024 * 1024;

/** Keep storage keys predictable and safe — the original name is kept as the title. */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
  return `${stem}${ext}`;
}

/**
 * Add a resource to the drive.
 *
 * A file goes into the private bucket; a link is stored as-is. Leaving
 * partner_id empty shares it with every partner, which is the common case —
 * per-partner uploads are for their own branded artwork.
 */
export async function uploadResource(
  _prev: UploadResourceState,
  formData: FormData
): Promise<UploadResourceState> {
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();
  const pack = String(formData.get("pack") ?? "").trim();
  const file = formData.get("file");

  if (!title) return { error: "Give it a title — that's what the partner sees." };
  if (!RESOURCE_CATEGORIES.some((c) => c.key === category)) return { error: "Choose a category." };

  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !externalUrl) return { error: "Attach a file or paste a link." };
  if (hasFile && file.size > MAX_RESOURCE_BYTES) return { error: "That file is over 50MB." };
  if (externalUrl && !/^https:\/\//i.test(externalUrl)) {
    return { error: "Links must start with https://" };
  }

  const admin = getSupabaseAdmin();
  let storagePath: string | null = null;

  if (hasFile) {
    const f = file as File;
    // Namespaced by partner so a shared and a per-gym file can share a name,
    // and prefixed so re-uploading the same filename never silently replaces
    // a resource partners may already be linking to.
    const prefix = partnerId ? `partners/${partnerId}` : "shared";
    storagePath = `${prefix}/${randomBytes(6).toString("hex")}-${safeFileName(f.name)}`;

    const { error: uploadError } = await admin.storage
      .from(RESOURCE_BUCKET)
      .upload(storagePath, await f.arrayBuffer(), {
        contentType: f.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[admin/partners] resource upload failed:", uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }
  }

  const { error: insertError } = await admin.from("pp_resources").insert({
    partner_id: partnerId || null,
    category,
    title,
    description: description || null,
    storage_path: storagePath,
    external_url: externalUrl || null,
    // Attaches this file to a campaign in the playbook, so the partner finds it
    // inside the campaign that needs it rather than hunting through Resources.
    pack: pack || null,
    mime: hasFile ? (file as File).type || null : null,
    file_size: hasFile ? (file as File).size : null,
  });

  if (insertError) {
    // Don't leave an orphan object in the bucket paying for storage nobody can
    // reach — nothing lists it, so it would never be found again.
    if (storagePath) await admin.storage.from(RESOURCE_BUCKET).remove([storagePath]);
    console.error("[admin/partners] resource insert failed:", insertError);
    return { error: "Could not save that resource. Nothing was uploaded." };
  }

  revalidatePath("/admin/partners");
  return {
    success: `"${title}" added${partnerId ? " for that partner" : " for all partners"}.`,
  };
}

export interface PlaybookEntryState {
  error?: string;
  success?: string;
}

/**
 * Add a playbook entry without a deploy.
 *
 * The curated entries stay as markdown in the repo — this is for the one-offs:
 * a seasonal post, a document to share this week. Both render identically at
 * /partners/playbook, and a repo entry with the same slug wins, so a reviewed
 * entry can't be quietly replaced from here.
 */
export async function addPlaybookEntry(
  _prev: PlaybookEntryState,
  formData: FormData
): Promise<PlaybookEntryState> {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const whenToUse = String(formData.get("whenToUse") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 100);
  const file = formData.get("file");

  if (!title) return { error: "Give it a title." };
  if (!PLAYBOOK_TYPES.some((t) => t.key === type)) return { error: "Choose a section." };

  const hasFile = file instanceof File && file.size > 0;
  if (!body && !hasFile && !externalUrl) {
    return { error: "Add some text, attach a file, or paste a link." };
  }
  if (hasFile && (file as File).size > MAX_RESOURCE_BYTES) return { error: "That file is over 50MB." };
  if (externalUrl && !/^https:\/\//i.test(externalUrl)) return { error: "Links must start with https://" };

  const slug =
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "entry";

  const admin = getSupabaseAdmin();
  let storagePath: string | null = null;

  if (hasFile) {
    const f = file as File;
    storagePath = `playbook/${randomBytes(6).toString("hex")}-${safeFileName(f.name)}`;
    const { error: uploadError } = await admin.storage
      .from(RESOURCE_BUCKET)
      .upload(storagePath, await f.arrayBuffer(), {
        contentType: f.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      console.error("[admin/partners] playbook upload failed:", uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }
  }

  // Upsert on slug so re-submitting the same title corrects the entry rather
  // than failing on the unique index or creating a near-duplicate.
  const { error: insertError } = await admin.from("pp_playbook_entries").upsert(
    {
      slug,
      title,
      type,
      channel: channel || null,
      when_to_use: whenToUse || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
      body_markdown: body || null,
      storage_path: storagePath,
      external_url: externalUrl || null,
      mime: hasFile ? (file as File).type || null : null,
      file_size: hasFile ? (file as File).size : null,
    },
    { onConflict: "slug" }
  );

  if (insertError) {
    if (storagePath) await admin.storage.from(RESOURCE_BUCKET).remove([storagePath]);
    console.error("[admin/partners] playbook insert failed:", insertError);
    return { error: "Could not save that entry. Nothing was uploaded." };
  }

  revalidatePath("/admin/partners");
  revalidatePath("/partners/playbook");
  return { success: `"${title}" is live in the playbook.` };
}

export interface SetBankState {
  error?: string;
  success?: string;
}

/**
 * Record bank details we were given outside the portal.
 *
 * Most partners handed these over by email long before the portal existed, so
 * without this they'd be nagged on their home page to supply something we
 * already have — and the nag is the thing that makes the portal feel unfinished.
 *
 * Goes through saveBankDetails, so a change to details already on file still
 * emails the partner and the admin. updatedBy is null, which the notification
 * reads as "changed by PT Launch Lab" rather than by them.
 */
export async function setPartnerBankDetails(
  _prev: SetBankState,
  formData: FormData
): Promise<SetBankState> {
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  if (!partnerId) return { error: "Choose a partner." };

  const admin = getSupabaseAdmin();
  const { data: partner } = await admin
    .from("pp_partners")
    .select("id, gym_name")
    .eq("id", partnerId)
    .maybeSingle();
  if (!partner) return { error: "That partner no longer exists." };

  const { data: users } = await admin
    .from("pp_partner_users")
    .select("email")
    .eq("partner_id", partnerId);

  const result = await saveBankDetails({
    partnerId,
    accountName: String(formData.get("accountName") ?? ""),
    sortCode: String(formData.get("sortCode") ?? ""),
    accountNumber: String(formData.get("accountNumber") ?? ""),
    updatedBy: null,
    notifyEmails: (users ?? []).map((u) => u.email as string),
    gymName: partner.gym_name as string,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/partners");
  return {
    success: result.wasChange
      ? `Updated for ${partner.gym_name}. The partner has been emailed about the change.`
      : `Saved for ${partner.gym_name}.`,
  };
}

/**
 * Reveal a partner's full bank details for a payment run.
 *
 * Behind the admin auth gate like everything under /admin. Deliberately an
 * action rather than part of the page payload: eight gyms' account numbers
 * rendered on every page load is one screenshot away from a bad day, and it
 * would sit in the HTML source whatever the UI showed.
 */
export async function revealBankDetails(
  partnerId: string
): Promise<{ accountName: string | null; sortCode: string | null; accountNumber: string | null } | null> {
  const details = await getBankDetails(partnerId);
  if (!details.sortCode || !details.accountNumber) return null;

  console.log(`[admin/partners] bank details revealed for partner ${partnerId}`);
  return {
    accountName: details.accountName,
    sortCode: details.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3"),
    accountNumber: details.accountNumber,
  };
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
  /** A reset reads differently to a first welcome — say which it is. */
  isReset?: boolean;
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
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">${args.isReset ? "Your password has been reset" : "Your partner portal is ready"}</div>
    </div>

    <div style="background:#0A2A44;padding:28px;border-radius:0 0 12px 12px;">
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 20px;">
        ${greeting} ${args.isReset
          ? `we've set a new temporary password on your <strong style="color:#ffffff;">${args.gymName}</strong> partner portal login.`
          : `your partner portal for <strong style="color:#ffffff;">${args.gymName}</strong> is now live.
             It has your academy link and QR code, your enrolments as they come in, and what you're owed.`}
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
      subject: args.isReset
        ? "Your PT Launch Lab portal password has been reset"
        : "Your PT Launch Lab partner portal",
      html,
    });
    return true;
  } catch (err) {
    console.error("[admin/partners] welcome email failed:", err);
    return false;
  }
}
