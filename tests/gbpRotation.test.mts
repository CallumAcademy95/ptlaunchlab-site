// tests/gbpRotation.test.mts
//
// GBP cron post selection (lib/gbp/rotation.ts) and the podcast post pool.
// File-only: reads JSON and images from disk, makes no network calls.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { DAY_MS, WEEK_MS, PODCAST_EPOCH_MS, parsePool, pickIndex } from "../lib/gbp/rotation.ts";
import { episodesIndex } from "../app/podcast/transcripts/_index.ts";

type Post = { title: string; summary: string; image_url: string; cta_type: string; cta_url: string };
const coursePosts: Post[] = JSON.parse(readFileSync("lib/gbp/posts.json", "utf8"));
const podcastPosts: Post[] = JSON.parse(readFileSync("lib/gbp/podcast-posts.json", "utf8"));

test("pool parsing: absent or empty is the default pool, unknown is rejected", () => {
  assert.equal(parsePool(null), "default");
  assert.equal(parsePool(""), "default");
  assert.equal(parsePool("default"), "default");
  assert.equal(parsePool("podcast"), "podcast");
  assert.equal(parsePool("Podcast"), null);
  assert.equal(parsePool("courses"), null);
});

test("default pool selection is unchanged: one step per UTC day", () => {
  const len = coursePosts.length;
  const start = Date.UTC(2026, 9, 1, 9, 30);
  for (let d = 0; d < 400; d++) {
    const now = start + d * DAY_MS;
    // The exact expression the route used before pools existed.
    assert.equal(pickIndex("default", len, now, null), Math.floor(now / DAY_MS) % len);
  }
  assert.equal(pickIndex("default", len, 0, "4"), Number("4") % len);
  assert.equal(pickIndex("default", len, 0, String(len + 2)), 2);
});

test("podcast pool steps once a week, item 0 on Wed 4 Nov 2026", () => {
  const len = podcastPosts.length;
  const wed = (n: number) => PODCAST_EPOCH_MS + n * WEEK_MS + (9 * 60 + 30) * 60_000; // 09:30 UTC
  assert.equal(new Date(PODCAST_EPOCH_MS).getUTCDay(), 3, "epoch is a Wednesday");
  assert.equal(new Date(PODCAST_EPOCH_MS).toISOString(), "2026-11-04T00:00:00.000Z");

  for (let n = 0; n < len * 2 + 3; n++) {
    assert.equal(pickIndex("podcast", len, wed(n), null), n % len, `week ${n}`);
  }
  // Every day of a week maps to the same post.
  for (let h = 0; h < 7 * 24; h++) {
    assert.equal(pickIndex("podcast", len, PODCAST_EPOCH_MS + 2 * WEEK_MS + h * 3_600_000, null), 2);
  }
});

test("podcast pool sends nothing before its start date, unless forced", () => {
  const len = podcastPosts.length;
  assert.equal(pickIndex("podcast", len, PODCAST_EPOCH_MS - 1, null), null);
  assert.equal(pickIndex("podcast", len, Date.UTC(2026, 9, 28, 9, 30), null), null);
  assert.equal(pickIndex("podcast", len, Date.UTC(2026, 9, 28, 9, 30), "3"), 3);
});

test("podcast posts: one per episode page, copy within GBP limits", () => {
  const slugs = new Set(episodesIndex.map((e) => e.slug));
  const seen = new Set<string>();
  assert.ok(podcastPosts.length > 0);
  for (const p of podcastPosts) {
    assert.deepEqual(Object.keys(p).sort(), ["cta_type", "cta_url", "image_url", "summary", "title"]);
    assert.ok(p.title.length <= 58, `title too long: ${p.title}`);
    assert.ok(p.summary.length >= 300 && p.summary.length <= 700, `summary ${p.summary.length}: ${p.title}`);
    assert.equal(p.cta_type, "LEARN_MORE");
    assert.doesNotMatch(p.title + p.summary, /500K|#/i);

    const slug = p.cta_url.replace("https://ptlaunchlab.co.uk/podcast/", "");
    assert.ok(slugs.has(slug), `no episode page for ${p.cta_url}`);
    assert.ok(!seen.has(slug), `duplicate ${slug}`);
    seen.add(slug);
  }
});

test("podcast post images exist, 1200x900 JPEG under 1 MB", () => {
  for (const p of podcastPosts) {
    const m = p.image_url.match(/^https:\/\/ptlaunchlab\.co\.uk\/(gbp\/podcast\/[\w-]+\.jpg)$/);
    assert.ok(m, `unexpected image_url ${p.image_url}`);
    const file = `public/${m[1]}`;
    assert.ok(existsSync(file), `missing ${file}`);
    assert.ok(statSync(file).size < 1_000_000, `${file} over 1 MB`);
    assert.deepEqual(jpegSize(readFileSync(file)), { width: 1200, height: 900 }, file);
  }
});

// Reads width/height from the first SOF marker.
function jpegSize(buf: Buffer) {
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error("no SOF marker");
}
