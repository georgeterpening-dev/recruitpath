/**
 * Gmail OAuth integration for RecruitPath.
 *
 * Security model:
 *  - Both access and refresh tokens are AES-256-GCM encrypted before DB storage.
 *  - The encryption key is derived from JWT_SECRET (already a platform secret).
 *  - Tokens are NEVER returned to the client or logged.
 *  - Only the gmail.send scope is requested — no inbox read access.
 */

import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

// ─── Encryption helpers ───────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from JWT_SECRET using SHA-256.
 * This avoids needing a separate env var while still being secure.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set — cannot encrypt Gmail tokens");
  return crypto.createHash("sha256").update(secret).digest();
}

/** Encrypt a plaintext string → base64-encoded "iv:tag:ciphertext" */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Encode as iv:tag:ciphertext (all base64)
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Decrypt a "iv:tag:ciphertext" base64 string back to plaintext */
export function decryptToken(encoded: string): string {
  const key = getEncryptionKey();
  const [ivB64, tagB64, dataB64] = encoded.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted token format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

// ─── OAuth URL generation ─────────────────────────────────────────────────────

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

/**
 * Build the Google OAuth consent URL.
 * @param state  An opaque string (e.g. JWT user ID) to validate in the callback.
 */
/** Derive the Gmail OAuth callback URI. Uses GMAIL_REDIRECT_URI if set, otherwise
 * falls back to constructing it from GOOGLE_REDIRECT_URI by replacing the path.
 * This ensures the Gmail flow always points to /api/auth/gmail/callback, not
 * /api/auth/google/callback which is for Sign-In only.
 */
function getGmailRedirectUri(): string {
  // Prefer an explicit GMAIL_REDIRECT_URI if configured
  if (process.env.GMAIL_REDIRECT_URI) {
    return process.env.GMAIL_REDIRECT_URI;
  }
  // Fall back: derive from GOOGLE_REDIRECT_URI by replacing the path
  const base = process.env.GOOGLE_REDIRECT_URI;
  if (base) {
    try {
      const url = new URL(base);
      url.pathname = "/api/auth/gmail/callback";
      return url.toString();
    } catch {
      // If parsing fails, use a safe default
    }
  }
  // Last resort default
  return "https://recruitpath.manus.space/api/auth/gmail/callback";
}

export function buildGmailAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getGmailRedirectUri();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }
  console.log("[Gmail OAuth] Building auth URL with redirect_uri:", redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline",   // request refresh_token
    prompt: "consent",        // always show consent to ensure refresh_token is returned
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/** Exchange an authorization code for access + refresh tokens. */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = getGmailRedirectUri();
  console.log("[Gmail OAuth] Exchanging code for tokens with redirect_uri:", redirectUri);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<TokenResponse>;
}

/** Use a refresh token to obtain a fresh access token. */
export async function refreshAccessToken(encryptedRefreshToken: string): Promise<string> {
  const refreshToken = decryptToken(encryptedRefreshToken);
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    // 400 with invalid_grant means the refresh token has been revoked
    if (res.status === 400 && body.includes("invalid_grant")) {
      throw new Error("GMAIL_REFRESH_INVALID");
    }
    throw new Error(`Token refresh failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

// ─── User info ────────────────────────────────────────────────────────────────

/** Fetch the email address associated with an access token. */
export async function getGmailUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Gmail user info");
  const data = (await res.json()) as { email: string };
  return data.email;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

/** Persist encrypted tokens + connected email to the user record. */
export async function saveGmailTokens(
  userId: number,
  accessToken: string,
  refreshToken: string,
  email: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    gmailAccessToken: encryptToken(accessToken),
    gmailRefreshToken: encryptToken(refreshToken),
    gmailConnectedEmail: email,
    gmailConnectedAt: new Date(),
  }).where(eq(users.id, userId));
}

/** Clear all Gmail tokens from the user record (disconnect). */
export async function clearGmailTokens(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    gmailAccessToken: null,
    gmailRefreshToken: null,
    gmailConnectedEmail: null,
    gmailConnectedAt: null,
  }).where(eq(users.id, userId));
}

/** Increment the emailsSent counter on the user record. */
export async function incrementEmailsSent(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ emailsSent: sql`${users.emailsSent} + 1` })
    .where(eq(users.id, userId));
}

// ─── Gmail send ───────────────────────────────────────────────────────────────

/**
 * Send an email via the Gmail API using the user's stored tokens.
 * Automatically refreshes the access token if it has expired.
 *
 * @throws "GMAIL_NOT_CONNECTED"       — user has no stored tokens
 * @throws "GMAIL_REFRESH_INVALID"     — refresh token revoked; user must reconnect
 * @throws "GMAIL_RATE_LIMIT"          — Gmail API 429
 * @throws "GMAIL_NO_COACH_EMAIL"      — to address is empty
 */
export async function sendGmailEmail(
  userId: number,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  if (!to || !to.trim()) {
    throw new Error("GMAIL_NO_COACH_EMAIL");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      gmailAccessToken: users.gmailAccessToken,
      gmailRefreshToken: users.gmailRefreshToken,
      gmailConnectedEmail: users.gmailConnectedEmail,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user?.gmailAccessToken || !user?.gmailRefreshToken) {
    throw new Error("GMAIL_NOT_CONNECTED");
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(user.gmailAccessToken);
  } catch {
    throw new Error("GMAIL_NOT_CONNECTED");
  }

  // Attempt send; if 401, refresh and retry once
  const attemptSend = async (token: string): Promise<Response> => {
    const rawMessage = buildRawMessage(user.gmailConnectedEmail!, to, subject, body);
    return fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: rawMessage }),
    });
  };

  let res = await attemptSend(accessToken);

  if (res.status === 401) {
    // Token expired — refresh and retry
    const newAccessToken = await refreshAccessToken(user.gmailRefreshToken);
    // Persist the new access token
    await db.update(users)
      .set({ gmailAccessToken: encryptToken(newAccessToken) })
      .where(eq(users.id, userId));
    res = await attemptSend(newAccessToken);
  }

  if (res.status === 429) {
    throw new Error("GMAIL_RATE_LIMIT");
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gmail send failed: ${res.status} ${errBody}`);
  }

  await incrementEmailsSent(userId);
}

// ─── RFC 2822 message builder ─────────────────────────────────────────────────

/**
 * Encode a header value using RFC 2047 encoded-word syntax (UTF-8/Base64).
 * This handles em dashes, smart quotes, and any non-ASCII characters in
 * Subject lines so they render correctly in all email clients.
 */
function encodeHeader(value: string): string {
  // Only encode if the value contains non-ASCII characters
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

/**
 * Strip any leading "Subject: ..." line that the AI may have prepended to the body.
 * The subject is sent as a proper email header — it must not appear in the body.
 */
function stripSubjectFromBody(body: string): string {
  // Remove lines like "Subject: 2028 Setter — Excited About..." at the start
  return body
    .replace(/^Subject:.*\n?/im, "")  // remove subject line if present
    .replace(/^\s+/, "")               // trim leading whitespace/newlines
    .trim();
}

/**
 * Build a base64url-encoded RFC 2822 email message for the Gmail API.
 */
function buildRawMessage(from: string, to: string, subject: string, body: string): string {
  // Clean the body — remove any subject line the AI may have prepended
  const cleanBody = stripSubjectFromBody(body);

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    cleanBody,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
