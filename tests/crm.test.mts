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
//   - replying from the CRM (phase 1B): which channels are offered, what the
//     button says per mode, the WhatsApp 24h window, the send action's input
//     check, and how Leads Central's answers become what the box shows

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
  isHandling,
  modeUpdatePayload,
  planModeChange,
  modeChangeWarning,
  isManualTakeover,
  incompleteNote,
  validateQualifiedInput,
  viewIdOf,
  TAKEOVER_REASON,
  AUTHOR_LABEL,
  replyChannels,
  defaultReplyChannel,
  replyState,
  lastInboundOn,
  insideWhatsAppWindow,
  willUseTemplate,
  templateText,
  replyCount,
  validateSendInput,
  ownerSendEndpoint,
  interpretSendResponse,
  interpretSendError,
  TEMPLATE_NOT_APPROVED,
  SEND_UNREACHABLE,
  SEND_UNCONFIRMED,
  SEND_IN_PROGRESS,
  whatsappLastMessageAt,
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

test("phone numbers normalise like the SQL crm_normalise_uk_phone", () => {
  assert.equal(normalisePhone("+44 7700 900123"), "07700900123");
  assert.equal(normalisePhone("+44 (0)7700 900123"), "07700900123");
  assert.equal(normalisePhone("0044 7700 900123"), "07700900123");
  assert.equal(normalisePhone("07700-900-123"), "07700900123");
  assert.equal(normalisePhone("7700 900123"), "07700900123");
  assert.equal(normalisePhone("12345678"), "", "fewer than 9 digits is no number");
  assert.equal(normalisePhone(null), "");
});

test("phone search needs at least 6 digits, so short numbers don't match everyone", () => {
  assert.equal(normaliseSearch("12345")?.digits, null);
  assert.equal(normaliseSearch("123456")?.digits, "123456");
  assert.equal(normaliseSearch("7700 900123")?.digits, "07700900123");
  // A person with junk in the phone field never matches a phone search.
  assert.equal(matchesSearch(person({ phone: "1234" }), normaliseSearch("123456")), false);
});

test("a phone-shaped search matches however the number was stored or typed", () => {
  const p = person({ phone: "+447700900123" });
  for (const typed of ["07700 900123", "+44 7700 900123", "447700900123", "7700900123", "900123"]) {
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

test("Human-mode people are never 'waiting on us': Callum's replies aren't recorded", () => {
  for (const s of ["human", "paused", "booked"]) {
    const p = person({ last_inbound_at: ago(800), last_outbound_at: ago(900), setter_status: s });
    assert.equal(isWaiting(p), false, s);
    assert.equal(waitingMinutes(p, NOW), null, s);
    assert.equal(isHandling(p), true, s);
  }
  assert.equal(isHandling(person({ last_inbound_at: ago(10) })), false, "AI mode is waiting, not handling");
  assert.equal(isHandling(person({ last_inbound_at: ago(90), last_outbound_at: ago(10), setter_status: "human" })), false);
});

test("wait filter, tiles, views and sort all use the corrected rule", () => {
  const rows = [
    person({ id: "a1111111-1111-4111-8111-111111111111", last_inbound_at: ago(10) }),
    person({ id: "a2222222-1111-4111-8111-111111111111", last_inbound_at: ago(200), setter_status: "reply_only" }),
    person({ id: "a3333333-1111-4111-8111-111111111111", last_inbound_at: ago(800), setter_status: "human" }),
  ];
  assert.equal(filterPeople(rows, { wait: "2h" }, NOW).length, 1);
  assert.equal(filterPeople(rows, { wait: "12h" }, NOW).length, 0);
  assert.deepEqual(
    filterPeople(rows, { view: "waiting" }, NOW).map((p) => p.id),
    ["a2222222-1111-4111-8111-111111111111", "a1111111-1111-4111-8111-111111111111"],
  );
  const t = tileCounts(rows, NOW);
  assert.equal(t.waiting, 2);
  assert.equal(t.oldestWaitMinutes, 200);
  assert.equal(t.aiActive, 1);
  assert.equal(t.human, 1);
  // Longest real wait first; the human-mode person is not ranked as waiting.
  assert.equal(filterPeople(rows, {}, NOW)[0].id, "a2222222-1111-4111-8111-111111111111");
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
  // Callum only when ai_generated is explicitly false.
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: null, meta: {} }), "ai");
  // The planner template opener and nudge are stored ai_generated=false but nobody typed them.
  for (const via of ["planner_template", "planner_nudge"]) {
    assert.equal(messageAuthor({ direction: "outbound", ai_generated: false, meta: { via } }), "template", via);
  }
  // Re-engagement nudges and the intake email are model-written: the AI.
  for (const via of ["reengage_nudge", "intake", "comment_to_dm"]) {
    assert.equal(messageAuthor({ direction: "outbound", ai_generated: true, meta: { via } }), "ai", via);
  }
});

