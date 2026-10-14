// tests/crm.test.mts
//
// WHAT THIS PROTECTS
//
// The admin CRM's rules (app/admin/(shell)/crm/crm.ts):
//   - the URL can only ever mean whitelisted filters
//   - search finds a phone however it was typed, and an email in any case
//   - the waiting timer's colour bands
//   - who wrote a message (the AI, a template, or Callum)
//   - which mode changes are allowed, and that Do not contact needs a reason
//   - saved views store only what the list page would accept
//   - the "Already a qualified PT" toggle never drops other ai_profile keys

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCrmQuery,
  serialiseCrmQuery,
  crmHref,
  normaliseSearch,
  normalisePhone,
  matchesSearch,
  waitBand,
  waitingMinutes,
  isWaiting,
  messageAuthor,
  validateModeChange,
  validateSavedView,
  mergeQualified,
  normalisePerson,
  filterPeople,
  tileCounts,
  modeOf,
  waNumber,
  gmailUrl,
  latestThreadId,
  isUuid,
  type CrmPerson,
} from "../app/admin/(shell)/crm/crm.ts";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const ago = (min: number) => new Date(NOW - min * 60_000).toISOString();

function person(over: Partial<CrmPerson> & Record<string, unknown> = {}): CrmPerson {
  const p = normalisePerson({
    id: "11111111-1111-4111-8111-111111111111",
    kind: "person",
    name: "Sam Smith",
    email: "Sam.Smith@Example.com",
    phone: "+44 7700 900123",
    primary_channel: "whatsapp",
    setter_status: "auto",
    created_at: ago(60 * 24 * 3),
    ...over,
  });
  assert.ok(p);
  return p;
}

// ─── filter → query whitelist ───────────────────────────────────────────

test("only whitelisted filter values survive parsing", () => {
  const q = parseCrmQuery({
    mode: "ai",
    band: "prime",
    channel: "whatsapp",
    wait: "2h",
    view: "hot",
    from: "2026-10-01",
    to: "2026-10-14",
    source: "facebook",
    ad: "ad_123",
  });
  assert.deepEqual(q, {
    mode: "ai",
    band: "prime",
    channel: "whatsapp",
    wait: "2h",
    view: "hot",
    from: "2026-10-01",
    to: "2026-10-14",
    source: "facebook",
    ad: "ad_123",
  });
});

test("unknown keys and off-list values are dropped, never passed through", () => {
  const q = parseCrmQuery({
    mode: "auto); drop table consultations;--",
    band: "vip",
    channel: "sms",
    wait: "5m",
    view: "everything",
    from: "2026-02-30",
    to: "yesterday",
    select: "*",
    order: "id",
    or: "(id.eq.1)",
    source: "a\u0000b",
  });
  assert.deepEqual(q, {});
});

test("raw setter_status values are not accepted as mode filters", () => {
  // The URL speaks CRM modes; "closed" or "paused" must not slip through.
  assert.deepEqual(parseCrmQuery({ mode: "closed" }), {});
  assert.deepEqual(parseCrmQuery({ mode: "paused" }), {});
  assert.deepEqual(parseCrmQuery({ mode: "dnc" }), { mode: "dnc" });
});

test("array params use the first value only", () => {
  assert.deepEqual(parseCrmQuery({ band: ["strong", "prime"] }), { band: "strong" });
});

test("serialise writes keys in one fixed order, so equal filters make equal URLs", () => {
  const a = serialiseCrmQuery({ wait: "12h", mode: "human", q: "sam" });
  const b = serialiseCrmQuery(parseCrmQuery(new URLSearchParams("mode=human&wait=12h&q=sam")));
  assert.equal(a, "q=sam&mode=human&wait=12h");
  assert.equal(a, b);
});

test("crmHref keeps filters and adds the open panel", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(crmHref({}), "/admin/crm");
  assert.equal(crmHref({ mode: "ai" }, { open: id }), `/admin/crm?mode=ai&open=${id}`);
});

