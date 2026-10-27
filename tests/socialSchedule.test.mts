// tests/socialSchedule.test.mts
//
// WHAT THIS PROTECTS
//
// The admin Social calendar is where Callum checks what's going out. It's only
// useful if it can't quietly mislead:
//   - Ultimate Shred / Shred Lifestyle posts share the OpusClip account and must
//     never appear as PTLL posts.
//   - One failed platform must not be hidden behind another that posted.
//   - A post must land on its UK day, including across the October clock change.
//   - The runway numbers must match the daily reminder email's rule (<= 7 days warns).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupOpusTasks, carouselItem, weekDays, londonDay, runway, carouselEnds, opusEnd,
  isPtllOpusTask, streamLabel, type OpusTask, type CarouselRow,
} from "../app/lib/socialSchedule.ts";

const task = (over: Partial<OpusTask>): OpusTask => ({
  clipId: "c1", platform: "TIKTOK_BUSINESS", status: "scheduled", publishAt: "2026-11-11T13:00:00.000Z",
  postDetail: { custom: { description: "\"Hook line here\"\n\nBody" } }, ...over,
});

test("Shred accounts on the shared OpusClip login are left out", () => {
  assert.equal(isPtllOpusTask({ platform: "FACEBOOK_PAGE", subAccountId: "349547611844400" }), false);
  assert.equal(isPtllOpusTask({ platform: "YOUTUBE", subAccountId: null }), false);
  assert.equal(isPtllOpusTask({ platform: "FACEBOOK_PAGE", subAccountId: "798389646699303" }), true);
  const items = groupOpusTasks([
    task({ platform: "FACEBOOK_PAGE", subAccountId: "349547611844400", clipId: "shred" }),
    task({ platform: "YOUTUBE", clipId: "shred-yt" }),
  ]);
  assert.deepEqual(items, []);
});

test("one clip on three platforms is one row, titled from the caption's first line", () => {
  const items = groupOpusTasks([
    task({ platform: "TIKTOK_BUSINESS" }),
    task({ platform: "INSTAGRAM_BUSINESS", subAccountId: "17841404060542559" }),
    task({ platform: "FACEBOOK_PAGE", subAccountId: "798389646699303" }),
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Hook line here");
  assert.deepEqual(items[0].platforms.map((p) => p.name), ["Facebook", "Instagram", "TikTok"]);
});

test("a failed platform wins over the ones that posted", () => {
  const [item] = groupOpusTasks([
    task({ platform: "TIKTOK_BUSINESS", status: "posted", extVideoLink: "https://tiktok.com/x" }),
    task({ platform: "INSTAGRAM_BUSINESS", status: "failed", errorMessage: "media expired" }),
  ]);
  assert.equal(item.status, "failed");
  assert.equal(item.error, "media expired");
  assert.equal(item.platforms.find((p) => p.name === "TikTok")?.url, "https://tiktok.com/x");
});

test("a carousel half way through posting shows which platform is live", () => {
  const row: CarouselRow = {
    id: "r1", series: "objections-50", post_no: 3, title: "Can I do it alongside a 9-5?", caption: null,
    image_urls: ["https://x/slide-01.jpg"], platforms: ["instagram", "facebook"], scheduled_at: "2026-10-29T20:00:00Z",
    status: "publishing", ig_media_id: "1789", fb_post_id: null, last_error: null,
  };
  const it = carouselItem(row);
  assert.equal(it.platforms[0].status, "published");
  assert.equal(it.platforms[1].status, "publishing");
  assert.equal(it.image, "https://x/slide-01.jpg");
  assert.equal(it.title, "#3 Can I do it alongside a 9-5?");
});

test("posts land on their UK day, across the clock change", () => {
  // 23:30 UTC on 24 Oct is 00:30 BST on 25 Oct.
  assert.equal(londonDay("2026-10-24T23:30:00Z"), "2026-10-25");
  // After the change, 23:30 UTC is 23:30 GMT, same day.
  assert.equal(londonDay("2026-10-26T23:30:00Z"), "2026-10-26");
});

test("a week runs Monday to Sunday and its window covers every day", () => {
  const now = Date.parse("2026-10-27T08:00:00Z"); // a Tuesday
  const w = weekDays(now, 0);
  assert.deepEqual(w.days, ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.ok(w.from < "2026-10-26T00:00:00Z" && w.to > "2026-11-01T23:59:59Z");
  assert.equal(weekDays(now, 1).days[0], "2026-11-02");
  assert.equal(weekDays(now, -1).days[0], "2026-10-19");
});

test("runway matches the reminder email: 7 days or fewer warns, nothing left is -1", () => {
  const now = Date.parse("2026-12-08T09:00:00Z");
  assert.equal(runway("objections-50", "2026-12-15T20:00:00Z", now).daysLeft, 7);
  assert.equal(runway("objections-50", "2026-12-15T20:00:00Z", now).warn, true);
  assert.equal(runway("opus", "2027-01-09T18:00:00Z", now).warn, false);
  assert.equal(runway("opus", null, now).daysLeft, -1);
});

test("a follow-on batch continues its stream, so batch 1 ending isn't a false 'running out'", () => {
  assert.deepEqual(
    carouselEnds([
      { series: "objections-50", scheduled_at: "2026-12-15T10:00:00Z" },
      { series: "objections-50-b2", scheduled_at: "2027-02-03T10:00:00Z" },
    ]),
    { "objections-50": "2027-02-03T10:00:00Z" },
  );
  assert.equal(streamLabel("objections-50-b2"), "Objection carousels (batch 2)");
  assert.equal(streamLabel("objections-50"), "Objection carousels");
});

test("ends are the last still-to-post item per stream", () => {
  assert.deepEqual(
    carouselEnds([
      { series: "a", scheduled_at: "2026-11-01T10:00:00Z" },
      { series: "a", scheduled_at: "2026-12-01T10:00:00Z" },
      { series: "b", scheduled_at: "2026-11-05T10:00:00Z" },
    ]),
    { a: "2026-12-01T10:00:00Z", b: "2026-11-05T10:00:00Z" },
  );
  assert.equal(
    opusEnd([
      task({ publishAt: "2027-01-09T18:00:00.000Z" }),
      task({ publishAt: "2027-02-01T18:00:00.000Z", status: "posted" }),
      task({ publishAt: "2027-03-01T18:00:00.000Z", platform: "FACEBOOK_PAGE", subAccountId: "349547611844400" }),
    ]),
    "2027-01-09T18:00:00.000Z",
  );
});
