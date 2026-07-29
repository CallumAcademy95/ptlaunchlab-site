// Partner portal authentication (/partners).
//
// Deliberately SEPARATE from the admin auth in ./admin-auth.ts. That one is a
// single shared password behind an HMAC cookie, which is fine for a two-person
// admin team and wrong for external business users. Partners get Supabase Auth:
// real per-user credentials, hashed by Supabase, with password reset available.
// The two cookie systems coexist — `ptll_admin_auth` gates /admin, the Supabase
// session cookies gate /partners.
//
// Access model: the Supabase session establishes WHO the user is. Every data
// read then goes through the service-role client filtered by the partner_id
// resolved here. RLS on the pp_* tables is a second belt, never the only one.

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "./supabase-admin";

export const PARTNER_LOGIN_PATH = "/partners/login";
export const PARTNER_SET_PASSWORD_PATH = "/partners/set-password";

/**
 * The anon key is only ever used server-side here (sign-in, session refresh).
 * There is no browser Supabase client in the partner portal, so this stays a
 * non-public env var rather than NEXT_PUBLIC_.
 */
export function getPartnerAuthConfig(): { url: string; anonKey: string } | null {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Supabase client bound to the request's cookies. Use in server components and
 * actions. Returns null when the portal isn't configured — callers treat that
 * as "nobody is signed in", which fails closed rather than 500-ing the page.
 */
export async function createPartnerServerClient() {
  const config = getPartnerAuthConfig();
  if (!config) {
    console.error("[partner-auth] SUPABASE_ANON_KEY not set — partner portal is disabled.");
    return null;
  }
  const { url, anonKey } = config;
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components can't write cookies. The middleware gate refreshes
          // the session on the next request, so this is safe to swallow.
        }
      },
    },
  });
}

export interface PartnerRecord {
  id: string;
  slug: string;
  gym_name: string;
  status: "active" | "paused";
  landing_page_path: string | null;
  promo_code: string | null;
  logo_url: string | null;
  primary_color: string | null;
  fee_per_learner_pence: number;
  commission_terms: "on_enrolment" | "instalment_2";
}

export interface PartnerSession {
  userId: string;
  email: string;
  fullName: string | null;
  role: "owner" | "staff";
  mustChangePassword: boolean;
  /** Null until they dismiss the first-run walkthrough. */
  onboardingDismissedAt: string | null;
  partner: PartnerRecord;
}

/**
 * Resolve the signed-in partner, or null.
 *
 * Uses getUser() rather than getSession() — getSession() trusts the cookie
 * as-is, getUser() revalidates the token with Supabase.
 *
 * Wrapped in React cache() so the portal layout and the page it renders share
 * one result. Without it every page load costs two Supabase round trips and two
 * partner lookups to answer the same question. The cache is per-render, so it
 * never leaks one partner's session into another request.
 */
export const getPartnerSession = cache(async function getPartnerSession(): Promise<PartnerSession | null> {
  const supabase = await createPartnerServerClient();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Service role: the portal's own reads never depend on the user's JWT.
  const admin = getSupabaseAdmin();
  const { data, error: lookupError } = await admin
    .from("pp_partner_users")
    .select(
      "id, email, full_name, role, must_change_password, onboarding_dismissed_at, partner:pp_partners!inner(id, slug, gym_name, status, landing_page_path, promo_code, logo_url, primary_color, fee_per_learner_pence, commission_terms)"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[partner-auth] pp_partner_users lookup failed:", lookupError);
    return null;
  }
  // An auth.users row with no pp_partner_users row is not a partner — most
  // likely a leftover from a deleted partner. Treat it as signed out.
  if (!data) return null;

  // The client has no generated database types, so PostgREST can't infer the
  // shape of an embedded select. The cast is the shape asked for above.
  const row = data as unknown as {
    id: string;
    email: string;
    full_name: string | null;
    role: "owner" | "staff";
    must_change_password: boolean;
    onboarding_dismissed_at: string | null;
    // PostgREST types an embedded join as an array; !inner makes it a single row.
    partner: PartnerRecord | PartnerRecord[];
  };

  const partner = Array.isArray(row.partner) ? row.partner[0] : row.partner;
  if (!partner) return null;

  return {
    userId: row.id,
    email: row.email,
    fullName: row.full_name ?? null,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    onboardingDismissedAt: row.onboarding_dismissed_at ?? null,
    partner,
  };
});

/**
 * Gate a partner page. Redirects rather than returning null, so every page can
 * treat the result as guaranteed.
 *
 * `allowPasswordChange` is for /partners/set-password itself — without it that
 * page would redirect to itself forever.
 */
export async function requirePartner(
  opts: { allowPasswordChange?: boolean } = {}
): Promise<PartnerSession> {
  const session = await getPartnerSession();
  if (!session) redirect(PARTNER_LOGIN_PATH);

  if (session.partner.status !== "active") {
    redirect(`${PARTNER_LOGIN_PATH}?error=paused`);
  }
  if (session.mustChangePassword && !opts.allowPasswordChange) {
    redirect(PARTNER_SET_PASSWORD_PATH);
  }
  return session;
}

/** Their white-label academy URL, e.g. https://ptlaunchlab.co.uk/6fit-academy */
export function partnerAcademyUrl(partner: PartnerRecord): string | null {
  if (!partner.landing_page_path) return null;
  return `https://ptlaunchlab.co.uk${partner.landing_page_path}`;
}
