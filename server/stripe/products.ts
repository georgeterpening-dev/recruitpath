/**
 * RecruitPath Stripe Products Configuration
 * Two-tier subscription model: Free (limited) and Pro (monthly or annual).
 *
 * Monthly: $25.00/month recurring
 * Annual:  $220.00/year recurring (saves $80 vs monthly)
 *
 * Price IDs are injected from environment variables so they work across
 * test mode and live mode without code changes.
 */

// ─── Pro Monthly ─────────────────────────────────────────────────────────────
export const PRO_MONTHLY_PRICE_CENTS = 2500; // $25.00 USD
export const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID ?? "";

// ─── Pro Annual ──────────────────────────────────────────────────────────────
export const PRO_ANNUAL_PRICE_CENTS = 22000; // $220.00 USD
export const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_ANNUAL_PRICE_ID ?? "";

// ─── Legacy (kept for backward compat — no longer sold) ──────────────────────
/** @deprecated One-time $49.99 is no longer sold. Existing buyers are grandfathered. */
export const FULL_ACCESS_PRICE_CENTS = 4999;

// ─── Product metadata (used in UI) ───────────────────────────────────────────
export const FREE_PRODUCT = {
  id: "free",
  name: "Free",
  priceDisplay: "$0",
  features: [
    "Up to 5 schools",
    "Browse all 324 programs",
    "School finder quiz",
    "View roster data",
  ],
};

export const PRO_PRODUCT = {
  id: "pro",
  name: "Pro",
  monthlyPriceDisplay: "$25/month",
  annualPriceDisplay: "$220/year",
  annualSavings: "$80",
  features: [
    "Everything in Free",
    "Unlimited schools",
    "AI email generation",
    "Gmail send integration",
    "Outreach tracker",
    "Reply & follow up generator",
    "Roster gap finder",
    "Priority support",
  ],
};

// ─── Access helpers ───────────────────────────────────────────────────────────
export type SubscriptionType = "monthly" | "annual" | "grandfathered" | null;
export type SubscriptionStatus = "active" | "cancelling" | "cancelled" | "past_due" | null;

/** Returns true if the user has full Pro access (active sub OR grandfathered). */
export function hasProAccess(
  hasPaidAccess: boolean,
  subscriptionType?: SubscriptionType,
  subscriptionStatus?: SubscriptionStatus
): boolean {
  // Grandfathered users always have access
  if (subscriptionType === "grandfathered") return true;
  // Legacy hasPaidAccess flag (set by old one-time flow) — treat as grandfathered
  if (hasPaidAccess && !subscriptionType) return true;
  // Active subscription (cancelling = still active until period end)
  if (subscriptionStatus === "active" || subscriptionStatus === "cancelling") return true;
  return false;
}

/** Returns the max number of schools a user can add. */
export function getSchoolsLimit(hasPaidAccess: boolean): number {
  return hasPaidAccess ? Infinity : 5;
}
