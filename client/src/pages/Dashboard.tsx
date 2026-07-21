/*
 * RecruitPath — Dashboard Page
 * Design: Unified UI — matches Schools/Profile/Emails design system exactly
 * Colors: #0A0E1A bg, #141414 cards, #2A2A2A borders, #F5C518 gold, #6B6B6B muted
 * Fonts: Bebas Neue headlines, DM Sans body
 * Features: Live stats, target schools with gap analysis, full-screen school detail modal
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronRight, X, Copy, Check, ArrowRight, Plus, RefreshCw, Lock, Mail, Eye, EyeOff, ChevronDown, Star, Filter, SlidersHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useModal } from "@/contexts/ModalContext";
import { SCHOOL_DATABASE, type SchoolEntry } from "@/data/schoolDatabase";
import SchoolDetailModal from "@/components/SchoolDetailModal";
import SchoolLogoImg from "@/components/SchoolLogo";
import { getStoredGradYear } from "@/hooks/useAthleteProfile";
import SchoolFinderQuiz, { QUIZ_ANSWERS_KEY, QUIZ_COMPLETED_KEY, type QuizAnswers } from "@/components/SchoolFinderQuiz";
import AppFooter from "@/components/AppFooter";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import AppWalkthrough from "@/components/AppWalkthrough";
import MobileWalkthrough from "@/components/MobileWalkthrough";
import { useIsMobile } from "@/hooks/useMobile";

// @ts-ignore
import { rosterDatabase, calculateRosterGap } from "@shared/rosterData.js";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── StatBlock component ──────────────────────────────────────────────────────
function StatBlock({ value, label, onClick }: { value: string | number; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: hovered ? "1px solid rgba(245,197,24,0.3)" : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "4px",
        padding: "clamp(14px, 3vw, 20px) clamp(12px, 2vw, 16px)",
        minHeight: 0,
        cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 32px rgba(245,197,24,0.12), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "clamp(26px, 5vw, 40px)",
          color: "#FFFFFF",
          lineHeight: 1,
          marginBottom: "6px",
          textShadow: "0 0 30px rgba(255,255,255,0.15)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "11px",
          color: "#6B6B6B",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface OutreachSchool {
  id: number;
  schoolId: string;
  schoolName: string | null;
  coachName: string | null;
  sport: string | null;
  division: string | null;
  starred: boolean;
  createdAt: Date;
}

interface GapResult {
  openings: number;
  commits: number;
  netOpenings: number;
  matchScore: number;
  reason: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSchoolEntry(schoolId: string): SchoolEntry | undefined {
  return SCHOOL_DATABASE.find((s) => s.id === schoolId);
}

function getGapForSchool(school: OutreachSchool): GapResult | null {
  const entry = getSchoolEntry(school.schoolId);
  if (!entry || !entry.sport) return null;

  const positionMap: Record<string, string> = {
    "Football": "Quarterback",
    "Men's Basketball": "Guard",
    "Women's Basketball": "Guard",
    "Men's Volleyball": "Outside Hitter",
    "Women's Volleyball": "Outside Hitter",
  };
  const position = positionMap[entry.sport] || "Guard";

  try {
    return calculateRosterGap(entry.school, entry.sport, position, 2026);
  } catch {
    return null;
  }
}

function getStatusBadge(gap: GapResult | null): { label: string; color: string; bg: string; border: string } {
  if (!gap) return { label: "UNKNOWN", color: "#6B6B6B", bg: "rgba(107,107,107,0.1)", border: "rgba(107,107,107,0.3)" };
  if (gap.netOpenings > 1) return { label: "OPEN", color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
  if (gap.netOpenings === 1) return { label: "LIMITED", color: "#F5C518", bg: "rgba(245,197,24,0.1)", border: "rgba(245,197,24,0.3)" };
  return { label: "CLOSED", color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" };
}

function getOpeningsColor(netOpenings: number): string {
  if (netOpenings > 1) return "#22C55E";
  if (netOpenings === 1) return "#F5C518";
  return "#EF4444";
}

function yearToClass(year: number): string {
  const diff = year - 2026;
  if (diff <= 0) return "Senior";
  if (diff === 1) return "Junior";
  if (diff === 2) return "Sophomore";
  return "Freshman";
}

// ─── SchoolLogo ───────────────────────────────────────────────────────────────

function SchoolLogo({ domain, brandColor, name, size = 48, logoUrl }: { domain: string; brandColor: string; name: string; size?: number; logoUrl?: string | null }) {
  return (
    <SchoolLogoImg
      name={name}
      athleticsDomain={domain}
      logoUrl={logoUrl}
      size={size}
      brandColor={brandColor}
    />
  );
}

// ─── Match Score Ring ─────────────────────────────────────────────────────────

function MatchScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 60 ? "#22C55E" : score >= 30 ? "#F5C518" : "#EF4444";
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#2A2A2A" strokeWidth="6" />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: size * 0.25, color }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

// ─── Full-Screen School Detail Modal ─────────────────────────────────────────

function SchoolModal({
  school,
  onClose,
  onRemove,
  isPro,
}: {
  school: OutreachSchool;
  onClose: () => void;
  onRemove: () => void;
  isPro: boolean;
}) {
  const entry = getSchoolEntry(school.schoolId);
  const gap = getGapForSchool(school);
  const status = getStatusBadge(gap);
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailGenerated, setEmailGenerated] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopyEmail = () => {
    if (entry?.coachEmail) {
      navigator.clipboard.writeText(entry.coachEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    // Simulate generation with a realistic delay
    await new Promise((r) => setTimeout(r, 1400));
    const coachLast = (entry?.coachName || school.coachName || "Coach").split(" ").pop();
    const schoolName = entry?.school || school.schoolName || "your university";
    const sport = entry?.sport || school.sport || "athletics";
    const generated = `Dear Coach ${coachLast},

My name is [Your Name], and I am a [year] [position] at [Your High School] in [City, State]. I am writing to express my strong interest in the ${sport} program at ${schoolName}.

This past season, I [describe key stats/achievements]. I carry a [GPA] GPA and am committed to performing at the highest level both on the field and in the classroom. I believe ${schoolName}'s program aligns perfectly with my athletic and academic goals.

I would be honored to have the opportunity to visit campus and speak with you about how I might contribute to your program. I have attached my highlight film for your review.

Highlight Video: [Your highlight link]

Thank you for your time and consideration. I look forward to hearing from you.

Respectfully,
[Your Name]
[Your High School] | Class of [Year]
[Phone] | [Email]`;
    setEmailGenerated(generated);
    setIsGenerating(false);
  };

  // Get roster data for this school
  const rosterEntry = useMemo(() => {
    if (!entry) return null;
    return rosterDatabase.find(
      (r: any) => r.schoolName === entry.school && r.sport === entry.sport
    ) || null;
  }, [entry]);

  const positionMap: Record<string, string> = {
    "Football": "Quarterback",
    "Men's Basketball": "Guard",
    "Women's Basketball": "Guard",
    "Men's Volleyball": "Outside Hitter",
    "Women's Volleyball": "Outside Hitter",
  };
  const athletePosition = entry?.sport ? (positionMap[entry.sport] || "Guard") : "Guard";

  const rosterAtPosition = useMemo(() => {
    if (!rosterEntry) return [];
    return rosterEntry.roster.filter((p: any) => p.position === athletePosition);
  }, [rosterEntry, athletePosition]);

  const commitsAtPosition = useMemo(() => {
    if (!rosterEntry) return [];
    return rosterEntry.commits.filter((c: any) => c.position === athletePosition);
  }, [rosterEntry, athletePosition]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(0,0,0,0.75)" }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.88, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 32 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col"
          style={{
            width: "90vw",
            height: "90vh",
            maxWidth: 720,
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "28px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MODAL HEADER (non-scrollable) ── */}
          <div
            className="flex-shrink-0 p-7"
            style={{ borderBottom: "1px solid #2A2A2A" }}
          >
            {/* Top row: logo + name + close */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                {entry && (
                  <SchoolLogo
                    domain={entry.athleticsDomain}
                    brandColor={entry.brandColor}
                    name={entry.school}
                    size={56}
                    logoUrl={entry.logoUrl}
                  />
                )}
                <div>
                  <h2
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "clamp(22px, 4vw, 32px)",
                      color: "#FFFFFF",
                      lineHeight: 1,
                      marginBottom: "4px",
                    }}
                  >
                    {(entry?.school || school.schoolName || "Unknown").toUpperCase()}
                  </h2>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#6B6B6B" }}>
                    {entry ? `${entry.city}, ${entry.state} · ${entry.conference} · ${entry.division}` : ""}
                  </p>
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={onClose}
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "50%",
                  color: "#6B6B6B",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Status badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  color: status.color,
                  padding: "3px 10px",
                  background: status.bg,
                  border: `1px solid ${status.border}`,
                  borderRadius: "20px",
                }}
              >
                {status.label}
              </span>
              {entry?.conference && (
                <span
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: "#94A3B8",
                    padding: "3px 10px",
                    background: "rgba(148,163,184,0.08)",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: "20px",
                  }}
                >
                  {entry.conference}
                </span>
              )}
              {entry?.division && (
                <span
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: "#94A3B8",
                    padding: "3px 10px",
                    background: "rgba(148,163,184,0.08)",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: "20px",
                  }}
                >
                  {entry.division}
                </span>
              )}
            </div>
          </div>

          {/* ── MODAL BODY (scrollable) ── */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto"
            style={{ padding: "28px" }}
          >
            <div className="flex flex-col gap-5">

              {/* ── SECTION 1: ROSTER GAP ANALYSIS ── */}
              <div
                style={{
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#6B6B6B",
                    marginBottom: "20px",
                  }}
                >
                  ROSTER GAP ANALYSIS
                </p>
                {gap ? (
                  <>
                    {/* Three columns with dividers */}
                    <div
                      className="grid grid-cols-3"
                      style={{ borderBottom: "1px solid #2A2A2A", paddingBottom: "20px", marginBottom: "16px" }}
                    >
                      <div className="text-center" style={{ borderRight: "1px solid #2A2A2A" }}>
                        <div
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "48px",
                            color: "#FFFFFF",
                            lineHeight: 1,
                            marginBottom: "6px",
                          }}
                        >
                          {gap.openings}
                        </div>
                        <div
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "#6B6B6B",
                            textTransform: "uppercase",
                          }}
                        >
                          Graduating
                        </div>
                      </div>
                      <div className="text-center" style={{ borderRight: "1px solid #2A2A2A" }}>
                        <div
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "48px",
                            color: "#EF4444",
                            lineHeight: 1,
                            marginBottom: "6px",
                          }}
                        >
                          {gap.commits}
                        </div>
                        <div
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "#6B6B6B",
                            textTransform: "uppercase",
                          }}
                        >
                          Commits Filling Spots
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "48px",
                            color: getOpeningsColor(gap.netOpenings),
                            lineHeight: 1,
                            marginBottom: "6px",
                          }}
                        >
                          {gap.netOpenings}
                        </div>
                        <div
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "#6B6B6B",
                            textTransform: "uppercase",
                          }}
                        >
                          Real Openings
                        </div>
                      </div>
                    </div>
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#94A3B8", lineHeight: 1.6 }}>
                      {gap.reason}
                    </p>
                  </>
                ) : (
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#6B6B6B" }}>
                    No roster data available for this school yet.
                  </p>
                )}
              </div>

              {/* ── SECTION 2: MATCH SCORE ── */}
              {gap && (
                <div
                  style={{
                    background: "#1A1A1A",
                    border: "1px solid #2A2A2A",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      color: "#6B6B6B",
                      marginBottom: "20px",
                    }}
                  >
                    MATCH SCORE
                  </p>
                  <div className="flex items-center gap-6">
                    <MatchScoreRing score={gap.matchScore} size={96} />
                    <div>
                      <p
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "22px",
                          color: "#FFFFFF",
                          lineHeight: 1.2,
                          marginBottom: "8px",
                        }}
                      >
                        {gap.matchScore >= 60 ? "STRONG OPPORTUNITY" : gap.matchScore >= 30 ? "LIMITED OPENING" : "POSITION FILLED"}
                      </p>
                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#6B6B6B", lineHeight: 1.6 }}>
                        {gap.matchScore >= 60
                          ? "This program has real roster needs at your position. Now is the time to reach out."
                          : gap.matchScore >= 30
                          ? "There may be a spot available, but competition is high. A strong email could make the difference."
                          : "This position appears to be filled for the upcoming cycle. Consider reaching out for future years."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECTION 3: GENERATE EMAIL (OUTREACH) ── */}
              <div
                style={{
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#6B6B6B",
                    marginBottom: "20px",
                  }}
                >
                  OUTREACH
                </p>

                {/* Coach info */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: "#F5C518",
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "18px",
                      color: "#0A0A0A",
                      fontWeight: 700,
                    }}
                  >
                    {(entry?.coachName || school.coachName || "C")
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "18px",
                        color: "#FFFFFF",
                        lineHeight: 1.1,
                      }}
                    >
                      {(entry?.coachName || school.coachName || "Head Coach").toUpperCase()}
                    </p>
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B" }}>
                      {entry?.coachTitle || "Head Coach"}
                    </p>
                    {entry?.coachEmail && (
                      <button
                        onClick={handleCopyEmail}
                        className="flex items-center gap-1.5 mt-1"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <span
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "12px",
                            color: emailCopied ? "#22C55E" : "#F5C518",
                            transition: "color 0.2s",
                          }}
                        >
                          {entry.coachEmail}
                        </span>
                        {emailCopied ? (
                          <Check size={12} style={{ color: "#22C55E" }} />
                        ) : (
                          <Copy size={12} style={{ color: "#F5C518" }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Generate email button */}
                {!emailGenerated && (
                  <button
                    onClick={handleGenerateEmail}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 w-full"
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "14px",
                      letterSpacing: "0.08em",
                      background: isGenerating ? "rgba(245,197,24,0.4)" : "#F5C518",
                      color: "#0A0A0A",
                      border: "none",
                      borderRadius: "10px",
                      padding: "14px 20px",
                      cursor: isGenerating ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        GENERATING...
                      </>
                    ) : (
                      <>
                        GENERATE EMAIL <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}

                {/* Generated email textarea */}
                {emailGenerated && (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={emailGenerated}
                      onChange={(e) => setEmailGenerated(e.target.value)}
                      rows={10}
                      style={{
                        width: "100%",
                        background: "#111111",
                        border: "1px solid #2A2A2A",
                        borderRadius: "8px",
                        padding: "14px 16px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        color: "#F8FAFC",
                        lineHeight: 1.7,
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(emailGenerated);
                          toast.success("Email copied to clipboard!");
                        }}
                        className="flex items-center gap-2 flex-1 justify-center"
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.08em",
                          background: "#F5C518",
                          color: "#0A0A0A",
                          border: "none",
                          borderRadius: "8px",
                          padding: "11px 16px",
                          cursor: "pointer",
                        }}
                      >
                        <Copy size={13} /> COPY EMAIL
                      </button>
                      <button
                        onClick={() => { setEmailGenerated(null); handleGenerateEmail(); }}
                        className="flex items-center gap-2 justify-center"
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.08em",
                          background: "transparent",
                          color: "#6B6B6B",
                          border: "1px solid #2A2A2A",
                          borderRadius: "8px",
                          padding: "11px 16px",
                          cursor: "pointer",
                        }}
                      >
                        <RefreshCw size={13} /> REGENERATE
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 4: ROSTER INTEL (Pro only) ── */}
              <div
                style={{
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  padding: "24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#6B6B6B",
                    marginBottom: "20px",
                  }}
                >
                  ROSTER INTEL
                </p>

                {/* Content (blurred for free users) */}
                <div style={{ filter: isPro ? "none" : "blur(6px)", pointerEvents: isPro ? "auto" : "none", userSelect: isPro ? "auto" : "none" }}>
                  {rosterAtPosition.length > 0 ? (
                    <div className="mb-5">
                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase" }}>
                        Current {athletePosition}s on Roster
                      </p>
                      <div className="flex flex-col gap-2">
                        {rosterAtPosition.map((player: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                            style={{
                              background: "#111111",
                              border: "1px solid #2A2A2A",
                              borderRadius: "6px",
                              padding: "10px 14px",
                            }}
                          >
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#F8FAFC" }}>
                              {player.name}
                            </span>
                            <span
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: player.graduationYear === 2026 ? "#EF4444" : "#6B6B6B",
                                padding: "2px 8px",
                                background: player.graduationYear === 2026 ? "rgba(239,68,68,0.1)" : "rgba(107,107,107,0.1)",
                                border: `1px solid ${player.graduationYear === 2026 ? "rgba(239,68,68,0.3)" : "rgba(107,107,107,0.3)"}`,
                                borderRadius: "4px",
                              }}
                            >
                              {yearToClass(player.graduationYear)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#6B6B6B", marginBottom: "16px" }}>
                      No current {athletePosition}s on roster.
                    </p>
                  )}

                  {commitsAtPosition.length > 0 && (
                    <div>
                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase" }}>
                        Committed Recruits at {athletePosition}
                      </p>
                      <div className="flex flex-col gap-2">
                        {commitsAtPosition.map((commit: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                            style={{
                              background: "#111111",
                              border: "1px solid rgba(245,197,24,0.2)",
                              borderRadius: "6px",
                              padding: "10px 14px",
                            }}
                          >
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#F8FAFC" }}>
                              {commit.name}
                            </span>
                            <span
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: "#F5C518",
                                padding: "2px 8px",
                                background: "rgba(245,197,24,0.1)",
                                border: "1px solid rgba(245,197,24,0.3)",
                                borderRadius: "4px",
                              }}
                            >
                              Enrolling {commit.enrollmentYear}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rosterAtPosition.length === 0 && commitsAtPosition.length === 0 && (
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#6B6B6B" }}>
                      No roster intel available for this school yet.
                    </p>
                  )}
                </div>

                {/* Pro gate overlay */}
                {!isPro && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                      background: "rgba(10,14,26,0.85)",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    <Lock size={24} style={{ color: "#F5C518", marginBottom: "12px" }} />
                    <p
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "16px",
                        letterSpacing: "0.08em",
                        color: "#FFFFFF",
                        marginBottom: "8px",
                        textAlign: "center",
                      }}
                    >
                      UPGRADE TO PRO TO SEE ROSTER INTEL
                    </p>
                    <Link href="/pricing">
                      <button
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.08em",
                          background: "#F5C518",
                          color: "#0A0A0A",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        UPGRADE TO PRO — FROM $25/MO <ArrowRight size={13} />
                      </button>
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── MODAL FOOTER (non-scrollable) ── */}
          <div
            className="flex-shrink-0 flex items-center gap-3 px-7 py-5"
            style={{ borderTop: "1px solid #2A2A2A" }}
          >
            <button
              onClick={emailGenerated ? () => { setEmailGenerated(null); handleGenerateEmail(); } : handleGenerateEmail}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 flex-1"
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "14px",
                letterSpacing: "0.08em",
                background: isGenerating ? "rgba(245,197,24,0.4)" : "#F5C518",
                color: "#0A0A0A",
                border: "none",
                borderRadius: "14px",
                height: "48px",
                cursor: isGenerating ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {isGenerating ? (
                <><RefreshCw size={14} className="animate-spin" /> GENERATING...</>
              ) : emailGenerated ? (
                <><RefreshCw size={14} /> REGENERATE EMAIL</>
              ) : (
                <>GENERATE EMAIL <ArrowRight size={14} /></>
              )}
            </button>
            <button
              onClick={onRemove}
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "14px",
                letterSpacing: "0.08em",
                background: "transparent",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "14px",
                height: "48px",
                padding: "0 20px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              REMOVE SCHOOL
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── School Row (simplified) ──────────────────────────────────────────────────

function SchoolRow({
  school,
  index,
  onClick,
  dbSchool,
  liveOpenings,
  isActive = false,
  onStar,
}: {
  school: OutreachSchool;
  index: number;
  onClick: () => void;
  dbSchool?: { name: string; athleticsDomain: string | null; brandColor: string | null; city: string | null; conference: string | null; logoUrl?: string | null; logoBackgroundColor?: string | null; logoMixBlendMode?: string | null } | null;
  liveOpenings?: number | null;
  isActive?: boolean;
  onStar?: () => void;
}) {
  const entry = getSchoolEntry(school.schoolId);
  // Use live DB openings if available, otherwise fall back to static gap data
  const netOpenings = liveOpenings != null ? liveOpenings : (getGapForSchool(school)?.netOpenings ?? 0);
  const status = useMemo(() => {
    if (netOpenings > 1) return { label: "OPEN", color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
    if (netOpenings === 1) return { label: "LIMITED", color: "#F5C518", bg: "rgba(245,197,24,0.1)", border: "rgba(245,197,24,0.3)" };
    return { label: "CLOSED", color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" };
  }, [netOpenings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.4 + index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className="school-card flex items-center gap-3 cursor-pointer group"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: "4px",
        padding: "clamp(12px, 2vw, 16px) clamp(12px, 2vw, 20px)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.08)";
        el.style.background = "rgba(255,255,255,0.04)";
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.04)";
        el.style.background = "rgba(255,255,255,0.02)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Logo with optional active dot */}
      <div className="relative flex-shrink-0">
        <SchoolLogo
          domain={dbSchool?.athleticsDomain || entry?.athleticsDomain || ""}
          brandColor={dbSchool?.brandColor || entry?.brandColor || "#F5C518"}
          name={dbSchool?.name || entry?.school || school.schoolName || "?"}
          size={48}
          logoUrl={dbSchool?.logoUrl || entry?.logoUrl}
        />
        {isActive && (
          <div
            title="Active conversation"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#22C55E",
              border: "2px solid #141414",
            }}
          />
        )}
      </div>

      {/* School info */}
      <div className="flex-1 min-w-0">
        <h3
          className="text-[13px] md:text-[17px]"
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            color: "#FFFFFF",
            lineHeight: 1.1,
          }}
        >
          {(entry?.school || school.schoolName || "Unknown").toUpperCase()}
        </h3>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", color: "#6B6B6B" }}>
          {entry ? `${entry.city} · ${entry.conference}` : school.division || ""}
        </p>
      </div>

      {/* Net openings */}
      <div className="text-right flex-shrink-0" style={{ minWidth: 48 }}>
        <div
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "26px",
            color: getOpeningsColor(netOpenings),
            lineHeight: 1,
          }}
        >
          {netOpenings}
        </div>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "9px", color: "#6B6B6B", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          openings
        </div>
      </div>

      {/* Status badge */}
      <span
        className="flex-shrink-0"
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: status.color,
          padding: "3px 10px",
          background: status.bg,
          border: `1px solid ${status.border}`,
          borderRadius: "2px",
          minWidth: 68,
          textAlign: "center",
          boxShadow: status.label === "OPEN"
            ? "0 0 8px rgba(29,158,117,0.3)"
            : status.label === "LIMITED"
            ? "0 0 8px rgba(245,197,24,0.3)"
            : "0 0 8px rgba(226,75,74,0.3)",
        }}
      >
        {status.label}
      </span>

      {/* Star button */}
      {onStar && (
        <button
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          title={school.starred ? "Unstar" : "Star this school"}
          style={{
            background: "transparent",
            border: "none",
            padding: "7px",
            width: "36px",
            height: "36px",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: school.starred ? "#F5C518" : "#2A2A2A",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            if (!school.starred) el.style.color = "#888";
            const starEl = el.querySelector('svg');
            if (starEl) (starEl as SVGElement).style.filter = "drop-shadow(0 0 4px rgba(245,197,24,0.6))";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            if (!school.starred) el.style.color = "#2A2A2A";
            const starEl = el.querySelector('svg');
            if (starEl) (starEl as SVGElement).style.filter = "none";
          }}
        >
          <Star size={18} fill={school.starred ? "#F5C518" : "none"} stroke={school.starred ? "#F5C518" : "#2A2A2A"} strokeWidth={1.5} />
        </button>
      )}

      {/* Arrow */}
      <ChevronRight
        size={14}
        style={{ color: "#6B6B6B", flexShrink: 0, transition: "transform 0.15s, color 0.15s" }}
        className="group-hover:translate-x-0.5 group-hover:text-[#F5C518]"
      />
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [selectedSchool, setSelectedSchool] = useState<OutreachSchool | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"school" | "coach" | "roster" | "email">("school");
  const [quizOpen, setQuizOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savedQuizAnswers, setSavedQuizAnswers] = useState<Partial<QuizAnswers> | null>(null);
  const { openModal, closeModal, registerCloseCallback, unregisterCloseCallback } = useModal();

  // Stat block modal state
  const [showOpenWindowsModal, setShowOpenWindowsModal] = useState(false);
  const [showSchoolsTargetedModal, setShowSchoolsTargetedModal] = useState(false);

  // Welcome overlay: show once for new users (hasSeenWelcome=false AND account <24h old)
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (!user) return;
    if (user.hasSeenWelcome) return;
    const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
    const ageMs = Date.now() - createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (ageMs <= twentyFourHours) {
      setShowWelcome(true);
    }
  }, [user]);

  // Walkthrough overlay: show for users who haven't seen it yet
  const [location] = useLocation();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [welcomeJustClosed, setWelcomeJustClosed] = useState(false);

  // Track when welcome modal is dismissed
  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    setWelcomeJustClosed(true);
  };
  useEffect(() => {
    if (!user) return;
    // Only show on /dashboard route
    if (location !== '/dashboard') return;
    // Do not show while welcome modal is open
    if (showWelcome) return;
    if (user.hasSeenWalkthrough) return;

    // If welcome was just closed, use 600ms delay; otherwise use 500ms
    const delay = welcomeJustClosed ? 600 : 500;
    const timer = setTimeout(() => {
      setShowWalkthrough(true);
      setWelcomeJustClosed(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [user, showWelcome, location, welcomeJustClosed]);

  const completeWalkthrough = trpc.auth.completeWalkthrough.useMutation();
  const handleWalkthroughDone = () => {
    setShowWalkthrough(false);
    completeWalkthrough.mutate();
  };

  useEffect(() => {
    registerCloseCallback(() => setSelectedSchool(null));
    return () => unregisterCloseCallback();
  }, [registerCloseCallback, unregisterCloseCallback]);

  // Fetch outreach list
  const { data: outreachList = [], refetch: refetchOutreach } = trpc.outreach.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Fetch all volleyball schools for full school data lookup
  const { data: allSchoolsData = [] } = trpc.volleyball.schools.useQuery();
  // Fetch subscription status
  const { data: subStatus } = trpc.subscription.status.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Fetch athlete profile to get firstName, positions, and grad year
  const { data: athleteProfile } = trpc.athleteProfile.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // ─── Openings mode: ALL vs MY POSITION ──────────────────────────────────────
  const [openingsMode, setOpeningsMode] = useState<"all" | "position">("position");

  // Parse positions from athlete profile (stored as JSON array or plain string)
  const userPositions = useMemo(() => {
    if (!athleteProfile?.positions) return [];
    try {
      const parsed = JSON.parse(athleteProfile.positions);
      if (Array.isArray(parsed)) return parsed as string[];
      return [athleteProfile.positions];
    } catch {
      return athleteProfile.positions ? [athleteProfile.positions] : [];
    }
  }, [athleteProfile?.positions]);

  // User's graduation year from their profile (string like "2027")
  const userGradYear = useMemo(() => athleteProfile?.graduationYear || "", [athleteProfile?.graduationYear]);

  // ─── Single source of truth: openingCounts (athlete-specific, deduplicated) ───
  // Uses the athlete's real grad year and positions from their profile on the server.
  const { data: openingCountsRaw = {} } = trpc.volleyball.openingCounts.useQuery(
    undefined,
    { enabled: true }
  );

  // openingCounts is now Record<string, { total, atPosition }> from the server
  const openingCounts = useMemo(() => {
    const map: Record<string, { total: number; atPosition: number }> = {};
    for (const [id, data] of Object.entries(openingCountsRaw)) {
      if (data && typeof data === "object" && "total" in data) {
        map[id] = data as { total: number; atPosition: number };
      }
    }
    return map;
  }, [openingCountsRaw]);

  // Resolve a single number from openingCounts based on the current openingsMode
  const activeOpeningCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [id, data] of Object.entries(openingCounts)) {
      map[id] = openingsMode === "position" ? data.atPosition : data.total;
    }
    return map;
  }, [openingCounts, openingsMode]);

  // DB-backed grad year for SchoolDetailModal (falls back to localStorage for backward compat)
  // NOTE: must NOT depend on selectedSchool - we need the value ready before the modal opens
  const athleteGradYear = useMemo(() => {
    return athleteProfile?.graduationYear || getStoredGradYear() || "";
  }, [athleteProfile?.graduationYear]);

  const isPro = subStatus?.hasPaidAccess ?? false;

  // ─── Filter / Sort / Star state ─────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterDivisions, setFilterDivisions] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<string>("");
  const [filterHasRoster, setFilterHasRoster] = useState(false);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"openings_desc" | "openings_asc" | "az" | "za" | "recent" | "starred">("openings_desc");

  // Close filter panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // Toggle star mutation
  const toggleStarMutation = trpc.outreach.toggleStar.useMutation({
    onMutate: async ({ schoolId }) => {
      // Optimistic update
      await utils.outreach.list.cancel();
      const prev = utils.outreach.list.getData();
      utils.outreach.list.setData(undefined, (old) =>
        old ? old.map((s) => s.schoolId === schoolId ? { ...s, starred: !s.starred } : s) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.outreach.list.setData(undefined, ctx.prev);
    },
    onSettled: () => {
      utils.outreach.list.invalidate();
    },
  });

  // Remove school mutation
  const removeMutation = trpc.outreach.remove.useMutation({
    onSuccess: () => {
      refetchOutreach();
      setSelectedSchool(null);
      toast.success("School removed from your list.");
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Onboarding overlay logic: show once for new users with zero schools
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const dismissed = localStorage.getItem(`recruitpath_onboarding_dismissed_${user?.id}`);
    if (dismissed) return;
    // Wait for outreach list to load before deciding
    // We check after a short delay to let the query settle
    const timer = setTimeout(() => {
      const storedAnswers = localStorage.getItem(QUIZ_ANSWERS_KEY);
      const quizCompleted = localStorage.getItem(QUIZ_COMPLETED_KEY);
      if (storedAnswers && quizCompleted) {
        // User completed quiz before signing up — skip onboarding, answers will pre-fill quiz
        setSavedQuizAnswers(JSON.parse(storedAnswers));
      } else {
        setShowOnboarding(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, authLoading, user?.id]);

  function dismissOnboarding() {
    setShowOnboarding(false);
    if (user?.id) {
      localStorage.setItem(`recruitpath_onboarding_dismissed_${user.id}`, "1");
    }
  }

  function startOnboardingQuiz() {
    dismissOnboarding();
    setQuizOpen(true);
  }

  // Compute stats
  const openWindows = useMemo(() => {
    return outreachList.filter((s) => {
      const liveCount = activeOpeningCounts[s.schoolId];
      if (liveCount != null) return liveCount > 0;
      const gap = getGapForSchool(s);
      return gap && gap.netOpenings > 0;
    }).length;
  }, [outreachList, activeOpeningCounts]);

  const { data: gmailStatus } = trpc.gmail.status.useQuery();
  // Use the sentEmails table count as the authoritative EMAILS SENT number
  const { data: emailsSentCount } = trpc.outreachTracker.emailsSentCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const emailsSent = emailsSentCount ?? gmailStatus?.emailsSent ?? 0;

  // Active school IDs (response_received, conversation_ongoing, visit_scheduled, offer_received)
  const { data: activeSchoolIds = [] } = trpc.outreachTracker.activeSchoolIds.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const activeSchoolIdSet = useMemo(() => new Set(activeSchoolIds), [activeSchoolIds]);

  // All school IDs where user has sent at least one email (for Schools Targeted modal)
  const { data: sentSchoolIds = [] } = trpc.outreachTracker.sentSchoolIds.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const sentSchoolIdSet = useMemo(() => new Set(sentSchoolIds), [sentSchoolIds]);

  const schoolsTargeted = outreachList.length;

  const profileStrength = useMemo(() => {
    if (!user) return 0;
    let score = 20;
    if (user.name) score += 20;
    if (user.email) score += 20;
    if (schoolsTargeted > 0) score += 20;
    if (schoolsTargeted >= 5) score += 20;
    return Math.min(score, 100);
  }, [user, schoolsTargeted]);

  const nextAction = useMemo(() => {
    if (schoolsTargeted === 0) return "Start by adding your target schools to build your outreach list.";
    if (openWindows === 0) return "No open roster windows found yet. Try adding more schools or different positions.";
    return `Keep going — ${openWindows} open window${openWindows > 1 ? "s" : ""} still available at your target schools.`;
  }, [schoolsTargeted, openWindows]);

  // Unique states from the user's outreach list (for state filter dropdown)
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    outreachList.forEach((s) => {
      const db = allSchoolsData.find((d) => d.id === s.schoolId);
      if (db?.state) states.add(db.state);
    });
    return Array.from(states).sort();
  }, [outreachList, allSchoolsData]);

  // Check if any filter is active
  const hasActiveFilter = filterDivisions.length > 0 || filterState !== "" || filterHasRoster || filterStarredOnly;

  // Filtered + sorted outreach list
  const displayedSchools = useMemo(() => {
    let list = [...outreachList];

    // Apply filters
    if (filterDivisions.length > 0) {
      list = list.filter((s) => {
        const db = allSchoolsData.find((d) => d.id === s.schoolId);
        const div = db?.division || s.division || "";
        return filterDivisions.some((fd) => div.toLowerCase().includes(fd.toLowerCase()));
      });
    }
    if (filterState) {
      list = list.filter((s) => {
        const db = allSchoolsData.find((d) => d.id === s.schoolId);
        return db?.state === filterState;
      });
    }
    if (filterHasRoster) {
      list = list.filter((s) => {
        const db = allSchoolsData.find((d) => d.id === s.schoolId);
        return db?.hasRosterData;
      });
    }
    if (filterStarredOnly) {
      list = list.filter((s) => s.starred);
    }

    // Apply sort
    const getOpenings = (s: typeof list[0]) => activeOpeningCounts[s.schoolId] ?? getGapForSchool(s)?.netOpenings ?? 0;
    switch (sortMode) {
      case "openings_desc": list.sort((a, b) => getOpenings(b) - getOpenings(a)); break;
      case "openings_asc": list.sort((a, b) => getOpenings(a) - getOpenings(b)); break;
      case "az": list.sort((a, b) => (a.schoolName || "").localeCompare(b.schoolName || "")); break;
      case "za": list.sort((a, b) => (b.schoolName || "").localeCompare(a.schoolName || "")); break;
      case "recent": list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "starred": list.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)); break;
    }

    return list;
  }, [outreachList, allSchoolsData, activeOpeningCounts, filterDivisions, filterState, filterHasRoster, filterStarredOnly, sortMode]);

  // Split into starred and non-starred groups
  const starredSchools = useMemo(() => displayedSchools.filter((s) => s.starred), [displayedSchools]);
  const nonStarredSchools = useMemo(() => displayedSchools.filter((s) => !s.starred), [displayedSchools]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "20px", color: "#6B6B6B", letterSpacing: "0.1em" }}>
          LOADING...
        </div>
      </div>
    );
  }

  // Use firstName from athlete profile if available, otherwise fall back to email or default
  const firstName = athleteProfile?.firstName || user?.email?.split("@")[0] || "ATHLETE";

  return (
    <>
    <div className="min-h-screen pb-8 md:pb-8 pb-24 dashboard-fade-in" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1628 50%, #0a1020 100%)" }}>
      {/* Main content column */}
      <div className="mx-auto" style={{ maxWidth: 860, paddingTop: "clamp(24px, 5vw, 64px)", paddingLeft: "clamp(16px, 4vw, 40px)", paddingRight: "clamp(16px, 4vw, 40px)" }}>

        {/* ── SECTION 1: HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mb-14"
        >
          {/* HOW IT WORKS link */}
          <div className="flex items-center justify-end mb-6">
            {/* Persistent HOW IT WORKS link */}
            <Link href="/how-it-works">
              <span
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  color: "#6B6B6B",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F5C518")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
              >
                HOW IT WORKS →
              </span>
            </Link>
          </div>

          {/* Two-line headline */}
          <h1 style={{ fontFamily: "Bebas Neue, sans-serif", lineHeight: 0.95, marginBottom: "16px" }}>
            <span className="block text-[28px] md:text-[clamp(28px,8vw,80px)]" style={{ color: "#6B6B6B" }}>
              YOUR MOVE,
            </span>
            <span className="block text-[36px] md:text-[clamp(28px,8vw,80px)]" style={{ color: "#F5C518" }}>
              {firstName.toUpperCase()}.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#94A3B8", lineHeight: 1.5 }}>
            You have{" "}
            <span style={{ color: "#22C55E", fontWeight: 600, textShadow: "0 0 12px rgba(245,197,24,0.6)" }}>{openWindows}</span>{" "}
            open roster window{openWindows !== 1 ? "s" : ""} at your target schools
            {userPositions.length > 0 ? (
              <> at your position{userPositions.length > 1 ? "s" : ""}</>
            ) : null}.
          </p>
        </motion.div>

        {/* ── SECTION 2: STATS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 md:mb-14"
          data-walkthrough="stat-blocks"
        >
          {/* OPEN WINDOWS — opens modal */}
          <StatBlock
            value={openWindows}
            label="OPEN WINDOWS"
            onClick={() => setShowOpenWindowsModal(true)}
          />
          {/* EMAILS SENT — navigates to /outreach */}
          <StatBlock
            value={emailsSent}
            label="EMAILS SENT"
            onClick={() => navigate("/outreach")}
          />
          {/* SCHOOLS TARGETED — opens modal */}
          <StatBlock
            value={schoolsTargeted}
            label="SCHOOLS TARGETED"
            onClick={() => setShowSchoolsTargetedModal(true)}
          />
          {/* PROFILE STRENGTH — navigates to /profile */}
          <StatBlock
            value={`${profileStrength}%`}
            label="PROFILE STRENGTH"
            onClick={() => navigate("/profile")}
          />
        </motion.div>

        {/* ── SECTION 3: NEXT ACTION BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between gap-3 mb-8 md:mb-14"
          style={{
            background: "rgba(245,197,24,0.05)",
            border: "1px solid rgba(245,197,24,0.25)",
            borderRadius: "4px",
            padding: "clamp(14px, 3vw, 22px) clamp(14px, 3vw, 28px)",
          }}
        >
          <div className="flex-1 min-w-0">
            <span
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: "#F5C518",
                display: "block",
                marginBottom: "4px",
              }}
            >
              NEXT STEP
            </span>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(13px, 2vw, 14px)", color: "#F8FAFC", lineHeight: 1.5 }}>
              {nextAction}
            </p>
          </div>
          <Link href="/schools">
            <button
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "13px",
                letterSpacing: "0.08em",
                background: "linear-gradient(135deg, #F5C518 0%, #FFD700 100%)",
                color: "#0A0A0A",
                border: "none",
                borderRadius: "4px",
                padding: "10px 18px",
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 20px rgba(245,197,24,0.35)",
                transition: "box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(245,197,24,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(245,197,24,0.35)"; }}
            >
              ADD SCHOOLS <ArrowRight size={13} />
            </button>
          </Link>
        </motion.div>

        {/* ── SECTION 4: TARGET SCHOOLS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          data-walkthrough="target-schools"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-[10px]">
            <span
              className="text-[13px] md:text-[12px]"
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                letterSpacing: "0.15em",
                color: "#6B6B6B",
                paddingBottom: "6px",
                borderBottom: "1px solid",
                borderImage: "linear-gradient(90deg, rgba(245,197,24,0.5) 0%, transparent 100%) 1",
              }}
            >
              TARGET SCHOOLS
            </span>
            <Link href="/schools">
              <button
                className="flex items-center gap-1.5"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  color: "#F5C518",
                  background: "transparent",
                  border: "1px solid rgba(245,197,24,0.3)",
                  borderRadius: "4px",
                  padding: "5px 12px",
                  cursor: "pointer",
                }}
              >
                <Plus size={12} /> ADD SCHOOLS
              </button>
            </Link>
          </div>

          {/* Mobile FILTER pill button — only on mobile */}
          {outreachList.length > 0 && (
            <div className="flex md:hidden items-center justify-between mb-4">
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#6B6B6B" }}>
                {displayedSchools.length} of {outreachList.length} schools
              </span>
              <button
                onClick={() => setMobileFilterSheetOpen(true)}
                className="flex items-center gap-1.5"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  color: hasActiveFilter ? "#F5C518" : "#FFFFFF",
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: `1px solid ${hasActiveFilter ? "rgba(245,197,24,0.4)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: "999px",
                  padding: "8px 18px",
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={13} />
                FILTER{hasActiveFilter ? " •" : ""}
              </button>
            </div>
          )}

          {/* Filter / Sort bar */}
          {outreachList.length > 0 && (
            <div className="hidden md:flex items-center justify-between mb-4" style={{ gap: "8px" }}>
              {/* Results count */}
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#6B6B6B" }}>
                Showing {displayedSchools.length} of {outreachList.length} schools
              </span>

              <div className="flex items-center gap-2">
                {/* ALL OPENINGS / MY POSITION toggle */}
                <div className="flex items-center" style={{ gap: "2px", background: "#0A0A0A", border: "1px solid #2A2A2A", borderRadius: "6px", padding: "2px" }}>
                  {(["all", "position"] as const).map((mode) => {
                    const label = mode === "all" ? "ALL OPENINGS" : "MY POSITION";
                    const isActive = openingsMode === mode;
                    const noPositions = mode === "position" && userPositions.length === 0;
                    return (
                      <div key={mode} className="relative group">
                        <button
                          onClick={() => {
                            if (!noPositions) setOpeningsMode(mode);
                          }}
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.08em",
                            background: isActive ? "#F5C518" : "#1A1A1A",
                            border: `1px solid ${isActive ? "#F5C518" : "#2A2A2A"}`,
                            borderRadius: "4px",
                            color: isActive ? "#000" : "#888",
                            padding: "4px 8px",
                            cursor: noPositions ? "default" : "pointer",
                            opacity: noPositions ? 0.5 : 1,
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </button>
                        {noPositions && (
                          <div style={{
                            position: "absolute",
                            bottom: "calc(100% + 6px)",
                            right: 0,
                            background: "#1A1A1A",
                            border: "1px solid #2A2A2A",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            fontSize: "11px",
                            color: "#888",
                            fontFamily: "DM Sans, sans-serif",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            opacity: 0,
                            transition: "opacity 0.15s",
                            zIndex: 50,
                          }} className="group-hover:opacity-100">
                            Add your position in your profile to use this filter
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sort dropdown */}
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    background: "#141414",
                    border: "1px solid #2A2A2A",
                    borderRadius: "4px",
                    color: "#888",
                    padding: "5px 8px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="openings_desc">MOST OPENINGS</option>
                  <option value="openings_asc">LEAST OPENINGS</option>
                  <option value="az">A–Z</option>
                  <option value="za">Z–A</option>
                  <option value="recent">MOST RECENT</option>
                  <option value="starred">STARRED FIRST</option>
                </select>

                {/* Filter button */}
                <div className="relative" ref={filterPanelRef}>
                  <button
                    onClick={() => setFilterOpen((v) => !v)}
                    className="flex items-center gap-1.5"
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      background: "#141414",
                      border: `1px solid ${hasActiveFilter ? "#F5C518" : "#2A2A2A"}`,
                      borderRadius: "4px",
                      color: hasActiveFilter ? "#F5C518" : "#888",
                      padding: "5px 10px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <Filter size={11} />
                    FILTER
                    {hasActiveFilter && (
                      <span style={{
                        position: "absolute",
                        top: "-3px",
                        right: "-3px",
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#F5C518",
                        border: "1px solid #0A0E1A",
                      }} />
                    )}
                  </button>

                  {/* Filter panel */}
                  {filterOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        zIndex: 100,
                        background: "#1A1A1A",
                        border: "1px solid #2A2A2A",
                        borderRadius: "12px",
                        padding: "20px",
                        minWidth: "240px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                      }}
                    >
                      {/* Division */}
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#6B6B6B", marginBottom: "8px" }}>DIVISION</div>
                        {["D1", "D2", "D3", "NAIA", "CC"].map((div) => (
                          <label key={div} className="flex items-center gap-2" style={{ cursor: "pointer", marginBottom: "6px" }}>
                            <input
                              type="checkbox"
                              checked={filterDivisions.includes(div)}
                              onChange={(e) => {
                                if (e.target.checked) setFilterDivisions((prev) => [...prev, div]);
                                else setFilterDivisions((prev) => prev.filter((d) => d !== div));
                              }}
                              style={{ accentColor: "#F5C518", cursor: "pointer" }}
                            />
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CCC" }}>{div}</span>
                          </label>
                        ))}
                      </div>

                      {/* State */}
                      {uniqueStates.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#6B6B6B", marginBottom: "8px" }}>STATE</div>
                          <select
                            value={filterState}
                            onChange={(e) => setFilterState(e.target.value)}
                            style={{
                              width: "100%",
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "13px",
                              background: "#111",
                              border: "1px solid #333",
                              borderRadius: "6px",
                              color: "#CCC",
                              padding: "6px 8px",
                              outline: "none",
                            }}
                          >
                            <option value="">All states</option>
                            {uniqueStates.map((st) => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Toggles */}
                      <div style={{ marginBottom: "16px" }}>
                        <label className="flex items-center gap-2" style={{ cursor: "pointer", marginBottom: "8px" }}>
                          <input
                            type="checkbox"
                            checked={filterHasRoster}
                            onChange={(e) => setFilterHasRoster(e.target.checked)}
                            style={{ accentColor: "#F5C518", cursor: "pointer" }}
                          />
                          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CCC" }}>Only schools with roster data</span>
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={filterStarredOnly}
                            onChange={(e) => setFilterStarredOnly(e.target.checked)}
                            style={{ accentColor: "#F5C518", cursor: "pointer" }}
                          />
                          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CCC" }}>Only starred schools</span>
                        </label>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between" style={{ borderTop: "1px solid #2A2A2A", paddingTop: "12px" }}>
                        <button
                          onClick={() => {
                            setFilterDivisions([]);
                            setFilterState("");
                            setFilterHasRoster(false);
                            setFilterStarredOnly(false);
                          }}
                          style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                          CLEAR ALL
                        </button>
                        <button
                          onClick={() => setFilterOpen(false)}
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.08em",
                            background: "#F5C518",
                            color: "#0A0A0A",
                            border: "none",
                            borderRadius: "4px",
                            padding: "7px 16px",
                            cursor: "pointer",
                          }}
                        >
                          APPLY FILTERS
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* School rows */}
          {outreachList.length === 0 ? (
            <div
              className="text-center py-20"
              style={{
                background: "#141414",
                border: "1px solid #2A2A2A",
                borderRadius: "4px",
              }}
            >
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "24px",
                  color: "#6B6B6B",
                  marginBottom: "8px",
                }}
              >
                NO SCHOOLS ADDED YET
              </p>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#6B6B6B", marginBottom: "24px" }}>
                Add your target schools to start tracking roster gaps.
              </p>
              <Link href="/schools">
                <button
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                    background: "#F5C518",
                    color: "#0A0A0A",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                >
                  SELECT YOUR SCHOOLS →
                </button>
              </Link>
            </div>
          ) : displayedSchools.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: "4px" }}
            >
              <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "18px", color: "#6B6B6B" }}>NO SCHOOLS MATCH YOUR FILTERS</p>
              <button
                onClick={() => { setFilterDivisions([]); setFilterState(""); setFilterHasRoster(false); setFilterStarredOnly(false); }}
                style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#F5C518", background: "none", border: "none", cursor: "pointer", marginTop: "8px", textDecoration: "underline" }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Starred group */}
              {starredSchools.length > 0 && (
                <>
                  <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#F5C518", marginBottom: "4px", marginTop: "2px" }}>STARRED</div>
                  {starredSchools.map((school, i) => (
                    <SchoolRow
                      key={school.id}
                      school={school}
                      index={i}
                      onClick={() => { setModalInitialTab("school"); setSelectedSchool(school); openModal(); }}
                      dbSchool={allSchoolsData.find((s) => s.id === school.schoolId) || null}
                      liveOpenings={activeOpeningCounts[school.schoolId] ?? null}
                      isActive={activeSchoolIdSet.has(school.schoolId)}
                      onStar={() => toggleStarMutation.mutate({ schoolId: school.schoolId })}
                    />
                  ))}
                </>
              )}

              {/* Non-starred group */}
              {nonStarredSchools.length > 0 && (
                <>
                  {starredSchools.length > 0 && (
                    <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#444", marginBottom: "4px", marginTop: "8px" }}>ALL SCHOOLS</div>
                  )}
                  {nonStarredSchools.map((school, i) => (
                    <SchoolRow
                      key={school.id}
                      school={school}
                      index={i + starredSchools.length}
                      onClick={() => { setModalInitialTab("school"); setSelectedSchool(school); openModal(); }}
                      dbSchool={allSchoolsData.find((s) => s.id === school.schoolId) || null}
                      liveOpenings={activeOpeningCounts[school.schoolId] ?? null}
                      isActive={activeSchoolIdSet.has(school.schoolId)}
                      onStar={() => toggleStarMutation.mutate({ schoolId: school.schoolId })}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </motion.div>

      </div>

      {/* ── SCHOOL DETAIL MODAL ── */}
      {selectedSchool && (() => {
        const dbSchool = allSchoolsData.find((s) => s.id === selectedSchool.schoolId);
        return (
          <SchoolDetailModal
            school={{
              id: selectedSchool.schoolId,
              school: dbSchool?.name || selectedSchool.schoolName || "Unknown",
              city: dbSchool?.city || "",
              state: dbSchool?.state || "",
              division: dbSchool?.division || selectedSchool.division || "",
              conference: dbSchool?.conference || "",
              sport: selectedSchool.sport || "Men's Volleyball",
              coachName: dbSchool?.coachName || selectedSchool.coachName || "TBD",
              coachTitle: dbSchool?.coachTitle || "Head Coach",
              coachEmail: dbSchool?.coachEmail || "",
              athleticsDomain: dbSchool?.athleticsDomain || "",
              brandColor: dbSchool?.brandColor || "#F5C518",
              hasRosterData: !!dbSchool?.hasRosterData,
              logoUrl: dbSchool?.logoUrl || null,
            }}
            onClose={() => { setSelectedSchool(null); closeModal(); }}
            isInOutreachList={true}
            onToggleOutreach={() => { removeMutation.mutate({ schoolId: selectedSchool.schoolId }); closeModal(); }}
            athleteGradYear={athleteGradYear}
            initialTab={modalInitialTab}
          />
        );
       })()}
    </div>

    {/* ── ONBOARDING OVERLAY (first-time users) ── */}
    {showOnboarding && (
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center"
        style={{ background: "rgba(10,10,10,0.97)" }}
      >
        <div className="text-center px-6 max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "clamp(48px, 8vw, 72px)", color: "#F8FAFC", lineHeight: 1, marginBottom: "16px" }}
          >
            LET'S FIND YOUR SCHOOLS.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: "#888888", marginBottom: "36px" }}
          >
            Answer 8 quick questions and we'll match you with the right programs.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={startOnboardingQuiz}
            className="px-10 py-4 rounded-xl font-bold block mx-auto mb-5"
            style={{ background: "#F5C518", color: "#0A0A0A", fontFamily: "DM Sans, sans-serif", fontSize: "15px", letterSpacing: "0.08em", cursor: "pointer" }}
          >
            GET STARTED →
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            onClick={dismissOnboarding}
            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#555555", background: "none", border: "none", cursor: "pointer" }}
          >
            Skip for now
          </motion.button>
        </div>
      </div>
    )}

    {/* ── SCHOOL FINDER QUIZ ── */}
    <SchoolFinderQuiz
      isOpen={quizOpen}
      onClose={() => setQuizOpen(false)}
      initialAnswers={savedQuizAnswers}
      onComplete={() => {
        refetchOutreach();
        if (user?.id) {
          localStorage.setItem(`recruitpath_onboarding_dismissed_${user.id}`, "1");
        }
      }}
    />
    {/* ── MOBILE FILTER BOTTOM SHEET ── */}
    <AnimatePresence>
      {mobileFilterSheetOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] md:hidden"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileFilterSheetOpen(false)}
          />
          {/* Sheet */}
          <motion.div
            key="mobile-filter-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[160] md:hidden"
            style={{
              background: "rgba(18,18,24,0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
              paddingBottom: "max(24px, env(safe-area-inset-bottom))",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "16px", letterSpacing: "0.1em", color: "#FFFFFF", marginBottom: "20px" }}>FILTER &amp; SORT</div>

              {/* Openings mode */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#6B6B6B", marginBottom: "8px" }}>OPENINGS</div>
                <div className="flex gap-2">
                  {(["all", "position"] as const).map((mode) => {
                    const label = mode === "all" ? "ALL OPENINGS" : "MY POSITION";
                    const isActive = openingsMode === mode;
                    const noPositions = mode === "position" && userPositions.length === 0;
                    return (
                      <button
                        key={mode}
                        onClick={() => { if (!noPositions) setOpeningsMode(mode); }}
                        style={{
                          flex: 1,
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          background: isActive ? "#F5C518" : "#1A1A1A",
                          border: `1px solid ${isActive ? "#F5C518" : "#2A2A2A"}`,
                          borderRadius: "6px",
                          color: isActive ? "#000" : "#888",
                          padding: "8px",
                          cursor: noPositions ? "default" : "pointer",
                          opacity: noPositions ? 0.5 : 1,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#6B6B6B", marginBottom: "8px" }}>SORT BY</div>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                  style={{
                    width: "100%",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    background: "#111",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    color: "#CCC",
                    padding: "8px",
                    outline: "none",
                  }}
                >
                  <option value="openings_desc">MOST OPENINGS</option>
                  <option value="openings_asc">LEAST OPENINGS</option>
                  <option value="az">A–Z</option>
                  <option value="za">Z–A</option>
                  <option value="recent">MOST RECENT</option>
                  <option value="starred">STARRED FIRST</option>
                </select>
              </div>

              {/* Division */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "#6B6B6B", marginBottom: "8px" }}>DIVISION</div>
                <div className="flex gap-2 flex-wrap">
                  {["D1", "D2", "D3", "NAIA", "CC"].map((div) => (
                    <button
                      key={div}
                      onClick={() => {
                        if (filterDivisions.includes(div)) setFilterDivisions((prev) => prev.filter((d) => d !== div));
                        else setFilterDivisions((prev) => [...prev, div]);
                      }}
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        background: filterDivisions.includes(div) ? "#F5C518" : "#1A1A1A",
                        border: `1px solid ${filterDivisions.includes(div) ? "#F5C518" : "#2A2A2A"}`,
                        borderRadius: "6px",
                        color: filterDivisions.includes(div) ? "#000" : "#888",
                        padding: "6px 14px",
                        cursor: "pointer",
                      }}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ marginBottom: "16px" }}>
                <label className="flex items-center gap-2" style={{ cursor: "pointer", marginBottom: "8px" }}>
                  <input type="checkbox" checked={filterHasRoster} onChange={(e) => setFilterHasRoster(e.target.checked)} style={{ accentColor: "#F5C518", cursor: "pointer" }} />
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CCC" }}>Only schools with roster data</span>
                </label>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={filterStarredOnly} onChange={(e) => setFilterStarredOnly(e.target.checked)} style={{ accentColor: "#F5C518", cursor: "pointer" }} />
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#CCC" }}>Only starred schools</span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                <button
                  onClick={() => { setFilterDivisions([]); setFilterState(""); setFilterHasRoster(false); setFilterStarredOnly(false); }}
                  style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  CLEAR ALL
                </button>
                <button
                  onClick={() => setMobileFilterSheetOpen(false)}
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                    background: "#F5C518",
                    color: "#0A0A0A",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 24px",
                    cursor: "pointer",
                  }}
                >
                  APPLY FILTERS
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* ── WELCOME OVERLAY (new users only, one-time) ── */}
    {showWelcome && (
      <WelcomeOverlay onDismiss={handleWelcomeDismiss} />
    )}

    {/* ── APP WALKTHROUGH (first-time users, one-time) ── */}
    {showWalkthrough && (
      isMobile ? (
        <MobileWalkthrough
          onComplete={handleWalkthroughDone}
          onSkip={handleWalkthroughDone}
        />
      ) : (
        <AppWalkthrough
          onComplete={handleWalkthroughDone}
          onSkip={handleWalkthroughDone}
        />
      )
    )}

    {/* ── OPEN WINDOWS MODAL ── */}
    <AnimatePresence>
      {showOpenWindowsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowOpenWindowsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              margin: "0 16px",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #2A2A2A", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "22px", color: "#FFFFFF", letterSpacing: "0.05em" }}>OPEN ROSTER WINDOWS</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", marginTop: 4 }}>Schools with the most openings at your position{userPositions.length > 1 ? "s" : ""} — email these first.</div>
              </div>
              <button
                onClick={() => setShowOpenWindowsModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B6B", padding: 4, flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 24px" }}>
              {outreachList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#6B6B6B", fontFamily: "DM Sans, sans-serif", fontSize: "14px" }}>
                  No schools added yet. Add schools to see roster windows.
                </div>
              ) : (() => {
                // Sort by openings descending, schools with no data at bottom
                const withData = outreachList
                  .map((s) => {
                    const liveCount = activeOpeningCounts[s.schoolId];
                    const gap = getGapForSchool(s);
                    const openings = liveCount != null ? liveCount : (gap?.netOpenings ?? null);
                    const dbSchool = allSchoolsData.find((d) => d.id === s.schoolId);
                    return { ...s, openings, dbSchool };
                  })
                  .sort((a, b) => {
                    if (a.openings == null && b.openings == null) return 0;
                    if (a.openings == null) return 1;
                    if (b.openings == null) return -1;
                    return b.openings - a.openings;
                  });
                return withData.map((s, idx) => (
                  <div
                    key={s.schoolId || `roster-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderBottom: "1px solid #2A2A2A",
                    }}
                  >
                    <SchoolLogoImg
                      name={s.schoolName || s.schoolId}
                      athleticsDomain={s.dbSchool?.athleticsDomain}
                      logoUrl={s.dbSchool?.logoUrl}
                      brandColor={s.dbSchool?.brandColor}
                      size={40}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#FFFFFF", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.schoolName || s.schoolId}
                      </div>
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#6B6B6B", marginTop: 2 }}>
                        {s.division || s.dbSchool?.division || ""}
                      </div>
                    </div>
                    {s.openings != null ? (
                      <div style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: 6, padding: "4px 10px", fontFamily: "Bebas Neue, sans-serif", fontSize: "13px", color: "#F5C518", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                        {s.openings} OPEN
                      </div>
                    ) : (
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#4A4A4A", fontStyle: "italic" }}>Roster data coming soon</div>
                    )}
                    <button
                      onClick={() => {
                        setShowOpenWindowsModal(false);
                        const school = outreachList.find((o) => o.schoolId === s.schoolId);
                        if (school) { setModalInitialTab("school"); setSelectedSchool(school); openModal(); }
                      }}
                      style={{ background: "none", border: "1px solid #3A3A3A", borderRadius: 6, padding: "5px 10px", fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#888888", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.05em" }}
                    >
                      VIEW →
                    </button>
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── SCHOOLS TARGETED MODAL ── */}
    <AnimatePresence>
      {showSchoolsTargetedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowSchoolsTargetedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              margin: "0 16px",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #2A2A2A", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "22px", color: "#FFFFFF", letterSpacing: "0.05em" }}>YOUR TARGET SCHOOLS</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", marginTop: 4 }}>Track which programs you've reached out to.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <Link href="/schools">
                  <button
                    onClick={() => setShowSchoolsTargetedModal(false)}
                    style={{ background: "#F5C518", border: "none", borderRadius: 6, padding: "6px 12px", fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#0A0A0A", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", whiteSpace: "nowrap" }}
                  >
                    ADD MORE SCHOOLS →
                  </button>
                </Link>
                <button
                  onClick={() => setShowSchoolsTargetedModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B6B", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 24px" }}>
              {outreachList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#6B6B6B", fontFamily: "DM Sans, sans-serif", fontSize: "14px" }}>
                  No schools added yet.
                </div>
              ) : (() => {
                // Sort: no email sent first (action items at top), then email sent
                const sorted = [...outreachList].sort((a, b) => {
                  const aHasEmail = sentSchoolIdSet.has(a.schoolId);
                  const bHasEmail = sentSchoolIdSet.has(b.schoolId);
                  if (!aHasEmail && bHasEmail) return -1;
                  if (aHasEmail && !bHasEmail) return 1;
                  return 0;
                });
                return sorted.map((s, idx) => {
                  const dbSchool = allSchoolsData.find((d) => d.id === s.schoolId);
                  const hasSent = sentSchoolIdSet.has(s.schoolId);
                  return (
                    <div
                      key={s.schoolId || `email-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 0",
                        borderBottom: "1px solid #2A2A2A",
                      }}
                    >
                      <SchoolLogoImg
                        name={s.schoolName || s.schoolId}
                        athleticsDomain={dbSchool?.athleticsDomain}
                        logoUrl={dbSchool?.logoUrl}
                        brandColor={dbSchool?.brandColor}
                        size={40}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#FFFFFF", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.schoolName || s.schoolId}
                        </div>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#6B6B6B", marginTop: 2 }}>
                          {s.division || dbSchool?.division || ""}
                        </div>
                      </div>
                      {hasSent ? (
                        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "4px 12px", fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#22C55E", fontWeight: 600, whiteSpace: "nowrap" }}>
                          EMAIL SENT ✓
                        </div>
                      ) : (
                        <div style={{ background: "rgba(107,107,107,0.1)", border: "1px solid rgba(107,107,107,0.2)", borderRadius: 20, padding: "4px 12px", fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#6B6B6B", whiteSpace: "nowrap" }}>
                          NO EMAIL YET
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AppFooter />
    </>
  );
}
