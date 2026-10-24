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
  BAND_FILTERS,
  BUILT_IN_VIEWS,
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
  isRealEmail,
  replyForm,
  sentNotice,
  replyKey,
  planAttempt,
  attemptAfter,
  TEMPLATE_CUT_WARNING,
  type ReplyIdentity,
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

test("reactivated: normalised from the view column, false when absent, filterable and counted", () => {
  assert.equal(normalisePerson({ id: "d1111111-1111-4111-8111-111111111111", reactivated: true })?.reactivated, true);
  assert.equal(normalisePerson({ id: "d1111111-1111-4111-8111-111111111111" })?.reactivated, false);
  assert.equal(normalisePerson({ id: "d1111111-1111-4111-8111-111111111111", reactivated: "true" })?.reactivated, false);
  const rows = [
    person({ id: "d1111111-1111-4111-8111-111111111111", reactivated: true }),
    person({ id: "d2222222-1111-4111-8111-111111111111" }),
    person({ id: "d3333333-1111-4111-8111-111111111111", reactivated: true, already_qualified: true }),
  ];
  assert.deepEqual(
    filterPeople(rows, { band: "reactivated" }, NOW).map((p) => p.id).sort(),
    ["d1111111-1111-4111-8111-111111111111", "d3333333-1111-4111-8111-111111111111"],
  );
  assert.equal(tileCounts(rows, NOW).reactivated, 2);
  assert.ok((BAND_FILTERS as readonly string[]).includes("reactivated"));
  assert.equal(parseCrmQuery({ band: "reactivated" }).band, "reactivated");
  assert.equal(crmHref({ band: "reactivated" }), "/admin/crm?band=reactivated");
  assert.deepEqual(BUILT_IN_VIEWS.find((v) => v.name === "Reactivated")?.query, { band: "reactivated" });
  const names = BUILT_IN_VIEWS.map((v) => v.name);
  assert.equal(names.indexOf("Reactivated"), names.indexOf("Qualified PTs") + 1);
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

test("reply channels: Leads Central's rules (identity, consent, real email)", () => {
  const wa = (over: Record<string, unknown> = {}) => ({ channel: "whatsapp", external_id: "447700900123", consent_state: "opted_in", created_at: ago(100), ...over }) as ReplyIdentity;
  const em = (over: Record<string, unknown> = {}) => ({ channel: "email", external_id: "sam@example.com", consent_state: null, created_at: ago(100), ...over }) as ReplyIdentity;

  assert.deepEqual(replyChannels({ email: "sam@example.com" }, [wa()]), ["whatsapp", "email"]);
  // A phone alone is not enough: Leads Central sends to the WhatsApp identity.
  assert.deepEqual(replyChannels({ email: null }, []), []);
  // The identity needs a non-empty external_id.
  assert.deepEqual(replyChannels({ email: null }, [wa({ external_id: "  " })]), []);
  assert.deepEqual(replyChannels({ email: null }, [wa({ external_id: null })]), []);
  // Opted out of WhatsApp: not offered. Judged on the newest usable identity, as Leads Central picks it.
  assert.deepEqual(replyChannels({ email: null }, [wa({ consent_state: "opted_out" })]), []);
  assert.deepEqual(replyChannels({ email: null }, [wa({ consent_state: "opted_out", created_at: ago(200) }), wa({ created_at: ago(10) })]), ["whatsapp"]);
  assert.deepEqual(replyChannels({ email: null }, [wa({ created_at: ago(200) }), wa({ consent_state: "opted_out", created_at: ago(10) })]), []);

  // Email: a real address on the newest email identity or on the consultation.
  assert.deepEqual(replyChannels({ email: "whatsapp:447700900123" }, [wa()]), ["whatsapp"]);
  assert.deepEqual(replyChannels({ email: "messenger:12345" }, []), []);
  assert.deepEqual(replyChannels({ email: "not-an-email" }, []), []);
  assert.deepEqual(replyChannels({ email: "sam@localhost" }, []), []); // isRealEmail wants a dot in the domain
  assert.deepEqual(replyChannels({ email: "whatsapp:447700900123" }, [em()]), ["email"]);
  assert.deepEqual(replyChannels({ email: "sam@example.com" }, []), ["email"]);
  // Opted out of email: not offered, even with a real consultation email.
  assert.deepEqual(replyChannels({ email: "sam@example.com" }, [em({ consent_state: "opted_out" })]), []);
  // Messenger/Instagram identities are never offered.
  assert.deepEqual(replyChannels({ email: null }, [{ channel: "messenger", external_id: "1" }, { channel: "instagram", external_id: "2" }]), []);
});

test("isRealEmail matches pt-app's rule", () => {
  assert.equal(isRealEmail("a@b.co"), true);
  assert.equal(isRealEmail("  a@b.co  "), true);
  assert.equal(isRealEmail("whatsapp:a@b.co"), false);
  assert.equal(isRealEmail("a b@c.co"), false);
  assert.equal(isRealEmail("a@b"), false);
  assert.equal(isRealEmail(null), false);
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

test("counter: 2000 for free text, 900 for a certain template, 2000 + a warning for a probable one", () => {
  assert.equal(templateText("Hi\n\nthere \r\n  you"), "Hi there you");
  assert.equal(templateText("a\tb   c"), "a b c");
  assert.deepEqual(replyCount("  hello  ", "free"), { length: 5, max: 2000, over: false, willCut: false });
  assert.equal(replyCount("a".repeat(2001), "free").over, true);
  assert.equal(replyCount("a".repeat(1500), "free").willCut, false);
  assert.deepEqual(replyCount("a".repeat(901), "template"), { length: 901, max: 900, over: true, willCut: false });
  assert.equal(replyCount("a".repeat(450) + "\n\n" + "b".repeat(449), "template").length, 900);
  // Only probably a template: not blocked at 900, but warned it'd be cut.
  assert.deepEqual(replyCount("a".repeat(1200), "maybe_template"), { length: 1200, max: 2000, over: false, willCut: true });
  assert.equal(replyCount("a".repeat(900), "maybe_template").willCut, false);
  assert.equal(replyCount("a".repeat(2001), "maybe_template").over, true);
  assert.match(TEMPLATE_CUT_WARNING, /cut to 900 characters/);
});

test("reply form: a template is certain only when the window time is exact", () => {
  assert.equal(replyForm("email", true, true), "free");
  assert.equal(replyForm("whatsapp", false, false), "free");
  assert.equal(replyForm("whatsapp", true, true), "template");
  assert.equal(replyForm("whatsapp", true, false), "maybe_template");
  assert.equal(replyForm(null, true, true), "free");
});

test("sent notice: shortened templates say so; duplicates and take-overs too", () => {
  const base = { template: false, truncated: false, duplicate: false, tookOver: false };
  assert.equal(sentNotice(base, "email"), "Sent by Email.");
  assert.equal(sentNotice({ ...base, template: true }, "whatsapp"), "Sent as the WhatsApp template.");
  assert.equal(sentNotice({ ...base, template: true, truncated: true }, "whatsapp"), "Sent (shortened to 900 characters for the template).");
  assert.match(sentNotice({ ...base, tookOver: true }, "whatsapp"), /^Sent by WhatsApp\. You've taken over/);
  assert.match(sentNotice({ ...base, duplicate: true }, "whatsapp"), /Already sent/);
});

test("send attempts: same id only for a retry of the same message; anything else after a maybe-sent attempt needs a confirm", () => {
  let n = 0;
  const newId = () => `id-${++n}`;
  const k1 = replyKey("whatsapp", " Hello ");
  const k2 = replyKey("whatsapp", "Hello again");
  assert.equal(k1, replyKey("whatsapp", "Hello")); // trimmed, as Leads Central trims
  assert.notEqual(replyKey("email", "Hello"), k1);

  // Nothing before: new id, no confirm.
  assert.deepEqual(planAttempt(null, k1, newId), { requestId: "id-1", confirmResend: false });

  // Timeout / network / non-JSON 5xx: may have sent, the id is reusable.
  const timedOut = attemptAfter(interpretSendError(Object.assign(new Error("t"), { name: "TimeoutError" })), "A", k1);
  assert.deepEqual(timedOut, { id: "A", key: k1, reusable: true, uncertain: true });
  assert.deepEqual(planAttempt(timedOut, k1, newId), { requestId: "A", confirmResend: false });
  // Edited text or another channel: a new message, so a new id, after a confirm.
  assert.deepEqual(planAttempt(timedOut, k2, newId), { requestId: "id-2", confirmResend: true });
  assert.deepEqual(planAttempt(timedOut, replyKey("email", "Hello"), newId), { requestId: "id-3", confirmResend: true });
  const crashed = attemptAfter(interpretSendResponse(500, "<html>"), "B", k1);
  assert.deepEqual(crashed, { id: "B", key: k1, reusable: true, uncertain: true });

  // unknown_outcome: the id can't be reused; even the same text needs the confirm.
  const unknown = attemptAfter(interpretSendResponse(409, JSON.stringify({ ok: false, code: "unknown_outcome", error: "?" })), "C", k1);
  assert.deepEqual(unknown, { id: "C", key: k1, reusable: false, uncertain: true });
  assert.deepEqual(planAttempt(unknown, k1, newId), { requestId: "id-4", confirmResend: true });

  // Definitely not sent (refused to connect): same id kept for the same text, no confirm for new text.
  const refused = attemptAfter(interpretSendError(Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } })), "D", k1);
  assert.deepEqual(refused, { id: "D", key: k1, reusable: true, uncertain: false });
  assert.deepEqual(planAttempt(refused, k2, newId), { requestId: "id-5", confirmResend: false });

  // A definite answer (conflict, send_failed, template_problem) or a success: forgotten, fresh id next time.
  assert.equal(attemptAfter(interpretSendResponse(409, JSON.stringify({ ok: false, code: "conflict", error: "x" })), "E", k1), null);
  assert.equal(attemptAfter(interpretSendResponse(502, JSON.stringify({ ok: false, code: "send_failed", error: "x" })), "F", k1), null);
  assert.equal(attemptAfter(interpretSendResponse(502, JSON.stringify({ ok: false, code: "template_problem", error: "x" })), "H", k1), null);
  assert.equal(attemptAfter(interpretSendResponse(200, JSON.stringify({ ok: true, mode: "human" })), "G", k1), null);
});

test("template_problem and send_failed: Leads Central's plain words shown as-is, no retry", () => {
  const j = (o: unknown) => JSON.stringify(o);
  const tp = interpretSendResponse(502, j({ ok: false, code: "template_problem", error: "Template problem (WhatsApp error 132012). Message them from your phone." }));
  assert.deepEqual(tp, {
    ok: false,
    code: "template_problem",
    error: "Template problem (WhatsApp error 132012). Message them from your phone.",
    retrySameId: false,
  });
  const tpBare = interpretSendResponse(502, j({ ok: false, code: "template_problem" }));
  assert.match(tpBare.ok ? "" : tpBare.error, /Template problem/);
  const sf = interpretSendResponse(
    502,
    j({ ok: false, code: "send_failed", error: "Not sent: WhatsApp says their 24-hour window has closed. Message them from your phone." }),
  );
  assert.equal(sf.ok ? "" : sf.error, "Not sent: WhatsApp says their 24-hour window has closed. Message them from your phone.");
  assert.equal(sf.ok ? true : sf.retrySameId, false);
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
    uncertain: true,
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

test("error mapping: a non-JSON 5xx may have sent ('couldn't confirm'); a non-JSON 4xx never ran; same id on retry", () => {
  const j = (o: unknown) => JSON.stringify(o);
  const unconfirmed = { ok: false, error: SEND_UNCONFIRMED, retrySameId: true, uncertain: true };
  for (const status of [500, 502, 503, 504]) {
    assert.deepEqual(interpretSendResponse(status, "<html>oops</html>"), unconfirmed, String(status));
  }
  assert.deepEqual(interpretSendResponse(404, ""), { ok: false, error: SEND_UNREACHABLE, retrySameId: true });
  // 2xx that isn't ok:true is not a confirmed send.
  assert.deepEqual(interpretSendResponse(200, j({ ok: false })), unconfirmed);
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

test("error mapping: only a connection that never opened is 'nothing was sent'; anything else 'couldn't confirm'", () => {
  const unconfirmed = { ok: false, error: SEND_UNCONFIRMED, retrySameId: true, uncertain: true };
  const unreachable = { ok: false, error: SEND_UNREACHABLE, retrySameId: true };
  const fetchFailed = (code: string) => Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error(code), { code }) });
  assert.deepEqual(interpretSendError(Object.assign(new Error("timeout"), { name: "TimeoutError" })), unconfirmed);
  assert.deepEqual(interpretSendError(Object.assign(new Error("aborted"), { name: "AbortError" })), unconfirmed);
  for (const code of ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "UND_ERR_CONNECT_TIMEOUT"]) {
    assert.deepEqual(interpretSendError(fetchFailed(code)), unreachable, code);
  }
  // A reset mid-request, a redirect refused, or anything unrecognised may have come after the send.
  assert.deepEqual(interpretSendError(fetchFailed("ECONNRESET")), unconfirmed);
  assert.deepEqual(interpretSendError(fetchFailed("UND_ERR_SOCKET")), unconfirmed);
  assert.deepEqual(interpretSendError(new TypeError("fetch failed")), unconfirmed);
  assert.deepEqual(interpretSendError("weird"), unconfirmed);
});
