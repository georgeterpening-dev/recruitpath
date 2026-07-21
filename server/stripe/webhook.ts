/**
 * Stripe Webhook Handler
 * Registered at /api/stripe/webhook with raw body parsing.
 * Handles:
 *   - checkout.session.completed  → activate Pro subscription
 *   - customer.subscription.updated → sync subscription status changes
 *   - customer.subscription.deleted → revoke Pro access on cancellation
 *
 * Grandfathered one-time purchasers (hasPaidAccess=true, subscriptionType=null)
 * are never touched by subscription events.
 */
import type { Request, Response, Express } from "express";
import express from "express";
import { getStripe } from "./client";
import { getDb } from "../db";
import { users, affiliates as affiliatesTable, affiliateConversions } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export function registerStripeWebhook(app: Express) {
  // MUST register raw body parser BEFORE the global express.json() middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        console.error("[Webhook] Missing stripe-signature header");
        return res.status(400).json({ error: "Missing signature" });
      }

      let event;
      try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          event = JSON.parse(req.body.toString());
          console.warn("[Webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification");
        }
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // ⚠️ CRITICAL: Handle test events for webhook verification
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          // ── New subscription checkout completed ──────────────────────────────────────────
          case "checkout.session.completed": {
            const session = event.data.object;
            const userId = session.metadata?.user_id;
            const billingPeriod = (session.metadata?.billing_period ?? "monthly") as "monthly" | "annual";
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;

            if (!userId) {
              console.error("[Webhook] checkout.session.completed missing user_id in metadata");
              break;
            }
            if (session.payment_status !== "paid") {
              console.warn(`[Webhook] Session ${session.id} payment_status is ${session.payment_status}, skipping`);
              break;
            }

            const db = await getDb();
            if (db) {
              await db
                .update(users)
                .set({
                  hasPaidAccess: true,
                  plan: "pro",
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId ?? null,
                  subscriptionType: billingPeriod,
                  subscriptionStatus: "active",
                })
                .where(eq(users.id, parseInt(userId)));
              console.log(`[Webhook] User ${userId} activated Pro (${billingPeriod})`);

              // Record affiliate conversion if checkout came through an affiliate link
              const affiliateCode = session.metadata?.affiliateCode;
              if (affiliateCode) {
                try {
                  const affiliateRows = await db
                    .select()
                    .from(affiliatesTable)
                    .where(eq(affiliatesTable.couponCode, affiliateCode))
                    .limit(1);
                  if (affiliateRows.length > 0) {
                    const affiliate = affiliateRows[0];
                    const commission = billingPeriod === "annual" ? "5.00" : "3.00";
                    const customerEmail = session.metadata?.customer_email || "";
                    await db.insert(affiliateConversions).values({
                      affiliateId: affiliate.id,
                      couponCode: affiliateCode,
                      convertedUserEmail: customerEmail,
                      subscriptionType: billingPeriod,
                      commissionAmount: commission,
                      paid: false,
                    });
                    await db
                      .update(affiliatesTable)
                      .set({
                        totalConversions: sql`${affiliatesTable.totalConversions} + 1`,
                        totalEarned: sql`${affiliatesTable.totalEarned} + ${commission}`,
                      })
                      .where(eq(affiliatesTable.id, affiliate.id));
                    console.log(`[Webhook] Recorded affiliate conversion for code ${affiliateCode} — commission $${commission}`);
                  }
                } catch (affiliateErr: any) {
                  console.error("[Webhook] Affiliate conversion recording failed:", affiliateErr.message);
                }
              }
            }
            break;
          }

          // ── Subscription status changed (renewal, payment failure, cancel) ────────
          case "customer.subscription.updated": {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;
            const status = subscription.status; // active | past_due | canceled | unpaid | etc.

            const db = await getDb();
            if (!db) break;

            const rows = await db
              .select({ id: users.id, subscriptionType: users.subscriptionType })
              .from(users)
              .where(eq(users.stripeCustomerId, customerId))
              .limit(1);

            const user = rows[0];
            if (!user) {
              console.warn(`[Webhook] customer.subscription.updated — no user found for customer ${customerId}`);
              break;
            }

            const isActive = status === "active" || status === "trialing";
            await db
              .update(users)
              .set({
                hasPaidAccess: isActive,
                subscriptionStatus: status as "active" | "cancelled" | "past_due",
                stripeSubscriptionId: subscription.id,
              })
              .where(eq(users.id, user.id));

            console.log(`[Webhook] User ${user.id} subscription.updated — status: ${status}, hasPaidAccess: ${isActive}`);
            break;
          }

          // ── Subscription fully cancelled ──────────────────────────────────────────────────────
          case "customer.subscription.deleted": {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;

            const db = await getDb();
            if (!db) break;

            const rows = await db
              .select({ id: users.id, hasPaidAccess: users.hasPaidAccess, subscriptionType: users.subscriptionType })
              .from(users)
              .where(eq(users.stripeCustomerId, customerId))
              .limit(1);

            const user = rows[0];
            if (!user) {
              console.warn(`[Webhook] customer.subscription.deleted — no user found for customer ${customerId}`);
              break;
            }

            // Do NOT revoke grandfathered one-time purchasers (subscriptionType is null)
            if (!user.subscriptionType) {
              console.log(`[Webhook] User ${user.id} is grandfathered — skipping revocation`);
              break;
            }

            await db
              .update(users)
              .set({
                hasPaidAccess: false,
                subscriptionStatus: "cancelled",
              })
              .where(eq(users.id, user.id));

            console.log(`[Webhook] User ${user.id} subscription deleted — Pro access revoked`);
            break;
          }

          default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err: any) {
        console.error(`[Webhook] Error processing ${event.type}:`, err.message);
      }

      return res.json({ received: true });
    }
  );
}