test("a CRM reply (via crm_owner) is Callum, including when it went as the template", () => {
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: false, meta: { via: "crm_owner", author: "callum" } }), "human");
  assert.equal(
    messageAuthor({ direction: "outbound", ai_generated: false, meta: { via: "crm_owner", author: "callum", template: "ptll_owner_message" } }),
    "human",
  );
  // The via wins even if the flag were ever written wrongly.
  assert.equal(messageAuthor({ direction: "outbound", ai_generated: null, meta: { via: "crm_owner" } }), "human");
  assert.equal(AUTHOR_LABEL.human, "👤 Callum");
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

// ─── what changeMode writes ─────────────────────────────────────────────

const ID = "11111111-1111-4111-8111-111111111111";
const T = "2026-10-14T12:00:00.000Z";

test("payload: hand back to AI active resets the unanswered count and clears the paused reason", () => {
  assert.deepEqual(modeUpdatePayload({ status: "auto", dncReason: null }, T, "callum"), {
    setter_status: "auto",
    dnc_reason: null,
    mode_changed_at: T,
    mode_changed_by: "callum",
    ai_unanswered_count: 0,
    setter_paused_reason: null,
  });
});

test("payload: Reply-only resets the same fields as AI active", () => {
  assert.deepEqual(modeUpdatePayload({ status: "reply_only", dncReason: null }, T, "callum"), {
    setter_status: "reply_only",
    dnc_reason: null,
    mode_changed_at: T,
    mode_changed_by: "callum",
    ai_unanswered_count: 0,
    setter_paused_reason: null,
  });
});

test("payload: take over records why the setter is silent", () => {
  assert.deepEqual(modeUpdatePayload({ status: "human", dncReason: null }, T, "callum"), {
    setter_status: "human",
    dnc_reason: null,
    mode_changed_at: T,
    mode_changed_by: "callum",
    setter_paused_reason: TAKEOVER_REASON,
  });
});

test("payload: Do not contact writes closed + reason and nothing else", () => {
  assert.deepEqual(modeUpdatePayload({ status: "closed", dncReason: "Spam" }, T, "callum"), {
    setter_status: "closed",
    dnc_reason: "Spam",
    mode_changed_at: T,
    mode_changed_by: "callum",
  });
});

test("planModeChange: the full decision, end to end", () => {
  const row = { setter_status: "auto", unsubscribed: false };
  const ok = planModeChange({ id: ID, expected: "auto", target: "human" }, row, T, "callum");
  assert.ok(ok.ok);
  assert.equal(ok.update.setter_status, "human");
  assert.equal(ok.update.setter_paused_reason, TAKEOVER_REASON);
  assert.deepEqual(ok.activity, { from: "auto", to: "human", from_mode: "ai", to_mode: "human", dnc_reason: null });

  const dnc = planModeChange({ id: ID, expected: "auto", target: "dnc", reason: "lost" }, row, T, "callum");
  assert.ok(dnc.ok);
  assert.equal(dnc.update.dnc_reason, "Lost");
});

test("planModeChange: stale panel → conflict; bad input refused before any write", () => {
  const stale = planModeChange({ id: ID, expected: "auto", target: "human" }, { setter_status: "human", unsubscribed: false }, T, "c");
  assert.deepEqual(stale, { ok: false, conflict: true, error: "Changed elsewhere, refresh." });
  assert.equal(planModeChange({ id: "nope", expected: "auto", target: "human" }, null, T, "c").ok, false);
  assert.equal(planModeChange({ id: ID, expected: "weird", target: "human" }, null, T, "c").ok, false);
  assert.equal(planModeChange({ id: ID, expected: "auto", target: "human" }, null, T, "c").ok, false, "row not found");
  assert.equal(planModeChange({ id: ID, expected: "auto", target: "dnc" }, { setter_status: "auto", unsubscribed: false }, T, "c").ok, false);
  assert.equal(
    planModeChange({ id: ID, expected: "closed", target: "ai" }, { setter_status: "closed", unsubscribed: true }, T, "c").ok,
    false,
    "unsubscribed comes from the fresh row",
  );
});

