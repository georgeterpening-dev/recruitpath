/**
 * Stripe SDK singleton — initialized lazily from STRIPE_SECRET_KEY env var.
 * Never import this on the frontend.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "[Stripe] STRIPE_SECRET_KEY is not set. Configure it in Settings → Payment."
      );
    }
    _stripe = new Stripe(secretKey);
  }
  return _stripe;
}
