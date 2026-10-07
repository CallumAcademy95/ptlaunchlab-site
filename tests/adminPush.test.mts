// tests/adminPush.test.mts
//
// WHAT THIS PROTECTS
//
// Phone alerts for the admin (Web Push):
//
//   1. Only a well-formed https subscription gets stored.
//   2. The service worker and manifest are fetchable WITHOUT the admin cookie
//      (the browser fetches them itself), while the admin pages and the
//      /api/admin-push/* routes stay behind it.
//   3. sendOwnerPush cleans up dead subscriptions, counts other failures,
//      no-ops without VAPID keys, and never throws.
//   4. A notification tap can only ever open a same-origin /admin/ page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parseSubscription, parseEndpoint, sendOwnerPush } from "../app/lib/owner-push.ts";
import { isProtectedAdminPath } from "../app/lib/admin-paths.ts";

const VALID = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  expirationTime: null,
  keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" },
};

test("parseSubscription accepts a real-shaped subscription", () => {
  assert.deepEqual(parseSubscription(VALID), {
    endpoint: VALID.endpoint,
    p256dh: VALID.keys.p256dh,
    auth: VALID.keys.auth,
  });
});

test("parseSubscription rejects http, missing keys, oversize and junk", () => {
  assert.equal(parseSubscription({ ...VALID, endpoint: "http://fcm.googleapis.com/x" }), null);
  assert.equal(parseSubscription({ ...VALID, endpoint: "not a url" }), null);
  assert.equal(parseSubscription({ endpoint: VALID.endpoint }), null);
  assert.equal(parseSubscription({ ...VALID, keys: { p256dh: VALID.keys.p256dh } }), null);
  assert.equal(parseSubscription({ ...VALID, keys: { p256dh: "", auth: "x" } }), null);
  assert.equal(parseSubscription({ ...VALID, keys: { p256dh: 123, auth: "x" } }), null);
  assert.equal(parseSubscription({ ...VALID, endpoint: "https://x.test/" + "a".repeat(1000) }), null);
  assert.equal(parseSubscription({ ...VALID, keys: { p256dh: "a".repeat(201), auth: "x" } }), null);
  assert.equal(parseSubscription(null), null);
  assert.equal(parseSubscription("string"), null);
});

test("parseEndpoint", () => {
  assert.equal(parseEndpoint({ endpoint: VALID.endpoint }), VALID.endpoint);
  assert.equal(parseEndpoint({}), null);
  assert.equal(parseEndpoint(null), null);
});

test("isProtectedAdminPath gates the push API and admin pages, not login", () => {
  assert.equal(isProtectedAdminPath("/api/admin-push/test"), true);
  assert.equal(isProtectedAdminPath("/api/admin-push/subscribe"), true);
  assert.equal(isProtectedAdminPath("/api/admin-push/unsubscribe"), true);
  for (const p of ["/api/meta-ads/performance", "/api/meta-ads/optimise", "/api/meta-ads/campaigns", "/api/meta-ads/campaigns/123"]) {
    assert.equal(isProtectedAdminPath(p), true, p);
  }
  assert.equal(isProtectedAdminPath("/admin/leads"), true);
  assert.equal(isProtectedAdminPath("/admin"), true);
  assert.equal(isProtectedAdminPath("/admin/login"), false);
  assert.equal(isProtectedAdminPath("/api/whatsapp-send"), true);
  assert.equal(isProtectedAdminPath("/api/whatsapp-webhook"), false);
});

