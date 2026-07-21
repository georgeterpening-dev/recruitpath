/**
 * RecruitPath — Affiliate Dashboard (/affiliate-dashboard)
 * Only accessible to users whose email matches an approved affiliate record.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const SITE_URL = "https://recruitpath.manus.space";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-sm p-5 text-center"
      style={{ background: "#111827", border: "1px solid #1E293B" }}
    >
      <div
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "32px",
          color: "#F5C518",
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "#6B6B6B",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function AffiliateDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [affiliateStatus, setAffiliateStatus] = useState<{ isAffiliate: boolean; affiliate: { couponCode: string; firstName: string; status: string; totalConversions: number; totalEarned: string; totalPaid: string } | null } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Use the REST status endpoint so sidebar and dashboard stay in sync
  useState(() => {
    if (!isAuthenticated) return;
    fetch("/api/affiliate/status", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setAffiliateStatus(data); setStatusLoading(false); })
      .catch(() => { setAffiliateStatus({ isAffiliate: false, affiliate: null }); setStatusLoading(false); });
  });

  const { data: conversions = [], isLoading: conversionsLoading } =
    trpc.affiliate.myConversions.useQuery(undefined, { enabled: !!affiliateStatus?.isAffiliate });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Affiliate was removed — show a clear removed state instead of the not-found state
  if (!statusLoading && affiliateStatus && !affiliateStatus.isAffiliate && affiliateStatus.affiliate?.status === "inactive") {
    return (
      <DashboardLayout>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>⚠️</div>
          <div
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "28px",
              color: "#E24B4A",
              letterSpacing: "0.05em",
              marginBottom: "12px",
            }}
          >
            AFFILIATE ACCESS REMOVED
          </div>
          <div
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "#6B6B6B",
              maxWidth: "400px",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            Your affiliate account has been deactivated. If you believe this is a mistake, reach out to{" "}
            <a href="mailto:contact.recruitpath@gmail.com" style={{ color: "#F5C518", textDecoration: "none" }}>
              contact.recruitpath@gmail.com
            </a>.
          </div>
          <Link href="/dashboard">
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#888",
                textTransform: "uppercase",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Back to Dashboard
            </span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === "code" ? "Code copied!" : "Link copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const affiliate = affiliateStatus?.affiliate;

  if (authLoading || statusLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#6B6B6B",
              letterSpacing: "0.1em",
            }}
          >
            LOADING...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not an approved affiliate (and not inactive — that case handled above)
  if (!statusLoading && !affiliateStatus?.isAffiliate) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
          <div
            className="mb-4"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "28px",
              color: "#FFFFFF",
            }}
          >
            NOT AN AFFILIATE YET
          </div>
          <p
            className="mb-6"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "#64748B",
              maxWidth: "360px",
              lineHeight: 1.65,
            }}
          >
            Your account isn't linked to an approved affiliate record. Apply on the affiliates page.
          </p>
          <Link href="/affiliates">
            <button
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
              style={{
                background: "#F5C518",
                color: "#0A0A0A",
                fontFamily: "DM Sans, sans-serif",
                border: "none",
              }}
            >
              APPLY NOW →
            </button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Null guard — should not reach here but satisfies TypeScript
  if (!affiliate) return null;

  const affiliateLink = `${SITE_URL}/?ref=${affiliate.couponCode}`;
  const totalEarned = parseFloat(affiliate.totalEarned as string);
  const totalPaid = parseFloat(affiliate.totalPaid as string);
  const pending = Math.max(0, totalEarned - totalPaid);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-2 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#F5C518",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            AFFILIATE PROGRAM
          </p>
          <h1
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "40px",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            YOUR AFFILIATE DASHBOARD
          </h1>
        </motion.div>

        {/* Coupon Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-sm p-8 mb-6"
          style={{ background: "#111827", border: "1px solid #1E293B" }}
        >
          <p
            className="mb-3"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#6B6B6B",
              textTransform: "uppercase",
            }}
          >
            YOUR PERSONAL CODE
          </p>
          <div
            className="mb-2"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(48px, 8vw, 72px)",
              color: "#F5C518",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            {affiliate.couponCode}
          </div>
          <p
            className="mb-6"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              color: "#475569",
            }}
          >
            Your code gives teammates 15% off their first month
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => copyToClipboard(affiliate.couponCode, "code")}
              className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-sm cursor-pointer"
              style={{
                background: copied === "code" ? "rgba(245,197,24,0.12)" : "transparent",
                color: "#F5C518",
                fontFamily: "DM Sans, sans-serif",
                border: "1px solid rgba(245,197,24,0.35)",
                transition: "background 0.2s",
              }}
            >
              {copied === "code" ? "✓ COPIED" : "COPY CODE"}
            </button>
            <button
              onClick={() => copyToClipboard(affiliateLink, "link")}
              className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-sm cursor-pointer"
              style={{
                background: copied === "link" ? "rgba(245,197,24,0.12)" : "transparent",
                color: "#F5C518",
                fontFamily: "DM Sans, sans-serif",
                border: "1px solid rgba(245,197,24,0.35)",
                transition: "background 0.2s",
              }}
            >
              {copied === "link" ? "✓ COPIED" : "COPY LINK"}
            </button>
          </div>
          <p
            className="mt-3"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              color: "#334155",
              wordBreak: "break-all",
            }}
          >
            {affiliateLink}
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <StatCard label="Conversions" value={String(affiliate.totalConversions)} />
          <StatCard label="Total Earned" value={`$${totalEarned.toFixed(2)}`} />
          <StatCard label="Paid Out" value={`$${totalPaid.toFixed(2)}`} />
          <StatCard label="Pending" value={`$${pending.toFixed(2)}`} />
        </motion.div>

        {/* Commission rates */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6 px-5 py-3 rounded-sm"
          style={{
            background: "rgba(245,197,24,0.05)",
            border: "1px solid rgba(245,197,24,0.15)",
          }}
        >
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#94A3B8",
            }}
          >
            Commission rates:{" "}
            <strong style={{ color: "#F5C518" }}>
              $3 per monthly signup · $5 per annual signup
            </strong>
          </span>
        </motion.div>

        {/* Conversion History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-sm mb-6"
          style={{ background: "#111827", border: "1px solid #1E293B" }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid #1E293B" }}
          >
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#6B6B6B",
                textTransform: "uppercase",
              }}
            >
              CONVERSION HISTORY
            </span>
          </div>

          {conversionsLoading ? (
            <div
              className="px-6 py-8 text-center"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                color: "#6B6B6B",
              }}
            >
              Loading...
            </div>
          ) : conversions.length === 0 ? (
            <div
              className="px-6 py-10 text-center"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.65,
              }}
            >
              No conversions yet. Share your code and start earning!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E293B" }}>
                    {["Date", "Plan", "Commission", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left"
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          color: "#475569",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((c) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}
                    >
                      <td
                        className="px-6 py-4"
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "13px",
                          color: "#94A3B8",
                        }}
                      >
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          textTransform: "capitalize",
                        }}
                      >
                        {c.subscriptionType === "annual" ? "Annual" : "Monthly"}
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "13px",
                          color: "#F5C518",
                          fontWeight: 700,
                        }}
                      >
                        ${parseFloat(c.commissionAmount as string).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2 py-1 rounded-sm text-xs font-bold uppercase"
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            letterSpacing: "0.08em",
                            background: c.paid
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(245,197,24,0.1)",
                            color: c.paid ? "#22C55E" : "#F5C518",
                            border: `1px solid ${c.paid ? "rgba(34,197,94,0.2)" : "rgba(245,197,24,0.2)"}`,
                          }}
                        >
                          {c.paid ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Payout Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-sm p-6"
          style={{ background: "#111827", border: "1px solid #1E293B" }}
        >
          <p
            className="mb-1"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#6B6B6B",
              textTransform: "uppercase",
            }}
          >
            PAYOUT INFO
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "#64748B",
              lineHeight: 1.65,
            }}
          >
            Commissions are paid monthly via Venmo or PayPal once you reach a $10 minimum. Email{" "}
            <a
              href="mailto:contact.recruitpath@gmail.com"
              style={{ color: "#F5C518", textDecoration: "none" }}
            >
              contact.recruitpath@gmail.com
            </a>{" "}
            to set up your payment method.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
