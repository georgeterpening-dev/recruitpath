/**
 * RecruitPath — Settings Page
 * Wired to real Stripe subscription status and customer portal via tRPC.
 * After checkout, verifies the session directly with Stripe as a fallback.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AppFooter from "@/components/AppFooter";


/** Muted outlined cancel button — red tint only on hover */
function CancelButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="px-5 py-2 text-xs font-bold tracking-widest uppercase rounded-sm cursor-pointer"
      style={{
        background: "transparent",
        border: `1px solid ${hovered ? "#E24B4A" : "#2A2A2A"}`,
        color: hovered ? "#E24B4A" : "#888888",
        fontFamily: "DM Sans, sans-serif",
        transition: "border-color 0.2s, color 0.2s",
      }}
    >
      CANCEL SUBSCRIPTION
    </button>
  );
}

export default function Settings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPeriodEnd, setCancelPeriodEnd] = useState<Date | null>(null);

  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const search = useSearch();
  const utils = trpc.useUtils();

  // ─── Post-Checkout Activation State ──────────────────────────────────────────
  const [activating, setActivating] = useState(false);
  const [activationTimedOut, setActivationTimedOut] = useState(false);
  const activationStartRef = useRef<number>(0);

  // Get subscription status
  const { data: subStatus, isLoading: subLoading } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Gmail integration status
  const { data: gmailStatus, isLoading: gmailLoading, refetch: refetchGmail } = trpc.gmail.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Gmail disconnect
  const [disconnecting, setDisconnecting] = useState(false);
  const handleGmailDisconnect = async () => {
    if (!confirm("Disconnect your Gmail account? You won't be able to send emails until you reconnect.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/auth/gmail/disconnect", { method: "POST", credentials: "include" });
      await refetchGmail();
      toast.success("Gmail disconnected.");
    } catch {
      toast.error("Failed to disconnect Gmail.");
    } finally {
      setDisconnecting(false);
    }
  };

  // Handle gmail query param from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(search);
    const gmailParam = params.get("gmail");
    if (gmailParam === "connected") {
      window.history.replaceState({}, "", "/settings");
      refetchGmail();
      toast.success("Gmail connected successfully!");
    } else if (gmailParam === "denied") {
      window.history.replaceState({}, "", "/settings");
      toast.info("Gmail connection cancelled.");
    } else if (gmailParam === "error") {
      window.history.replaceState({}, "", "/settings");
      toast.error("Gmail connection failed. Please try again.");
    } else if (gmailParam === "no_refresh_token") {
      window.history.replaceState({}, "", "/settings");
      toast.error("Could not get a refresh token. Please revoke RecruitPath's access in your Google account and try again.");
    }
  }, []);

  // Direct session verification mutation
  const verifySession = trpc.subscription.verifySession.useMutation({
    onSuccess: (data) => {
      if (data.activated) {
        setActivating(false);
        setActivationTimedOut(false);
        toast.success(data.message);
        utils.subscription.status.invalidate();
        utils.auth.me.invalidate();
      } else {
        // Payment not yet completed — keep polling
        console.log("[Settings] Session not yet paid, will retry...");
      }
    },
    onError: (err) => {
      console.error("[Settings] Session verification error:", err.message);
    },
  });

  // Handle post-checkout redirect: grab session_id and verify directly
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("upgrade") === "success") {
      const sessionId = params.get("session_id");
      const plan = params.get("plan") || "pro";

      // Clean URL immediately
      window.history.replaceState({}, "", "/settings");

      if (sessionId) {
        setActivating(true);
        activationStartRef.current = Date.now();
        toast.info(`Activating your ${plan.toUpperCase()} plan...`);

        // Immediately try to verify the session
        verifySession.mutate({ sessionId });
      } else {
        toast.success(`Welcome to ${plan.toUpperCase()}!`);
        utils.subscription.status.invalidate();
      }
    }
  }, []); // Only run once on mount

  // Retry verification every 3 seconds while activating
  useEffect(() => {
    if (!activating) return;

    const params = new URLSearchParams(window.location.search);
    // We already cleaned the URL, so store sessionId in a ref-like approach
    // Actually, we need the sessionId. Let's store it in state.
    return;
  }, [activating]);

  // Store sessionId for retries
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  // Updated mount effect that stores sessionId
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("upgrade") === "success") {
      const sessionId = params.get("session_id");
      if (sessionId) {
        setPendingSessionId(sessionId);
      }
    }
  }, []); // Only run once on mount

  // Retry loop: poll every 3s while activating
  useEffect(() => {
    if (!activating || !pendingSessionId) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - activationStartRef.current;

      if (elapsed > 20000) {
        setActivationTimedOut(true);
        clearInterval(interval);
        return;
      }

      // Retry verification
      verifySession.mutate({ sessionId: pendingSessionId });
    }, 3000);

    return () => clearInterval(interval);
  }, [activating, pendingSessionId]);

  // Stop activating once plan updates
  useEffect(() => {
    if (activating && subStatus?.plan && subStatus.plan !== "free") {
      setActivating(false);
      setActivationTimedOut(false);
      setPendingSessionId(null);
    }
  }, [activating, subStatus?.plan]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (pendingSessionId) {
      setActivationTimedOut(false);
      setActivating(true);
      activationStartRef.current = Date.now();
      verifySession.mutate({ sessionId: pendingSessionId });
    } else {
      utils.subscription.status.invalidate();
      utils.auth.me.invalidate();
      toast.info("Refreshing subscription status...");
    }
  };

  // Stripe customer portal mutation
  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) {
        toast.info("Opening Stripe billing portal...");
        window.open(data.portalUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  const handleManageSubscription = () => {
    createPortal.mutate();
  };

  // Cancel subscription mutation
  const cancelSubscription = trpc.subscription.cancel.useMutation({
    onSuccess: (data) => {
      setShowCancelModal(false);
      setCancelPeriodEnd(data.periodEnd);
      utils.subscription.status.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      setShowCancelModal(false);
      toast.error(error.message || "Failed to cancel subscription. Please try again.");
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscription = trpc.subscription.reactivate.useMutation({
    onSuccess: () => {
      setCancelPeriodEnd(null);
      utils.subscription.status.invalidate();
      utils.auth.me.invalidate();
      toast.success("Your subscription has been reactivated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reactivate subscription. Please try again.");
    },
  });

  const handleConfirmCancel = () => {
    cancelSubscription.mutate();
  };

  const handleReactivate = () => {
    reactivateSubscription.mutate();
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const resetWalkthrough = trpc.auth.resetWalkthrough.useMutation();
  const handleReplayWalkthrough = () => {
    resetWalkthrough.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/dashboard";
      },
    });
  };

  const currentPlan = subStatus?.plan || "free";
  const hasPaidAccess = subStatus?.hasPaidAccess ?? false;
  const isCancelling = subStatus?.subscriptionStatus === "cancelling" || cancelPeriodEnd !== null;
  const userName = user?.name || "Athlete";
  const userEmail = user?.email || "—";

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <>
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0A0E1A" }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "56px",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            SETTINGS
          </h1>
          <div
            className="mt-4"
            style={{ width: "40px", height: "3px", background: "#F5C518" }}
          />
        </motion.div>

        {/* ─── Activation Banner ───────────────────────────────────────────── */}
        <AnimatePresence>
          {activating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
              style={{
                background: "#1A1A00",
                border: "1px solid #F5C518",
                borderRadius: "4px",
                padding: "24px",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Animated spinner */}
                <div
                  className="flex-shrink-0"
                  style={{ width: "24px", height: "24px" }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "3px solid #2A2A2A",
                      borderTop: "3px solid #F5C518",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#F5C518",
                    }}
                  >
                    ACTIVATING YOUR SUBSCRIPTION...
                  </div>
                  <div
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "14px",
                      color: "#A3A3A3",
                      marginTop: "4px",
                    }}
                  >
                    Verifying payment with Stripe. This usually takes a few seconds.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Timed Out — REFRESH NOW Button ──────────────────────────────── */}
        <AnimatePresence>
          {activationTimedOut && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
              style={{
                background: "#1A1A00",
                border: "2px solid #F5C518",
                borderRadius: "4px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: "8px",
                }}
              >
                ACTIVATION IS TAKING LONGER THAN EXPECTED
              </div>
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "#A3A3A3",
                  marginBottom: "16px",
                }}
              >
                Your payment was received. Click below to refresh your subscription status.
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-8 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                style={{
                  background: "#F5C518",
                  color: "#0A0A0A",
                  fontFamily: "DM Sans, sans-serif",
                  border: "none",
                  fontSize: "14px",
                }}
              >
                REFRESH NOW
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subscription Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
          style={{
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "4px",
            padding: "32px",
          }}
        >
          <h2
            className="mb-6"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.02em",
            }}
          >
            ACCESS
          </h2>

          <div className="mb-6">
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Access Level
            </span>
            <div
              className="mt-1"
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#F5C518",
              }}
            >
              {subLoading || activating
                ? "ACTIVATING..."
                : hasPaidAccess
                ? subStatus?.subscriptionType === "annual"
                  ? "PRO — ANNUAL"
                  : subStatus?.subscriptionType === "monthly"
                  ? "PRO — MONTHLY"
                  : "PRO ACCESS"
                : "FREE"}
            </div>
            {hasPaidAccess && (
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                {subStatus?.subscriptionType === "annual"
                  ? "Annual subscription — $220/year"
                  : subStatus?.subscriptionType === "monthly"
                  ? "Monthly subscription — $25/month"
                  : "Lifetime access (grandfathered)"}
              </div>
            )}
          </div>

          {subStatus?.totalSchoolsAdded !== undefined && (
            <div className="mb-6">
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Schools Added (Lifetime)
              </span>
              <div
                className="mt-1"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              >
                {hasPaidAccess
                  ? `${subStatus.totalSchoolsAdded} (unlimited)`
                  : `${subStatus.totalSchoolsAdded} / ${subStatus.schoolsLimit}`}
              </div>
              {!hasPaidAccess && (
                <div
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "11px",
                    color: "#6B6B6B",
                    marginTop: "4px",
                    fontStyle: "italic",
                  }}
                >
                  Removing schools does not reset your limit.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            {!hasPaidAccess && !activating ? (
              <Link href="/pricing">
                <button
                  className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#0A0A0A",
                    fontFamily: "DM Sans, sans-serif",
                    border: "none",
                  }}
                >
                  UPGRADE TO PRO — FROM $25/MO →
                </button>
              </Link>
            ) : hasPaidAccess ? (
              <div
                className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                style={{
                  background: "rgba(245,197,24,0.08)",
                  color: "#F5C518",
                  fontFamily: "DM Sans, sans-serif",
                  border: "1px solid rgba(245,197,24,0.2)",
                }}
              >
                ✓ PRO ACCESS ACTIVE
              </div>
            ) : null}
          </div>

          {/* Cancellation / Reactivation area */}
          {hasPaidAccess && (
            <div className="mt-6">
              {isCancelling ? (
                /* Cancelling state: show end date + reactivate button */
                <div>
                  <div
                    className="mb-4 px-4 py-3 rounded-sm"
                    style={{
                      background: "rgba(226,75,74,0.08)",
                      border: "1px solid rgba(226,75,74,0.25)",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "13px",
                      color: "#A3A3A3",
                      lineHeight: 1.6,
                    }}
                  >
                    Your subscription has been cancelled. You’ll keep Pro access until{" "}
                    <strong style={{ color: "#FFFFFF" }}>
                      {cancelPeriodEnd
                        ? cancelPeriodEnd.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                        : "the end of your billing period"}
                    </strong>.
                  </div>
                  <button
                    onClick={handleReactivate}
                    disabled={reactivateSubscription.isPending}
                    className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                    style={{
                      background: "transparent",
                      color: "#F5C518",
                      fontFamily: "DM Sans, sans-serif",
                      border: "1px solid rgba(245,197,24,0.4)",
                      opacity: reactivateSubscription.isPending ? 0.5 : 1,
                      cursor: reactivateSubscription.isPending ? "not-allowed" : "pointer",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                  >
                    {reactivateSubscription.isPending ? "REACTIVATING..." : "REACTIVATE"}
                  </button>
                </div>
              ) : (
                /* Active state: show muted cancel button */
                subStatus?.subscriptionType !== "grandfathered" && (
                  <CancelButton onClick={() => setShowCancelModal(true)} />
                )
              )}
            </div>
          )}
        </motion.div>

        {/* Email Integration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
          style={{
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "4px",
            padding: "32px",
          }}
        >
          <h2
            className="mb-2"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.02em",
            }}
          >
            EMAIL INTEGRATION
          </h2>
          <p
            className="mb-6"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#6B6B6B",
              lineHeight: 1.6,
            }}
          >
            Connect your Gmail account to send coach outreach emails directly from RecruitPath.
            We only request permission to send emails — we never read your inbox.
          </p>

          {gmailLoading ? (
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#6B6B6B" }}>Loading...</div>
          ) : gmailStatus?.connected ? (
            <div>
              {/* Connected state */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22C55E",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#FFFFFF" }}>
                  {gmailStatus.email}
                </span>
              </div>
              <div className="mb-6">
                <span
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    color: "#6B6B6B",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Emails Sent
                </span>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#F5C518",
                  }}
                >
                  {gmailStatus.emailsSent ?? 0}
                </div>
              </div>
              <button
                onClick={handleGmailDisconnect}
                disabled={disconnecting}
                className="px-5 py-2.5 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                style={{
                  background: "transparent",
                  color: "#EF4444",
                  border: "1px solid #EF4444",
                  fontFamily: "DM Sans, sans-serif",
                  opacity: disconnecting ? 0.5 : 1,
                  cursor: disconnecting ? "not-allowed" : "pointer",
                }}
              >
                {disconnecting ? "DISCONNECTING..." : "DISCONNECT GMAIL"}
              </button>
            </div>
          ) : (
            <div>
              {/* Disconnected state */}
              <div className="flex items-center gap-2 mb-6">
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#6B6B6B",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#6B6B6B" }}>
                  Not connected
                </span>
              </div>
              <a
                href={hasPaidAccess ? "/api/auth/gmail" : undefined}
                onClick={hasPaidAccess ? undefined : (e) => e.preventDefault()}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                style={{
                  background: "#F5C518",
                  color: "#0A0A0A",
                  fontFamily: "DM Sans, sans-serif",
                  textDecoration: "none",
                  display: "inline-block",
                  opacity: hasPaidAccess ? 1 : 0.4,
                  cursor: hasPaidAccess ? "pointer" : "not-allowed",
                  pointerEvents: hasPaidAccess ? "auto" : "none",
                }}
              >
                CONNECT GMAIL →
              </a>
              {!hasPaidAccess && (
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    color: "#6B6B6B",
                    marginTop: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  Gmail integration is available on Pro.{" "}
                  <a
                    href="/pricing"
                    style={{
                      color: "#F5C518",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    UPGRADE →
                  </a>
                  {" "}to connect your account and send emails directly.
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "4px",
            padding: "32px",
          }}
        >
          <h2
            className="mb-6"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.02em",
            }}
          >
            ACCOUNT
          </h2>

          <div className="space-y-4 mb-8">
            <div>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Name
              </span>
              <div
                className="mt-1"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              >
                {userName}
              </div>
            </div>
            <div>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </span>
              <div
                className="mt-1"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              >
                {userEmail}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
              style={{
                background: "transparent",
                color: "#FFFFFF",
                fontFamily: "DM Sans, sans-serif",
                border: "1px solid #2A2A2A",
              }}
            >
              SIGN OUT
            </button>
            <button
              onClick={handleReplayWalkthrough}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
              style={{
                background: "transparent",
                color: "#F5C518",
                fontFamily: "DM Sans, sans-serif",
                border: "1px solid rgba(245,197,24,0.3)",
              }}
            >
              REPLAY TOUR
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
              style={{
                background: "transparent",
                color: "#991B1B",
                fontFamily: "DM Sans, sans-serif",
                border: "1px solid #991B1B33",
              }}
            >
              DELETE ACCOUNT
            </button>
          </div>
        </motion.div>
      </div>

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#141414",
                border: "1px solid #2A2A2A",
                borderRadius: "4px",
                padding: "32px",
                maxWidth: "440px",
                width: "100%",
              }}
            >
              <h3
                className="mb-4"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                CANCEL SUBSCRIPTION?
              </h3>
              <p
                className="mb-8"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "#A3A3A3",
                  lineHeight: 1.65,
                }}
              >
                You’ll keep access until the end of your current billing period. After that your account will revert to the free tier (5 schools max).
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                  style={{
                    background: "transparent",
                    color: "#888888",
                    fontFamily: "DM Sans, sans-serif",
                    border: "1px solid #2A2A2A",
                  }}
                >
                  NEVER MIND
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelSubscription.isPending}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    background: "#E24B4A",
                    color: "#FFFFFF",
                    fontFamily: "DM Sans, sans-serif",
                    border: "none",
                    opacity: cancelSubscription.isPending ? 0.6 : 1,
                    cursor: cancelSubscription.isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {cancelSubscription.isPending ? "CANCELLING..." : "YES, CANCEL"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#141414",
                border: "2px solid #991B1B",
                borderRadius: "4px",
                padding: "32px",
                maxWidth: "480px",
                width: "100%",
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <h3
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                  }}
                >
                  DELETE ACCOUNT
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-2xl text-[#6B6B6B] hover:text-white transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  color: "#A3A3A3",
                  marginBottom: "24px",
                  lineHeight: 1.6,
                }}
              >
                THIS CANNOT BE UNDONE. ALL YOUR DATA WILL BE DELETED.
              </p>
              <p
                className="mb-4"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "#6B6B6B",
                }}
              >
                Type <strong style={{ color: "#FFFFFF" }}>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 mb-6 rounded-sm"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid #2A2A2A",
                  color: "#FFFFFF",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                  style={{
                    background: "transparent",
                    color: "#FFFFFF",
                    fontFamily: "DM Sans, sans-serif",
                    border: "1px solid #2A2A2A",
                  }}
                >
                  CANCEL
                </button>
                <button
                  disabled={deleteConfirm !== "DELETE"}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    background: deleteConfirm === "DELETE" ? "#991B1B" : "#2A2A2A",
                    color: deleteConfirm === "DELETE" ? "#FFFFFF" : "#6B6B6B",
                    fontFamily: "DM Sans, sans-serif",
                    border: "none",
                    cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                  }}
                  onClick={() => {
                    toast.info("Account deletion is not yet implemented.");
                    setShowDeleteModal(false);
                  }}
                >
                  DELETE FOREVER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
    </>
  );
}
