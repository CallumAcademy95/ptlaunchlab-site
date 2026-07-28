"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createPartnerServerClient,
  getPartnerSession,
  PARTNER_LOGIN_PATH,
} from "@/app/lib/partner-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { createRateLimiter } from "@/app/lib/rate-limit";

/**
 * Supabase applies its own auth rate limits, but those are per-project and
 * generous. This is a second, tighter limit on our side so a credential-stuffing
 * run against the partner portal burns out fast. In-memory per instance — same
 * trade-off as every other limiter in this codebase.
 */
const loginLimiter = createRateLimiter(8, 15 * 60_000);

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

export async function partnerSignOut(): Promise<void> {
  const supabase = await createPartnerServerClient();
  await supabase.auth.signOut();
  redirect(PARTNER_LOGIN_PATH);
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
