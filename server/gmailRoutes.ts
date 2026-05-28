/**
 * Express route handlers for Gmail OAuth and email sending.
 *
 * Routes registered:
 *   GET  /api/auth/gmail              — redirect to Google consent screen
 *   GET  /api/auth/gmail/callback     — handle OAuth callback, store tokens
 *   POST /api/auth/gmail/disconnect   — clear stored tokens
 *   POST /api/email/send              — send email via Gmail API
 */

import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  buildGmailAuthUrl,
  exchangeCodeForTokens,
  getGmailUserEmail,
  saveGmailTokens,
  clearGmailTokens,
  sendGmailEmail,
} from "./gmail";

// ─── Auth helper ─────────────────────────────────────────────────────────────

/** Extract the authenticated user from the session cookie. Returns null if not authed. */
async function getSessionUser(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerGmailRoutes(app: Express): void {
  /**
   * GET /api/auth/gmail
   * Redirects the authenticated user to Google's OAuth consent screen.
   * Uses the user's numeric DB id as the state parameter for CSRF protection.
   */
  app.get("/api/auth/gmail", async (req: Request, res: Response) => {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const authUrl = buildGmailAuthUrl(String(user.id));
      return res.redirect(authUrl);
    } catch (err: unknown) {
      console.error("[Gmail OAuth] Failed to build auth URL:", err);
      return res.redirect("/settings?gmail=error");
    }
  });

  /**
   * GET /api/auth/gmail/callback
   * Google redirects here after the user approves (or denies) the consent screen.
   * Exchanges the code for tokens, fetches the Gmail address, stores everything
   * encrypted on the user record, then redirects back to /settings.
   */
  app.get("/api/auth/gmail/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;
    console.log("[Gmail OAuth] Callback received — code:", code ? "present" : "missing", "state:", state || "missing", "error:", error || "none");

    if (error) {
      console.warn("[Gmail OAuth] User denied consent:", error);
      return res.redirect("/settings?gmail=denied");
    }

    if (!code || !state) {
      console.error("[Gmail OAuth] Missing code or state in callback");
      return res.redirect("/settings?gmail=error");
    }

    try {
      // Verify state matches a real user
      const userId = parseInt(state, 10);
      if (isNaN(userId)) {
        console.error("[Gmail OAuth] Invalid state (not a user ID):", state);
        return res.redirect("/settings?gmail=error");
      }
      console.log("[Gmail OAuth] Processing callback for user ID:", userId);

      // Exchange code for tokens
      console.log("[Gmail OAuth] Exchanging authorization code for tokens...");
      const tokens = await exchangeCodeForTokens(code);
      console.log("[Gmail OAuth] Token exchange result — access_token:", tokens.access_token ? "present" : "missing", "refresh_token:", tokens.refresh_token ? "present" : "MISSING");

      if (!tokens.refresh_token) {
        // This can happen if the user already granted consent before and
        // prompt=consent wasn't respected. Redirect with a specific error.
        console.warn("[Gmail OAuth] No refresh_token in response — user may need to revoke and reconnect");
        return res.redirect("/settings?gmail=no_refresh_token");
      }

      // Fetch the Gmail address
      console.log("[Gmail OAuth] Fetching Gmail user email...");
      const gmailEmail = await getGmailUserEmail(tokens.access_token);
      console.log("[Gmail OAuth] Gmail email fetched:", gmailEmail);

      // Persist encrypted tokens
      console.log("[Gmail OAuth] Saving tokens to database for user ID:", userId);
      await saveGmailTokens(userId, tokens.access_token, tokens.refresh_token, gmailEmail);
      console.log("[Gmail OAuth] Tokens saved successfully for user ID:", userId);

      console.log(`[Gmail OAuth] User ${userId} connected Gmail: ${gmailEmail}`);
      return res.redirect("/settings?gmail=connected");
    } catch (err: unknown) {
      console.error("[Gmail OAuth] Callback error:", err instanceof Error ? err.message : String(err));
      console.error("[Gmail OAuth] Full error:", err);
      return res.redirect("/settings?gmail=error");
    }
  });

  /**
   * POST /api/auth/gmail/disconnect
   * Clears the stored Gmail tokens from the user record.
   */
  app.post("/api/auth/gmail/disconnect", async (req: Request, res: Response) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      await clearGmailTokens(user.id);
      return res.json({ success: true });
    } catch (err: unknown) {
      console.error("[Gmail disconnect] Error:", err);
      return res.status(500).json({ error: "Failed to disconnect Gmail" });
    }
  });

  /**
   * POST /api/email/send
   * Body: { to: string, subject: string, body: string }
   * Sends an email via the authenticated user's Gmail account.
   */
  app.post("/api/email/send", async (req: Request, res: Response) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const { to, subject, body } = req.body as {
        to?: string;
        subject?: string;
        body?: string;
      };

      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields: to, subject, body" });
      }

      await sendGmailEmail(user.id, to, subject, body);
      return res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      if (message === "GMAIL_NOT_CONNECTED") {
        return res.status(403).json({ error: "GMAIL_NOT_CONNECTED" });
      }
      if (message === "GMAIL_REFRESH_INVALID") {
        return res.status(403).json({ error: "GMAIL_REFRESH_INVALID" });
      }
      if (message === "GMAIL_RATE_LIMIT") {
        return res.status(429).json({ error: "GMAIL_RATE_LIMIT" });
      }
      if (message === "GMAIL_NO_COACH_EMAIL") {
        return res.status(400).json({ error: "GMAIL_NO_COACH_EMAIL" });
      }

      console.error("[Email send] Error:", err);
      return res.status(500).json({ error: "Failed to send email" });
    }
  });
}