test("isUuid accepts only uuids", () => {
  assert.equal(isUuid("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(isUuid("1 or 1=1"), false);
  assert.equal(isUuid(undefined), false);
});

// ─── search normalisation ───────────────────────────────────────────────

test("phone numbers normalise to one UK spelling", () => {
  assert.equal(normalisePhone("+44 7700 900123"), "07700900123");
  assert.equal(normalisePhone("0044 7700 900123"), "07700900123");
  assert.equal(normalisePhone("07700-900-123"), "07700900123");
  assert.equal(normalisePhone(null), "");
});

test("a phone-shaped search matches however the number was stored or typed", () => {
  const p = person({ phone: "+447700900123" });
  for (const typed of ["07700 900123", "+44 7700 900123", "447700900123", "900123"]) {
    assert.ok(matchesSearch(p, normaliseSearch(typed)), typed);
  }
  assert.equal(matchesSearch(p, normaliseSearch("07700 111111")), false);
});

test("email and name search is case-insensitive and trimmed", () => {
  const p = person();
  assert.equal(normaliseSearch("  SAM.SMITH@example.COM ")?.text, "sam.smith@example.com");
  assert.ok(matchesSearch(p, normaliseSearch("SAM.SMITH@EXAMPLE.COM")));
  assert.ok(matchesSearch(p, normaliseSearch("smith")));
  assert.equal(matchesSearch(p, normaliseSearch("jones")), false);
});

test("an email with digits in it is a text search, not a phone search", () => {
  assert.equal(normaliseSearch("sam1234@x.com")?.digits, null);
  assert.equal(normaliseSearch("")?.text, undefined);
});

// ─── waiting timer ──────────────────────────────────────────────────────

test("waiting-timer bands: green <30m, yellow <2h, orange <12h, red ≥12h", () => {
  assert.equal(waitBand(0), "green");
  assert.equal(waitBand(29), "green");
  assert.equal(waitBand(30), "yellow");
  assert.equal(waitBand(119), "yellow");
  assert.equal(waitBand(120), "orange");
  assert.equal(waitBand(719), "orange");
  assert.equal(waitBand(720), "red");
  assert.equal(waitBand(5000), "red");
});

test("waiting only when they wrote last on an open conversation", () => {
  assert.equal(waitingMinutes(person({ last_inbound_at: ago(45), last_outbound_at: ago(90) }), NOW), 45);
  assert.equal(waitingMinutes(person({ last_inbound_at: ago(45), last_outbound_at: null }), NOW), 45);
  assert.equal(waitingMinutes(person({ last_inbound_at: ago(90), last_outbound_at: ago(45) }), NOW), null);
  assert.equal(isWaiting(person({ last_inbound_at: ago(45), setter_status: "closed" })), false);
  assert.equal(isWaiting(person({ last_inbound_at: ago(45), unsubscribed: true })), false);
  assert.equal(isWaiting(person({ kind: "site_only", setter_status: null, last_inbound_at: ago(45) })), false);
});

test("wait filter and tiles count from the same rule", () => {
  const rows = [
    person({ id: "a1111111-1111-4111-8111-111111111111", last_inbound_at: ago(10) }),
    person({ id: "a2222222-1111-4111-8111-111111111111", last_inbound_at: ago(200) }),
    person({ id: "a3333333-1111-4111-8111-111111111111", last_inbound_at: ago(800), setter_status: "human" }),
  ];
  assert.equal(filterPeople(rows, { wait: "2h" }, NOW).length, 2);
  assert.equal(filterPeople(rows, { wait: "12h" }, NOW).length, 1);
  const t = tileCounts(rows, NOW);
  assert.equal(t.waiting, 3);
  assert.equal(t.oldestWaitMinutes, 800);
  assert.equal(t.aiActive, 2);
  assert.equal(t.human, 1);
  // Longest wait first.
  assert.equal(filterPeople(rows, {}, NOW)[0].id, "a3333333-1111-4111-8111-111111111111");
});

test("band filters: qualified and gym owner come from their own columns", () => {
  const rows = [
    person({ id: "b1111111-1111-4111-8111-111111111111", planner_band: "prime" }),
    person({ id: "b2222222-1111-4111-8111-111111111111", already_qualified: true }),
    person({ id: "b3333333-1111-4111-8111-111111111111", setter_profile_id: "p1" }),
  ];
  assert.equal(filterPeople(rows, { band: "prime" }, NOW).length, 1);
  assert.equal(filterPeople(rows, { band: "qualified" }, NOW)[0].id, "b2222222-1111-4111-8111-111111111111");
  assert.equal(filterPeople(rows, { band: "gym" }, NOW)[0].id, "b3333333-1111-4111-8111-111111111111");
});

test("a row with missing columns still normalises", () => {
  const p = normalisePerson({ id: "c1111111-1111-4111-8111-111111111111" });
  assert.ok(p);
  assert.equal(p.kind, "person");
  assert.equal(p.already_qualified, false);
  assert.equal(p.site_lead_count, 0);
  assert.equal(normalisePerson({ name: "no id" }), null);
});

// ─── author labels ──────────────────────────────────────────────────────

test("message author: lead, AI setter, template, Callum", () => {
  assert.equal(messageAuthor({ direction: "inbound", ai_generated: false, meta: {} }), "lead");
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: true, meta: {} }), "ai");
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: false, meta: {} }), "human");
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: false, meta: null }), "human");
  // Templates and nudges are stored ai_generated=false but nobody typed them.
  for (const via of ["planner_template", "planner_nudge", "reengage_nudge", "intake"]) {
    assert.equal(messageAuthor({ direction: "outbound", ai_generated: false, meta: { via } }), "template", via);
    assert.equal(messageAuthor({ direction: "outbound", ai_generated: true, meta: { via } }), "template", via);
  }
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: true, meta: { via: "comment_to_dm" } }), "ai");
});