test("middleware matcher skips the service worker, manifest and icons", () => {
  const src = readFileSync("middleware.ts", "utf8");
  const m = src.match(/matcher:\s*\[\s*("(?:[^"\\]|\\.)*")/);
  assert.ok(m, "could not find the matcher in middleware.ts");
  const pattern: string = JSON.parse(m[1]);
  const re = new RegExp(`^${pattern}$`);
  for (const p of ["/admin/sw.js", "/admin.webmanifest", "/admin-icon-192.png", "/admin-apple-touch-icon.png"]) {
    assert.equal(re.test(p), false, `${p} would hit the middleware (and the admin gate)`);
  }
  for (const p of ["/admin/leads", "/api/admin-push/test", "/admin/login"]) {
    assert.equal(re.test(p), true, `${p} must run through the middleware`);
  }
});

// ── sendOwnerPush ───────────────────────────────────────────────────────────

type Row = { id: string; endpoint: string; p256dh: string; auth: string; failure_count: number | null };

function fakeDb(rows: Row[]) {
  const ops: { op: string; values?: Record<string, unknown>; col: string; val: string }[] = [];
  const db = {
    from(_table: string) {
      return {
        select: (_cols: string) => Promise.resolve({ data: rows, error: null }),
        delete: () => ({
          eq: (col: string, val: string) => {
            ops.push({ op: "delete", col, val });
            return Promise.resolve({ data: null, error: null });
          },
        }),
        update: (values: Record<string, unknown>) => ({
          eq: (col: string, val: string) => {
            ops.push({ op: "update", values, col, val });
            return Promise.resolve({ data: null, error: null });
          },
        }),
      };
    },
  };
  return { db, ops };
}

const ENV = { VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" };
const row = (id: string, failure_count = 2): Row => ({
  id,
  endpoint: `https://push.test/${id}`,
  p256dh: "p",
  auth: "a",
  failure_count,
});
const PAYLOAD = { title: "T", body: "B", url: "/admin/leads", tag: "t" };

test("sendOwnerPush: success resets failure_count and stamps last_success_at", async () => {
  const { db, ops } = fakeDb([row("a")]);
  const calls: unknown[][] = [];
  const now = new Date("2026-10-07T12:00:00Z");
  const res = await sendOwnerPush(db, PAYLOAD, {
    env: ENV,
    now: () => now,
    send: async (...args) => {
      calls.push(args);
    },
  });
  assert.deepEqual(res, { sent: 1, removed: 0, failed: 0 });
  assert.deepEqual(ops, [
    { op: "update", values: { last_success_at: now.toISOString(), failure_count: 0 }, col: "id", val: "a" },
  ]);
  const [sub, body, opts] = calls[0] as [any, string, any];
  assert.equal(sub.endpoint, "https://push.test/a");
  assert.deepEqual(JSON.parse(body), PAYLOAD);
  assert.equal(opts.TTL, 3600);
  assert.equal(opts.urgency, "high");
  assert.equal(opts.timeout, 8000);
  assert.equal(opts.vapidDetails.subject, "mailto:info@ptlaunchlab.co.uk");
});

test("sendOwnerPush: 410 and 404 delete the row", async () => {
  const { db, ops } = fakeDb([row("gone"), row("missing")]);
  const res = await sendOwnerPush(db, PAYLOAD, {
    env: ENV,
    send: async (sub) => {
      throw Object.assign(new Error("x"), { statusCode: sub.endpoint.endsWith("gone") ? 410 : 404 });
    },
  });
  assert.deepEqual(res, { sent: 0, removed: 2, failed: 0 });
  assert.deepEqual(
    ops.map((o) => [o.op, o.val]).sort(),
    [["delete", "gone"], ["delete", "missing"]]
  );
});

test("sendOwnerPush: 500 increments failure_count", async () => {
  const { db, ops } = fakeDb([row("a", 2), { ...row("b"), failure_count: null }]);
  const res = await sendOwnerPush(db, PAYLOAD, {
    env: ENV,
    send: async () => {
      throw Object.assign(new Error("boom"), { statusCode: 500 });
    },
  });
  assert.deepEqual(res, { sent: 0, removed: 0, failed: 2 });
  const byId = Object.fromEntries(ops.map((o) => [o.val, o]));
  assert.deepEqual(byId.a.values, { failure_count: 3 });
  assert.deepEqual(byId.b.values, { failure_count: 1 });
});

test("sendOwnerPush: missing VAPID env is a no-op", async () => {
  const { db, ops } = fakeDb([row("a")]);
  let sends = 0;
  const res = await sendOwnerPush(db, PAYLOAD, {
    env: { VAPID_PUBLIC_KEY: "pub" },
    send: async () => {
      sends++;
    },
  });
  assert.deepEqual(res, { sent: 0, removed: 0, failed: 0 });
  assert.equal(sends, 0);
  assert.equal(ops.length, 0);
});

test("sendOwnerPush: never throws, even when the db and sender both blow up", async () => {
  const broken = {
    from() {
      throw new Error("db down");
    },
  };
  const res = await sendOwnerPush(broken as any, PAYLOAD, {
    env: ENV,
    send: () => {
      throw new Error("sync throw");
    },
  });
  assert.deepEqual(res, { sent: 0, removed: 0, failed: 0, error: "Push send failed unexpectedly." });

  const { db } = fakeDb([row("a")]);
  const res2 = await sendOwnerPush(db, PAYLOAD, {
    env: ENV,
    send: () => {
      throw new Error("sync throw, no status");
    },
  });
  assert.deepEqual(res2, { sent: 0, removed: 0, failed: 1 });
});

// ── service worker: notification tap URL guard ──────────────────────────────

function loadSafeAdminUrl(): (raw: unknown, origin: string) => string {
  const code = readFileSync("public/admin/sw.js", "utf8");
  const ctx: Record<string, unknown> = { self: { addEventListener() {} }, URL };
  vm.runInNewContext(code + "\nthis.__safe = safeAdminUrl;", ctx);
  return ctx.__safe as (raw: unknown, origin: string) => string;
}

test("sw.js only opens same-origin /admin/ URLs on tap", () => {
  const safe = loadSafeAdminUrl();
  const O = "https://ptlaunchlab.co.uk";
  assert.equal(safe("/admin/leads/123", O), `${O}/admin/leads/123`);
  assert.equal(safe(`${O}/admin/leads/abc`, O), `${O}/admin/leads/abc`);
  assert.equal(safe("https://evil.example/admin/leads", O), `${O}/admin/leads`);
  assert.equal(safe("/", O), `${O}/admin/leads`);
  assert.equal(safe("/administrator", O), `${O}/admin/leads`);
  assert.equal(safe("javascript:alert(1)", O), `${O}/admin/leads`);
  assert.equal(safe("//evil.example/admin/x", O), `${O}/admin/leads`);
  assert.equal(safe(undefined, O), `${O}/admin/leads`);
});

test("sendOwnerPush: 403 prunes only once failure_count has reached 5", async () => {
  const { db, ops } = fakeDb([row("old", 5), row("new", 4)]);
  const res = await sendOwnerPush(db, PAYLOAD, {
    env: ENV,
    send: async () => {
      throw Object.assign(new Error("forbidden"), { statusCode: 403 });
    },
  });
  assert.deepEqual(res, { sent: 0, removed: 1, failed: 1 });
  const byId = Object.fromEntries(ops.map((o) => [o.val, o]));
  assert.equal(byId.old.op, "delete");
  assert.equal(byId.new.op, "update");
  assert.deepEqual(byId.new.values, { failure_count: 5 });
});

test("sendOwnerPush: a failed subscription load is reported, not hidden as zero sends", async () => {
  const db = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: "permission denied" } }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  };
  const res = await sendOwnerPush(db, PAYLOAD, { env: ENV, send: async () => {} });
  assert.equal(res.sent, 0);
  assert.equal(typeof res.error, "string");
});

