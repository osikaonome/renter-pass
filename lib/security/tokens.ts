import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (l, o, 0, 1)

/** Unguessable public slug: 14 chars from a 32-symbol alphabet = 70 bits. */
export function generateSlug(length = 14): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (const byte of bytes) slug += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
  return slug;
}

/** Opaque bearer secret for emails (invites, requester access). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Keyed hash for short secrets (one-time codes) so a DB leak can't brute-force them offline. */
export function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Compact signed payload: base64url(json).signature. Used for the requester session cookie. */
export function sign(payload: object, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, secret)}`;
}

export function verify<T>(token: string | undefined, secret: string): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(hmac(body, secret), signature)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
