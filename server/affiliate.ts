/**
 * RecruitPath — Affiliate Program Router
 * Handles: applications, admin approval/rejection, dashboard data, conversion tracking, admin management.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { affiliateApplications, affiliates, affiliateConversions } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getStripe } from "./stripe/client";
import { sendEmail } from "./email";

const ADMIN_EMAILS = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];
const isAdmin = (email: string | null | undefined) => !!email && ADMIN_EMAILS.includes(email);

// ─── Coupon code generation ───────────────────────────────────────────────────

async function generateCouponCode(firstName: string, gradYear: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Format: FIRSTNAME + last 2 digits of grad year, uppercase, max 10 chars
  const base = (firstName.toUpperCase().replace(/[^A-Z0-9]/g, "") + gradYear.slice(-2)).slice(0, 10);

  // Check for collisions and append number if needed
  const existing = await db
    .select({ couponCode: affiliates.couponCode })
    .from(affiliates)
    .where(sql`${affiliates.couponCode} LIKE ${base + "%"}`);

  if (existing.length === 0) return base;

  // Find next available suffix
  for (let i = 2; i <= 99; i++) {
    const candidate = (base.slice(0, 8) + i).toUpperCase();
    if (!existing.some((r) => r.couponCode === candidate)) return candidate;
  }
  return base + Date.now().toString().slice(-3);
}

// ─── Email helpers ────────────────────────────────────────────────────────────

async function sendApprovalEmail(toEmail: string, toName: string, code: string): Promise<boolean> {
  const link = `https://recruitpath.manus.space/?ref=${code}`;
  const text = `Hey ${toName},

Great news — you've been approved as a RecruitPath affiliate!

Your personal code is: ${code}

Share it anywhere — your Instagram bio, group chats, at tournaments. When a teammate signs up using your code they get 15% off their first month, and you earn $3 for every monthly signup and $5 for every annual signup.

Your shareable link: ${link}

To set up your payout method (Venmo or PayPal), just reply to this email. Commissions are paid monthly once you hit a $10 minimum.

Welcome to the team.

— George
RecruitPath
contact.recruitpath@gmail.com`;
  return sendEmail({
    to: toEmail,
    subject: "You're a RecruitPath Affiliate — Here's Your Code",
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
    text,
  });
}

async function sendRejectionEmail(toEmail: string, toName: string): Promise<boolean> {
  const text = `Hey ${toName},

Thanks for applying to the RecruitPath affiliate program.

We aren't able to move forward with your application at this time, but we appreciate your interest and will keep your information on file.

If you have any questions feel free to reach out at contact.recruitpath@gmail.com.

— George
RecruitPath`;
  return sendEmail({
    to: toEmail,
    subject: "RecruitPath Affiliate Application Update",
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
    text,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const affiliateRouter = router({
  /** Submit a public affiliate application */
  submitApplication: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().max(320),
        graduationYear: z.enum(["2026", "2027", "2028", "2029"]),
        position: z.string().min(1).max(64),
        highSchool: z.string().min(1).max(255),
        clubTeam: z.string().min(1).max(255),
        instagramHandle: z.string().max(100).optional(),
        whyJoin: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.insert(affiliateApplications).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        graduationYear: input.graduationYear,
        position: input.position,
        highSchool: input.highSchool,
        clubTeam: input.clubTeam,
        instagramHandle: input.instagramHandle || null,
        whyJoin: input.whyJoin,
        status: "pending",
      });

      return { success: true };
    }),

  /** Get the current user's affiliate record (if approved) */
  myAffiliate: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.email, ctx.user.email ?? ""))
      .limit(1);

    return rows[0] ?? null;
  }),

  /** Get conversions for the current affiliate */
  myConversions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const affiliate = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.email, ctx.user.email ?? ""))
      .limit(1);

    if (!affiliate[0]) return [];

    return db
      .select()
      .from(affiliateConversions)
      .where(eq(affiliateConversions.affiliateId, affiliate[0].id))
      .orderBy(desc(affiliateConversions.createdAt));
  }),

  // ─── Admin procedures ───────────────────────────────────────────────────────

  /** List all affiliate applications (admin only) */
  adminListApplications: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user.email)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) return [];
    return db.select().from(affiliateApplications).orderBy(desc(affiliateApplications.appliedAt));
  }),

  /** List all approved affiliates (admin only) */
  adminListAffiliates: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user.email)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) return [];
    return db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
  }),

  /** Approve an application: create affiliate record, generate code, create Stripe coupon, send email */
  adminApprove: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Get the application
      const apps = await db
        .select()
        .from(affiliateApplications)
        .where(eq(affiliateApplications.id, input.applicationId))
        .limit(1);

      const app = apps[0];
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      if (app.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Application already processed" });
      }

      // Generate coupon code
      const couponCode = await generateCouponCode(app.firstName, app.graduationYear);

      // Create Stripe coupon + promotion code
      try {
        const stripe = getStripe();
        // Step 1: Create the coupon
        const coupon = await stripe.coupons.create({
          id: couponCode,
          percent_off: 15,
          duration: "once",
          name: `RecruitPath Affiliate - ${couponCode}`,
        });
        // Step 2: Create a promotion code that wraps the coupon
        // This is what users actually type at Stripe checkout
        await stripe.promotionCodes.create({
          promotion: { type: "coupon", coupon: coupon.id },
          code: couponCode,
          restrictions: {
            first_time_transaction: true,
          },
        });
      } catch (err: any) {
        // Coupon/promo code may already exist — log and continue
        console.warn(`[affiliate.adminApprove] Stripe coupon/promo creation warning: ${err.message}`);
      }

      // Create affiliate record
      await db.insert(affiliates).values({
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        couponCode,
        discountPercent: 15,
        commissionMonthly: "3.00",
        commissionAnnual: "5.00",
        totalConversions: 0,
        totalEarned: "0.00",
        totalPaid: "0.00",
        status: "active",
      });

      // Update application status
      await db
        .update(affiliateApplications)
        .set({ status: "approved" })
        .where(eq(affiliateApplications.id, input.applicationId));

      // Send approval email — await the boolean result so the caller knows if it succeeded
      const emailSent = await sendApprovalEmail(app.email, app.firstName, couponCode);

      return { success: true, couponCode, emailSent };
    }),

  /** Reject an application */
  adminReject: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const apps = await db
        .select()
        .from(affiliateApplications)
        .where(eq(affiliateApplications.id, input.applicationId))
        .limit(1);

      const app = apps[0];
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

      await db
        .update(affiliateApplications)
        .set({ status: "rejected" })
        .where(eq(affiliateApplications.id, input.applicationId));

      // Send rejection email — await the boolean result
      const emailSent = await sendRejectionEmail(app.email, app.firstName);

      return { success: true, emailSent };
    }),

  /** Mark all unpaid conversions for an affiliate as paid */
  adminMarkPaid: protectedProcedure
    .input(z.object({ affiliateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Sum unpaid commissions
      const unpaid = await db
        .select({ commissionAmount: affiliateConversions.commissionAmount })
        .from(affiliateConversions)
        .where(
          and(
            eq(affiliateConversions.affiliateId, input.affiliateId),
            eq(affiliateConversions.paid, false)
          )
        );

      const paidAmount = unpaid.reduce((sum, r) => sum + parseFloat(r.commissionAmount), 0);

      // Mark all as paid
      await db
        .update(affiliateConversions)
        .set({ paid: true })
        .where(
          and(
            eq(affiliateConversions.affiliateId, input.affiliateId),
            eq(affiliateConversions.paid, false)
          )
        );

      // Update totalPaid on affiliate record
      if (paidAmount > 0) {
        await db
          .update(affiliates)
          .set({
            totalPaid: sql`totalPaid + ${paidAmount.toFixed(2)}`,
          })
          .where(eq(affiliates.id, input.affiliateId));
      }

      return { success: true, paidAmount };
    }),

  /** Get all conversions for a specific affiliate (admin) */
  adminGetConversions: protectedProcedure
    .input(z.object({ affiliateId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(affiliateConversions)
        .where(eq(affiliateConversions.affiliateId, input.affiliateId))
        .orderBy(desc(affiliateConversions.createdAt));
    }),
});

