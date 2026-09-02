// HMAC-signed admin auth cookie. Edge-runtime compatible (uses Web Crypto API).
//
// Cookie formats — BOTH are accepted on verify:
//   v2 (current): `<expiryMs>.<subject>.<base64url(hmac(secret, "expiry.subject"))>`
//   v1 (legacy):  `<expiryMs>.<base64url(hmac(secret, expiryMs))>`
//
// v1 is still honoured so that shipping v2 does not sign every existing admin
// out. It carries no identity, so it logs as `user:legacy`. Once everyone has
// signed in again, v1 support can be deleted — that is the only step needed.
//
// IDENTITY
// Originally a single shared password with no notion of *who* logged in. The
// admin overview now shows named leads, phone numbers and payment amounts, so
// per-person credentials matter: you can tell who accessed it, and revoke one
// person without rotating a secret everybody shares.
//
// Configure ADMIN_USERS as JSON:  [{"id":"callum","password":"…"}, …]
// If ADMIN_USERS is absent, ADMIN_PASSWORD still works exactly as before and
// authenticates as subject "admin". Nothing breaks by not setting it.

const COOKIE_NAME = "ptll_admin_auth";

// 30 days was generous for a password-only gate on a page that now shows
// customer PII. Override with ADMIN_SESSION_DAYS if a different trade is wanted.
const DEFAULT_SESSION_DAYS = 7;
function sessionDays(): number {
  const raw = Number(process.env.ADMIN_SESSION_DAYS);
  return Number.isFinite(raw) && raw > 0 && raw <= 90 ? raw : DEFAULT_SESSION_DAYS;
}
const COOKIE_MAX_AGE_SEC = sessionDays() * 24 * 60 * 60;
const COOKIE_TTL_MS = COOKIE_MAX_AGE_SEC * 1000;

export const ADMIN_AUTH_COOKIE = COOKIE_NAME;
export const ADMIN_AUTH_MAX_AGE = COOKIE_MAX_AGE_SEC;

export interface AdminUser {
  id: string;
  password: string;
}

/**
 * Named admin users from ADMIN_USERS, or a single implicit "admin" user from
 * ADMIN_PASSWORD. Returns [] when neither is configured — callers must treat
 * that as "deny", never as "allow".
 */
export function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const users = parsed.filter(
          (u): u is AdminUser =>
            !!u && typeof u.id === "string" && u.id.length > 0 &&
            typeof u.password === "string" && u.password.length > 0,
        );
        if (users.length) return users;
      }
      // Malformed ADMIN_USERS must not silently fall through to the shared
      // password — that would look like it worked while identity was lost.
      console.error("[admin-auth] ADMIN_USERS is set but unusable (expected [{id,password}]). Refusing to fall back.");
      return [];
    } catch {
      console.error("[admin-auth] ADMIN_USERS is not valid JSON. Refusing to fall back to ADMIN_PASSWORD.");
      return [];
    }
  }
  const shared = process.env.ADMIN_PASSWORD;
  return shared ? [{ id: "admin", password: shared }] : [];
}

function getSecret(): string {
  const s = process.env.ADMIN_AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_AUTH_SECRET missing or too short (min 32 chars)");
  }
  return s;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSignBase64Url(data: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function hmacVerify(data: string, sigBase64Url: string, secret: string): Promise<boolean> {
  try {
    const key = await importHmacKey(secret);
    const sigBytes = base64UrlToBytes(sigBase64Url);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as ArrayBuffer,
      new TextEncoder().encode(data)
    );
  } catch {
    return false;
  }
}

// Subjects go in the cookie and the audit log, so keep them boring and safe:
// no dots (the cookie delimiter) and nothing that could confuse a log grep.
const SAFE_SUBJECT = /^[a-zA-Z0-9_-]{1,40}$/;

/**
 * Build a fresh signed cookie for `subject`, valid for the session window.
 * Subject defaults to "admin" so existing callers keep working unchanged.
 */
export async function issueAuthCookieValue(subject = "admin"): Promise<string> {
  const sub = SAFE_SUBJECT.test(subject) ? subject : "admin";
  const expiry = Date.now() + COOKIE_TTL_MS;
  const payload = `${expiry}.${sub}`;
  const sig = await hmacSignBase64Url(payload, getSecret());
  return `${payload}.${sig}`;
}

/**
 * Verify a cookie and return the subject it authenticates, or null.
 *
 * Accepts the current 3-part format and the legacy 2-part one. The legacy
 * branch is what stops this change signing everyone out; remove it once all
 * admins have signed in again.
 */
export async function readAuthCookieSubject(
  value: string | undefined | null,
): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2 && parts.length !== 3) return null;

  const expiry = Number(parts[0]);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;

  try {
    if (parts.length === 3) {
      const [expiryStr, sub, sig] = parts;
      if (!SAFE_SUBJECT.test(sub)) return null;
      const ok = await hmacVerify(`${expiryStr}.${sub}`, sig, getSecret());
      return ok ? sub : null;
    }
    // Legacy: signature covers the expiry alone, and carries no identity.
    const ok = await hmacVerify(parts[0], parts[1], getSecret());
    return ok ? "legacy" : null;
  } catch {
    return null;
  }
}

/** Verify a cookie value. Returns true iff signature valid and not expired. */
export async function verifyAuthCookieValue(value: string | undefined | null): Promise<boolean> {
  return (await readAuthCookieSubject(value)) !== null;
}

/**
 * Constant-time string comparison (prevents timing attacks against the password).
 * Both inputs are normalised to the same length before compare.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  // Pad both to the longer length so attackers can't infer real length from timing.
  const len = Math.max(a.length, b.length);
  const aPad = a.padEnd(len, "\0");
  const bPad = b.padEnd(len, "\0");
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    mismatch |= aPad.charCodeAt(i) ^ bPad.charCodeAt(i);
  }
  return mismatch === 0;
}