test("sendOwnerPush: trims whitespace off the VAPID env values", async () => {
  const { db } = fakeDb([row("a")]);
  let opts: any;
  await sendOwnerPush(db, PAYLOAD, {
    env: { VAPID_PUBLIC_KEY: " pub\n", VAPID_PRIVATE_KEY: "priv \r\n", VAPID_SUBJECT: " mailto:x@y.z " },
    send: async (_s, _b, o) => {
      opts = o;
    },
  });
  assert.deepEqual(opts.vapidDetails, { subject: "mailto:x@y.z", publicKey: "pub", privateKey: "priv" });
});

// ── service worker: push + notificationclick handlers ───────────────────────

function loadSw(clients: Record<string, unknown> = {}) {
  const handlers: Record<string, (e: any) => void> = {};
  const shown: { title: string; options: any }[] = [];
  const self = {
    location: { origin: "https://ptlaunchlab.co.uk" },
    addEventListener: (name: string, fn: (e: any) => void) => {
      handlers[name] = fn;
    },
    registration: {
      showNotification: async (title: string, options: any) => {
        shown.push({ title, options });
      },
    },
    clients,
  };
  vm.runInNewContext(readFileSync("public/admin/sw.js", "utf8"), { self, URL, Date });
  return { handlers, shown };
}

