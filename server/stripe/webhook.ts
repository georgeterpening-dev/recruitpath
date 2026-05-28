/**
 * Stripe Webhook Handler
 * Registered at /api/stripe/webhook with raw body parsing.
 * Handles checkout.session.completed for one-time $49.99 Full Access purchase.
 */
import type { Request, Response, Express } from "express";
import express from "express";
import { getStripe } from "./client";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
          case "checkout.session.completed": {
            const session = event.data.object;
            const userId = session.metadata?.user_id;
            const customerId = session.customer;
            const paymentIntentId = session.payment_intent;

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
                  plan: "pro", // keep plan in sync for backward compat
                  stripeCustomerId: customerId as string,
                  stripePaymentIntentId: paymentIntentId as string,
                })
                .where(eq(users.id, parseInt(userId)));
              console.log(`[Webhook] User ${userId} granted Full Access (one-time purchase)`);
            }
            break;
          }

          case "payment_intent.succeeded": {
            // Secondary confirmation — only update if we have metadata
            const paymentIntent = event.data.object;
            const userId = paymentIntent.metadata?.user_id;
            if (userId) {
              const db = await getDb();
              if (db) {
                await db
                  .update(users)
                  .set({
                    hasPaidAccess: true,
                    plan: "pro",
                    stripePaymentIntentId: paymentIntent.id,
                  })
                  .where(eq(users.id, parseInt(userId)));
                console.log(`[Webhook] payment_intent.succeeded — User ${userId} confirmed Full Access`);
              }
            }
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
