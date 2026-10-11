// app/api/lead/route.ts — the one door for website leads. See app/lib/leads.ts.
import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { processLead, type LeadDeps } from "@/app/lib/leads";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendOwnerPush } from "@/app/lib/owner-push";
import { notifySetter } from "@/app/lib/setter-intake";
import { makeSideEffects } from "@/app/lib/leadSideEffects";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

export const runtime = "nodejs";

const limiter = createRateLimiter(10, 60_000);

export async function POST(req: NextRequest) {
  if (!limiter(getIP(req))) return NextResponse.json({ ok: false, message: "Too many tries — wait a minute." }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Bad request." }, { status: 400 }); }

  const db = getSupabaseAdmin();
  const fx = makeSideEffects(req);
  const deps: LeadDeps = {
    insert: async (row) => {
      const { data, error } = await db.from("leads").insert(row).select("id").single();
      return error || !data ? { error: error?.message ?? "no row" } : { id: data.id as string };
    },
    update: async (id, patch) => { await db.from("leads").update(patch).eq("id", id); },
    push: (p) => sendOwnerPush(db as never, p),
    setter: (l) => notifySetter(l),
    zapier: fx.zapier, mailerlite: fx.mailerlite, capi: fx.capi,
    newEventId: () => `lead_${randomUUID()}`,
  };

  const result = await processLead(body, deps);
  if (result.after) after(result.after);
  return NextResponse.json(result.body, { status: result.status });
}
