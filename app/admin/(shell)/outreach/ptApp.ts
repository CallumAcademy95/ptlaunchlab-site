import "server-only";

// Talking to the project that actually sends.
//
// The gym outreach runs in pt-app, not here. This project owns the screen; that
// one owns the mailbox, the caps and the cron. Rather than reimplement any of
// that, both buttons call the same endpoint the cron calls, so a batch composed
// from the admin and a batch composed at 10am are composed by identical code.
//
// TWO SECRETS, NOT ONE. pt-app has its own CRON_SECRET and it is NOT the same
// value as this project's — they were compared and they differ. So the
// credential is stored under its own name, PT_APP_CRON_SECRET. Assuming they
// matched would have failed in production only, with a 401 that looked like the
// endpoint was broken.

export interface OutreachCandidate {
  gym: string;
  city?: string | null;
  to: string;
  subject?: string;
  preview?: string;
  ok?: boolean;
  error?: string;
  id?: string;
}

export interface OutreachRun {
  mode: "dry-run" | "SENT";
  /**
   * Which copy composed this batch — the editable row, or the built-in
   * fallback. This is how the editor learns its template was REJECTED. Without
   * it a broken template saves cleanly, a dry run succeeds, and every email
   * goes out in the old words with nothing on screen to say so.
   */
  copy?: "template" | "built-in";
  /** Why pt-app refused the template, in its words. */
  templateIssues?: string[];
  considered: number;
  inBandAndContactable?: number;
  excludedByPartnerRadius?: number;
  sentToday?: number;
  skipped?: string;
  results: OutreachCandidate[];
}

export type RunOutcome =
  | { ok: true; run: OutreachRun }
  | { ok: false; error: string; unconfigured?: boolean };

/** Why a call cannot be made, in words the screen can show. */
export function missingConfig(): string | null {
  if (!process.env.PT_APP_CRON_SECRET) return "PT_APP_CRON_SECRET is not set on this project.";
  if (!process.env.PT_APP_URL) return "PT_APP_URL is not set on this project.";
  return null;
}

/**
 * Compose a batch in pt-app.
 *
 * `send: false` is pt-app's dry run, which is its DEFAULT — it composes the
 * batch, returns it, and writes nothing. You have to ask for a send, and that
 * asymmetry is deliberate on their side; it is preserved here rather than
 * papered over with a single ambiguous "run" call.
 *
 * The request is slow by nature: the route geocodes postcodes in bulk to
 * exclude gyms near an existing partner. 90 seconds is generous on purpose,
 * because a timeout on the SEND path is the genuinely bad case — the emails may
 * well have gone out while we gave up waiting for the answer.
 */
export async function runOutreach(opts: { send: boolean }): Promise<RunOutcome> {
  const missing = missingConfig();
  if (missing) return { ok: false, error: missing, unconfigured: true };

  const url = `${process.env.PT_APP_URL}/api/setter/gym-outreach?band=outside${opts.send ? "&send=1" : ""}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PT_APP_CRON_SECRET}` },
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: opts.send
        ? `No answer from pt-app (${why}). Emails may still have gone out — check the send history before retrying.`
        : `No answer from pt-app (${why}).`,
    };
  }

  const body = await res.text();
  if (!res.ok) return { ok: false, error: `pt-app returned ${res.status}: ${body.slice(0, 200)}` };

  try {
    const json = JSON.parse(body) as OutreachRun & { ok?: boolean };
    return { ok: true, run: { ...json, results: json.results ?? [] } };
  } catch {
    return { ok: false, error: `pt-app returned something that is not JSON: ${body.slice(0, 200)}` };
  }
}
