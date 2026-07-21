/**
 * Email + Password Authentication Routes
 * POST /api/auth/register  — create account, issue session cookie, redirect to /onboarding
 * POST /api/auth/login     — verify credentials, issue session cookie, redirect to /dashboard
 *
 * Session cookies are identical to the Google OAuth path: httpOnly JWT signed with JWT_SECRET.
 */
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { recordAffiliateConversion } from "./affiliate";

const BCRYPT_ROUNDS = 12;

/** Validate email format */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Validate password: at least 8 characters */
function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

export function registerEmailAuthRoutes(app: Express) {
  // ── POST /api/auth/register ────────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, affiliateRef } = req.body ?? {};

      if (!email || !isValidEmail(email)) {
        res.status(400).json({ error: "A valid email address is required." });
        return;
      }
      if (!isValidPassword(password)) {
        res.status(400).json({ error: "Password must be at least 8 characters." });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable. Please try again." });
        return;
      }

      // Check for existing account with this email
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "An account with this email already exists. Please sign in." });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Generate a unique openId for email/password users
      const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const isOwner = email.trim().toLowerCase() === "georgeterp27@gmail.com";

      await db.insert(users).values({
        openId,
        name: (name ?? "").trim() || email.split("@")[0],
        email: email.trim().toLowerCase(),
        loginMethod: "email",
        passwordHash,
        role: isOwner ? "admin" : "user",
        lastSignedIn: new Date(),
      });

      // Issue session cookie
      const sessionToken = await sdk.createSessionToken(openId, {
        name: (name ?? "").trim() || email.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // If user signed up via an affiliate link, record the referral (non-blocking)
      if (affiliateRef && typeof affiliateRef === "string") {
        recordAffiliateConversion({
          couponCode: affiliateRef.toUpperCase(),
          convertedUserEmail: email.trim().toLowerCase(),
          subscriptionType: "monthly", // signup referral defaults to monthly tier
        }).catch(
          (e: unknown) => console.error("[Affiliate] Failed to record signup referral:", e)
        );
      }

      res.json({ success: true, redirect: "/onboarding" });
    } catch (err) {
      console.error("[EmailAuth] Register failed:", err);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable. Please try again." });
        return;
      }

      // Find user by email
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()))
        .limit(1);

      const user = rows[0];

      if (!user || !user.passwordHash) {
        // Generic message to avoid email enumeration
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      // Update lastSignedIn
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Issue session cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect: users who haven't completed onboarding go there first
      const redirect = user.hasCompletedOnboarding ? "/dashboard" : "/onboarding";
      res.json({ success: true, redirect });
    } catch (err) {
      console.error("[EmailAuth] Login failed:", err);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });
}
