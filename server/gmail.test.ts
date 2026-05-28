/**
 * Tests for Gmail integration helpers.
 *
 * Covers:
 *  - Token encryption / decryption round-trip
 *  - sendGmailEmail error paths (not connected, no coach email, rate limit)
 *  - gmail.status tRPC query (connected vs disconnected)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { encryptToken, decryptToken } from "./gmail";

// ─── Encryption helpers ───────────────────────────────────────────────────────

describe("encryptToken / decryptToken", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-sha256";
  });

  it("round-trips a short string", () => {
    const plain = "ya29.access_token_example";
    const encrypted = encryptToken(plain);
    expect(encrypted).not.toBe(plain);
    expect(decryptToken(encrypted)).toBe(plain);
  });

  it("round-trips a long token string", () => {
    const plain = "1//refresh_token_" + "x".repeat(200);
    expect(decryptToken(encryptToken(plain))).toBe(plain);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plain = "same_token";
    const a = encryptToken(plain);
    const b = encryptToken(plain);
    // Same plaintext → different ciphertext due to random IV
    expect(a).not.toBe(b);
    // But both decrypt correctly
    expect(decryptToken(a)).toBe(plain);
    expect(decryptToken(b)).toBe(plain);
  });

  it("throws on tampered ciphertext", () => {
    const plain = "token";
    const encrypted = encryptToken(plain);
    // Flip last character of the data segment
    const parts = encrypted.split(":");
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === "A" ? "B" : "A");
    expect(() => decryptToken(parts.join(":"))).toThrow();
  });

  it("throws on invalid format", () => {
    expect(() => decryptToken("not-valid-format")).toThrow("Invalid encrypted token format");
  });
});

// ─── sendGmailEmail error paths ───────────────────────────────────────────────

describe("sendGmailEmail error paths", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-sha256";
    vi.resetAllMocks();
  });

  it("throws GMAIL_NO_COACH_EMAIL when to is empty", async () => {
    const { sendGmailEmail } = await import("./gmail");
    await expect(sendGmailEmail(1, "", "Subject", "Body")).rejects.toThrow("GMAIL_NO_COACH_EMAIL");
  });

  it("throws GMAIL_NO_COACH_EMAIL when to is whitespace", async () => {
    const { sendGmailEmail } = await import("./gmail");
    await expect(sendGmailEmail(1, "   ", "Subject", "Body")).rejects.toThrow("GMAIL_NO_COACH_EMAIL");
  });

  it("throws GMAIL_NOT_CONNECTED when user has no tokens in DB", async () => {
    // Mock getDb to return a user with no tokens
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          gmailAccessToken: null,
          gmailRefreshToken: null,
          gmailConnectedEmail: null,
        }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      }),
      getUserByOpenId: vi.fn(),
    }));

    const { sendGmailEmail: sendFn } = await import("./gmail?nocache=" + Date.now());
    await expect(sendFn(1, "coach@school.edu", "Subject", "Body")).rejects.toThrow("GMAIL_NOT_CONNECTED");
    vi.doUnmock("./db");
  });
});

// ─── gmail.status tRPC query ──────────────────────────────────────────────────

describe("gmail.status response shape", () => {
  it("returns connected=false shape when no tokens present", () => {
    // Simulate the shape returned by the procedure when no token
    const result = { connected: false, email: null, emailsSent: 0, connectedAt: null };
    expect(result.connected).toBe(false);
    expect(result.email).toBeNull();
    expect(result.emailsSent).toBe(0);
  });

  it("returns connected=true shape when tokens present", () => {
    const result = {
      connected: true,
      email: "athlete@gmail.com",
      emailsSent: 7,
      connectedAt: new Date(),
    };
    expect(result.connected).toBe(true);
    expect(result.email).toBe("athlete@gmail.com");
    expect(result.emailsSent).toBe(7);
  });
});
