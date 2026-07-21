import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerStripeWebhook } from "../stripe/webhook";
import { registerGmailRoutes } from "../gmailRoutes";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { registerEmailAuthRoutes } from "../emailAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Register Stripe webhook BEFORE body parsers (needs raw body for signature verification)
  registerStripeWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Gmail OAuth + email send routes
  registerGmailRoutes(app);
  // Google Sign-In OAuth routes
  registerGoogleAuthRoutes(app);
  // Email + password auth routes
  registerEmailAuthRoutes(app);

  // ── ADMIN DEBUG ROUTE ──────────────────────────────────────────────────────
  app.get("/api/admin/debug-roster", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { players, schools } = await import("../../drizzle/schema");
      const { sql, eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) return res.json({ error: "No database connection" });

      const totalPlayers = await db.select({ count: sql<number>`COUNT(*)` }).from(players);
      const samplePlayers = await db.select().from(players).limit(5);
      const byGradYear = await db
        .select({ graduationYear: players.graduationYear, count: sql<number>`COUNT(*)` })
        .from(players)
        .groupBy(players.graduationYear)
        .orderBy(players.graduationYear);
      const schoolsWithPlayers = await db.selectDistinct({ schoolId: players.schoolId }).from(players);
      const rosterTrue = await db.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.hasRosterData, true));
      const rosterFalse = await db.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.hasRosterData, false));
      
      const hawaiiSchools = await db.select().from(schools).where(sql`LOWER(${schools.name}) LIKE '%hawaii%'`).limit(3);
      const hawaiiPlayers = hawaiiSchools.length > 0
        ? await db.select().from(players).where(eq(players.schoolId, hawaiiSchools[0].id)).limit(20)
        : [];

      res.json({
        totalPlayers: Number(totalPlayers[0]?.count ?? 0),
        samplePlayers,
        playersByGradYear: byGradYear,
        schoolsWithHasRosterDataTrue: Number(rosterTrue[0]?.count ?? 0),
        schoolsWithHasRosterDataFalse: Number(rosterFalse[0]?.count ?? 0),
        schoolsWithActualPlayers: schoolsWithPlayers.length,
        hawaiiSchools,
        hawaiiPlayers,
      });
    } catch (err: any) {
      res.json({ error: err.message, stack: err.stack });
    }
  });

  // Test email endpoint (temporary for debugging)
  app.get("/api/test-email", async (req, res) => {
    const emailUser = ENV.emailUser || process.env.EMAIL_USER;
    const emailPass = ENV.emailPass || process.env.EMAIL_PASS;
    
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        service: "gmail",
        auth: { 
          user: emailUser, 
          pass: emailPass 
        },
      });
      
      await transporter.sendMail({
        from: `"RecruitPath" <${emailUser}>`,
        to: "georgeterp27@gmail.com",
        subject: "RecruitPath Email Test",
        text: "This is a test email from RecruitPath.",
      });
      
      res.json({ success: true });
    } catch (err: any) {
      res.json({ 
        success: false, 
        error: err.message,
        code: err.code,
        response: err.response
      });
    }
  });
  // One-time migration: create Stripe Promotion Codes for existing affiliate coupons
  app.get("/api/admin/fix-promo-codes", async (req, res) => {
    try {
      const { getStripe } = await import("../stripe/client");
      const { getDb } = await import("../db");
      const { affiliates: affiliatesTable } = await import("../../drizzle/schema");
      const stripe = getStripe();
      const db = await getDb();
      if (!db) return res.json({ success: false, error: "DB not available" });
      const rows = await db.select().from(affiliatesTable);
      const results: { code: string; status: string }[] = [];
      for (const affiliate of rows) {
        try {
          await stripe.promotionCodes.create({
            promotion: { type: "coupon", coupon: affiliate.couponCode },
            code: affiliate.couponCode,
            restrictions: { first_time_transaction: true },
          });
          console.log(`[fix-promo-codes] Created promo code for ${affiliate.couponCode}`);
          results.push({ code: affiliate.couponCode, status: "created" });
        } catch (err: any) {
          console.log(`[fix-promo-codes] Skipped ${affiliate.couponCode}: ${err.message}`);
          results.push({ code: affiliate.couponCode, status: `skipped: ${err.message}` });
        }
      }
      res.json({ success: true, count: rows.length, results });
    } catch (err: any) {
      res.json({ success: false, error: err.message });
    }
  });
  // ─── Admin REST routes ────────────────────────────────────────────────────
  // Helper: check if request is from an admin (session cookie → JWT → DB lookup)
  async function requireAdmin(req: any, res: any): Promise<boolean> {
    try {
      const { parse: parseCookies } = await import("cookie");
      const { jwtVerify } = await import("jose");
      const { COOKIE_NAME } = await import("../../shared/const");
      const { getUserByOpenId } = await import("../db");
      const cookies = parseCookies(req.headers.cookie || "");
      const token = cookies[COOKIE_NAME];
      if (!token) { res.status(403).json({ error: "Forbidden" }); return false; }
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
      const openId = payload.openId as string;
      if (!openId) { res.status(403).json({ error: "Forbidden" }); return false; }
      const user = await getUserByOpenId(openId);
      const adminEmails = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];
      if (!user || !user.email || !adminEmails.includes(user.email)) {
        res.status(403).json({ error: "Forbidden" });
        return false;
      }
      return true;
    } catch {
      res.status(403).json({ error: "Forbidden" });
      return false;
    }
  }

  // DELETE /api/admin/affiliate-applications/:id
  app.delete("/api/admin/affiliate-applications/:id", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { affiliateApplications } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.json({ success: false, error: "DB not available" });
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      await db.delete(affiliateApplications).where(eq(affiliateApplications.id, id));
      console.log(`[admin] Deleted affiliate application id=${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[admin] delete application error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/admin/affiliates/:id — hard-delete affiliate + conversions + deactivate Stripe promo code
  app.delete("/api/admin/affiliates/:id", async (req, res) => {
    try {
      const { getStripe } = await import("../stripe/client");
      const { getDb } = await import("../db");
      const { affiliates: affiliatesTable, affiliateConversions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.json({ success: false, error: "DB not available" });
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      // Fetch affiliate to get coupon code
      const rows = await db.select().from(affiliatesTable).where(eq(affiliatesTable.id, id));
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      const affiliate = rows[0];
      // Deactivate Stripe promo code
      try {
        const stripe = getStripe();
        const promoCodes = await stripe.promotionCodes.list({ code: affiliate.couponCode, limit: 5 });
        for (const pc of promoCodes.data) {
          await stripe.promotionCodes.update(pc.id, { active: false });
        }
      } catch (stripeErr: any) {
        console.warn(`[admin] Stripe promo deactivation warning for ${affiliate.couponCode}: ${stripeErr.message}`);
      }
      // Hard-delete conversions then affiliate record
      await db.delete(affiliateConversions).where(eq(affiliateConversions.affiliateId, id));
      await db.delete(affiliatesTable).where(eq(affiliatesTable.id, id));
      console.log(`[admin] Hard-deleted affiliate id=${id} (${affiliate.couponCode}) and their conversions`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[admin] remove affiliate error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/admin/promo-codes — list all Stripe promotion codes
  app.get("/api/admin/promo-codes", async (req, res) => {
    try {
      const { getStripe } = await import("../stripe/client");
      const stripe = getStripe();
      const promoCodes = await stripe.promotionCodes.list({ limit: 100, expand: ["data.coupon"] });
      res.json({ success: true, data: promoCodes.data });
    } catch (err: any) {
      console.error("[admin] list promo codes error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/admin/promo-codes/:id — deactivate promo code
  app.delete("/api/admin/promo-codes/:id", async (req, res) => {
    try {
      const { getStripe } = await import("../stripe/client");
      const stripe = getStripe();
      await stripe.promotionCodes.update(req.params.id, { active: false });
      res.json({ success: true });
    } catch (err: any) {
      console.error("[admin] deactivate promo code error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/admin/promo-codes/:id/update — update max_redemptions and active
  app.post("/api/admin/promo-codes/:id/update", async (req, res) => {
    try {
      const { getStripe } = await import("../stripe/client");
      const stripe = getStripe();
      const { maxRedemptions, active } = req.body;
      const updateParams: any = {};
      if (typeof active === "boolean") updateParams.active = active;
      // Note: max_redemptions cannot be updated via promotionCodes.update in Stripe
      // We log it but skip — Stripe only allows setting it at creation time
      if (maxRedemptions !== undefined) {
        console.warn("[admin] max_redemptions cannot be changed after creation — Stripe limitation");
      }
      const updated = await stripe.promotionCodes.update(req.params.id, updateParams);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error("[admin] update promo code error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  // GET /api/admin/reset-affiliates — one-time cleanup: clear all affiliate data + deactivate Stripe promo codes
  app.get("/api/admin/reset-affiliates", async (req, res) => {
    const isAdmin = await requireAdmin(req, res);
    if (!isAdmin) return;
    try {
      const { getStripe } = await import("../stripe/client");
      const { getDb } = await import("../db");
      const { affiliates: affiliatesTable, affiliateApplications, affiliateConversions } = await import("../../drizzle/schema");
      const stripe = getStripe();
      const db = await getDb();
      if (!db) return res.json({ success: false, error: "DB not available" });
      // Deactivate all Stripe promotion codes
      let deactivatedCount = 0;
      try {
        const promoCodes = await stripe.promotionCodes.list({ limit: 100 });
        for (const code of promoCodes.data) {
          if (code.active) {
            await stripe.promotionCodes.update(code.id, { active: false });
            deactivatedCount++;
          }
        }
      } catch (stripeErr: any) {
        console.warn("[reset-affiliates] Stripe cleanup warning:", stripeErr.message);
      }
      // Delete all affiliate data from DB
      await db.delete(affiliateConversions);
      await db.delete(affiliatesTable);
      await db.delete(affiliateApplications);
      console.log(`[reset-affiliates] Cleared all affiliate data. Deactivated ${deactivatedCount} promo codes.`);
      res.json({ success: true, deactivatedPromoCodes: deactivatedCount });
    } catch (err: any) {
      console.error("[reset-affiliates] Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/admin/debug-roster — temporary debug endpoint to inspect database roster data (admin only)
  app.get("/api/admin/debug-roster", async (req, res) => {
    const isAdmin = await requireAdmin(req, res);
    if (!isAdmin) return;
    try {
      const { getDb } = await import("../db");
      const { schools, players } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.json({ error: "No database connection" });

      // 1. Total player count
      const totalPlayers = await db.select({ count: sql<number>`COUNT(*)` }).from(players);

      // 2. Sample of 5 players to see raw data structure
      const samplePlayers = await db.select().from(players).limit(5);

      // 3. Count players per graduation year
      const byGradYear = await db
        .select({
          graduationYear: players.graduationYear,
          count: sql<number>`COUNT(*)`,
        })
        .from(players)
        .groupBy(players.graduationYear)
        .orderBy(players.graduationYear);

      // 4. Schools with hasRosterData=true vs false
      const rosterTrue = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schools)
        .where(eq(schools.hasRosterData, true));

      const rosterFalse = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schools)
        .where(eq(schools.hasRosterData, false));

      // 5. Schools that have players in the players table
      const schoolsWithPlayers = await db
        .selectDistinct({ schoolId: players.schoolId })
        .from(players);

      // 6. Sample school — Hawaii specifically
      const hawaiiSchool = await db
        .select()
        .from(schools)
        .where(sql`LOWER(${schools.name}) LIKE '%hawaii%'`)
        .limit(3);

      const hawaiiPlayers = hawaiiSchool.length > 0
        ? await db
            .select()
            .from(players)
            .where(eq(players.schoolId, hawaiiSchool[0].id))
            .limit(20)
        : [];

      res.json({
        totalPlayers: Number(totalPlayers[0]?.count ?? 0),
        samplePlayers,
        playersByGradYear: byGradYear,
        schoolsWithHasRosterDataTrue: Number(rosterTrue[0]?.count ?? 0),
        schoolsWithHasRosterDataFalse: Number(rosterFalse[0]?.count ?? 0),
        schoolsWithActualPlayers: schoolsWithPlayers.length,
        hawaiiSchool,
        hawaiiPlayers,
      });
    } catch (err: any) {
      console.error("[admin/debug-roster] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/affiliate/status — check if logged-in user is an active affiliate
  app.get("/api/affiliate/status", async (req, res) => {
    try {
      const { parse: parseCookies } = await import("cookie");
      const { jwtVerify } = await import("jose");
      const { COOKIE_NAME } = await import("../../shared/const");
      const { getUserByOpenId } = await import("../db");
      const { getDb } = await import("../db");
      const { affiliates: affiliatesTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const cookies = parseCookies(req.headers.cookie || "");
      const token = cookies[COOKIE_NAME];
      if (!token) return res.json({ isAffiliate: false, affiliate: null });
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
      const openId = payload.openId as string;
      if (!openId) return res.json({ isAffiliate: false, affiliate: null });
      const user = await getUserByOpenId(openId);
      if (!user || !user.email) return res.json({ isAffiliate: false, affiliate: null });
      const db = await getDb();
      if (!db) return res.json({ isAffiliate: false, affiliate: null });
      const rows = await db.select().from(affiliatesTable).where(eq(affiliatesTable.email, user.email)).limit(1);
      const affiliate = rows[0] ?? null;
      const isAffiliate = !!affiliate && affiliate.status === "active";
      res.json({ isAffiliate, affiliate });
    } catch {
      res.json({ isAffiliate: false, affiliate: null });
    }
  });

  // GET /api/admin/sync-roster-flags — sync hasRosterData flags from actual player data
  app.get("/api/admin/sync-roster-flags", async (req, res) => {
    try {
      const { syncHasRosterDataFlags } = await import("../db");
      await syncHasRosterDataFlags();
      res.json({ success: true });
    } catch (err: any) {
      console.error("[sync-roster-flags] Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── End admin REST routes ────────────────────────────────────────────────

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Run hasRosterData sync on startup (safe to run every time)
  try {
    const { syncHasRosterDataFlags } = await import("../db");
    await syncHasRosterDataFlags();
  } catch (err) {
    console.warn("[startup] syncHasRosterDataFlags failed:", err);
  }
}

startServer().catch(console.error);