// ─── mode transitions ───────────────────────────────────────────────────

test("mode mapping: paused and booked show as Human, closed as Do not contact", () => {
  assert.equal(modeOf("auto"), "ai");
  assert.equal(modeOf("reply_only"), "reply_only");
  assert.equal(modeOf("human"), "human");
  assert.equal(modeOf("paused"), "human");
  assert.equal(modeOf("booked"), "human");
  assert.equal(modeOf("closed"), "dnc");
  assert.equal(modeOf(null), null);
});

test("take over writes 'human'; hand back writes auto or reply_only", () => {
  assert.deepEqual(validateModeChange({ current: "auto", target: "human" }), { ok: true, status: "human", dncReason: null });
  assert.deepEqual(validateModeChange({ current: "paused", target: "ai" }), { ok: true, status: "auto", dncReason: null });
  assert.deepEqual(validateModeChange({ current: "human", target: "reply_only" }), { ok: true, status: "reply_only", dncReason: null });
  assert.deepEqual(validateModeChange({ current: "closed", target: "human" }), { ok: true, status: "human", dncReason: null });
});

test("unknown targets, unknown current statuses and no-ops are refused", () => {
  assert.equal(validateModeChange({ current: "auto", target: "auto" }).ok, false);
  assert.equal(validateModeChange({ current: "auto", target: "closed" }).ok, false);
  assert.equal(validateModeChange({ current: "auto", target: "ai" }).ok, false);
  assert.equal(validateModeChange({ current: "paused", target: "human" }).ok, false);
  assert.equal(validateModeChange({ current: null, target: "human" }).ok, false);
  assert.equal(validateModeChange({ current: "weird", target: "human" }).ok, false);
});

test("Do not contact requires a reason from the list; Other requires words", () => {
  assert.equal(validateModeChange({ current: "auto", target: "dnc" }).ok, false);
  assert.equal(validateModeChange({ current: "auto", target: "dnc", reason: "because" }).ok, false);
  assert.equal(validateModeChange({ current: "auto", target: "dnc", reason: "other", note: "   " }).ok, false);
  assert.deepEqual(validateModeChange({ current: "auto", target: "dnc", reason: "asked_to_stop" }), {
    ok: true,
    status: "closed",
    dncReason: "Asked to stop",
  });
  assert.deepEqual(validateModeChange({ current: "human", target: "dnc", reason: "other", note: " moved abroad " }), {
    ok: true,
    status: "closed",
    dncReason: "Other: moved abroad",
  });
});

