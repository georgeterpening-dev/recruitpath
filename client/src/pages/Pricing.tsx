/**
 * RecruitPath — Pricing Page
 * Design: Free / Pro two-card layout with monthly/annual toggle
 * Wired to Stripe subscription checkout via tRPC subscription.createCheckout
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AppFooter from "@/components/AppFooter";


const FREE_FEATURES = [
  "Up to 5 schools",
  "Browse all 324 programs",
  "School finder quiz",
  "View roster data",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited schools",
  "AI email generation",
  "Gmail send integration",
  "Outreach tracker",
  "Reply & follow up generator",
  "Roster gap finder",
  "Priority support",
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const { isAuthenticated } = useAuth();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: ({ sessionUrl }) => {
      if (sessionUrl) {
        toast.info("Redirecting to secure checkout...");
        window.open(sessionUrl, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const hasPaidAccess = subStatus?.hasPaidAccess ?? false;

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (hasPaidAccess) {
      toast.info("You already have Pro access!");
      return;
    }
    const affiliateCode = sessionStorage.getItem("affiliateRef") || undefined;
    createCheckout.mutate({ billingPeriod, affiliateCode });
  };

  const monthlyPrice = 25;
  const annualPrice = 220;
  const annualMonthlyEquiv = Math.round(annualPrice / 12);
  const annualSavings = monthlyPrice * 12 - annualPrice;

  return (
    <>
      <div className="min-h-screen pb-8" style={{ background: "#0A0E1A" }}>
        {/* Hero */}
        <div className="pt-28 pb-16 px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#F5B800",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Simple Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "clamp(48px, 8vw, 72px)",
              color: "#FFFFFF",
              lineHeight: 1,
              marginBottom: "16px",
            }}
          >
            START FREE. GO PRO WHEN YOU'RE READY.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "17px",
              color: "#94A3B8",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Explore the platform for free. Upgrade to Pro for unlimited schools, AI emails, and every tool you need to get recruited.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex justify-center mb-10"
        >
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "#111827", border: "1px solid #1E293B" }}
          >
            {(["monthly", "annual"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className="relative px-5 py-2 rounded-lg text-xs font-semibold tracking-widest uppercase transition-all duration-200"
                style={{
                  fontFamily: "Inter, sans-serif",
                  background: billingPeriod === period ? "#F5B800" : "transparent",
                  color: billingPeriod === period ? "#0A0E1A" : "#64748B",
                }}
              >
                {period === "annual" ? (
                  <span className="flex items-center gap-1.5">
                    ANNUAL
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        background: billingPeriod === "annual" ? "rgba(10,14,26,0.2)" : "rgba(245,184,0,0.15)",
                        color: billingPeriod === "annual" ? "#0A0E1A" : "#F5B800",
                      }}
                    >
                      SAVE ${annualSavings}
                    </span>
                  </span>
                ) : "MONTHLY"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="px-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Free Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl p-8 flex flex-col"
              style={{
                background: "#111827",
                border: "1px solid #1E293B",
              }}
            >
              <div className="mb-6">
                <p
                  className="text-xs font-bold tracking-widest uppercase mb-3"
                  style={{ fontFamily: "Inter, sans-serif", color: "#64748B" }}
                >
                  Free
                </p>
                <div className="flex items-end gap-2 mb-2">
                  <span
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "52px",
                      color: "#FFFFFF",
                      lineHeight: 1,
                    }}
                  >
                    $0
                  </span>
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#64748B" }}>
                  No credit card required
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check size={14} className="flex-shrink-0" style={{ color: "#475569" }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#94A3B8" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <motion.button
                  whileHover={{ borderColor: "#475569", color: "#F8FAFC" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 flex items-center justify-center"
                  style={{
                    background: "transparent",
                    border: "1px solid #1E293B",
                    color: "#64748B",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "15px",
                    letterSpacing: "0.1em",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  GET STARTED FREE
                </motion.button>
              </Link>
            </motion.div>

            {/* Pro Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl p-8 flex flex-col relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0F1929 0%, #111827 100%)",
                border: "1px solid rgba(245,184,0,0.3)",
                boxShadow: "0 0 40px rgba(245,184,0,0.06)",
              }}
            >
              {/* Popular badge */}
              <div
                className="absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-1"
                style={{
                  background: "rgba(245,184,0,0.12)",
                  color: "#F5B800",
                  border: "1px solid rgba(245,184,0,0.25)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <Zap size={10} strokeWidth={2.5} />
                MOST POPULAR
              </div>

              <div className="mb-6">
                <p
                  className="text-xs font-bold tracking-widest uppercase mb-3"
                  style={{ fontFamily: "Inter, sans-serif", color: "#F5B800" }}
                >
                  Pro
                </p>
                <div className="flex items-end gap-2 mb-2">
                  {billingPeriod === "annual" ? (
                    <>
                      <span
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "52px",
                          color: "#FFFFFF",
                          lineHeight: 1,
                        }}
                      >
                        ${annualMonthlyEquiv}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#64748B", paddingBottom: "8px" }}>
                        /month
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "52px",
                          color: "#FFFFFF",
                          lineHeight: 1,
                        }}
                      >
                        ${monthlyPrice}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#64748B", paddingBottom: "8px" }}>
                        /month
                      </span>
                    </>
                  )}
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#64748B" }}>
                  {billingPeriod === "annual"
                    ? `$${annualPrice}/year — save $${annualSavings} vs monthly`
                    : "Billed monthly. Cancel anytime."}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((feature, i) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check
                      size={14}
                      className="flex-shrink-0"
                      style={{ color: i === 0 ? "#475569" : "#F5B800" }}
                    />
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        color: i === 0 ? "#94A3B8" : "#E2E8F0",
                      }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {hasPaidAccess ? (
                <div
                  className="w-full py-3.5 flex items-center justify-center gap-2 rounded-lg"
                  style={{
                    background: "rgba(245,184,0,0.1)",
                    border: "1px solid rgba(245,184,0,0.25)",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "15px",
                    letterSpacing: "0.1em",
                    color: "#F5B800",
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                  YOU HAVE PRO ACCESS
                </div>
              ) : (
                <motion.button
                  whileHover={{ filter: "brightness(1.08)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpgrade}
                  disabled={createCheckout.isPending}
                  className="w-full py-3.5 flex items-center justify-center gap-2 rounded-lg font-bold"
                  style={{
                    background: "#F5B800",
                    color: "#0A0E1A",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "15px",
                    letterSpacing: "0.1em",
                    cursor: createCheckout.isPending ? "not-allowed" : "pointer",
                    opacity: createCheckout.isPending ? 0.7 : 1,
                    transition: "filter 0.15s",
                  }}
                >
                  {createCheckout.isPending
                    ? "REDIRECTING..."
                    : billingPeriod === "annual"
                    ? `GET PRO — $${annualPrice}/YEAR`
                    : `GET PRO — $${monthlyPrice}/MONTH`}
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Notes */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#94A3B8",
              lineHeight: 1.6,
              maxWidth: "480px",
              margin: "32px auto 0",
              textAlign: "center",
            }}
          >
            Start free — add your first 5 schools with no credit card required. Upgrade to Pro whenever you're ready.
          </motion.p>

        </div>

        {/* FAQ */}
        <div className="px-6 pb-24 max-w-2xl mx-auto mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "32px",
              color: "#FFFFFF",
              letterSpacing: "0.04em",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            FREQUENTLY ASKED QUESTIONS
          </motion.h2>
          {[
            {
              q: "What's included in the free plan?",
              a: "Free accounts can add up to 5 schools, browse all 324 programs, take the school finder quiz, and view roster data. No credit card required.",
            },
            {
              q: "What does Pro add?",
              a: "Pro unlocks unlimited school tracking, AI-generated recruiting emails, Gmail send integration, the outreach tracker, reply & follow-up generator, roster gap finder, and priority support.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel anytime from your Settings page. You keep Pro access until the end of your billing period.",
            },
            {
              q: "What happens when I cancel?",
              a: "Your account reverts to the free tier. You can still browse schools and use basic features, but email generation and Gmail send are paused.",
            },
            {
              q: "Is there a free trial?",
              a: "Yes — your first 5 schools are completely free with no credit card required.",
            },
            {
              q: "What's the difference between monthly and annual?",
              a: "Same features either way. Annual saves you $80 compared to paying monthly.",
            },
            {
              q: "Can I switch between monthly and annual?",
              a: "Yes, you can switch anytime from your Settings page.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.07 }}
              style={{ borderBottom: "1px solid #1E293B", paddingBottom: "24px", marginBottom: "24px" }}
            >
              <p
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "16px",
                  color: "#FFFFFF",
                  letterSpacing: "0.04em",
                  marginBottom: "8px",
                }}
              >
                {item.q}
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#64748B",
                  lineHeight: 1.65,
                }}
              >
                {item.a}
              </p>
            </motion.div>
          ))}
        </div>
        <AppFooter />
      </div>
    </>
  );
}
