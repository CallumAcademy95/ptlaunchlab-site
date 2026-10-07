// Phone alerts for the owner (Callum) — Web Push to every subscribed device.
//
// Same semantics as Leads Central's pushOwner (the repos share no package, so
// this is a small deliberate duplicate). Subscriptions live in the shared
// Supabase table `owner_push_subscriptions` (service role only).
//
// Never throws: a push failing must not break whatever triggered it.
// No `@/` imports and only type imports from Supabase so node --test can load it.

import webpush from "web-push";
import type { PushSubscription as WebPushSubscription, RequestOptions } from "web-push";

export const OWNER_PUSH_TABLE = "owner_push_subscriptions";

export type OwnerPushPayload = { title: string; body?: string; url?: string; tag?: string };

export type OwnerPushResult = { sent: number; removed: number; failed: number };

export type ParsedSubscription = { endpoint: string; p256dh: string; auth: string };

const MAX_ENDPOINT = 1000;
const MAX_KEY = 200;

/**
 * Validate a browser PushSubscription JSON ({endpoint, keys:{p256dh, auth}}).
 * Returns the flattened row fields, or null if anything is off.
 */
export function parseSubscription(body: unknown): ParsedSubscription | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { endpoint?: unknown; keys?: unknown };
  const endpoint = b.endpoint;
  if (typeof endpoint !== "string" || endpoint.length === 0 || endpoint.length > MAX_ENDPOINT) return null;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!b.keys || typeof b.keys !== "object") return null;
  const { p256dh, auth } = b.keys as { p256dh?: unknown; auth?: unknown };
  const okKey = (k: unknown): k is string => typeof k === "string" && k.length > 0 && k.length <= MAX_KEY;
  if (!okKey(p256dh) || !okKey(auth)) return null;
  return { endpoint, p256dh, auth };
}

/** Pull an endpoint out of an unsubscribe body. */
export function parseEndpoint(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const e = (body as { endpoint?: unknown }).endpoint;
  if (typeof e !== "string" || e.length === 0 || e.length > MAX_ENDPOINT) return null;
  return e;
}

// Minimal slice of the Supabase client this module uses — lets tests pass a fake.
type DbResult<T = unknown> = PromiseLike<{ data: T | null; error: unknown }>;
export interface OwnerPushDb {
  from(table: string): {
    select(cols: string): DbResult<SubRow[]>;
    delete(): { eq(col: string, val: string): DbResult };
    update(values: Record<string, unknown>): { eq(col: string, val: string): DbResult };
  };
}

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number | null;
};

export type SendFn = (
  sub: WebPushSubscription,
  body: string,
  options: RequestOptions
) => Promise<unknown>;

export interface OwnerPushDeps {
  send?: SendFn;
  env?: Record<string, string | undefined>;
  now?: () => Date;
}

let warnedMissingEnv = false;

export async function sendOwnerPush(
  db: OwnerPushDb,
  payload: OwnerPushPayload,
  deps: OwnerPushDeps = {}
): Promise<OwnerPushResult> {
  const result: OwnerPushResult = { sent: 0, removed: 0, failed: 0 };
  const env = deps.env ?? process.env;
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT || "mailto:info@ptlaunchlab.co.uk";
  if (!publicKey || !privateKey) {
    if (!warnedMissingEnv) {
      console.warn("[owner-push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — push disabled");
      warnedMissingEnv = true;
    }
    return result;
  }

  const send: SendFn = deps.send ?? ((sub, body, options) => webpush.sendNotification(sub, body, options));
  const now = deps.now ?? (() => new Date());

  try {
    const { data: subs, error } = await db
      .from(OWNER_PUSH_TABLE)
      .select("id, endpoint, p256dh, auth, failure_count");
    if (error) {
      console.error("[owner-push] failed to load subscriptions", error);
      return result;
    }
    if (!subs?.length) return result;

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body ?? "",
      url: payload.url ?? "/admin/leads",
      tag: payload.tag,
    });
    const options: RequestOptions = {
      TTL: 3600,
      urgency: "high",
      timeout: 8000,
      vapidDetails: { subject, publicKey, privateKey },
    };

    await Promise.all(
      subs.map(async (s) => {
        try {
          await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, options);
          result.sent++;
          try {
            await db
              .from(OWNER_PUSH_TABLE)
              .update({ last_success_at: now().toISOString(), failure_count: 0 })
              .eq("id", s.id);
          } catch (e) {
            console.error("[owner-push] failed to record success", e);
          }
        } catch (err) {
          const status = (err as { statusCode?: number } | null)?.statusCode;
          try {
            if (status === 404 || status === 410) {
              result.removed++;
              await db.from(OWNER_PUSH_TABLE).delete().eq("id", s.id);
            } else {
              result.failed++;
              console.error("[owner-push] send failed", status ?? err);
              await db
                .from(OWNER_PUSH_TABLE)
                .update({ failure_count: (s.failure_count ?? 0) + 1 })
                .eq("id", s.id);
            }
          } catch (e) {
            console.error("[owner-push] failed to record failure", e);
          }
        }
      })
    );
  } catch (err) {
    console.error("[owner-push] sendOwnerPush failed", err);
  }
  return result;
}