async function firePush(handlers: Record<string, (e: any) => void>, data: any) {
  const waits: Promise<unknown>[] = [];
  handlers.push({ data, waitUntil: (p: Promise<unknown>) => waits.push(p) });
  await Promise.all(waits);
}

test("sw.js push: a malformed payload still shows a PTLL Admin notification", async () => {
  const { handlers, shown } = loadSw();
  await firePush(handlers, { json: () => { throw new SyntaxError("bad"); }, text: () => "raw text" });
  await firePush(handlers, { json: () => null, text: () => "null" });
  await firePush(handlers, { json: () => "just a string", text: () => "" });
  await firePush(handlers, null);
  assert.equal(shown.length, 4);
  for (const n of shown) {
    assert.equal(n.title, "PTLL Admin");
    assert.equal(n.options.data.url, "/admin/leads");
    assert.equal(n.options.tag, undefined);
  }
  assert.equal(shown[0].options.body, "raw text");
});

test("sw.js push: a full payload sets tag + renotify and the url", async () => {
  const { handlers, shown } = loadSw();
  await firePush(handlers, {
    json: () => ({ title: "Needs you: Sam", body: "wants a call", url: "/admin/leads/42", tag: "handover-42" }),
  });
  assert.equal(shown[0].title, "Needs you: Sam");
  assert.equal(shown[0].options.tag, "handover-42");
  assert.equal(shown[0].options.renotify, true);
  assert.equal(shown[0].options.data.url, "/admin/leads/42");
  assert.equal(shown[0].options.icon, "/admin-icon-192.png");
});

async function fireClick(clientList: any[], url: string) {
  const opened: string[] = [];
  const { handlers } = loadSw({
    matchAll: async () => clientList,
    openWindow: async (u: string) => {
      opened.push(u);
    },
  });
  const waits: Promise<unknown>[] = [];
  handlers.notificationclick({
    notification: { close() {}, data: { url } },
    waitUntil: (p: Promise<unknown>) => waits.push(p),
  });
  await Promise.all(waits);
  return opened;
}

test("sw.js click: navigates + focuses an open admin window, no extra window", async () => {
  const log: string[] = [];
  const client = {
    url: "https://ptlaunchlab.co.uk/admin/partners",
    navigate: async (u: string) => {
      log.push(`navigate ${u}`);
      return client;
    },
    focus: async () => {
      log.push("focus");
      return client;
    },
  };
  const opened = await fireClick([client], "/admin/leads/7");
  assert.deepEqual(log, ["navigate https://ptlaunchlab.co.uk/admin/leads/7", "focus"]);
  assert.deepEqual(opened, []);
});

test("sw.js click: navigate rejecting or missing falls back to openWindow", async () => {
  const rejecting = {
    url: "https://ptlaunchlab.co.uk/admin/leads",
    navigate: async () => {
      throw new TypeError("not controlled");
    },
    focus: async () => {},
  };
  assert.deepEqual(await fireClick([rejecting], "/admin/leads/1"), ["https://ptlaunchlab.co.uk/admin/leads/1"]);

  const noNavigate = { url: "https://ptlaunchlab.co.uk/admin/leads", focus: async () => {} };
  assert.deepEqual(await fireClick([noNavigate], "/admin/leads/2"), ["https://ptlaunchlab.co.uk/admin/leads/2"]);

  const publicTab = { url: "https://ptlaunchlab.co.uk/", navigate: async () => { throw new Error("must not"); } };
  assert.deepEqual(await fireClick([publicTab], "https://evil.example/x"), ["https://ptlaunchlab.co.uk/admin/leads"]);
});