test("booked → AI or Reply-only is allowed, with a warning", () => {
  assert.equal(validateModeChange({ current: "booked", target: "ai" }).ok, true);
  assert.match(String(modeChangeWarning("booked", "ai")), /booked a call/);
  assert.match(String(modeChangeWarning("booked", "reply_only")), /booked a call/);
  assert.equal(modeChangeWarning("booked", "dnc"), null);
  assert.equal(modeChangeWarning("human", "ai"), null);
});

test("manual takeover reasons from either app are recognised", () => {
  assert.equal(isManualTakeover("manual takeover"), true);
  assert.equal(isManualTakeover(TAKEOVER_REASON), true);
  assert.equal(isManualTakeover("Loop breaker: 3 replies with no answer"), false);
  assert.equal(isManualTakeover(null), false);
});

// ─── other action inputs ────────────────────────────────────────────────

test("qualified input: a uuid and a real boolean only", () => {
  assert.deepEqual(validateQualifiedInput({ id: ID, value: true }), { ok: true, id: ID, value: true });
  assert.equal(validateQualifiedInput({ id: ID, value: "true" }).ok, false);
  assert.equal(validateQualifiedInput({ id: "x", value: false }).ok, false);
});

test("view ids: uuid or positive integer, nothing else", () => {
  assert.equal(viewIdOf(ID), ID);
  assert.equal(viewIdOf(42), "42");
  assert.equal(viewIdOf("42"), "42");
  assert.equal(viewIdOf("0"), null);
  assert.equal(viewIdOf("1,2"), null);
  assert.equal(viewIdOf(-1), null);
  assert.equal(viewIdOf(undefined), null);
});

test("a capped read says so instead of undercounting", () => {
  assert.equal(incompleteNote(76, 76), null);
  assert.equal(incompleteNote(76, null), null);
  assert.match(String(incompleteNote(1000, 1240)), /1000 of 1240/);
});

// ─── replying from the CRM (phase 1B) ───────────────────────────────────

const CID = "11111111-1111-4111-8111-111111111111";
const RID = "22222222-2222-4222-9222-222222222222";

test("reply channels: WhatsApp from an identity or a phone, email only when it's a real address", () => {
  assert.deepEqual(replyChannels({ email: "sam@example.com", phone: "07700 900123" }), ["whatsapp", "email"]);
  // A WhatsApp-only lead: the email column holds a placeholder, not an address.
  assert.deepEqual(replyChannels({ email: "whatsapp:447700900123", phone: "447700900123" }), ["whatsapp"]);
  assert.deepEqual(replyChannels({ email: "messenger:12345", phone: null }), []);
  assert.deepEqual(replyChannels({ email: "not-an-email", phone: null }), []);
  // An identity is enough even without a stored phone.
  assert.deepEqual(replyChannels({ email: null, phone: null }, ["whatsapp"]), ["whatsapp"]);
  // Messenger/Instagram identities are not offered.
  assert.deepEqual(replyChannels({ email: null, phone: null }, ["messenger", "instagram"]), []);
  assert.deepEqual(replyChannels({ email: "sam@example.com", phone: "123" }), ["email"]);
});

test("default channel: their primary if offered, else the first offered", () => {
  assert.equal(defaultReplyChannel(["whatsapp", "email"], "email"), "email");
  assert.equal(defaultReplyChannel(["whatsapp", "email"], "whatsapp"), "whatsapp");
  assert.equal(defaultReplyChannel(["email"], "whatsapp"), "email");
  assert.equal(defaultReplyChannel(["whatsapp", "email"], "messenger"), "whatsapp");
  assert.equal(defaultReplyChannel([], "email"), null);
});