// ─── Conversion tracking helper (called from webhook) ────────────────────────

/**
 * Called from the Stripe webhook when a checkout.session.completed event fires
 * and a coupon code was applied. Attributes the conversion to the matching affiliate.
 */
export async function recordAffiliateConversion({
  couponCode,
  convertedUserEmail,
  subscriptionType,
}: {
  couponCode: string;
  convertedUserEmail: string;
  subscriptionType: "monthly" | "annual";
}) {
  try {
    const db = await getDb();
    if (!db) return;

    const affiliateRows = await db
      .select()
      .from(affiliates)
      .where(and(eq(affiliates.couponCode, couponCode), eq(affiliates.status, "active")))
      .limit(1);

    const affiliate = affiliateRows[0];
    if (!affiliate) {
      console.log(`[affiliate] No active affiliate found for code: ${couponCode}`);
      return;
    }

    const commissionAmount =
      subscriptionType === "annual"
        ? parseFloat(affiliate.commissionAnnual)
        : parseFloat(affiliate.commissionMonthly);

    await db.insert(affiliateConversions).values({
      affiliateId: affiliate.id,
      couponCode,
      convertedUserEmail,
      subscriptionType,
      commissionAmount: commissionAmount.toFixed(2),
      paid: false,
    });

    // Increment totals
    await db
      .update(affiliates)
      .set({
        totalConversions: sql`totalConversions + 1`,
        totalEarned: sql`totalEarned + ${commissionAmount.toFixed(2)}`,
      })
      .where(eq(affiliates.id, affiliate.id));

    console.log(
      `[affiliate] Conversion recorded: ${couponCode} → ${convertedUserEmail} (${subscriptionType}, $${commissionAmount})`
    );
  } catch (err: any) {
    console.error("[affiliate] recordAffiliateConversion error:", err.message);
  }
}
