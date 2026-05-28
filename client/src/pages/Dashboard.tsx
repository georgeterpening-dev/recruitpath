/*
 * RecruitPath — Dashboard Page
 * Design: Unified UI — matches Schools/Profile/Emails design system exactly
 * Colors: #0A0E1A bg, #141414 cards, #1E2A42 borders, #F5C518 gold, #6B6B6B muted
 * Fonts: Bebas Neue headlines, DM Sans body
 * Features: Live stats, target schools with gap analysis, full-screen school detail modal
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronRight, X, Copy, Check, ArrowRight, Plus, RefreshCw, Lock, Mail, Eye, EyeOff, ChevronDown } from "lucide-react";
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
import OutreachTracker from "@/components/OutreachTracker";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import AppTopNav from "@/components/AppTopNav";
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
        background: "#131829",
        border: hovered ? "1.5px solid rgba(245,197,24,0.5)" : "1px solid #1E2A42",
        borderRadius: "10px",
        padding: "20px 16px",
        cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 6px 24px rgba(245, 197, 24, 0.12)" : "0 2px 12px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: "40px",
          color: "#FFFFFF",
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          color: "#8B9BB8",
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
  if (!gap) return { label: "UNKNOWN", color: "#8B9BB8", bg: "rgba(107,107,107,0.1)", border: "rgba(107,107,107,0.3)" };
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
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1E2A42" strokeWidth="6" />
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
        <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: size * 0.25, color }}>
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
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(0,0,0,0.72)" }}
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
            background: "#131829",
            border: "1px solid #1E2A42",
            borderRadius: "20px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MODAL HEADER (non-scrollable) ── */}
          <div
            className="flex-shrink-0 p-7"
            style={{ borderBottom: "1px solid #1E2A42" }}
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
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "clamp(22px, 4vw, 32px)",
                      color: "#FFFFFF",
                      lineHeight: 1,
                      marginBottom: "4px",
                    }}
                  >
                    {(entry?.school || school.schoolName || "Unknown").toUpperCase()}
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8B9BB8" }}>
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
                  background: "#181E32",
                  border: "1px solid #1E2A42",
                  borderRadius: "50%",
                  color: "#8B9BB8",
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
                  fontFamily: "Barlow Condensed, sans-serif",
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
                    fontFamily: "Barlow Condensed, sans-serif",
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
                    fontFamily: "Barlow Condensed, sans-serif",
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
                  background: "#181E32",
                  border: "1px solid #1E2A42",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#8B9BB8",
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
                      style={{ borderBottom: "1px solid #1E2A42", paddingBottom: "20px", marginBottom: "16px" }}
                    >
                      <div className="text-center" style={{ borderRight: "1px solid #1E2A42" }}>
                        <div
                          style={{
                            fontFamily: "Barlow Condensed, sans-serif",
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
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "#8B9BB8",
                            textTransform: "uppercase",
                          }}
                        >
                          Graduating
                        </div>
                      </div>
                      <div className="text-center" style={{ borderRight: "1px solid #1E2A42" }}>
                        <div
                          style={{
                            fontFamily: "Barlow Condensed, sans-serif",
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
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "#8B9BB8",
                            textTransform: "uppercase",
                          }}
                        >
                          Commits Filling Spots
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          style={{
                            fontFamily: "Barlow Condensed, sans-serif",
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
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "#8B9BB8",
                            textTransform: "uppercase",
                          }}
                        >
                          Real Openings
                        </div>
                      </div>
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#94A3B8", lineHeight: 1.6 }}>
                      {gap.reason}
                    </p>
                  </>
                ) : (
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8" }}>
                    No roster data available for this school yet.
                  </p>
                )}
              </div>

              {/* ── SECTION 2: MATCH SCORE ── */}
              {gap && (
                <div
                  style={{
                    background: "#181E32",
                    border: "1px solid #1E2A42",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      color: "#8B9BB8",
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
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "22px",
                          color: "#FFFFFF",
                          lineHeight: 1.2,
                          marginBottom: "8px",
                        }}
                      >
                        {gap.matchScore >= 60 ? "STRONG OPPORTUNITY" : gap.matchScore >= 30 ? "LIMITED OPENING" : "POSITION FILLED"}
                      </p>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8", lineHeight: 1.6 }}>
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
                  background: "#181E32",
                  border: "1px solid #1E2A42",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#8B9BB8",
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
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "18px",
                      color: "#090D18",
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
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "18px",
                        color: "#FFFFFF",
                        lineHeight: 1.1,
                      }}
                    >
                      {(entry?.coachName || school.coachName || "Head Coach").toUpperCase()}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
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
                            fontFamily: "Inter, sans-serif",
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
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "14px",
                      letterSpacing: "0.08em",
                      background: isGenerating ? "rgba(245,197,24,0.4)" : "#F5C518",
                      color: "#090D18",
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
                        background: "#0C1020",
                        border: "1px solid #1E2A42",
                        borderRadius: "8px",
                        padding: "14px 16px",
                        fontFamily: "Inter, sans-serif",
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
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.08em",
                          background: "#F5C518",
                          color: "#090D18",
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
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.08em",
                          background: "transparent",
                          color: "#8B9BB8",
                          border: "1px solid #1E2A42",
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
                  background: "#181E32",
                  border: "1px solid #1E2A42",
                  borderRadius: "12px",
                  padding: "24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#8B9BB8",
                    marginBottom: "20px",
                  }}
                >
                  ROSTER INTEL
                </p>

                {/* Content (blurred for free users) */}
                <div style={{ filter: isPro ? "none" : "blur(6px)", pointerEvents: isPro ? "auto" : "none", userSelect: isPro ? "auto" : "none" }}>
                  {rosterAtPosition.length > 0 ? (
                    <div className="mb-5">
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8", letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase" }}>
                        Current {athletePosition}s on Roster
                      </p>
                      <div className="flex flex-col gap-2">
                        {rosterAtPosition.map((player: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                            style={{
                              background: "#0C1020",
                              border: "1px solid #1E2A42",
                              borderRadius: "6px",
                              padding: "10px 14px",
                            }}
                          >
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F8FAFC" }}>
                              {player.name}
                            </span>
                            <span
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: player.graduationYear === 2026 ? "#EF4444" : "#8B9BB8",
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
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8", marginBottom: "16px" }}>
                      No current {athletePosition}s on roster.
                    </p>
                  )}

                  {commitsAtPosition.length > 0 && (
                    <div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8", letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase" }}>
                        Committed Recruits at {athletePosition}
                      </p>
                      <div className="flex flex-col gap-2">
                        {commitsAtPosition.map((commit: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                            style={{
                              background: "#0C1020",
                              border: "1px solid rgba(245,197,24,0.2)",
                              borderRadius: "6px",
                              padding: "10px 14px",
                            }}
                          >
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F8FAFC" }}>
                              {commit.name}
                            </span>
                            <span
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
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
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8" }}>
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
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "16px",
                        letterSpacing: "0.08em",
                        color: "#FFFFFF",
                        marginBottom: "8px",
                        textAlign: "center",
                      }}
                    >
                      GET FULL ACCESS TO SEE ROSTER INTEL
                    </p>
                    <Link href="/pricing">
                      <button
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.08em",
                          background: "#F5C518",
                          color: "#090D18",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        GET FULL ACCESS — $49.99 <ArrowRight size={13} />
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
            style={{ borderTop: "1px solid #1E2A42" }}
          >
            <button
              onClick={emailGenerated ? () => { setEmailGenerated(null); handleGenerateEmail(); } : handleGenerateEmail}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 flex-1"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "14px",
                letterSpacing: "0.08em",
                background: isGenerating ? "rgba(245,197,24,0.4)" : "#F5C518",
                color: "#090D18",
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
                fontFamily: "Barlow Condensed, sans-serif",
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
}: {
  school: OutreachSchool;
  index: number;
  onClick: () => void;
  dbSchool?: { name: string; athleticsDomain: string | null; brandColor: string | null; city: string | null; conference: string | null; logoUrl?: string | null } | null;
  liveOpenings?: number | null;
  isActive?: boolean;
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
      className="flex items-center gap-4 cursor-pointer group"
      style={{
        background: "#131829",
        border: "1px solid #1E2A42",
        borderRadius: "10px",
        padding: "16px 20px",
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#F5C518";
        (e.currentTarget as HTMLElement).style.background = "rgba(245,197,24,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1E2A42";
        (e.currentTarget as HTMLElement).style.background = "#131829";
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
              border: "2px solid #131829",
            }}
          />
        )}
      </div>

      {/* School info */}
      <div className="flex-1 min-w-0">
        <h3
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "17px",
            color: "#FFFFFF",
            lineHeight: 1.1,
          }}
        >
          {(entry?.school || school.schoolName || "Unknown").toUpperCase()}
        </h3>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
          {entry ? `${entry.city} · ${entry.conference}` : school.division || ""}
        </p>
      </div>

      {/* Net openings */}
      <div className="text-right flex-shrink-0" style={{ minWidth: 48 }}>
        <div
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "26px",
            color: getOpeningsColor(netOpenings),
            lineHeight: 1,
          }}
        >
          {netOpenings}
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "9px", color: "#8B9BB8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          openings
        </div>
      </div>

      {/* Status badge */}
      <span
        className="flex-shrink-0"
        style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: status.color,
          padding: "3px 10px",
          background: status.bg,
          border: `1px solid ${status.border}`,
          borderRadius: "2px",
          minWidth: 68,
          textAlign: "center",
        }}
      >
        {status.label}
      </span>

      {/* Arrow */}
      <ChevronRight
        size={16}
        style={{ color: "#8B9BB8", flexShrink: 0, transition: "transform 0.15s, color 0.15s" }}
        className="group-hover:translate-x-0.5 group-hover:text-[#F5C518]"
      />
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
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

  // Read athlete's grad year from localStorage (set on Profile page).
  // Derived directly from selectedSchool so it re-reads every time a modal opens.
  const athleteGradYear = selectedSchool ? getStoredGradYear() : "";

  
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
  // Fetch live opening counts (graduating players per school) from DB
  const { data: openingCounts = {} } = trpc.volleyball.openingCounts.useQuery();

  // Fetch subscription status
  const { data: subStatus } = trpc.subscription.status.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const isPro = subStatus?.hasPaidAccess ?? false;

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
      const liveCount = openingCounts[s.schoolId];
      if (liveCount != null) return liveCount > 0;
      const gap = getGapForSchool(s);
      return gap && gap.netOpenings > 0;
    }).length;
  }, [outreachList, openingCounts]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#090D18" }}>
        <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", color: "#8B9BB8", letterSpacing: "0.1em" }}>
          LOADING...
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "ATHLETE";

  return (
    <>
    <AppTopNav />
    <div className="min-h-screen pb-8" style={{ background: "#090D18", paddingTop: "56px" }}>
      {/* Main content column */}
      <div className="mx-auto" style={{ maxWidth: 860, paddingTop: 64, paddingLeft: 40, paddingRight: 40 }}>

        {/* ── SECTION 1: HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mb-14"
        >
          {/* Campaign Active badge + HOW IT WORKS link */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "#22C55E",
                padding: "2px 10px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: "2px",
              }}
            >
              CAMPAIGN ACTIVE
            </span>
            </div>
            {/* Persistent HOW IT WORKS link */}
            <Link href="/how-it-works">
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  color: "#8B9BB8",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F5C518")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB8")}
              >
                HOW IT WORKS →
              </span>
            </Link>
          </div>

          {/* Two-line headline */}
          <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", lineHeight: 0.95, marginBottom: "16px" }}>
            <span style={{ display: "block", fontSize: "clamp(56px, 8vw, 80px)", color: "#8B9BB8" }}>
              YOUR MOVE,
            </span>
            <span style={{ display: "block", fontSize: "clamp(56px, 8vw, 80px)", color: "#F5C518" }}>
              {firstName.toUpperCase()}.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "#94A3B8", lineHeight: 1.5 }}>
            You have{" "}
            <span style={{ color: "#22C55E", fontWeight: 600 }}>{openWindows}</span>{" "}
            open roster window{openWindows !== 1 ? "s" : ""} at your target schools.
          </p>
        </motion.div>

        {/* ── SECTION 2: STATS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14"
        >
          {/* OPEN WINDOWS — opens modal */}
          <StatBlock
            value={openWindows}
            label="OPEN WINDOWS"
            onClick={() => setShowOpenWindowsModal(true)}
          />
          {/* EMAILS SENT — scrolls to outreach tracker */}
          <StatBlock
            value={emailsSent}
            label="EMAILS SENT"
            onClick={() => {
              document.getElementById("outreach-tracker")?.scrollIntoView({ behavior: "smooth" });
            }}
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
          className="flex items-center justify-between gap-4 mb-14"
          style={{
            background: "rgba(245,197,24,0.05)",
            border: "1px solid rgba(245,197,24,0.25)",
            borderRadius: "10px",
            padding: "22px 28px",
          }}
        >
          <div className="flex-1 min-w-0">
            <span
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: "#F5C518",
                display: "block",
                marginBottom: "4px",
              }}
            >
              NEXT STEP
            </span>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F8FAFC", lineHeight: 1.5 }}>
              {nextAction}
            </p>
          </div>
          <Link href="/schools">
            <button
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "13px",
                letterSpacing: "0.08em",
                background: "#F5C518",
                color: "#090D18",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
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
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <span
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "#8B9BB8",
              }}
            >
              TARGET SCHOOLS
            </span>
            <Link href="/schools">
              <button
                className="flex items-center gap-1.5"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  color: "#F5C518",
                  background: "transparent",
                  border: "1px solid rgba(245,197,24,0.3)",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  cursor: "pointer",
                }}
              >
                <Plus size={12} /> ADD SCHOOLS
              </button>
            </Link>
          </div>

          {/* School rows */}
          {outreachList.length === 0 ? (
            <div
              className="text-center py-20"
              style={{
                background: "#131829",
                border: "1px solid #1E2A42",
                borderRadius: "12px",
              }}
            >
              <p
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "24px",
                  color: "#8B9BB8",
                  marginBottom: "8px",
                }}
              >
                NO SCHOOLS ADDED YET
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8", marginBottom: "24px" }}>
                Add your target schools to start tracking roster gaps.
              </p>
              <Link href="/schools">
                <button
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                    background: "#F5C518",
                    color: "#090D18",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                >
                  SELECT YOUR SCHOOLS →
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {outreachList.map((school, i) => (
                <SchoolRow
                  key={school.id}
                  school={school}
                  index={i}
                  onClick={() => { setModalInitialTab("school"); setSelectedSchool(school); openModal(); }}
                  dbSchool={allSchoolsData.find((s) => s.id === school.schoolId) || null}
                  liveOpenings={openingCounts[school.schoolId] ?? null}
                  isActive={activeSchoolIdSet.has(school.schoolId)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── SECTION 5: OUTREACH TRACKER ── */}
        <OutreachTracker
          onFollowUp={(schoolId) => {
            const school = outreachList.find((s) => s.schoolId === schoolId);
            if (school) { setModalInitialTab("email"); setSelectedSchool(school); openModal(); }
          }}
          onSendReply={(schoolId, _subject, _body, _coachEmail) => {
            // Open the school modal on the email tab so user can send the generated reply
            const school = outreachList.find((s) => s.schoolId === schoolId);
            if (school) { setModalInitialTab("email"); setSelectedSchool(school); openModal(); }
          }}
        />

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
            style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(48px, 8vw, 72px)", color: "#F8FAFC", lineHeight: 1, marginBottom: "16px" }}
          >
            LET'S FIND YOUR SCHOOLS.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "#888888", marginBottom: "36px" }}
          >
            Answer 8 quick questions and we'll match you with the right programs.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={startOnboardingQuiz}
            className="px-10 py-4 rounded-xl font-bold block mx-auto mb-5"
            style={{ background: "#F5C518", color: "#090D18", fontFamily: "Inter, sans-serif", fontSize: "15px", letterSpacing: "0.08em", cursor: "pointer" }}
          >
            GET STARTED →
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            onClick={dismissOnboarding}
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#555555", background: "none", border: "none", cursor: "pointer" }}
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
    {/* ── WELCOME OVERLAY (new users only, one-time) ── */}
    {showWelcome && (
      <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />
    )}

    {/* ── OPEN WINDOWS MODAL ── */}
    <AnimatePresence>
      {showOpenWindowsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setShowOpenWindowsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#181E32",
              border: "1px solid #1E2A42",
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
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #1E2A42", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "22px", color: "#FFFFFF", letterSpacing: "0.05em" }}>OPEN ROSTER WINDOWS</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8", marginTop: 4 }}>Schools with the most openings at your position — email these first.</div>
              </div>
              <button
                onClick={() => setShowOpenWindowsModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9BB8", padding: 4, flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 24px" }}>
              {outreachList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8B9BB8", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                  No schools added yet. Add schools to see roster windows.
                </div>
              ) : (() => {
                // Sort by openings descending, schools with no data at bottom
                const withData = outreachList
                  .map((s) => {
                    const liveCount = openingCounts[s.schoolId];
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
                return withData.map((s) => (
                  <div
                    key={s.schoolId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderBottom: "1px solid #1E2A42",
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
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.schoolName || s.schoolId}
                      </div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8B9BB8", marginTop: 2 }}>
                        {s.division || s.dbSchool?.division || ""}
                      </div>
                    </div>
                    {s.openings != null ? (
                      <div style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: 6, padding: "4px 10px", fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", color: "#F5C518", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                        {s.openings} OPEN
                      </div>
                    ) : (
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#4A4A4A", fontStyle: "italic" }}>Roster data coming soon</div>
                    )}
                    <button
                      onClick={() => {
                        setShowOpenWindowsModal(false);
                        const school = outreachList.find((o) => o.schoolId === s.schoolId);
                        if (school) { setModalInitialTab("school"); setSelectedSchool(school); openModal(); }
                      }}
                      style={{ background: "none", border: "1px solid #3A3A3A", borderRadius: 6, padding: "5px 10px", fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#888888", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.05em" }}
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
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setShowSchoolsTargetedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#181E32",
              border: "1px solid #1E2A42",
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
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #1E2A42", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "22px", color: "#FFFFFF", letterSpacing: "0.05em" }}>YOUR TARGET SCHOOLS</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8", marginTop: 4 }}>Track which programs you've reached out to.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <Link href="/schools">
                  <button
                    onClick={() => setShowSchoolsTargetedModal(false)}
                    style={{ background: "#F5C518", border: "none", borderRadius: 6, padding: "6px 12px", fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#090D18", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", whiteSpace: "nowrap" }}
                  >
                    ADD MORE SCHOOLS →
                  </button>
                </Link>
                <button
                  onClick={() => setShowSchoolsTargetedModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9BB8", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 24px" }}>
              {outreachList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8B9BB8", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
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
                return sorted.map((s) => {
                  const dbSchool = allSchoolsData.find((d) => d.id === s.schoolId);
                  const hasSent = sentSchoolIdSet.has(s.schoolId);
                  return (
                    <div
                      key={s.schoolId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 0",
                        borderBottom: "1px solid #1E2A42",
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
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.schoolName || s.schoolId}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8B9BB8", marginTop: 2 }}>
                          {s.division || dbSchool?.division || ""}
                        </div>
                      </div>
                      {hasSent ? (
                        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "4px 12px", fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#22C55E", fontWeight: 600, whiteSpace: "nowrap" }}>
                          EMAIL SENT ✓
                        </div>
                      ) : (
                        <div style={{ background: "rgba(107,107,107,0.1)", border: "1px solid rgba(107,107,107,0.2)", borderRadius: 20, padding: "4px 12px", fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8B9BB8", whiteSpace: "nowrap" }}>
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
