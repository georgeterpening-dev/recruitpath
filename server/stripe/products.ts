/**
 * RecruitPath Stripe Products Configuration
 * One-time payment model: $49.99 for Full Access (forever).
 * Pro Communication Suite ($19.99/mo) is coming soon — not yet purchasable.
 */

export const FULL_ACCESS_PRICE_CENTS = 4999; // $49.99 USD

export const FULL_ACCESS_PRODUCT = {
  id: "full_access",
  name: "Full Access",
  priceDisplay: "$49.99",
  description: "One-time payment. No subscription. No hidden fees.",
  features: [
    "Unlimited schools",
    "AI email generation",
    "Roster Gap Finder",
    "School finder questionnaire",
    "Full athlete profile",
    "Coach directory",
  ],
};

export const PRO_SUITE_PRODUCT = {
  id: "pro_suite",
  name: "Pro Communication Suite",
  priceDisplay: "$19.99/mo",
  description: "Coming soon — get notified at launch.",
  features: [
    "Everything in Full Access",
    "Direct Gmail integration",
    "Email open tracking",
    "Coach response tracker",
    "Drip campaign builder",
    "Parent dashboard",
    "Priority support",
  ],
};

// Legacy plan type kept for backward compatibility
export type PlanId = "free" | "pro" | "elite";

export function getSchoolsLimit(hasPaidAccess: boolean): number {
  return hasPaidAccess ? Infinity : 5;
}