test("button wording per mode: take over for the setter's modes, send for human, blocked for DNC/unsubscribed", () => {
  assert.deepEqual(replyState("auto", false), { kind: "takeover", label: "Take over and send" });
  assert.deepEqual(replyState("reply_only", false), { kind: "takeover", label: "Take over and send" });
  for (const s of ["human", "paused", "booked"]) assert.deepEqual(replyState(s, false), { kind: "send", label: "Send" }, s);
  assert.deepEqual(replyState("closed", false), { kind: "blocked", reason: "Marked do not contact" });
  assert.deepEqual(replyState("closed", true), { kind: "blocked", reason: "Marked do not contact" });
  assert.deepEqual(replyState("human", true), { kind: "blocked", reason: "Unsubscribed" });
  assert.deepEqual(replyState("auto", true), { kind: "blocked", reason: "Unsubscribed" });
  assert.equal(replyState(null, false).kind, "blocked");
  assert.equal(replyState("something_new", false).kind, "blocked");
});

test("WhatsApp window: from their newest inbound WhatsApp message, under 24h is free text", () => {
  const msgs = [
    { channel: "whatsapp", direction: "inbound", created_at: ago(60 * 30) },
    { channel: "whatsapp", direction: "inbound", created_at: ago(60 * 23) },
    { channel: "email", direction: "inbound", created_at: ago(5) },
    { channel: "whatsapp", direction: "outbound", created_at: ago(1) },
  ];
  assert.equal(lastInboundOn(msgs, "whatsapp"), ago(60 * 23));
  assert.equal(lastInboundOn([], "whatsapp"), null);
  assert.equal(insideWhatsAppWindow(ago(60 * 23), NOW), true);
  assert.equal(insideWhatsAppWindow(ago(60 * 24), NOW), false);
  assert.equal(insideWhatsAppWindow(null, NOW), false);
  // Outbound and other channels never open the window.
  assert.equal(willUseTemplate("whatsapp", lastInboundOn(msgs.slice(2), "whatsapp"), NOW), true);
  assert.equal(willUseTemplate("whatsapp", ago(60), NOW), false);
  assert.equal(willUseTemplate("email", null, NOW), false);
});

test("counter: 2000 for free text, 900 for the template's one-line text", () => {
  assert.equal(templateText("Hi\n\nthere \r\n  you"), "Hi there you");
  assert.deepEqual(replyCount("  hello  ", false), { length: 5, max: 2000, over: false });
  assert.equal(replyCount("a".repeat(2001), false).over, true);
  assert.deepEqual(replyCount("a".repeat(901), true), { length: 901, max: 900, over: true });
  assert.equal(replyCount("a".repeat(450) + "\n\n" + "b".repeat(449), true).length, 900);
});

test("send input: ids, channel, status and text are checked before anything leaves the site", () => {
  const good = { consultationId: CID, channel: "whatsapp", text: "  Hello there  ", expectStatus: "auto", requestId: RID };
  const ok = validateSendInput(good);
  assert.ok(ok.ok);
  assert.deepEqual(ok.body, { consultationId: CID, channel: "whatsapp", text: "Hello there", actor: "callum", expectStatus: "auto", requestId: RID });

  const bad = (over: Record<string, unknown>) => {
    const r = validateSendInput({ ...good, ...over });
    assert.equal(r.ok, false, JSON.stringify(over));
    return r.ok ? "" : r.error;
  };
  bad({ consultationId: "x" });
  bad({ channel: "messenger" });
  bad({ channel: undefined });
  bad({ expectStatus: "nonsense" });
  bad({ expectStatus: null });
  assert.match(bad({ expectStatus: "closed" }), /do not contact/i);
  bad({ requestId: "not-a-uuid" });
  bad({ requestId: "22222222-2222-1222-9222-222222222222" }); // not v4
  assert.match(bad({ text: "   " }), /Write a message/);
  bad({ text: 42 });
  assert.match(bad({ text: "a".repeat(2001) }), /2000/);
  assert.equal(validateSendInput({ ...good, text: "a".repeat(2000) }).ok, true);
});

