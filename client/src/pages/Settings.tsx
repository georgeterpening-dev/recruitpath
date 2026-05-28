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
import AppTopNav from "@/components/AppTopNav";

export default function Settings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const currentPlan = subStatus?.plan || "free";
  const hasPaidAccess = subStatus?.hasPaidAccess ?? false;
  const userName = user?.name || "Athlete";
  const userEmail = user?.email || "—";

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <>
    <AppTopNav />
    <div className="min-h-screen pb-8" style={{ background: "#090D18", paddingTop: "56px" }}>
      <div className="max-w-3xl mx-auto px-6 pt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "56px",
              fontWeight: 700,
              color: "#F0F4FF",
              lineHeight: 1,
              letterSpacing: "0.04em",
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
                background: "#0C1020",
                border: "1px solid #F5C518",
                borderRadius: "12px",
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
                      border: "3px solid #1E2A42",
                      borderTop: "3px solid #F5C518",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#F5C518",
                    }}
                  >
                    ACTIVATING YOUR SUBSCRIPTION...
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      color: "#8B9BB8",
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
                background: "#0C1020",
                border: "2px solid #F5C518",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#F0F4FF",
                  letterSpacing: "0.04em",
                  marginBottom: "8px",
                }}
              >
                ACTIVATION IS TAKING LONGER THAN EXPECTED
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#8B9BB8",
                  marginBottom: "16px",
                }}
              >
                Your payment was received. Click below to refresh your subscription status.
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-8 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                style={{
                  background: "#F5C518",
                  color: "#090D18",
                  fontFamily: "Barlow Condensed, sans-serif",
                  border: "none",
                  fontSize: "15px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
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
            background: "#131829",
            border: "1px solid #1E2A42",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          <h2
            className="mb-6"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0F4FF",
              letterSpacing: "0.04em",
            }}
          >
            ACCESS
          </h2>

          <div className="mb-6">
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#4A5570",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Access Level
            </span>
            <div
              className="mt-1"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#F5C518",
              }}
            >
              {subLoading || activating ? "ACTIVATING..." : hasPaidAccess ? "FULL ACCESS" : "FREE"}
            </div>
            {hasPaidAccess && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8", marginTop: "4px" }}>
                One-time purchase — lifetime access
              </div>
            )}
          </div>

          {subStatus?.totalSchoolsAdded !== undefined && (
            <div className="mb-6">
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#4A5570",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Schools Added (Lifetime)
              </span>
              <div
                className="mt-1"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  color: "#F0F4FF",
                }}
              >
                {hasPaidAccess
                  ? `${subStatus.totalSchoolsAdded} (unlimited)`
                  : `${subStatus.totalSchoolsAdded} / ${subStatus.schoolsLimit}`}
              </div>
              {!hasPaidAccess && (
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#4A5570",
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
                  className="px-6 py-3 font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "15px",
                    border: "none",
                    borderRadius: "10px",
                    boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                  }}
                >
                  GET FULL ACCESS — $49.99 →
                </button>
              </Link>
            ) : hasPaidAccess ? (
              <div
                className="px-6 py-3 font-bold tracking-widest uppercase"
                style={{
                  background: "rgba(245,197,24,0.08)",
                  color: "#F5C518",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "15px",
                  border: "1px solid rgba(245,197,24,0.2)",
                  borderRadius: "10px",
                }}
              >
                ✓ FULL ACCESS ACTIVE
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Email Integration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
          style={{
            background: "#131829",
            border: "1px solid #1E2A42",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          <h2
            className="mb-2"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0F4FF",
              letterSpacing: "0.04em",
            }}
          >
            EMAIL INTEGRATION
          </h2>
          <p
            className="mb-6"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#8B9BB8",
              lineHeight: 1.6,
            }}
          >
            Connect your Gmail account to send coach outreach emails directly from RecruitPath.
            We only request permission to send emails — we never read your inbox.
          </p>

          {gmailLoading ? (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8B9BB8" }}>Loading...</div>
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
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F0F4FF" }}>
                  {gmailStatus.email}
                </span>
              </div>
              <div className="mb-6">
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#4A5570",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Emails Sent
                </span>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
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
                className="px-5 py-2.5 text-sm font-bold tracking-widest uppercase cursor-pointer"
                style={{
                  background: "transparent",
                  color: "#EF4444",
                  border: "1px solid #EF4444",
                  fontFamily: "Inter, sans-serif",
                  borderRadius: "8px",
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
                    background: "#4A5570",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8" }}>
                  Not connected
                </span>
              </div>
              <a
                href="/api/auth/gmail"
                className="inline-flex items-center gap-2 px-6 py-3 font-bold tracking-widest uppercase"
                style={{
                  background: "#F5C518",
                  color: "#090D18",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "15px",
                  textDecoration: "none",
                  display: "inline-block",
                  borderRadius: "10px",
                  boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                }}
              >
                CONNECT GMAIL →
              </a>
            </div>
          )}
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: "#131829",
            border: "1px solid #1E2A42",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          <h2
            className="mb-6"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0F4FF",
              letterSpacing: "0.04em",
            }}
          >
            ACCOUNT
          </h2>

          <div className="space-y-4 mb-8">
            <div>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#4A5570",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Name
              </span>
              <div
                className="mt-1"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  color: "#F0F4FF",
                }}
              >
                {userName}
              </div>
            </div>
            <div>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#4A5570",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </span>
              <div
                className="mt-1"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  color: "#F0F4FF",
                }}
              >
                {userEmail}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
              style={{
                background: "transparent",
                color: "#F0F4FF",
                fontFamily: "Inter, sans-serif",
                border: "1px solid #1E2A42",
                borderRadius: "8px",
              }}
            >
              SIGN OUT
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
              style={{
                background: "transparent",
                color: "#991B1B",
                fontFamily: "Inter, sans-serif",
                border: "1px solid #991B1B33",
                borderRadius: "8px",
              }}
            >
              DELETE ACCOUNT
            </button>
          </div>
        </motion.div>
      </div>

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
                background: "#131829",
                border: "2px solid #991B1B",
                borderRadius: "16px",
                padding: "32px",
                maxWidth: "480px",
                width: "100%",
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <h3
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#F0F4FF",
                    letterSpacing: "0.04em",
                  }}
                >
                  DELETE ACCOUNT
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-2xl text-[#4A5570] hover:text-[#F0F4FF] transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#8B9BB8",
                  marginBottom: "24px",
                  lineHeight: 1.6,
                }}
              >
                THIS CANNOT BE UNDONE. ALL YOUR DATA WILL BE DELETED.
              </p>
              <p
                className="mb-4"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#4A5570",
                }}
              >
                Type <strong style={{ color: "#F0F4FF" }}>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 mb-6"
                style={{
                  background: "#0C1020",
                  border: "1px solid #1E2A42",
                  borderRadius: "8px",
                  color: "#F0F4FF",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "transparent",
                    color: "#F0F4FF",
                    fontFamily: "Inter, sans-serif",
                    border: "1px solid #1E2A42",
                    borderRadius: "8px",
                  }}
                >
                  CANCEL
                </button>
                <button
                  disabled={deleteConfirm !== "DELETE"}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase"
                  style={{
                    background: deleteConfirm === "DELETE" ? "#991B1B" : "#1E2A42",
                    color: deleteConfirm === "DELETE" ? "#FFFFFF" : "#4A5570",
                    fontFamily: "Inter, sans-serif",
                    border: "none",
                    borderRadius: "8px",
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
