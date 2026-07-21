/**
 * RecruitPath — Admin Affiliate Panel (/admin/affiliates)
 * Only accessible to admin emails.
 * Three tabs: Applications (expand/approve/reject/delete), Affiliates (mark paid/remove), Promo Codes.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ChevronDown, Trash2, Edit2 } from "lucide-react";

const ADMIN_EMAILS = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];
const isAdmin = (email: string | null | undefined) => !!email && ADMIN_EMAILS.includes(email);

type Tab = "applications" | "affiliates" | "promoCodes";

const labelStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#475569",
  textTransform: "uppercase",
};

const cellStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: "13px",
  color: "#94A3B8",
  padding: "14px 16px",
  verticalAlign: "top",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: "rgba(245,197,24,0.1)", color: "#F5C518", border: "rgba(245,197,24,0.2)" },
    approved: { bg: "rgba(34,197,94,0.1)", color: "#22C55E", border: "rgba(34,197,94,0.2)" },
    rejected: { bg: "rgba(226,75,74,0.1)", color: "#E24B4A", border: "rgba(226,75,74,0.2)" },
    active: { bg: "rgba(34,197,94,0.1)", color: "#22C55E", border: "rgba(34,197,94,0.2)" },
    inactive: { bg: "rgba(100,116,139,0.1)", color: "#64748B", border: "rgba(100,116,139,0.2)" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span
      className="px-2 py-1 rounded-sm text-xs font-bold uppercase"
      style={{
        fontFamily: "DM Sans, sans-serif",
        letterSpacing: "0.08em",
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

// Inline delete confirmation widget
function DeleteConfirm({
  label,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2"
      style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px" }}
    >
      <span style={{ color: "#94A3B8" }}>{label}</span>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-2 py-1 rounded-sm text-xs font-bold uppercase cursor-pointer"
        style={{
          background: "rgba(226,75,74,0.12)",
          color: "#E24B4A",
          border: "1px solid rgba(226,75,74,0.25)",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {confirmLabel}
      </button>
      <button
        onClick={onCancel}
        style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}
      >
        CANCEL
      </button>
    </div>
  );
}

export default function AdminAffiliates() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("applications");

  // Expandable application rows
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());
  // Delete confirm state for applications
  const [deleteAppConfirm, setDeleteAppConfirm] = useState<number | null>(null);
  const [deletingApp, setDeletingApp] = useState<number | null>(null);
  // Delete confirm state for affiliates
  const [deleteAffConfirm, setDeleteAffConfirm] = useState<number | null>(null);
  const [deletingAff, setDeletingAff] = useState<number | null>(null);
  // Promo codes state
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoDeleteConfirm, setPromoDeleteConfirm] = useState<string | null>(null);
  const [promoDeleting, setPromoDeleting] = useState<string | null>(null);
  const [promoEditId, setPromoEditId] = useState<string | null>(null);
  const [promoEditActive, setPromoEditActive] = useState<boolean>(true);
  const [promoEditMax, setPromoEditMax] = useState<string>("");
  const [promoSaving, setPromoSaving] = useState<string | null>(null);

  // Local state for applications and affiliates (for optimistic removal)
  const [localApps, setLocalApps] = useState<any[] | null>(null);
  const [localAffs, setLocalAffs] = useState<any[] | null>(null);

  // Protect route
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!isAdmin(user?.email)) { navigate("/dashboard"); return; }
  }, [isAuthenticated, user?.email, authLoading, navigate]);

  const utils = trpc.useUtils();

  const { data: applications = [], isLoading: appsLoading } =
    trpc.affiliate.adminListApplications.useQuery(undefined, {
      enabled: isAuthenticated && isAdmin(user?.email),
    });

  const { data: affiliatesList = [], isLoading: affiliatesLoading } =
    trpc.affiliate.adminListAffiliates.useQuery(undefined, {
      enabled: isAuthenticated && isAdmin(user?.email),
    });

  // Sync local state from server
  useEffect(() => { if (applications.length > 0 || !appsLoading) setLocalApps(applications); }, [applications, appsLoading]);
  useEffect(() => { if (affiliatesList.length > 0 || !affiliatesLoading) setLocalAffs(affiliatesList); }, [affiliatesList, affiliatesLoading]);

  const displayApps = localApps ?? applications;
  const displayAffs = localAffs ?? affiliatesList;

  // Load promo codes when tab is selected
  useEffect(() => {
    if (tab !== "promoCodes") return;
    setPromoLoading(true);
    fetch("/api/admin/promo-codes", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPromoCodes(d.data); })
      .catch(() => toast.error("Failed to load promo codes"))
      .finally(() => setPromoLoading(false));
  }, [tab]);

  const approveMutation = trpc.affiliate.adminApprove.useMutation({
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success(`Application approved and confirmation email sent (Code: ${data.couponCode})`);
      } else {
        toast.warning(`Application approved — email failed to send, notify manually (Code: ${data.couponCode})`);
      }
      utils.affiliate.adminListApplications.invalidate();
      utils.affiliate.adminListAffiliates.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to approve"),
  });

  const rejectMutation = trpc.affiliate.adminReject.useMutation({
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success("Application rejected and notification email sent.");
      } else {
        toast.warning("Application rejected — email failed to send, notify manually.");
      }
      utils.affiliate.adminListApplications.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to reject"),
  });

  const markPaidMutation = trpc.affiliate.adminMarkPaid.useMutation({
    onSuccess: (data) => {
      toast.success(`Marked $${data.paidAmount.toFixed(2)} as paid.`);
      utils.affiliate.adminListAffiliates.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to mark paid"),
  });

  // Delete application
  async function handleDeleteApp(id: number) {
    setDeletingApp(id);
    try {
      const res = await fetch(`/api/admin/affiliate-applications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const d = await res.json();
      if (d.success) {
        setLocalApps((prev) => (prev ?? []).filter((a) => a.id !== id));
        toast.success("Application deleted.");
      } else {
        toast.error(d.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete application");
    } finally {
      setDeletingApp(null);
      setDeleteAppConfirm(null);
    }
  }

  // Remove affiliate (soft delete + deactivate Stripe promo)
  async function handleRemoveAffiliate(id: number) {
    setDeletingAff(id);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const d = await res.json();
      if (d.success) {
        setLocalAffs((prev) => (prev ?? []).filter((a) => a.id !== id));
        toast.success("Affiliate removed and promo code deactivated.");
      } else {
        toast.error(d.error || "Failed to remove");
      }
    } catch {
      toast.error("Failed to remove affiliate");
    } finally {
      setDeletingAff(null);
      setDeleteAffConfirm(null);
    }
  }

  // Deactivate promo code
  async function handleDeactivatePromo(id: string) {
    setPromoDeleting(id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const d = await res.json();
      if (d.success) {
        setPromoCodes((prev) => prev.map((p) => p.id === id ? { ...p, active: false } : p));
        toast.success("Promo code deactivated.");
      } else {
        toast.error(d.error || "Failed to deactivate");
      }
    } catch {
      toast.error("Failed to deactivate promo code");
    } finally {
      setPromoDeleting(null);
      setPromoDeleteConfirm(null);
    }
  }

  // Save promo code edit
  async function handleSavePromoEdit(id: string) {
    setPromoSaving(id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: promoEditActive,
          maxRedemptions: promoEditMax ? parseInt(promoEditMax) : undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPromoCodes((prev) =>
          prev.map((p) => p.id === id ? { ...p, active: promoEditActive } : p)
        );
        toast.success("Promo code updated.");
        setPromoEditId(null);
      } else {
        toast.error(d.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update promo code");
    } finally {
      setPromoSaving(null);
    }
  }

  // Auth checks
  if (!authLoading && !isAuthenticated) { window.location.href = getLoginUrl(); return null; }
  if (!authLoading && !isAdmin(user?.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "28px", color: "#E24B4A" }}>
          ACCESS DENIED
        </div>
      </div>
    );
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className="px-6 py-3 text-xs font-bold tracking-widest uppercase cursor-pointer"
      style={{
        fontFamily: "DM Sans, sans-serif",
        background: "transparent",
        border: "none",
        borderBottom: tab === t ? "2px solid #F5C518" : "2px solid transparent",
        color: tab === t ? "#F5C518" : "#475569",
        transition: "color 0.2s, border-color 0.2s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen px-6 py-10 pb-[100px] md:pb-10" style={{ background: "#0A0A0A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            color: "#888",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginBottom: "24px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#F8FAFC"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}
        >
          ← BACK TO DASHBOARD
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", color: "#F5C518", textTransform: "uppercase", marginBottom: "8px" }}>
            ADMIN
          </p>
          <h1 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "44px", color: "#FFFFFF", lineHeight: 1 }}>
            AFFILIATE MANAGEMENT
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex mb-8" style={{ borderBottom: "1px solid #1E293B" }}>
          {tabBtn("applications", `Applications (${displayApps.length})`)}
          {tabBtn("affiliates", `Affiliates (${displayAffs.length})`)}
          {tabBtn("promoCodes", "Promo Codes")}
        </div>

        {/* ─── Applications Tab ─────────────────────────────────────────── */}
        {tab === "applications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {appsLoading ? (
              <div style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: "13px" }}>Loading...</div>
            ) : displayApps.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: "14px" }}>
                No applications yet.
              </div>
            ) : (
              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #1E293B", background: "#111827" }}>
                {displayApps.map((app, idx) => {
                  const isExpanded = expandedApps.has(app.id);
                  const showDeleteConfirm = deleteAppConfirm === app.id;
                  return (
                    <div key={app.id} style={{ borderBottom: idx < displayApps.length - 1 ? "1px solid rgba(30,41,59,0.5)" : "none" }}>
                      {/* Collapsed row */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        style={{ background: isExpanded ? "rgba(30,41,59,0.3)" : "transparent" }}
                        onClick={() => {
                          setExpandedApps((prev) => {
                            const next = new Set(prev);
                            if (next.has(app.id)) next.delete(app.id); else next.add(app.id);
                            return next;
                          });
                        }}
                      >
                        {/* Chevron */}
                        <ChevronDown
                          size={14}
                          style={{
                            color: "#475569",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            flexShrink: 0,
                          }}
                        />
                        {/* Name */}
                        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#FFFFFF", fontWeight: 600, minWidth: "140px" }}>
                          {app.firstName} {app.lastName}
                        </span>
                        {/* Email */}
                        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#64748B", flex: 1 }}>
                          {app.email}
                        </span>
                        {/* Date */}
                        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#475569", whiteSpace: "nowrap", marginRight: "12px" }}>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                        {/* Status */}
                        <span style={{ marginRight: "12px" }}>
                          <StatusBadge status={app.status} />
                        </span>
                        {/* Approve/Reject — always visible */}
                        {app.status === "pending" && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => approveMutation.mutate({ applicationId: app.id })}
                              disabled={approveMutation.isPending}
                              className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-sm cursor-pointer"
                              style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", fontFamily: "DM Sans, sans-serif", opacity: approveMutation.isPending ? 0.5 : 1 }}
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate({ applicationId: app.id })}
                              disabled={rejectMutation.isPending}
                              className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-sm cursor-pointer"
                              style={{ background: "rgba(226,75,74,0.1)", color: "#E24B4A", border: "1px solid rgba(226,75,74,0.2)", fontFamily: "DM Sans, sans-serif", opacity: rejectMutation.isPending ? 0.5 : 1 }}
                            >
                              REJECT
                            </button>
                          </div>
                        )}
                        {/* Trash icon */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteAppConfirm(app.id); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", opacity: 0.6, marginLeft: "8px", padding: "4px" }}
                          title="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Delete confirm inline */}
                      {showDeleteConfirm && (
                        <div className="px-8 py-2" style={{ background: "rgba(226,75,74,0.05)", borderTop: "1px solid rgba(226,75,74,0.1)" }}>
                          <DeleteConfirm
                            label="Delete this application?"
                            confirmLabel="CONFIRM DELETE"
                            onConfirm={() => handleDeleteApp(app.id)}
                            onCancel={() => setDeleteAppConfirm(null)}
                            loading={deletingApp === app.id}
                          />
                        </div>
                      )}

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div
                              className="px-8 py-4 grid grid-cols-2 md:grid-cols-3 gap-4"
                              style={{ background: "rgba(15,23,42,0.6)", borderTop: "1px solid rgba(30,41,59,0.5)" }}
                            >
                              {[
                                ["Full Name", `${app.firstName} ${app.lastName}`],
                                ["Email", app.email],
                                ["Grad Year", app.graduationYear],
                                ["Position", app.position],
                                ["High School", app.highSchool],
                                ["Club Team", app.clubTeam || "—"],
                                ["Instagram", app.instagramHandle || "—"],
                                ["Date Applied", new Date(app.appliedAt).toLocaleString()],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <div style={{ ...labelStyle, marginBottom: "4px" }}>{label}</div>
                                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CBD5E1" }}>{value}</div>
                                </div>
                              ))}
                              <div className="col-span-2 md:col-span-3">
                                <div style={{ ...labelStyle, marginBottom: "4px" }}>Why do you want to be an affiliate?</div>
                                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CBD5E1", lineHeight: "1.6" }}>
                                  {app.whyJoin}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Affiliates Tab ───────────────────────────────────────────── */}
        {tab === "affiliates" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {affiliatesLoading ? (
              <div style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: "13px" }}>Loading...</div>
            ) : displayAffs.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: "14px" }}>
                No approved affiliates yet.
              </div>
            ) : (
              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #1E293B", background: "#111827" }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1E293B" }}>
                        {["Name", "Email", "Code", "Conversions", "Total Earned", "Paid Out", "Pending", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left" style={labelStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayAffs.map((aff) => {
                        const earned = parseFloat(aff.totalEarned as string);
                        const paid = parseFloat(aff.totalPaid as string);
                        const pending = Math.max(0, earned - paid);
                        const showDeleteConfirm = deleteAffConfirm === aff.id;
                        return (
                          <>
                            <tr key={aff.id} style={{ borderBottom: showDeleteConfirm ? "none" : "1px solid rgba(30,41,59,0.5)" }}>
                              <td style={{ ...cellStyle, color: "#FFFFFF", whiteSpace: "nowrap" }}>{aff.firstName} {aff.lastName}</td>
                              <td style={cellStyle}>{aff.email}</td>
                              <td style={{ ...cellStyle, color: "#F5C518", fontWeight: 700 }}>{aff.couponCode}</td>
                              <td style={cellStyle}>{aff.totalConversions}</td>
                              <td style={cellStyle}>${earned.toFixed(2)}</td>
                              <td style={cellStyle}>${paid.toFixed(2)}</td>
                              <td style={{ ...cellStyle, color: pending > 0 ? "#F5C518" : "#475569", fontWeight: pending > 0 ? 700 : 400 }}>
                                ${pending.toFixed(2)}
                              </td>
                              <td style={cellStyle}><StatusBadge status={aff.status} /></td>
                              <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                                <div className="flex items-center gap-2">
                                  {pending > 0 && (
                                    <button
                                      onClick={() => markPaidMutation.mutate({ affiliateId: aff.id })}
                                      disabled={markPaidMutation.isPending}
                                      className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase rounded-sm cursor-pointer"
                                      style={{ background: "rgba(245,197,24,0.1)", color: "#F5C518", border: "1px solid rgba(245,197,24,0.2)", fontFamily: "DM Sans, sans-serif", opacity: markPaidMutation.isPending ? 0.5 : 1 }}
                                    >
                                      MARK PAID
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setDeleteAffConfirm(aff.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", opacity: 0.6, padding: "4px" }}
                                    title="Remove affiliate"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {showDeleteConfirm && (
                              <tr key={`${aff.id}-confirm`} style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                                <td colSpan={9} style={{ padding: "10px 16px", background: "rgba(226,75,74,0.05)", borderTop: "1px solid rgba(226,75,74,0.1)" }}>
                                  <DeleteConfirm
                                    label="Remove this affiliate?"
                                    confirmLabel="CONFIRM REMOVE"
                                    onConfirm={() => handleRemoveAffiliate(aff.id)}
                                    onCancel={() => setDeleteAffConfirm(null)}
                                    loading={deletingAff === aff.id}
                                  />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Promo Codes Tab ──────────────────────────────────────────── */}
        {tab === "promoCodes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {promoLoading ? (
              <div style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: "13px" }}>Loading promo codes from Stripe...</div>
            ) : promoCodes.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: "14px" }}>
                No promotion codes found in Stripe.
              </div>
            ) : (
              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #1E293B", background: "#111827" }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1E293B" }}>
                        {["Code", "Discount", "Times Used", "Active", "Created", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left" style={labelStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map((pc, idx) => {
                        const coupon = pc.coupon ?? pc.promotion?.coupon ?? {};
                        const discount = coupon.percent_off
                          ? `${coupon.percent_off}% off`
                          : coupon.amount_off
                          ? `$${(coupon.amount_off / 100).toFixed(2)} off`
                          : "—";
                        const showDeleteConfirm = promoDeleteConfirm === pc.id;
                        const isEditing = promoEditId === pc.id;
                        return (
                          <>
                            <tr key={pc.id} style={{ borderBottom: (showDeleteConfirm || isEditing) ? "none" : idx < promoCodes.length - 1 ? "1px solid rgba(30,41,59,0.5)" : "none" }}>
                              <td style={{ ...cellStyle, color: "#F5C518", fontWeight: 700 }}>{pc.code}</td>
                              <td style={cellStyle}>{discount}</td>
                              <td style={cellStyle}>{pc.times_redeemed ?? 0}</td>
                              <td style={cellStyle}>
                                {pc.active ? (
                                  <span style={{ color: "#22C55E", fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 700 }}>● Active</span>
                                ) : (
                                  <span style={{ color: "#E24B4A", fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 700 }}>● Inactive</span>
                                )}
                              </td>
                              <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                                {new Date(pc.created * 1000).toLocaleDateString()}
                              </td>
                              <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                                <div className="flex items-center gap-2">
                                  {/* Edit button */}
                                  <button
                                    onClick={() => {
                                      if (isEditing) { setPromoEditId(null); return; }
                                      setPromoEditId(pc.id);
                                      setPromoEditActive(pc.active);
                                      setPromoEditMax(pc.max_redemptions ? String(pc.max_redemptions) : "");
                                    }}
                                    className="px-2 py-1 text-xs font-bold uppercase rounded-sm cursor-pointer flex items-center gap-1"
                                    style={{ background: "rgba(148,163,184,0.08)", color: "#94A3B8", border: "1px solid rgba(148,163,184,0.15)", fontFamily: "DM Sans, sans-serif" }}
                                  >
                                    <Edit2 size={11} /> EDIT
                                  </button>
                                  {/* Deactivate button */}
                                  {pc.active && (
                                    <button
                                      onClick={() => setPromoDeleteConfirm(pc.id)}
                                      className="px-2 py-1 text-xs font-bold uppercase rounded-sm cursor-pointer flex items-center gap-1"
                                      style={{ background: "rgba(226,75,74,0.08)", color: "#E24B4A", border: "1px solid rgba(226,75,74,0.15)", fontFamily: "DM Sans, sans-serif" }}
                                    >
                                      <Trash2 size={11} /> DEACTIVATE
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Deactivate confirm */}
                            {showDeleteConfirm && (
                              <tr key={`${pc.id}-del`} style={{ borderBottom: isEditing ? "none" : idx < promoCodes.length - 1 ? "1px solid rgba(30,41,59,0.5)" : "none" }}>
                                <td colSpan={6} style={{ padding: "10px 16px", background: "rgba(226,75,74,0.05)", borderTop: "1px solid rgba(226,75,74,0.1)" }}>
                                  <DeleteConfirm
                                    label="Deactivate this promo code?"
                                    confirmLabel="CONFIRM DEACTIVATE"
                                    onConfirm={() => handleDeactivatePromo(pc.id)}
                                    onCancel={() => setPromoDeleteConfirm(null)}
                                    loading={promoDeleting === pc.id}
                                  />
                                </td>
                              </tr>
                            )}

                            {/* Edit form */}
                            {isEditing && (
                              <tr key={`${pc.id}-edit`} style={{ borderBottom: idx < promoCodes.length - 1 ? "1px solid rgba(30,41,59,0.5)" : "none" }}>
                                <td colSpan={6} style={{ padding: "12px 16px", background: "rgba(15,23,42,0.6)", borderTop: "1px solid rgba(30,41,59,0.5)" }}>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span style={{ ...labelStyle }}>Max Redemptions</span>
                                      <input
                                        type="number"
                                        value={promoEditMax}
                                        onChange={(e) => setPromoEditMax(e.target.value)}
                                        placeholder="Unlimited"
                                        style={{
                                          background: "#1A1A1A",
                                          border: "1px solid #2A2A2A",
                                          borderRadius: "6px",
                                          color: "#F8FAFC",
                                          fontFamily: "DM Sans, sans-serif",
                                          fontSize: "12px",
                                          padding: "4px 8px",
                                          width: "100px",
                                        }}
                                      />
                                      <span style={{ ...labelStyle, fontSize: "9px", color: "#475569" }}>
                                        (Stripe limitation: can't change after creation)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span style={{ ...labelStyle }}>Active</span>
                                      <button
                                        onClick={() => setPromoEditActive(!promoEditActive)}
                                        style={{
                                          background: promoEditActive ? "rgba(34,197,94,0.12)" : "rgba(226,75,74,0.1)",
                                          border: `1px solid ${promoEditActive ? "rgba(34,197,94,0.25)" : "rgba(226,75,74,0.2)"}`,
                                          color: promoEditActive ? "#22C55E" : "#E24B4A",
                                          borderRadius: "6px",
                                          padding: "4px 10px",
                                          fontFamily: "DM Sans, sans-serif",
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        {promoEditActive ? "ON" : "OFF"}
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleSavePromoEdit(pc.id)}
                                      disabled={promoSaving === pc.id}
                                      style={{
                                        background: "rgba(245,197,24,0.12)",
                                        border: "1px solid rgba(245,197,24,0.25)",
                                        color: "#F5C518",
                                        borderRadius: "6px",
                                        padding: "4px 12px",
                                        fontFamily: "DM Sans, sans-serif",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        opacity: promoSaving === pc.id ? 0.5 : 1,
                                      }}
                                    >
                                      {promoSaving === pc.id ? "SAVING..." : "SAVE"}
                                    </button>
                                    <button
                                      onClick={() => setPromoEditId(null)}
                                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: "11px" }}
                                    >
                                      CANCEL
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