test("endpoint: both env values required, https only (localhost may be http), no trailing-slash doubling", () => {
  const missing = ownerSendEndpoint(undefined, undefined);
  assert.equal(missing.ok, false);
  assert.match(missing.ok ? "" : missing.error, /LEADS_CENTRAL_URL and CRM_SEND_SECRET are missing/);
  const noKey = ownerSendEndpoint("https://lc.example.com", " ");
  assert.match(noKey.ok ? "" : noKey.error, /CRM_SEND_SECRET is missing/);
  assert.equal(ownerSendEndpoint("http://lc.example.com", "k").ok, false);
  assert.equal(ownerSendEndpoint("not a url", "k").ok, false);
  assert.deepEqual(ownerSendEndpoint("https://lc.example.com/", "k"), { ok: true, url: "https://lc.example.com/api/setter/owner-send", secret: "k" });
  assert.deepEqual(ownerSendEndpoint("http://localhost:3001", "k"), { ok: true, url: "http://localhost:3001/api/setter/owner-send", secret: "k" });
});

test("error mapping: Leads Central's success answers", () => {
  const j = (o: unknown) => JSON.stringify(o);
  assert.deepEqual(
    interpretSendResponse(200, j({ ok: true, mode: "human", tookOver: true, channel: "whatsapp", template: "ptll_owner_message", truncated: true, messageId: "m1", externalMessageId: "wamid.1" })),
    { ok: true, mode: "human", tookOver: true, template: true, truncated: true, duplicate: false, messageId: "m1" },
  );
  assert.deepEqual(interpretSendResponse(200, j({ ok: true, mode: "human", template: null, messageId: "m2" })), {
    ok: true,
    mode: "human",
    tookOver: false,
    template: false,
    truncated: false,
    duplicate: false,
    messageId: "m2",
  });
  // A duplicate: an earlier attempt with this requestId already sent; mode is null.
  const dup = interpretSendResponse(200, j({ ok: true, mode: null, duplicate: true, template: null, messageId: "m1" }));
  assert.ok(dup.ok);
  assert.equal(dup.duplicate, true);
  assert.equal(dup.mode, null);
});

