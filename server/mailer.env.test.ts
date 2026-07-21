/**
 * Validates that EMAIL_USER and EMAIL_PASS environment variables are configured.
 * Does NOT send a real email — only checks that the credentials are present
 * so the Nodemailer transporter can be constructed.
 */
import { describe, it, expect } from "vitest";

describe("Email environment variables", () => {
  it("EMAIL_USER is set and looks like an email address", () => {
    const user = process.env.EMAIL_USER;
    expect(user).toBeTruthy();
    expect(user).toMatch(/@/);
  });

  it("EMAIL_PASS is set and non-empty", () => {
    const pass = process.env.EMAIL_PASS;
    expect(pass).toBeTruthy();
    expect((pass ?? "").length).toBeGreaterThan(0);
  });
});
