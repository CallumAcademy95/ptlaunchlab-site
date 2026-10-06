// tests/metaCustomData.test.mts
//
// WHAT THIS PROTECTS
//
// Meta's Conversions API only recognises snake_case custom_data keys
// (content_name, content_category, content_ids, order_id). Every caller passes
// camelCase, and metaCapi used to forward the object unchanged, so server-side
// events never carried content_name or the rest. Custom conversions keyed on
// content_name (e.g. "Career Planner Lead") only ever matched the browser pixel.
//
// toMetaCustomData is the single place that translates, so these tests pin the
// mapping, the keys Meta already accepts, and the pass-through of free-form keys.

import { test } from "node:test";
import assert from "node:assert/strict";
import { toMetaCustomData } from "../app/lib/metaCapi.ts";

test("camelCase keys map to Meta's snake_case", () => {
  const out = toMetaCustomData({
    contentName: "career_planner",
    contentCategory: "personal-trainer",
    contentIds: ["a", "b"],
    orderId: "cs_123",
  });
  assert.deepEqual(out, {
    content_name: "career_planner",
    content_category: "personal-trainer",
    content_ids: ["a", "b"],
    order_id: "cs_123",
  });
});

test("camelCase originals are not left behind alongside the snake_case keys", () => {
  const out = toMetaCustomData({ contentName: "x", orderId: "o" })!;
  assert.equal("contentName" in out, false);
  assert.equal("orderId" in out, false);
});

test("currency, value, contents and status are preserved as-is", () => {
  const contents = [{ id: "course", quantity: 1, item_price: 500 }];
  const out = toMetaCustomData({ currency: "GBP", value: 500, contents, status: "paid" });
  assert.deepEqual(out, { currency: "GBP", value: 500, contents, status: "paid" });
});

test("unknown free-form keys pass through unchanged", () => {
  const out = toMetaCustomData({ contentName: "x", avatar_slug: "pt", someFlag: true });
  assert.deepEqual(out, { content_name: "x", avatar_slug: "pt", someFlag: true });
});

test("undefined input returns undefined", () => {
  assert.equal(toMetaCustomData(undefined), undefined);
});

test("undefined values are dropped", () => {
  const out = toMetaCustomData({ contentName: undefined, value: 10, orderId: undefined, extra: undefined });
  assert.deepEqual(out, { value: 10 });
  assert.equal(Object.keys(out!).length, 1);
});
