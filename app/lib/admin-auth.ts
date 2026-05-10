// HMAC-signed admin auth cookie. Edge-runtime compatible (uses Web Crypto API).
//
// Cookie format: `<expiryMs>.<base64url(hmac-sha256(secret, expiryMs))>`
// On verify: split, recompute HMAC, constant-time compare, check expiry.
//
// This is intentionally minimal — single shared password for a small admin
// team. Upgrade to Supabase Auth or magic links when adding multi-user roles.

const COOKIE_NAME = "ptll_admin_auth";
const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days
const COOKIE_TTL_MS = COOKIE_MAX_AGE_SEC * 1000;

export const ADMIN_AUTH_COOKIE = COOKIE_NAME;
export const ADMIN_AUTH_MAX_AGE = COOKIE_MAX_AGE_SEC;

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

/** Build a fresh signed cookie value valid for COOKIE_TTL_MS. */
export async function issueAuthCookieValue(): Promise<string> {
  const expiry = Date.now() + COOKIE_TTL_MS;
  const sig = await hmacSignBase64Url(String(expiry), getSecret());
  return `${expiry}.${sig}`;
}

/** Verify a cookie value. Returns true iff signature valid and not expired. */
export async function verifyAuthCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const expiryStr = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  try {
    return await hmacVerify(expiryStr, sig, getSecret());
  } catch {
    return false;
  }
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
