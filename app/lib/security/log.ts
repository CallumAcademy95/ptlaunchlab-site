/**
 * Structured logger for spam/validation signals.
 *
 * Writes one JSON line to stdout per event. Vercel surfaces stdout in the
 * Logs tab; you can filter by `level:security` and the structured fields to
 * see what's being rejected and why. Easy to ship to Datadog/Logtail later
 * by just piping the same JSON shape.
 */

export type SecEvent = {
  level: "security";
  endpoint: string;
  outcome: "accepted" | "blocked-silent" | "blocked-user" | "soft-signal";
  signals: string[];
  ip?: string;
  ua?: string | null;
  email_domain?: string | null;
};

export function logSec(event: SecEvent) {
  try {
    // Single-line JSON keeps logs greppable. Drop noisy fields if empty.
    const out: Record<string, unknown> = {
      level: event.level,
      endpoint: event.endpoint,
      outcome: event.outcome,
      signals: event.signals,
    };
    if (event.ip) out.ip = event.ip;
    if (event.ua) out.ua = event.ua;
    if (event.email_domain) out.email_domain = event.email_domain;
    console.log(JSON.stringify(out));
  } catch {
    // Never let logging fail a request
  }
}
