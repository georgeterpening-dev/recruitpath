/**
 * RecruitPath — Pricing Page
 * Design: Two pricing cards (Full Access $49.99 one-time + Pro Coming Soon)
 * Wired to real Stripe one-time checkout via tRPC subscription.createCheckout
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Bell } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AppFooter from "@/components/AppFooter";

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,14,26,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(30,41,59,0.6)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <span
            className="cursor-pointer"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              fontSize: "22px",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RECRUITPATH
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {["ABOUT", "HOW IT WORKS"].map((label) => {
            const isActive = (label === "ABOUT" && location === "/about") || (label === "HOW IT WORKS" && location === "/how-it-works");
            return (
              <a
                key={label}
                href={label === "ABOUT" ? "/about" : "/how-it-works"}
                className={`text-xs font-semibold tracking-widest transition-colors duration-150 ${
                  isActive ? "text-[#F8FAFC]" : "text-[#8B9BB8] hover:text-[#F8FAFC]"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {label}
              </a>
            );
          })}
          <Link href="/pricing">
            <span className={`text-xs font-semibold tracking-widest transition-colors duration-150 cursor-pointer ${
              location === "/pricing" ? "text-[#F8FAFC]" : "text-[#8B9BB8] hover:text-[#F8FAFC]"
            }`} style={{ fontFamily: "Inter, sans-serif" }}>
              PRICING
            </span>
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <motion.span
                  whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-xs font-semibold tracking-widest uppercase rounded-lg cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  GO TO DASHBOARD
                </motion.span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin">
                <span className="text-xs font-semibold tracking-widest text-[#8B9BB8] hover:text-[#F8FAFC] transition-colors duration-150 cursor-pointer" style={{ fontFamily: "Inter, sans-serif" }}>
                  SIGN IN
                </span>
              </Link>
              <Link href="/signup">
                <motion.span
                  whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-xs font-semibold tracking-widest uppercase rounded-lg cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  GET STARTED
                </motion.span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}

const FULL_ACCESS_FEATURES = [
  "Unlimited school tracking",
  "AI-powered recruiting emails",
  "Roster Gap Finder",
  "School Finder Questionnaire",
  "Full athlete profile",
  "Complete coach directory",
  "All 291 programs",
  "Lifetime access — no subscription",
];

const PRO_FEATURES = [
  "Everything in Full Access",
  "Direct Gmail integration",
  "Email open tracking",
  "Coach response tracker",
  "Drip campaign builder",
  "Parent dashboard",
  "Priority support",
];

export default function Pricing() {
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notified, setNotified] = useState(false);
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

  const notifyProInterest = trpc.subscription.notifyProInterest.useMutation({
    onSuccess: () => {
      setNotified(true);
      toast.success("You're on the list! We'll notify you when Pro launches.");
    },
    onError: () => {
      toast.error("Failed to save. Please try again.");
    },
    onSettled: () => {
      setNotifyLoading(false);
    },
  });

  const hasPaidAccess = subStatus?.hasPaidAccess ?? false;
  const alreadyInterestedInPro = subStatus?.interestedInPro ?? false;

  const handleGetFullAccess = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (hasPaidAccess) {
      toast.info("You already have Full Access!");
      return;
    }
    createCheckout.mutate();
  };

  const handleNotifyPro = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (notified || alreadyInterestedInPro) {
      toast.info("You're already on the list!");
      return;
    }
    setNotifyLoading(true);
    notifyProInterest.mutate();
  };

  return (
    <>
    <TopNav />
    <div className="min-h-screen pb-8" style={{ background: "#090D18", paddingTop: "56px" }}>

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
            color: "#F5C518",
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
          ONE PAYMENT. FULL ACCESS.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "17px",
            color: "#8B9BB8",
            maxWidth: "480px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          No subscription. No monthly fees. Pay once and use RecruitPath for your entire recruiting journey.
        </motion.p>
      </div>

      {/* Cards */}
      <div className="px-6 pb-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Full Access Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative flex flex-col"
            style={{
              background: "linear-gradient(145deg, #151C30 0%, #131829 100%)",
              border: "1.5px solid rgba(245,197,24,0.45)",
              borderRadius: "16px",
              boxShadow: "0 0 60px rgba(245,197,24,0.10), 0 8px 32px rgba(0,0,0,0.5)",
              padding: "40px 32px",
            }}
          >
            {/* Available Now badge */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1"
              style={{
                background: "#F5C518",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#090D18",
                letterSpacing: "0.1em",
                borderRadius: "999px",
                whiteSpace: "nowrap",
              }}
            >
              AVAILABLE NOW
            </div>

            <span
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#F5C518",
                letterSpacing: "0.1em",
                marginBottom: "16px",
                display: "block",
              }}
            >
              FULL ACCESS
            </span>

            <div className="flex items-baseline gap-1 mb-1">
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "64px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                $49
              </span>
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "32px",
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                .99
              </span>
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#64748B",
                marginBottom: "28px",
              }}
            >
              One-time payment — yours forever
            </p>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FULL_ACCESS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={14} style={{ color: "#F5C518", flexShrink: 0, marginTop: "3px" }} />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      color: "#CBD5E1",
                      lineHeight: 1.5,
                    }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {hasPaidAccess ? (
              <div
                className="w-full py-3.5 text-center"
                style={{
                  background: "rgba(245,197,24,0.1)",
                  border: "1px solid rgba(245,197,24,0.3)",
                  borderRadius: "10px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "15px",
                  letterSpacing: "0.1em",
                  color: "#F5C518",
                }}
              >
                ✓ YOU HAVE FULL ACCESS
              </div>
            ) : (
              <div>
                <motion.button
                  whileHover={{ filter: "brightness(1.08)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetFullAccess}
                  disabled={createCheckout.isPending}
                  className="w-full py-3.5"
                  style={{
                    background: "#F5C518",
                    color: "#000000",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "15px",
                    letterSpacing: "0.1em",
                    borderRadius: "10px",
                    border: "none",
                    cursor: createCheckout.isPending ? "not-allowed" : "pointer",
                    opacity: createCheckout.isPending ? 0.7 : 1,
                  }}
                >
                  {createCheckout.isPending
                    ? "OPENING CHECKOUT..."
                    : isAuthenticated
                    ? "GET FULL ACCESS →"
                    : "SIGN IN TO PURCHASE →"}
                </motion.button>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "center" }}>
                  One-time payment. Starts after your 5 free schools.
                </p>
              </div>
            )}
          </motion.div>

          {/* Pro Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative flex flex-col"
            style={{
              background: "#0C1020",
              border: "1px solid #1E2A42",
              borderRadius: "16px",
              padding: "40px 32px",
            }}
          >
            {/* Coming Soon badge */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1"
              style={{
                background: "#1E2A42",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748B",
                letterSpacing: "0.1em",
                borderRadius: "999px",
                whiteSpace: "nowrap",
              }}
            >
              COMING SOON
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} style={{ color: "#7C3AED" }} />
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#7C3AED",
                  letterSpacing: "0.1em",
                }}
              >
                PRO COMMUNICATION SUITE
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "64px",
                  fontWeight: 700,
                  color: "#475569",
                  lineHeight: 1,
                }}
              >
                $19
              </span>
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "32px",
                  color: "#475569",
                  lineHeight: 1,
                }}
              >
                .99
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#475569",
                  marginLeft: "4px",
                }}
              >
                /mo
              </span>
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#334155",
                marginBottom: "28px",
              }}
            >
              Monthly subscription — launching soon
            </p>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={14} style={{ color: "#475569", flexShrink: 0, marginTop: "3px" }} />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      color: "#475569",
                      lineHeight: 1.5,
                    }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {notified || alreadyInterestedInPro ? (
              <div
                className="w-full py-3.5 text-center"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  borderRadius: "10px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "15px",
                  letterSpacing: "0.1em",
                  color: "#7C3AED",
                }}
              >
                ✓ YOU'RE ON THE LIST
              </div>
            ) : (
              <motion.button
                whileHover={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNotifyPro}
                disabled={notifyLoading}
                className="w-full py-3.5 flex items-center justify-center gap-2"
                style={{
                  background: "transparent",
                  border: "1px solid #334155",
                  color: "#64748B",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "15px",
                  letterSpacing: "0.1em",
                  borderRadius: "10px",
                  cursor: notifyLoading ? "not-allowed" : "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                <Bell size={13} />
                {notifyLoading ? "SAVING..." : "NOTIFY ME WHEN AVAILABLE"}
              </motion.button>
            )}
          </motion.div>
        </div>

          {/* Free tier info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-8 mb-6"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#8B9BB8",
            lineHeight: 1.6,
            maxWidth: "480px",
            margin: "32px auto 0",
          }}
        >
          Start free — add your first 5 schools with no credit card required. Upgrade to full access whenever you're ready.
        </motion.p>

        {/* Reassurance line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-6"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#475569",
            lineHeight: 1.6,
          }}
        >
          Your $49.99 purchase will be credited toward the Pro plan when it launches.
        </motion.p>
      </div>

      {/* FAQ */}
      <div className="px-6 pb-24 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mb-10"
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "32px",
            color: "#FFFFFF",
            letterSpacing: "0.04em",
          }}
        >
          FREQUENTLY ASKED QUESTIONS
        </motion.h2>

        {[
          {
            q: "Is this really a one-time payment?",
            a: "Yes. Pay $49.99 once and you have full access forever — no recurring charges, no subscription to cancel.",
          },
          {
            q: "What happens when the Pro plan launches?",
            a: "Your $49.99 purchase will be credited toward the Pro plan. You'll get a discount equal to what you paid.",
          },
          {
            q: "What's included in Full Access?",
            a: "Unlimited school tracking, AI email generation, Roster Gap Finder, the School Finder Questionnaire, your full athlete profile, and the complete coach directory for all 291 programs.",
          },
          {
            q: "Can I try it for free first?",
            a: "Yes — free accounts can track up to 5 schools and explore the platform before purchasing.",
          },
          {
            q: "What payment methods are accepted?",
            a: "All major credit and debit cards via Stripe's secure checkout. Your payment info is never stored on our servers.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + i * 0.07 }}
            className="mb-6"
            style={{ borderBottom: "1px solid #1E2A42", paddingBottom: "24px" }}
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
