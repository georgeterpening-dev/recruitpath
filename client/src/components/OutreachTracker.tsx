/**
 * OutreachTracker — Phase 4
 * Collapsible rows (click anywhere to expand/collapse), inline Follow Up section,
 * AI Reply Generator, and fixed status dropdown.
 *
 * Notification for "Response Received" is handled entirely by the global
 * NotificationPortal component (mounted at app root). This component only fires
 * a custom browser event — it holds zero notification state.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, ChevronDown, Sparkles, Copy, Check, Send, MessageSquare,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SchoolLogoImg from "@/components/SchoolLogo";
import { SCHOOL_DATABASE } from "@/data/schoolDatabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackerRow {
  id: number;
  schoolId: string;
  schoolName: string;
  coachName: string | null;
  coachEmail: string | null;
  subject: string;
  body: string;
  status: string;
  sentAt: Date;
}

type GenerateResult = {
  interestLevel: "Hot" | "Warm" | "Neutral" | "Cold";
  analysisBullets: string[];
  actionItems: string[];
  replySubject: string;
  replyBody: string;
};

type FollowUpResult = {
  subject: string;
  body: string;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string; emoji: string; color: string }[] = [
  { value: "no_response",          label: "No response yet",      emoji: "⬜", color: "#94A3B8" },
  { value: "response_received",    label: "Response received",    emoji: "📬", color: "#22C55E" },
  { value: "conversation_ongoing", label: "Conversation ongoing", emoji: "💬", color: "#3B82F6" },
  { value: "visit_scheduled",      label: "Visit scheduled",      emoji: "🏟", color: "#F5B800" },
  { value: "offer_received",       label: "Offer received",       emoji: "🏐", color: "#A855F7" },
  { value: "not_interested",       label: "Not interested",       emoji: "❌", color: "#EF4444" },
];

function getStatusConfig(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0];
}

// ─── Days-since pill ──────────────────────────────────────────────────────────

function DaysPill({ sentAt }: { sentAt: Date }) {
  const days = Math.floor((Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24));
  let color = "#22C55E";
  let bg = "rgba(34,197,94,0.1)";
  let border = "rgba(34,197,94,0.3)";
  let label = `${days}d ago`;
  if (days >= 8 && days <= 21) {
    color = "#F5B800"; bg = "rgba(245,184,0,0.1)"; border = "rgba(245,184,0,0.3)";
  } else if (days >= 22) {
    color = "#EF4444"; bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.3)";
    label = `${days}d ago — follow up?`;
  }
  return (
    <span
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "11px",
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "20px",
        padding: "3px 10px",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ─── Status dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef<{ top: number; left: number } | null>(null);
  const current = getStatusConfig(currentStatus);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280;
      const openUpward = spaceAbove > spaceBelow && spaceAbove > dropdownHeight;
      const top = openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
      posRef.current = { top, left: rect.left };
    }
    setOpen((v) => !v);
  };

  const handleClose = () => setOpen(false);

  const pos = open && buttonRef.current
    ? (() => {
        const r = buttonRef.current!.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const spaceAbove = r.top;
        const dropdownHeight = 280;
        const openUpward = spaceAbove > spaceBelow && spaceAbove > dropdownHeight;
        const top = openUpward ? r.top - dropdownHeight - 4 : r.bottom + 4;
        return { top, left: r.left };
      })()
    : posRef.current;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          color: current.color,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid #1E293B",
          borderRadius: "6px",
          padding: "5px 10px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          minWidth: 200,
          position: "relative",
          zIndex: 20,
        }}
      >
        <span>{current.emoji}</span>
        <span style={{ flex: 1, textAlign: "left" }}>{current.label}</span>
        <ChevronDown size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
      </button>

      {open && pos && createPortal(
        <>
          <div
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }}
            onClick={handleClose}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              background: "#111827",
              border: "1px solid #1E293B",
              borderRadius: "8px",
              minWidth: 220,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 99999,
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(opt.value);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: opt.value === currentStatus ? opt.color : "#F8FAFC",
                  background: opt.value === currentStatus ? "rgba(255,255,255,0.06)" : "transparent",
                  padding: "10px 14px",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = opt.value === currentStatus ? "rgba(255,255,255,0.06)" : "transparent"; }}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ─── Interest level badge ─────────────────────────────────────────────────────

function InterestBadge({ level }: { level: "Hot" | "Warm" | "Neutral" | "Cold" }) {
  const config = {
    Hot:     { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.4)",  color: "#22C55E",  emoji: "🔥" },
    Warm:    { bg: "rgba(245,184,0,0.15)", border: "rgba(245,184,0,0.4)", color: "#F5B800",  emoji: "☀️" },
    Neutral: { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)",color: "#94A3B8",  emoji: "😐" },
    Cold:    { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)", color: "#EF4444",  emoji: "🧊" },
  }[level];

  return (
    <span
      style={{
        fontFamily: "Barlow Condensed, sans-serif",
        fontSize: "13px",
        letterSpacing: "0.08em",
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "6px",
        padding: "3px 12px",
      }}
    >
      {config.emoji} {level.toUpperCase()}
    </span>
  );
}

// ─── AI Reply Generator section ───────────────────────────────────────────────

function AIReplySection({
  row,
  onSendReply,
  onReplyGenerated,
}: {
  row: TrackerRow;
  onSendReply: (subject: string, body: string, coachEmail: string | null) => void;
  onReplyGenerated?: () => void;
}) {
  const [coachResponse, setCoachResponse] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [editableReply, setEditableReply] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.outreachTracker.generateReply.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setEditableReply(data.replyBody);
      onReplyGenerated?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate reply. Please try again.");
    },
  });

  const handleGenerate = () => {
    if (coachResponse.trim().length < 10) {
      toast.error("Please paste the coach's response first.");
      return;
    }
    generateMutation.mutate({
      schoolId: row.schoolId,
      schoolName: row.schoolName,
      coachName: row.coachName ?? undefined,
      originalSubject: row.subject,
      originalBody: row.body,
      coachResponse: coachResponse.trim(),
    });
  };

  const handleCopy = useCallback(() => {
    const text = `Subject: ${result?.replySubject ?? ""}\n\n${editableReply}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Reply copied to clipboard");
    });
  }, [result, editableReply]);

  const isLoading = generateMutation.isPending;

  return (
    <div style={{ borderTop: "1px solid #1E293B", padding: "20px", background: "#111111" }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} style={{ color: "#F5B800" }} />
        <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.12em", color: "#F5B800" }}>
          AI REPLY GENERATOR
        </span>
      </div>

      <div className="mb-3">
        <label style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>
          Coach's response
        </label>
        <textarea
          value={coachResponse}
          onChange={(e) => setCoachResponse(e.target.value)}
          placeholder="Paste the coach's response here..."
          rows={4}
          style={{ width: "100%", background: "#111827", border: "1px solid #1E293B", borderRadius: "8px", padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F8FAFC", resize: "vertical" as const, outline: "none", lineHeight: 1.6 }}
        />
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => { setCoachResponse(""); setResult(null); setEditableReply(""); }} style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", background: "transparent", border: "1px solid #1E293B", borderRadius: "6px", padding: "7px 16px", cursor: "pointer" }}>
          CLEAR
        </button>
        <button onClick={handleGenerate} disabled={isLoading} style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: isLoading ? "#94A3B8" : "#0A0E1A", background: isLoading ? "#1E293B" : "#F5B800", border: "none", borderRadius: "6px", padding: "7px 18px", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={12} />
          {isLoading ? "ANALYZING..." : "ANALYZE & GENERATE REPLY →"}
        </button>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "10px", padding: "24px", textAlign: "center" }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} style={{ color: "#F5B800" }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F5B800" }}>Analyzing response...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
            <div style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "12px", letterSpacing: "0.12em", color: "#94A3B8", marginBottom: 10 }}>COACH ANALYSIS</div>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>Interest level:</span>
                <InterestBadge level={result.interestLevel} />
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {result.analysisBullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ color: "#F5B800", fontSize: "10px", marginTop: 4, flexShrink: 0 }}>●</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#94A3B8", lineHeight: 1.5 }}>{bullet}</span>
                  </div>
                ))}
              </div>
              {result.actionItems.length > 0 && (
                <div style={{ background: "rgba(245,184,0,0.06)", border: "1px solid rgba(245,184,0,0.15)", borderRadius: "6px", padding: "10px 12px" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#F5B800", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>Action items</div>
                  {result.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: "#F5B800", fontSize: "10px", marginTop: 4, flexShrink: 0 }}>●</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F8FAFC", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "12px", letterSpacing: "0.12em", color: "#94A3B8", marginBottom: 10 }}>SUGGESTED REPLY</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", marginBottom: 10, padding: "6px 10px", background: "#111111", borderRadius: "4px", border: "1px solid #1E293B" }}>
                <span style={{ color: "#4A4A4A", marginRight: 6 }}>Subject:</span>{result.replySubject}
              </div>
              <textarea value={editableReply} onChange={(e) => setEditableReply(e.target.value)} rows={8} style={{ width: "100%", background: "#111111", border: "1px solid #1E293B", borderRadius: "8px", padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F8FAFC", resize: "vertical" as const, outline: "none", lineHeight: 1.7, marginBottom: 10 }} />
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: copied ? "#22C55E" : "#94A3B8", background: "transparent", border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "#1E293B"}`, borderRadius: "6px", padding: "7px 14px", cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "COPIED" : "COPY"}
                </button>
                <button onClick={() => onSendReply(result.replySubject, editableReply, row.coachEmail)} className="flex items-center gap-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#0A0E1A", background: "#F5B800", border: "none", borderRadius: "6px", padding: "7px 16px", cursor: "pointer" }}>
                  <Send size={12} />
                  SEND →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline Follow Up section ─────────────────────────────────────────────────

function FollowUpSection({
  row,
  onSendFollowUp,
}: {
  row: TrackerRow;
  onSendFollowUp: (subject: string, body: string, coachEmail: string | null) => void;
}) {
  const [result, setResult] = useState<FollowUpResult | null>(null);
  const [editableBody, setEditableBody] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.outreachTracker.generateFollowUp.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setEditableBody(data.body);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate follow-up. Please try again.");
    },
  });

  const daysSince = Math.floor((Date.now() - new Date(row.sentAt).getTime()) / (1000 * 60 * 60 * 24));

  const handleGenerate = () => {
    generateMutation.mutate({
      schoolId: row.schoolId,
      schoolName: row.schoolName,
      coachName: row.coachName ?? undefined,
      originalSubject: row.subject,
      originalBody: row.body,
      daysSince,
    });
  };

  const handleCopy = useCallback(() => {
    const text = `Subject: ${result?.subject ?? ""}\n\n${editableBody}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Follow-up copied to clipboard");
    });
  }, [result, editableBody]);

  const isLoading = generateMutation.isPending;

  return (
    <div style={{ borderTop: "1px solid #1E293B", padding: "20px", background: "#111111" }}>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={14} style={{ color: "#94A3B8" }} />
        <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.12em", color: "#94A3B8" }}>
          FOLLOW UP EMAIL
        </span>
      </div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#4A4A4A", marginBottom: 16 }}>
        No response yet — remind the coach of your interest
      </p>

      {!result && (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: isLoading ? "#94A3B8" : "#0A0E1A",
            background: isLoading ? "#1E293B" : "#F5B800",
            border: "none",
            borderRadius: "6px",
            padding: "8px 18px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? (
            <>
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <Sparkles size={12} />
              </motion.span>
              GENERATING...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              GENERATE FOLLOW UP →
            </>
          )}
        </button>
      )}

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: 16, background: "#111827", border: "1px solid #1E293B", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} style={{ color: "#F5B800" }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F5B800" }}>Writing follow-up...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ marginTop: 0 }}>
            <div style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "12px", letterSpacing: "0.12em", color: "#94A3B8", marginBottom: 10 }}>GENERATED FOLLOW-UP</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", marginBottom: 10, padding: "6px 10px", background: "#111111", borderRadius: "4px", border: "1px solid #1E293B" }}>
                <span style={{ color: "#4A4A4A", marginRight: 6 }}>Subject:</span>{result.subject}
              </div>
              <textarea
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                rows={6}
                style={{ width: "100%", background: "#111111", border: "1px solid #1E293B", borderRadius: "8px", padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F8FAFC", resize: "vertical" as const, outline: "none", lineHeight: 1.7, marginBottom: 10 }}
              />
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: copied ? "#22C55E" : "#94A3B8", background: "transparent", border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "#1E293B"}`, borderRadius: "6px", padding: "7px 14px", cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "COPIED" : "COPY"}
                </button>
                <button onClick={() => onSendFollowUp(result.subject, editableBody, row.coachEmail)} className="flex items-center gap-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#0A0E1A", background: "#F5B800", border: "none", borderRadius: "6px", padding: "7px 16px", cursor: "pointer" }}>
                  <Send size={12} />
                  SEND →
                </button>
              </div>
            </div>
            <button onClick={() => { setResult(null); setEditableBody(""); }} style={{ marginTop: 8, fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#4A4A4A", background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}>
              ↺ Generate a different version
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── localStorage helper (reply used tracking) ────────────────────────────────

const REPLY_USED_KEY = "rp_reply_used";

function getReplyUsedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(REPLY_USED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markReplyUsed(schoolId: string) {
  const set = getReplyUsedSet();
  set.add(schoolId);
  localStorage.setItem(REPLY_USED_KEY, JSON.stringify(Array.from(set)));
}

// ─── Tracker Row ──────────────────────────────────────────────────────────────

function TrackerRowCard({
  row,
  onSendReply,
  onStatusChange,
  openReplyOnMount,
  onReplyOpened,
}: {
  row: TrackerRow;
  onSendReply: (schoolId: string, subject: string, body: string, coachEmail: string | null) => void;
  onStatusChange: (schoolId: string, status: string) => void;
  /** When true, expand the row and open the reply section immediately */
  openReplyOnMount: boolean;
  onReplyOpened: () => void;
}) {
  const [expanded] = useState(true); // Always expanded
  const [activeSection, setActiveSection] = useState<"email" | "followup" | "reply" | null>(null);

  // When the global NotificationPortal fires "GENERATE REPLY →", open reply section
  useEffect(() => {
    if (openReplyOnMount) {
      setActiveSection("reply");
      onReplyOpened();
    }
  }, [openReplyOnMount, onReplyOpened]);

  const entry = SCHOOL_DATABASE.find((s) => s.id === row.schoolId);
  const truncatedSubject = row.subject.length > 40 ? row.subject.slice(0, 40) + "..." : row.subject;
  const formattedDate = new Date(row.sentAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  // Row click removed — always expanded

  const handleSectionToggle = (section: "email" | "followup" | "reply") => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSection((prev) => prev === section ? null : section);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "#111827",
        border: "1px solid #1E293B",
        borderRadius: "12px",
        overflow: "visible",
      }}
    >
      {/* ── Summary row (always visible) ── */}
      <div
        className="flex flex-wrap items-start gap-4 p-5 select-none"
        style={{ minHeight: 80 }}
      >
        {/* Logo */}
        <div className="flex-shrink-0 mt-0.5">
          <SchoolLogoImg
            name={entry?.school || row.schoolName}
            athleticsDomain={entry?.athleticsDomain || ""}
            logoUrl={entry?.logoUrl}
            size={44}
            brandColor={entry?.brandColor || "#F5B800"}
          />
        </div>

        {/* School + coach info */}
        <div className="flex-1 min-w-0" style={{ minWidth: 140 }}>
          <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", color: "#F8FAFC", lineHeight: 1.1, letterSpacing: "0.03em" }}>
            {(entry?.school || row.schoolName).toUpperCase()}
          </div>
          {row.coachName && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", marginTop: 2 }}>{row.coachName}</div>
          )}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", marginTop: 2 }}>{truncatedSubject}</div>
        </div>

        {/* Date + days pill */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>{formattedDate}</span>
          <DaysPill sentAt={row.sentAt} />
        </div>

        {/* Status dropdown — full width on mobile */}
        <div className="w-full sm:w-auto flex-shrink-0 self-start" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            currentStatus={row.status}
            onStatusChange={(status) => onStatusChange(row.schoolId, status)}
          />
        </div>

        {/* Chevron removed — always expanded */}
      </div>

      {/* ── Expanded content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            {/* Action buttons row — stacked on mobile, inline on sm+ */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-3"
              style={{ borderTop: "1px solid #1E293B", background: "#111111" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleSectionToggle("email")}
                className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: activeSection === "email" ? "#0A0E1A" : "#94A3B8",
                  background: activeSection === "email" ? "#94A3B8" : "rgba(255,255,255,0.04)",
                  border: "1px solid #1E293B",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Mail size={12} />
                VIEW EMAIL
              </button>

              <button
                onClick={handleSectionToggle("followup")}
                className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: activeSection === "followup" ? "#0A0E1A" : "#F5B800",
                  background: activeSection === "followup" ? "#F5B800" : "rgba(245,184,0,0.08)",
                  border: `1px solid ${activeSection === "followup" ? "#F5B800" : "rgba(245,184,0,0.3)"}`,
                  borderRadius: "6px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                <MessageSquare size={12} />
                FOLLOW UP
              </button>

              <button
                onClick={handleSectionToggle("reply")}
                className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: activeSection === "reply" ? "#0A0E1A" : "#F5B800",
                  background: activeSection === "reply" ? "#F5B800" : "rgba(245,184,0,0.08)",
                  border: `1px solid ${activeSection === "reply" ? "#F5B800" : "rgba(245,184,0,0.3)"}`,
                  borderRadius: "6px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Sparkles size={12} />
                GENERATE REPLY
              </button>
            </div>

            {/* Full email body */}
            <AnimatePresence>
              {activeSection === "email" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ borderTop: "1px solid #1E293B", padding: "16px 20px", background: "#0D0D0D" }}>
                    <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "11px", letterSpacing: "0.12em", color: "#4A4A4A", marginBottom: 10 }}>FULL EMAIL</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", marginBottom: 10, padding: "6px 10px", background: "#111111", borderRadius: "4px", border: "1px solid #1E293B" }}>
                      <span style={{ color: "#4A4A4A", marginRight: 6 }}>Subject:</span>{row.subject}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#94A3B8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {row.body}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline Follow Up section */}
            <AnimatePresence>
              {activeSection === "followup" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <FollowUpSection
                    row={row}
                    onSendFollowUp={(subject, body, coachEmail) =>
                      onSendReply(row.schoolId, subject, body, coachEmail)
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Reply Generator section */}
            <AnimatePresence>
              {activeSection === "reply" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <AIReplySection
                    row={row}
                    onSendReply={(subject, body, coachEmail) => {
                      markReplyUsed(row.schoolId);
                      onSendReply(row.schoolId, subject, body, coachEmail);
                    }}
                    onReplyGenerated={() => {
                      markReplyUsed(row.schoolId);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Status group config ──────────────────────────────────────────────────────

const STATUS_GROUPS: {
  label: string;
  dotColor: string;
  statusValues: string[];
  defaultCollapsed?: boolean;
}[] = [
  {
    label: "NEEDS ATTENTION",
    dotColor: "#EF4444",
    statusValues: ["no_response"],
    defaultCollapsed: false,
  },
  {
    label: "OFFER RECEIVED",
    dotColor: "#22C55E",
    statusValues: ["offer_received"],
    defaultCollapsed: false,
  },
  {
    label: "VISIT SCHEDULED",
    dotColor: "#22C55E",
    statusValues: ["visit_scheduled"],
    defaultCollapsed: false,
  },
  {
    label: "CONVERSATION ONGOING",
    dotColor: "#F5B800",
    statusValues: ["conversation_ongoing"],
    defaultCollapsed: false,
  },
  {
    label: "RESPONSE RECEIVED",
    dotColor: "#F5B800",
    statusValues: ["response_received"],
    defaultCollapsed: false,
  },
  {
    label: "FOLLOW UP SENT",
    dotColor: "#94A3B8",
    statusValues: ["follow_up_sent"],
    defaultCollapsed: false,
  },
  {
    label: "NO RESPONSE YET",
    dotColor: "#94A3B8",
    statusValues: ["no_response"],
    defaultCollapsed: true,
  },
];

function isNeedsAttention(row: TrackerRow): boolean {
  const days = Math.floor((Date.now() - new Date(row.sentAt).getTime()) / (1000 * 60 * 60 * 24));
  return row.status === "no_response" && days >= 22;
}

function getGroupRows(group: typeof STATUS_GROUPS[0], rows: TrackerRow[]): TrackerRow[] {
  if (group.label === "NEEDS ATTENTION") return rows.filter(isNeedsAttention);
  if (group.label === "NO RESPONSE YET") return rows.filter((r) => r.status === "no_response" && !isNeedsAttention(r));
  return rows.filter((r) => group.statusValues.includes(r.status));
}

function StatusGroupSection({
  group,
  rows,
  onSendReply,
  onStatusChange,
  pendingReplyOpen,
  onReplyOpened,
}: {
  group: typeof STATUS_GROUPS[0];
  rows: TrackerRow[];
  onSendReply: (schoolId: string, subject: string, body: string, coachEmail: string | null) => void;
  onStatusChange: (schoolId: string, status: string) => void;
  pendingReplyOpen: string | null;
  onReplyOpened: () => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="mb-6">
      <div
        className="flex items-center gap-2 mb-3 w-full text-left"
        style={{ background: "transparent", padding: 0 }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: group.dotColor, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.15em", color: "#94A3B8" }}>
          {group.label}
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#4A4A4A", marginLeft: 4 }}>
          ({rows.length})
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <TrackerRowCard
            key={row.id}
            row={row}
            onSendReply={onSendReply}
            onStatusChange={onStatusChange}
            openReplyOnMount={pendingReplyOpen === row.schoolId}
            onReplyOpened={onReplyOpened}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main OutreachTracker ─────────────────────────────────────────────────────

export default function OutreachTracker({
  onFollowUp: _onFollowUp,
  onSendReply,
}: {
  onFollowUp: (schoolId: string) => void;
  onSendReply: (schoolId: string, subject: string, body: string, coachEmail: string | null) => void;
}) {
  const { data: rows = [], isLoading } = trpc.outreachTracker.list.useQuery();
  const utils = trpc.useUtils();

  // schoolId of the row that should open its reply section on next render
  // Set when the global NotificationPortal fires 'openReplyGenerator'
  const [pendingReplyOpen, setPendingReplyOpen] = useState<string | null>(null);

  // Listen for the global "GENERATE REPLY →" event from NotificationPortal
  useEffect(() => {
    const handler = (e: Event) => {
      const { schoolId } = (e as CustomEvent<{ schoolId: string }>).detail;
      setPendingReplyOpen(schoolId);
    };
    window.addEventListener("openReplyGenerator", handler);
    return () => window.removeEventListener("openReplyGenerator", handler);
  }, []);

  const updateStatus = trpc.outreachTracker.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      if (vars.status === "response_received") {
        // Find the school name for the notification
        const row = (rows as TrackerRow[]).find((r) => r.schoolId === vars.schoolId);
        const schoolName = row?.schoolName ?? vars.schoolId;
        // Fire global event — NotificationPortal handles everything from here
        window.dispatchEvent(
          new CustomEvent("showReplyNotification", {
            detail: { schoolId: vars.schoolId, schoolName },
          })
        );
      }
      utils.outreachTracker.list.invalidate();
      utils.outreachTracker.activeSchoolIds.invalidate();
    },
    onError: () => toast.error("Failed to update status. Please try again."),
  });

  const handleStatusChange = useCallback((schoolId: string, status: string) => {
    updateStatus.mutate({ schoolId, status });
  }, [updateStatus]);

  return (
    <motion.div
      id="outreach-tracker"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="mt-2"
    >
      {/* Content */}
      {isLoading ? (
        <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#4A4A4A" }}>Loading...</span>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px", padding: "56px 24px", textAlign: "center" }}>
          <Mail size={28} style={{ color: "#1E293B", margin: "0 auto 12px" }} />
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#94A3B8", marginBottom: 6 }}>No emails sent yet</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#4A4A4A", marginBottom: 24 }}>Emails you send through RecruitPath will appear here</p>
          <Link href="/schools">
            <button style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.08em", background: "#F5B800", color: "#0A0E1A", border: "none", borderRadius: "4px", padding: "10px 20px", cursor: "pointer" }}>
              FIND SCHOOLS →
            </button>
          </Link>
        </div>
      ) : (
        <div>
          {STATUS_GROUPS.map((group) => (
            <StatusGroupSection
              key={group.label}
              group={group}
              rows={getGroupRows(group, rows as TrackerRow[])}
              onSendReply={onSendReply}
              onStatusChange={handleStatusChange}
              pendingReplyOpen={pendingReplyOpen}
              onReplyOpened={() => setPendingReplyOpen(null)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
