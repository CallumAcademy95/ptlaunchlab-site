// tests/messageMedia.test.mts
//
// WHAT THIS PROTECTS
//
// Images and attachments on /admin/leads/[id]. The lead-media bucket is
// private; the page signs URLs with the service role. The rule that matters
// most is that only paths in the lead-media bucket, in the contract's shape,
// and under THIS consultation's folder are ever signed — a row pointing at
// another lead's folder (or another bucket) must show "Image unavailable".

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMedia,
  isSignablePath,
  fileTypeLabel,
  unsupportedChipLabel,
  signablePaths,
  mediaViews,
} from "../app/lib/message-media.ts";

const C = "0b6c1f7e-2a3d-4e5f-8a9b-0c1d2e3f4a5b";
const OTHER = "11111111-2222-3333-4444-555555555555";
const U = "9f8e7d6c-5b4a-4321-8fed-cba987654321";

test("isSignablePath: accepts the contract path under this consultation", () => {
  for (const ext of ["jpg", "jpeg", "png", "webp", "gif", "JPG"]) {
    assert.equal(isSignablePath("lead-media", `${C}/${U}.${ext}`, C), true, ext);
  }
  assert.equal(isSignablePath("lead-media", `${C.toUpperCase()}/${U}.png`, C), true);
});

test("isSignablePath: rejects another consultation's folder", () => {
  assert.equal(isSignablePath("lead-media", `${OTHER}/${U}.png`, C), false);
});

test("isSignablePath: rejects other buckets and malformed paths", () => {
  assert.equal(isSignablePath("avatars", `${C}/${U}.png`, C), false);
  assert.equal(isSignablePath(undefined, `${C}/${U}.png`, C), false);
  const bad = [
    `${C}/${U}.pdf`,
    `${C}/${U}.png.exe`,
    `${C}/../${OTHER}/${U}.png`,
    `/${C}/${U}.png`,
    `${C}/sub/${U}.png`,
    `${C}/flyer.png`,
    `${C}/${U}`,
    `${C}/${U}.png\n`,
    "",
  ];
  for (const p of bad) assert.equal(isSignablePath("lead-media", p, C), false, JSON.stringify(p));
  assert.equal(isSignablePath("lead-media", null, C), false);
  assert.equal(isSignablePath("lead-media", 42, C), false);
});

test("parseMedia: tolerates junk, keeps known types", () => {
  assert.deepEqual(parseMedia(null), []);
  assert.deepEqual(parseMedia("[]"), []);
  assert.deepEqual(parseMedia({}), []);
  const got = parseMedia([
    null,
    5,
    { type: "video" },
    { type: "image", bucket: "lead-media", path: `${C}/${U}.png`, mime: "image/png", size: 10, source: "email", filename: null },
    { type: "image" },
    { type: "unsupported", mime: "application/pdf", size: null, source: "email", filename: "cv.pdf" },
    { type: "unsupported", mime: "image/jpeg", source: "whatsapp", filename: null, error: "pending" },
  ]);
  assert.equal(got.length, 4);
  assert.deepEqual(got[0], { type: "image", bucket: "lead-media", path: `${C}/${U}.png`, mime: "image/png", filename: null });
  assert.deepEqual(got[1], { type: "image", bucket: "", path: "", mime: null, filename: null });
  assert.deepEqual(got[2], { type: "unsupported", mime: "application/pdf", filename: "cv.pdf", error: null });
  assert.equal(got[3].type === "unsupported" && got[3].error, "pending");
});

test("fileTypeLabel", () => {
  assert.equal(fileTypeLabel("application/pdf"), "PDF");
  assert.equal(fileTypeLabel("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "Word document");
  assert.equal(fileTypeLabel("video/mp4"), "video");
  assert.equal(fileTypeLabel("audio/ogg; codecs=opus"), "audio");
  assert.equal(fileTypeLabel("image/heic"), "image");
  assert.equal(fileTypeLabel(null), "file");
  assert.equal(fileTypeLabel("application/x-weird"), "file");
});

test("unsupportedChipLabel: filename or type, reason by error", () => {
  assert.equal(unsupportedChipLabel({ mime: "application/pdf", filename: "cv.pdf", error: null }), "cv.pdf — can't be previewed");
  assert.equal(unsupportedChipLabel({ mime: "application/pdf", filename: null, error: null }), "PDF — can't be previewed");
  assert.equal(unsupportedChipLabel({ mime: "image/jpeg", filename: null, error: "pending" }), "image — image still loading");
  assert.equal(unsupportedChipLabel({ mime: "image/png", filename: "big.png", error: "too large" }), "big.png — too large to keep");
  for (const err of ["timed out", "could not read image", "content is not a supported image", "more than 4 images in one message", "HTTP 500", "upload failed: 403"]) {
    assert.match(unsupportedChipLabel({ mime: "image/png", filename: null, error: err }), /can't be previewed$/, err);
  }
  assert.equal(unsupportedChipLabel({ mime: null, filename: "  ", error: null }), "file — can't be previewed");
});

test("signablePaths: only valid ones, de-duplicated", () => {
  const entries = parseMedia([
    { type: "image", bucket: "lead-media", path: `${C}/${U}.png` },
    { type: "image", bucket: "lead-media", path: `${C}/${U}.png` },
    { type: "image", bucket: "lead-media", path: `${OTHER}/${U}.png` },
    { type: "image", bucket: "public", path: `${C}/${U}.jpg` },
    { type: "unsupported", mime: "application/pdf" },
  ]);
  assert.deepEqual(signablePaths(entries, C), [`${C}/${U}.png`]);
});

test("mediaViews: signed → image, unsigned/foreign → unavailable, unsupported → chip", () => {
  const good = `${C}/${U}.png`;
  const foreign = `${OTHER}/${U}.png`;
  const entries = parseMedia([
    { type: "image", bucket: "lead-media", path: good, filename: "flyer.png" },
    { type: "image", bucket: "lead-media", path: `${C}/${U}.jpg` },
    { type: "image", bucket: "lead-media", path: foreign },
    { type: "unsupported", mime: "application/pdf", filename: "cv.pdf" },
  ]);
  // A URL for the foreign path in the map must still not be used.
  const signed = new Map([
    [good, "https://x.supabase.co/storage/v1/object/sign/lead-media/a?token=t"],
    [foreign, "https://x.supabase.co/evil"],
  ]);
  const v = mediaViews(entries, signed, C);
  assert.deepEqual(v[0], { kind: "image", url: signed.get(good), alt: "Attached image: flyer.png" });
  assert.deepEqual(v[1], { kind: "unavailable", label: "Image unavailable" });
  assert.deepEqual(v[2], { kind: "unavailable", label: "Image unavailable" });
  assert.deepEqual(v[3], { kind: "chip", label: "cv.pdf — can't be previewed" });
});

test("mediaViews: a non-http signed value is not rendered", () => {
  const good = `${C}/${U}.png`;
  const entries = parseMedia([{ type: "image", bucket: "lead-media", path: good }]);
  const v = mediaViews(entries, new Map([[good, "javascript:alert(1)"]]), C);
  assert.equal(v[0].kind, "unavailable");
});
