"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createPartnerServerClient,
  getPartnerSession,
  PARTNER_LOGIN_PATH,
} from "@/app/lib/partner-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { saveBankDetails } from "@/app/lib/partner-bank";
import { sendPartnerPasswordReset } from "@/app/lib/partner-password-reset";
import { createRateLimiter } from "@/app/lib/rate-limit";
import { revalidatePath } from "next/cache";

/**
 * Supabase applies its own auth rate limits, but those are per-project and
 * generous. This is a second, tighter limit on our side so a credential-stuffing
 * run against the partner portal burns out fast. In-memory per instance — same
 * trade-off as every other limiter in this codebase.
 */
const loginLimiter = createRateLimiter(8, 15 * 60_000);
/** Tighter than sign-in: each attempt sends a real email to someone's inbox. */
const resetLimiter = createRateLimiter(4, 15 * 60_000);

export interface PartnerFormState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 10;

async function clientIP(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip")?.trim() ?? "unknown";
}

/** Only ever send partners back to a path inside their own portal. */
function safeNextPath(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/partners") || value.startsWith("//")) return "/partners";
  if (value === PARTNER_LOGIN_PATH) return "/partners";
  return value;
}

export async function partnerSignIn(
  _prev: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  if (!loginLimiter(await clientIP())) {
    return { error: "Too many sign-in attempts. Try again in 15 minutes." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createPartnerServerClient();
  if (!supabase) {
    return { error: "The partner portal is temporarily unavailable. Please try again shortly." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately identical message for a wrong password and an unknown email —
  // otherwise this endpoint confirms which gyms we work with.
  if (error || !data.user) {
    return { error: "Email or password not recognised." };
  }

  // A valid Supabase login is not enough: the account also has to be attached to
  // an active partner. Anything else gets signed straight back out.
  const admin = getSupabaseAdmin();
  const { data: partnerUser } = await admin
    .from("pp_partner_users")
    .select("id, partner:pp_partners!inner(status)")
    .eq("id", data.user.id)
    .maybeSingle();

  const partner = partnerUser
    ? (Array.isArray(partnerUser.partner) ? partnerUser.partner[0] : partnerUser.partner)
    : null;

  if (!partnerUser || !partner) {
    await supabase.auth.signOut();
    return { error: "This account is not set up for the partner portal." };
  }
  if (partner.status !== "active") {
    await supabase.auth.signOut();
    return { error: "This partner account is paused. Contact info@ptlaunchlab.co.uk." };
  }

  await admin
    .from("pp_partner_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  // redirect() throws a control-flow signal — it must not sit inside a try block.
  redirect(safeNextPath(formData.get("next")));
}

export interface ResetRequestState {
  error?: string;
  sent?: boolean;
}

/**
 * Ask for a reset link.
 *
 * Reports success whether or not the address exists. Anything else lets an
 * anonymous caller work out which gyms we work with, one guess at a time.
 */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  if (!resetLimiter(await clientIP())) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter your email address." };

  await sendPartnerPasswordReset(email);
  return { sent: true };
}

/**
 * Redeem a reset token and set the new password.
 *
 * verifyOtp happens here rather than when the page loads, because it consumes
 * the token and writes session cookies — neither of which a server component
 * can do. It also means a link that is merely previewed, by a mail scanner for
 * instance, doesn't burn the token before its owner clicks it.
 */
export async function resetPasswordWithToken(
  _prev: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "That link is missing its token. Request a new one." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createPartnerServerClient();
  if (!supabase) {
    return { error: "The partner portal is temporarily unavailable. Please try again shortly." };
  }

  const { data, error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: token });
  if (error || !data?.user) {
    return { error: "That link has expired or has already been used. Request a new one." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { error: updateError.message || "Could not set that password. Try again." };
  }

  // They have just chosen their own, so the forced-change flow is done.
  await getSupabaseAdmin()
    .from("pp_partner_users")
    .update({ must_change_password: false })
    .eq("id", data.user.id);

  redirect("/partners");
}

export async function partnerSignOut(): Promise<void> {
  const supabase = await createPartnerServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect(PARTNER_LOGIN_PATH);
}

/** Mark the first-run walkthrough as seen. Per user, so it stays dismissed across devices. */
export async function dismissOnboarding(): Promise<void> {
  const session = await getPartnerSession();
  if (!session) return;
  const { error } = await getSupabaseAdmin()
    .from("pp_partner_users")
    .update({ onboarding_dismissed_at: new Date().toISOString() })
    .eq("id", session.userId);
  if (error) console.error("[partners] could not dismiss onboarding:", error);
  revalidatePath("/partners");
}

export async function partnerSaveBankDetails(
  _prev: PartnerFormState & { success?: string },
  formData: FormData
): Promise<PartnerFormState & { success?: string }> {
  const session = await getPartnerSession();
  if (!session) return { error: "Your session has expired. Sign in again." };

  const admin = getSupabaseAdmin();
  // Warn every login on the account, not just the one making the change —
  // that is the point of the notification.
  const { data: users } = await admin
    .from("pp_partner_users")
    .select("email")
    .eq("partner_id", session.partner.id);

  const result = await saveBankDetails({
    partnerId: session.partner.id,
    accountName: String(formData.get("accountName") ?? ""),
    sortCode: String(formData.get("sortCode") ?? ""),
    accountNumber: String(formData.get("accountNumber") ?? ""),
    updatedBy: session.userId,
    notifyEmails: (users ?? []).map((u) => u.email as string),
    gymName: session.partner.gym_name,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/partners");
  revalidatePath("/partners/payments");
  return {
    success: result.wasChange
      ? "Payment details updated. We've emailed everyone on this account to confirm."
      : "Payment details saved. Your commission will be paid to this account.",
  };
}

export async function partnerSetPassword(
  _prev: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  const session = await getPartnerSession();
  if (!session) return { error: "Your session has expired. Sign in again." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) {
    return { error: "The two passwords don't match." };
  }

  const supabase = await createPartnerServerClient();
  if (!supabase) {
    return { error: "The partner portal is temporarily unavailable. Please try again shortly." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message || "Could not update your password. Try again." };
  }

  // Only clear the flag once Supabase has actually accepted the new password —
  // otherwise a rejected password would drop them out of the forced-change flow
  // still using the one we emailed them.
  const { error: flagError } = await getSupabaseAdmin()
    .from("pp_partner_users")
    .update({ must_change_password: false })
    .eq("id", session.userId);

  if (flagError) {
    console.error("[partners] failed to clear must_change_password:", flagError);
    return { error: "Password changed, but we couldn't finish setting up. Refresh and try again." };
  }

  redirect("/partners");
}
