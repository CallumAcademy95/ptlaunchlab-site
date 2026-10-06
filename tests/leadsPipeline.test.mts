// tests/leadsPipeline.test.mts
//
// WHAT THIS PROTECTS
//
// A person who wrote to us and is still waiting.
//
// The case that created this screen, on 2026-10-05: twelve gyms were cold
// emailed at 09:10 and two replied within half an hour. PFP Exeter wrote back
// at 09:22 — "No thanks but I appreciate the message" — from
// pfpexeter@gmail.com, and because the reply reconciler will not domain-match a
// shared mail host, nothing linked it to the prospect. The outreach screen
// reported one reply out of twelve and was, by its own lights, correct.
//
// So "waiting on us" is computed from the conversation itself rather than from
// whether anyone managed to attribute it. The ordering rules matter for the
// same reason: a screen whose job is to show what has been dropped must not
// bury a three-day-old unanswered question under a chat the bot closed an hour
// ago.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  waitingOnUs,
  needsHuman,
  nudgesSinceTheySpoke,
  isClosed,
  leadCounts,
  byUrgency,
  hoursWaiting,
  channelLabel,
  type LeadRow,
} from "../app/admin/(shell)/leads/pipeline.ts";

const lead = (over: Partial<LeadRow> = {}): LeadRow => ({
  id: "1",
  name: "A Gym",
  email: "a@gym.co.uk",
  primary_channel: "email",
  setter_status: "auto",
  setter_stage: "rapport",
  setter_intent: 0,
  last_inbound_at: null,
  last_outbound_at: null,
  ai_unanswered_count: 0,
  unsubscribed: false,
  created_at: "2026-10-01T09:00:00Z",
  ...over,
});

test("someone who wrote after we did is waiting on us", () => {
  assert.equal(
    waitingOnUs(lead({ last_outbound_at: "2026-10-05T09:10:00Z", last_inbound_at: "2026-10-05T09:22:00Z" })),
    true,
    "PFP Exeter, twelve minutes after the cold email",
  );
  assert.equal(
    waitingOnUs(lead({ last_inbound_at: "2026-10-05T09:22:00Z", last_outbound_at: "2026-10-05T09:30:00Z" })),
    false,
    "we answered after they wrote",
  );
});

test("an inbound with no reply at all is the worst case, not an edge case", () => {
  assert.equal(waitingOnUs(lead({ last_inbound_at: "2026-10-05T09:22:00Z" })), true);
});

test("a lead that never wrote to us is not waiting", () => {
  assert.equal(waitingOnUs(lead({ last_outbound_at: "2026-10-05T09:10:00Z" })), false);
});

test("someone who unsubscribed is not waiting on a reply", () => {
  // Chasing them would be the costly mistake, so they drop out of the queue
  // rather than sitting at the top of it forever.
  const gone = lead({ last_inbound_at: "2026-10-05T09:22:00Z", unsubscribed: true });
  assert.equal(waitingOnUs(gone), false);
  assert.equal(needsHuman(gone), false);
  assert.equal(isClosed(gone), true);
});

test("both ways the setter stands down reach a human", () => {
  assert.equal(needsHuman(lead({ setter_status: "human" })), true, "escalated");
  assert.equal(needsHuman(lead({ setter_status: "paused" })), true, "someone paused it");
  assert.equal(needsHuman(lead()), false, "running normally");
});

test("ai_unanswered_count does not mean the AI failed to answer", () => {
  // The column name is a trap and it cost a wrong screen before this test
  // existed. engine.ts sets it to 1 on every OUTBOUND and back to 0 on every
  // inbound, and the re-engagement cron reads 1 as "nudge them once more". It
  // counts our messages since they last spoke — "waiting on THEM".
  //
  // Reading it as an escalation put 24 of 26 live conversations under a red
  // "needs a human" badge. That is the resting state of cold outreach, and an
  // alert that fires on everything is not an alert.
  assert.equal(
    needsHuman(lead({ ai_unanswered_count: 3 })),
    false,
    "three nudges sent and no answer is ordinary, not an escalation",
  );
  assert.equal(nudgesSinceTheySpoke(lead({ ai_unanswered_count: 3 })), 3);
  assert.equal(nudgesSinceTheySpoke(lead({ ai_unanswered_count: 0 })), 0, "their reply is the newest thing");
});

test("the counts separate live work from closed", () => {
  const leads = [
    lead({ id: "a", last_inbound_at: "2026-10-05T09:22:00Z" }),
    lead({ id: "b", setter_status: "human" }),
    lead({ id: "c", setter_status: "closed" }),
    lead({ id: "d", unsubscribed: true }),
    lead({ id: "e" }),
  ];
  assert.deepEqual(leadCounts(leads), { live: 3, waiting: 1, needsHuman: 1, closed: 2 });
});

test("a closed conversation is never counted as waiting", () => {
  // It can still carry a last_inbound_at newer than the last outbound — that
  // is what "they said no and we left it" looks like.
  const refused = lead({
    setter_status: "closed",
    last_outbound_at: "2026-10-05T09:10:00Z",
    last_inbound_at: "2026-10-05T09:22:00Z",
  });
  assert.deepEqual(leadCounts([refused]), { live: 0, waiting: 0, needsHuman: 0, closed: 1 });
});

test("what has been dropped sorts above what is running fine", () => {
  const quietButRecent = lead({ id: "recent", last_outbound_at: "2026-10-06T09:00:00Z" });
  const waitingThreeDays = lead({ id: "waiting", last_inbound_at: "2026-10-03T09:00:00Z" });
  const escalated = lead({ id: "human", setter_status: "human", last_outbound_at: "2026-10-04T09:00:00Z" });
  const done = lead({ id: "closed", setter_status: "closed", last_inbound_at: "2026-10-06T10:00:00Z" });

  assert.deepEqual(
    byUrgency([quietButRecent, done, escalated, waitingThreeDays]).map((l) => l.id),
    ["waiting", "human", "recent", "closed"],
    "recency alone would have buried the three-day-old question",
  );
});

test("hours waiting is only meaningful for someone actually waiting", () => {
  const now = Date.parse("2026-10-06T09:22:00Z");
  assert.equal(hoursWaiting(lead({ last_inbound_at: "2026-10-05T09:22:00Z" }), now), 24);
  assert.equal(hoursWaiting(lead({ last_outbound_at: "2026-10-05T09:10:00Z" }), now), null);
});

test("an unknown channel is labelled, not blanked", () => {
  assert.equal(channelLabel("whatsapp"), "WhatsApp");
  assert.equal(channelLabel(null), "Unknown");
  assert.equal(channelLabel("carrier_pigeon"), "carrier_pigeon", "show it rather than hide the lead");
});
