// ─────────────────────────────────────────────────────────────────────────────
// Automated Google Business Profile posting.
//
// Vercel Cron hits this on a schedule (see vercel.json). It picks one post from
// lib/gbp/posts.json, checks the destination and image still resolve, then POSTs
// it to the Make webhook, which creates the post on the Business Profile.
//
// Rotation is stateless and derived from the date, so there is nothing to store
// and no drift if a run is missed — each day maps to one post, and the library
// cycles round. Add posts to lib/gbp/posts.json and they join the rotation.
//
// Time-bound posts (live events, intake deadlines, offers) do NOT belong in that
// file — they would rotate back around after the date has passed. Send those
// manually with scripts/gbp-post.mjs.
//
// Env required: CRON_SECRET, GBP_MAKE_WEBHOOK_URL
// Manual use:   /api/gbp-cron?dry=1        preview today's post, sends nothing
//               /api/gbp-cron?index=4      force a specific post
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import posts from "@/lib/gbp/posts.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

async function resolves(url: string, expectImage = false) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return `HTTP ${res.status}`;
    if (expectImage && !(res.headers.get("content-type") ?? "").startsWith("image/")) {
      return `not an image (${res.headers.get("content-type")})`;
    }
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "fetch failed";
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const webhook = process.env.GBP_MAKE_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ error: "GBP_MAKE_WEBHOOK_URL not set" }, { status: 500 });
  }

  const override = req.nextUrl.searchParams.get("index");
  const index =
    override !== null
      ? Number(override) % posts.length
      : Math.floor(Date.now() / DAY_MS) % posts.length;

  const post = posts[index];
  if (!post) {
    return NextResponse.json({ error: `no post at index ${index}` }, { status: 400 });
  }

  // Google will happily publish a post whose button points at a 404, so check first.
  const [ctaProblem, imageProblem] = await Promise.all([
    resolves(post.cta_url),
    resolves(post.image_url, true),
  ]);

  if (ctaProblem || imageProblem) {
    return NextResponse.json(
      {
        error: "validation failed, nothing sent",
        index,
        title: post.title,
        cta_url: ctaProblem ? `${post.cta_url} — ${ctaProblem}` : "ok",
        image_url: imageProblem ? `${post.image_url} — ${imageProblem}` : "ok",
      },
      { status: 422 },
    );
  }

  if (req.nextUrl.searchParams.get("dry")) {
    return NextResponse.json({ dryRun: true, index, post });
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  return NextResponse.json(
    { sent: res.ok, index, title: post.title, makeStatus: res.status },
    { status: res.ok ? 200 : 502 },
  );
}
