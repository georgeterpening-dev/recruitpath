/**
 * Legacy Manus OAuth callback stub.
 * This route is no longer used — authentication is handled by:
 *   - POST /api/auth/register  (email/password)
 *   - POST /api/auth/login     (email/password)
 *   - GET  /api/auth/google    (Google OAuth via RecruitPath Google Cloud project)
 *
 * Kept as a stub to avoid 404s from any stale bookmarks or links.
 */
import type { Express, Request, Response } from "express";

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    // Redirect stale Manus OAuth callbacks to the sign-in page
    res.redirect(302, "/signin");
  });
}