test("someone who unsubscribed can't be handed back to the AI", () => {
  assert.equal(validateModeChange({ current: "closed", target: "ai", unsubscribed: true }).ok, false);
  assert.equal(validateModeChange({ current: "closed", target: "reply_only", unsubscribed: true }).ok, false);
  assert.equal(validateModeChange({ current: "closed", target: "human", unsubscribed: true }).ok, true);
});

// ─── saved views ────────────────────────────────────────────────────────

test("saved view: name is trimmed and bounded; query stored canonical and whitelisted", () => {
  assert.deepEqual(validateSavedView("  Hot   leads ", "?wait=2h&mode=ai&evil=1"), {
    ok: true,
    name: "Hot leads",
    query: "mode=ai&wait=2h",
  });
  assert.equal(validateSavedView("", "mode=ai").ok, false);
  assert.equal(validateSavedView("x".repeat(41), "mode=ai").ok, false);
  assert.equal(validateSavedView("<script>", "mode=ai").ok, false);
  assert.equal(validateSavedView("Hot", "mode=ai").ok, false, "clashes with a built-in view");
  assert.equal(validateSavedView("Nothing", "evil=1&mode=nope").ok, false, "no filters left");
  assert.equal(validateSavedView(42, "mode=ai").ok, false);
});

test("saved view round trip: URL → stored → URL gives the same filters", () => {
  const url = "band=strong&q=07700%20900123&channel=email&from=2026-10-01";
  const saved = validateSavedView("Strong email", url);
  assert.ok(saved.ok);
  assert.deepEqual(parseCrmQuery(new URLSearchParams(saved.query)), parseCrmQuery(new URLSearchParams(url)));
});

// ─── qualified toggle ───────────────────────────────────────────────────

test("qualified toggle keeps every other ai_profile key", () => {
  const stored = { planner: { band: "prime", answers: { goal: "full_time" } }, notes: "keen", already_qualified: false };
  const out = mergeQualified(stored, true);
  assert.deepEqual(out, {
    planner: { band: "prime", answers: { goal: "full_time" } },
    notes: "keen",
    already_qualified: true,
    already_qualified_set_by: "coach",
  });
  assert.deepEqual(stored.already_qualified, false, "input not mutated");
  assert.deepEqual(mergeQualified(null, false), { already_qualified: false, already_qualified_set_by: "coach" });
  assert.deepEqual(mergeQualified(["x"], true), { already_qualified: true, already_qualified_set_by: "coach" });
});

// ─── reply links ────────────────────────────────────────────────────────

test("wa.me numbers: UK numbers become 44…", () => {
  assert.equal(waNumber("07700 900123"), "447700900123");
  assert.equal(waNumber("+44 7700 900123"), "447700900123");
  assert.equal(waNumber("0044 7700 900123"), "447700900123");
  assert.equal(waNumber("7700900123"), "447700900123");
  assert.equal(waNumber("+1 415 555 0100"), "14155550100");
  assert.equal(waNumber("123"), null);
  assert.equal(waNumber(null), null);
});

test("Gmail link: thread when stored, else a search for the address", () => {
  assert.equal(
    gmailUrl("a+b@x.com"),
    "https://mail.google.com/mail/u/?authuser=info@ptlaunchlab.co.uk#search/a%2Bb%40x.com",
  );
  assert.equal(
    gmailUrl("a@x.com", "18f2a3b4c5d6e7f8"),
    "https://mail.google.com/mail/u/?authuser=info@ptlaunchlab.co.uk#all/18f2a3b4c5d6e7f8",
  );
  assert.equal(gmailUrl(null, "not a thread"), null);
  assert.equal(
    latestThreadId([
      { channel: "email", meta: { emailMeta: { threadId: "aaa111" } } },
      { channel: "whatsapp", meta: {} },
      { channel: "email", meta: { emailMeta: { threadId: "bbb222" } } },
    ]),
    "bbb222",
  );
});
