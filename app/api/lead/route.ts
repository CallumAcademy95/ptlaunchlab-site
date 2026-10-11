// app/api/lead/route.ts — the one door for website leads. See app/lib/leads.ts.
import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { processLead, type LeadDeps } from "@/app/lib/leads";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendOwnerPush } from "@/app/lib/owner-push";
import { notifySetter } from "@/app/lib/setter-intake";
import type { OwnerPushDb } from "@/app/lib/owner-push";
import { getGymByPartnerSlug } from "@/app/lib/gyms";
import { liveExtras, makeSideEffects, validateGymCallback } from "@/app/lib/leadSideEffects";
import { spamReasonFor } from "@/app/lib/leadSpam";
import { checkHoneypot } from "@/app/lib/security/honeypot";
import { validateName, validateBusinessName } from "@/app/lib/security/name";
import { validateEmail } from "@/app/lib/security/email";
import { validateGymPartnershipSec } from "@/app/lib/security/validate";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

export const runtime = "nodejs";

const limiter = createRateLimiter(10, 60_000);

const SPAM_VALIDATORS = {
  checkHoneypot: (sec: unknown) => checkHoneypot(sec),
  gymPartnershipSec: validateGymPartnershipSec,
  validateName: (n: unknown) => validateName(n),
  validateBusinessName,
  validateEmail,
};

export async function POST(req: NextRequest) {
  if (!limiter(getIP(req))) return NextResponse.json({ ok: false, message: "Too many tries — wait a minute." }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Bad request." }, { status: 400 }); }

  const b = body as Record<string, unknown> | null;
  if (b && b.intent === "gym_callback") {
    const bad = validateGymCallback(b.gymSlug, (slug) => getGymByPartnerSlug(slug));
    if (bad) return NextResponse.json(bad, { status: 400 });
  }

  // The client is created lazily inside the deps, so a missing env var or a
  // client error throws inside processLead's insert: that takes the NOT SAVED
  // push path and the friendly 500, never an unhandled crash.
  let client: ReturnType<typeof getSupabaseAdmin> | null = null;
  const db = () => (client ??= getSupabaseAdmin());
  const fx = makeSideEffects(req);
  const deps: LeadDeps = {
    insert: async (row) => {
      const { data, error } = await db().from("leads").insert(row).select("id").single();
      return error || !data ? { error: error?.message ?? "no row" } : { id: data.id as string };
    },
    update: async (id, patch) => {
      const { error } = await db().from("leads").update(patch).eq("id", id);
      if (error) console.error("[lead] status update failed", id, Object.keys(patch).join(","), error.message);
    },
    push: (p) => sendOwnerPush(db() as unknown as OwnerPushDb, p),
    setter: (l) => notifySetter(l),
    zapier: fx.zapier, mailerlite: fx.mailerlite, capi: fx.capi,
    newEventId: () => `lead_${randomUUID()}`,
    spamCheck: (raw) => spamReasonFor(raw, SPAM_VALIDATORS),
  };

  const result = await processLead(body, deps);
  if (result.after) after(result.after);
  const saved = result.status === 200 && (result.body as { ok?: boolean }).ok === true;
  const intent = typeof b?.intent === "string" ? b.intent : "";
  const out = saved ? { ...result.body, ...liveExtras(intent, process.env) } : result.body;
  return NextResponse.json(out, { status: result.status });
}
