/**
 * Google Sign-In OAuth routes
 * Handles /api/auth/google (initiate) and /api/auth/google/callback (complete)
 *
 * Flow:
 * 1. User clicks "Continue with Google" → GET /api/auth/google
 * 2. Redirected to Google OAuth consent screen
 * 3. Google redirects back to /api/auth/google/callback with code + state
 * 4. Exchange code for tokens, fetch user profile from Google
 * 5. Find-or-create user in DB by email (or googleId)
 * 6. Issue same JWT session cookie as Manus OAuth
 * 7. Redirect to /dashboard
 */
import type { Express, Request, Response } from "express";
import axios from "axios";
import { eq, or } from "drizzle-orm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "https://recruitpath.manus.space/api/auth/google/callback";

// Return the configured redirect URI (from env or default to custom domain)
function getSignInRedirectUri(): string {
  return GOOGLE_REDIRECT_URI;
}

function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string }> {
  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data;
}

async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data;
}

export function registerGoogleAuthRoutes(app: Express) {
  // ── Step 1: Initiate Google OAuth ──────────────────────────────────────────
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(500).json({ error: "Google OAuth not configured" });
      return;
    }

    const redirectUri = getSignInRedirectUri();
    // Encode the return path in state so we can redirect correctly after callback
    const returnPath = (req.query.return as string) || "/dashboard";
    const state = Buffer.from(JSON.stringify({ returnPath, redirectUri })).toString("base64");
    const authUrl = buildGoogleAuthUrl(redirectUri, state);
    res.redirect(302, authUrl);
  });

  // ── Step 2: Handle Google OAuth callback ───────────────────────────────────
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const stateRaw = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google Auth] OAuth error:", error);
      res.redirect(302, "/signin?error=google_cancelled");
      return;
    }

    if (!code || !stateRaw) {
      res.redirect(302, "/signin?error=google_missing_params");
      return;
    }

    let returnPath = "/dashboard";
    let redirectUri: string;

    try {
      const stateObj = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
      returnPath = stateObj.returnPath || "/dashboard";
      redirectUri = stateObj.redirectUri || getSignInRedirectUri();
    } catch {
      redirectUri = getSignInRedirectUri();
    }

    try {
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, redirectUri);

      // Fetch user profile from Google
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      if (!googleUser.email || !googleUser.sub) {
        res.redirect(302, "/signin?error=google_no_email");
        return;
      }

      const db = await getDb();
      if (!db) {
        res.redirect(302, "/signin?error=db_unavailable");
        return;
      }

      // Find existing user by googleId OR email
      const existingRows = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.googleId, googleUser.sub),
            eq(users.email, googleUser.email)
          )
        )
        .limit(1);

      let openId: string;

      if (existingRows.length > 0) {
        // ── Existing user: log them in ──────────────────────────────────────
        const existing = existingRows[0];
        openId = existing.openId;

        // Update googleId and lastSignedIn if not already set
        const updateData: Record<string, unknown> = { lastSignedIn: new Date() };
        if (!existing.googleId) {
          updateData.googleId = googleUser.sub;
          updateData.googleAuthUser = true;
        }
        await db.update(users).set(updateData).where(eq(users.id, existing.id));

        console.log(`[Google Auth] Existing user signed in: ${googleUser.email}`);
      } else {
        // ── New user: create account ────────────────────────────────────────
        // Generate a unique openId for Google users (prefixed to distinguish from Manus openIds)
        openId = `google_${googleUser.sub}`;

        const isOwner = googleUser.email === "georgeterp27@gmail.com";

        await db.insert(users).values({
          openId,
          name: googleUser.name || googleUser.email,
          email: googleUser.email,
          loginMethod: "google",
          googleAuthUser: true,
          googleId: googleUser.sub,
          role: isOwner ? "admin" : "user",
          lastSignedIn: new Date(),
        });

        console.log(`[Google Auth] New user created: ${googleUser.email}`);
      }

      // Issue the same JWT session cookie as Manus OAuth
      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || googleUser.email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to dashboard (welcome overlay will handle hasSeenWelcome check)
      res.redirect(302, returnPath);
    } catch (err) {
      console.error("[Google Auth] Callback failed:", err);
      res.redirect(302, "/signin?error=google_failed");
    }
  });
}