test("error mapping: Leads Central's refusals, by code", () => {
  const j = (o: unknown) => JSON.stringify(o);
  const fail = (status: number, body: unknown) => {
    const r = interpretSendResponse(status, j(body));
    assert.equal(r.ok, false);
    return r.ok ? null : r;
  };

  // conflict: fresh requestId and refresh.
  assert.deepEqual(fail(409, { ok: false, code: "conflict", error: "Changed elsewhere — refresh." }), {
    ok: false,
    code: "conflict",
    conflict: true,
    refresh: true,
    error: "Changed elsewhere — refresh.",
    retrySameId: false,
  });
  // conflict from a reused id with different text/channel: also a fresh id.
  const reused = fail(409, { ok: false, code: "conflict", error: "This send id was already used for a different message" });
  assert.equal(reused?.retrySameId, false);
  assert.equal(reused?.error, "This send id was already used for a different message");
  // unknown_outcome: shown as-is, refresh, and the next Send (the user's
  // confirmation to resend) carries a new id.
  const unknown = fail(409, {
    ok: false,
    code: "unknown_outcome",
    error: "Couldn't confirm whether that went — check the conversation on your phone before resending",
  });
  assert.deepEqual(unknown, {
    ok: false,
    code: "unknown_outcome",
    refresh: true,
    error: "Couldn't confirm whether that went — check the conversation on your phone before resending",
    retrySameId: false,
  });
  // `detail` never reaches the browser: only the error is passed on.
  const withDetail = fail(502, { ok: false, code: "send_failed", error: "Gmail said no", detail: { stack: "secret internals" } });
  assert.equal("detail" in (withDetail ?? {}), false);
  assert.equal(JSON.stringify(withDetail).includes("secret internals"), false);
  // in_progress: the same id is still being sent, so keep it.
  const busy = fail(409, { ok: false, code: "in_progress", error: "whatever" });
  assert.equal(busy?.error, SEND_IN_PROGRESS);
  assert.equal(busy?.retrySameId, true);
  // DNC / unsubscribed / closed / opted out: shown as-is, panel refreshed, fresh id.
  for (const code of ["dnc", "unsubscribed", "closed", "opted_out"]) {
    const r = fail(409, { ok: false, code, error: `Refused: ${code}` });
    assert.equal(r?.error, `Refused: ${code}`, code);
    assert.equal(r?.refresh, true, code);
    assert.equal(r?.retrySameId, false, code);
  }
  const noRecipient = fail(409, { ok: false, code: "no_recipient", error: "No WhatsApp number on file." });
  assert.equal(noRecipient?.error, "No WhatsApp number on file.");
  assert.equal(noRecipient?.refresh, undefined);
  // A failure after the take-over happened: refresh, the lead is now Human.
  const tookOver = fail(502, { ok: false, code: "send_failed", error: "Gmail said no", tookOver: true, messageId: "m3" });
  assert.deepEqual(tookOver, { ok: false, code: "send_failed", refresh: true, error: "Gmail said no", retrySameId: false });
  // Template not approved: Leads Central's words, else ours.
  assert.equal(fail(502, { ok: false, code: "template_not_approved", error: "Template not approved yet." })?.error, "Template not approved yet.");
  assert.equal(fail(502, { ok: false, code: "template_not_approved" })?.error, TEMPLATE_NOT_APPROVED);
  // Auth: shown with where to look.
  assert.match(String(fail(401, { ok: false, code: "unauthorized", error: "Unauthorized." })?.error), /^Unauthorized\. Check CRM_SEND_SECRET/);
  assert.equal(fail(503, { ok: false, code: "not_configured", error: "Sending from the CRM isn't set up yet." })?.error, "Sending from the CRM isn't set up yet.");
  assert.match(String(fail(503, { ok: false })?.error), /isn't set up/);
  assert.equal(fail(400, { ok: false, code: "bad_request", error: "Text is too long." })?.error, "Text is too long.");
  assert.equal(fail(500, { ok: false, code: "internal", error: "Something went wrong. Nothing was sent. Try again." })?.retrySameId, false);
  assert.match(String(fail(500, { ok: false })?.error), /HTTP 500/);
});

test("error mapping: no JSON answer is 'couldn't reach', a gateway timeout 'couldn't confirm'; same id on retry", () => {
  const j = (o: unknown) => JSON.stringify(o);
  assert.deepEqual(interpretSendResponse(500, "<html>oops</html>"), { ok: false, error: SEND_UNREACHABLE, retrySameId: true });
  assert.deepEqual(interpretSendResponse(404, ""), { ok: false, error: SEND_UNREACHABLE, retrySameId: true });
  assert.deepEqual(interpretSendResponse(504, "An error occurred"), { ok: false, error: SEND_UNCONFIRMED, retrySameId: true });
  // 2xx that isn't ok:true is not a confirmed send.
  assert.deepEqual(interpretSendResponse(200, j({ ok: false })), { ok: false, error: SEND_UNCONFIRMED, retrySameId: true });
  assert.deepEqual(interpretSendResponse(200, j([1])), { ok: false, error: SEND_UNREACHABLE, retrySameId: true });
});

test("WhatsApp window estimate: Leads Central's rule (identity time at or before the newest inbound row)", () => {
  const row = ago(60 * 20);
  // The identity's own timestamp, earlier than the row (the job ran late): exact.
  assert.deepEqual(whatsappLastMessageAt(row, [ago(60 * 26), null]), { at: ago(60 * 26), exact: true });
  // An identity time after the row is ignored (it belongs to a message not stored yet).
  assert.deepEqual(whatsappLastMessageAt(row, [ago(60)]), { at: row, exact: false });
  // No identity time: the row's created_at, flagged as an estimate.
  assert.deepEqual(whatsappLastMessageAt(row, []), { at: row, exact: false });
  // Nothing inbound: no window, for certain.
  assert.deepEqual(whatsappLastMessageAt(null, [ago(5)]), { at: null, exact: true });
  // The decision follows: 26h by the identity → template, though the row says 20h.
  assert.equal(willUseTemplate("whatsapp", whatsappLastMessageAt(row, [ago(60 * 26)]).at, NOW), true);
});

test("error mapping: a timeout may have sent (keep the id); a failed connection didn't", () => {
  const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
  assert.deepEqual(interpretSendError(timeout), { ok: false, error: SEND_UNCONFIRMED, retrySameId: true });
  assert.deepEqual(interpretSendError(new TypeError("fetch failed")), { ok: false, error: SEND_UNREACHABLE, retrySameId: true });
  assert.deepEqual(interpretSendError("weird"), { ok: false, error: SEND_UNREACHABLE, retrySameId: true });
});
