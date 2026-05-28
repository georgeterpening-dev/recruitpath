/**
 * SchoolDetailModal — 3-tab modal for Men's Volleyball school details
 * Tab 1: School Info (name, division, conference, city, state)
 * Tab 2: Coach Info (name, email, phone)
 * Tab 3: Roster Gap Finder (DB-backed player data, locked for 8 schools)
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Lock, Mail, Phone, ExternalLink, Sparkles, RefreshCw, Send, ChevronDown, ChevronUp, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SchoolLogoImg from "@/components/SchoolLogo";
import { type AthleteProfile } from "@/hooks/useAthleteProfile";

const ATHLETE_PROFILE_KEY = "recruitpath_athlete_profile";
function loadAthleteProfile(): Partial<AthleteProfile> {
  try {
    const raw = localStorage.getItem(ATHLETE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

type EmailTone = "confident" | "respectful" | "energetic" | "concise";
const TONE_OPTIONS: { id: EmailTone; label: string }[] = [
  { id: "confident", label: "Confident" },
  { id: "respectful", label: "Respectful" },
  { id: "energetic", label: "Energetic" },
  { id: "concise", label: "Concise" },
];

type Tab = "school" | "coach" | "roster" | "email" | "links";

const POSITIONS = ["OH", "MB", "OPP", "S", "L", "DS"] as const;
type Position = (typeof POSITIONS)[number];

const POSITION_LABELS: Record<Position, string> = {
  OH: "Outside Hitter",
  MB: "Middle Blocker",
  OPP: "Opposite",
  S: "Setter",
  L: "Libero",
  DS: "Defensive Specialist",
};

const GRAD_YEAR_COLORS: Record<number, { color: string; bg: string; label: string }> = {
  2025: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "SR" },
  2026: { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "SR" },
  2027: { color: "#F5C518", bg: "rgba(245,197,24,0.12)", label: "JR" },
  2028: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", label: "SO" },
  2029: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "FR" },
};

function SchoolLogo({
  domain,
  brandColor,
  name,
  size = 48,
  logoUrl,
}: {
  domain: string;
  brandColor: string;
  name?: string;
  size?: number;
  logoUrl?: string | null;
}) {
  return (
    <SchoolLogoImg
      name={name || (domain ? domain.split(".")[0] : "?")}
      athleticsDomain={domain}
      logoUrl={logoUrl}
      size={size}
      brandColor={brandColor}
    />
  );
}

// ─── Roster Gap Personalized Warning Banner ─────────────────────────────────

function RosterGapBanner({ athleteGradYear }: { athleteGradYear?: string }) {
  const year = parseInt(athleteGradYear || "", 10);

  type BannerConfig = {
    icon: string;
    text: string;
    color: string;
    bg: string;
    border: string;
    isPositive?: boolean;
  };

  let config: BannerConfig | null = null;

  if (!athleteGradYear || isNaN(year)) {
    config = {
      icon: "⚠️",
      text: "Add your graduation year to your profile for personalized gap analysis.",
      color: "#888888",
      bg: "rgba(136,136,136,0.06)",
      border: "rgba(136,136,136,0.18)",
    };
  } else if (year <= 2026) {
    config = {
      icon: "⚠️",
      text: "Most rosters are already finalized for your class. The gap data below may not reflect available spots for Class of 2026.",
      color: "#F5C518",
      bg: "rgba(245,197,24,0.07)",
      border: "rgba(245,197,24,0.25)",
    };
  } else if (year === 2027) {
    config = {
      icon: "✓",
      text: "OPENINGS FOR CLASS OF 2027",
      color: "#22C55E",
      bg: "rgba(34,197,94,0.07)",
      border: "rgba(34,197,94,0.25)",
      isPositive: true,
    };
  } else if (year === 2028) {
    config = {
      icon: "⚠️",
      text: "Recruiting for Class of 2028 typically opens in your junior year. The gaps below show current openings but spots may be filled before coaches recruit your class.",
      color: "#888888",
      bg: "rgba(136,136,136,0.06)",
      border: "rgba(136,136,136,0.18)",
    };
  } else if (year >= 2029) {
    config = {
      icon: "⚠️",
      text: "It\u2019s early \u2014 coaches aren\u2019t recruiting your class yet. Use this tool to explore rosters and get familiar with programs, but gap data won\u2019t reflect your actual recruiting window.",
      color: "#888888",
      bg: "rgba(136,136,136,0.06)",
      border: "rgba(136,136,136,0.18)",
    };
  }

  if (!config) return null;

  return (
    <div
      className="flex items-start gap-2.5 mb-4"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "4px",
        padding: "10px 14px",
      }}
    >
      {config.isPositive ? (
        // Positive state: compact pill label
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "13px",
              letterSpacing: "0.12em",
              color: config.color,
            }}
          >
            {config.icon} {config.text}
          </span>
        </div>
      ) : (
        // Warning / muted state
        <>
          <span style={{ fontSize: "13px", lineHeight: 1, flexShrink: 0, marginTop: "1px" }}>
            {config.icon}
          </span>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12.5px",
              color: config.color,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {config.text}
          </p>
        </>
      )}
    </div>
  );
}

export interface SchoolModalProps {
  school: {
    id: string;
    school: string;
    city: string;
    state: string;
    division: string;
    conference: string;
    sport: string;
    coachName: string;
    coachTitle: string;
    coachEmail: string;
    athleticsDomain: string;
    brandColor: string;
    hasRosterData: boolean;
    logoUrl?: string | null;
  };
  onClose: () => void;
  isInOutreachList?: boolean;
  onToggleOutreach?: () => void;
  /** Athlete's graduation year from their profile (e.g. "2027"). Used to show
   * a contextual warning banner at the top of the Roster Gap Finder tab. */
  athleteGradYear?: string;
  /** Which tab to open first. Defaults to "school". */
  initialTab?: "school" | "coach" | "roster" | "email" | "links";
}

export default function SchoolDetailModal({
  school,
  onClose,
  isInOutreachList,
  onToggleOutreach,
  athleteGradYear,
  initialTab = "school",
}: SchoolModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showFullRoster, setShowFullRoster] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [tabFading, setTabFading] = useState(false);
  const [coachStaffExpanded, setCoachStaffExpanded] = useState(false);
  const [copiedCoachEmail, setCopiedCoachEmail] = useState<string | null>(null);

  const { data: players, isLoading: playersLoading } = trpc.volleyball.players.useQuery(
    { schoolId: school.id },
    { enabled: activeTab === "roster" && !!school.hasRosterData }
  );

  // Load coaches data eagerly (not just when Coach tab is active) so the
  // email address is available to the Email tab's send function too.
  const { data: coachesData } = trpc.volleyball.coaches.useQuery(
    { schoolId: school.id }
  );

  // Load school links (recruiting questionnaire + athletics website)
  const { data: schoolLinks } = trpc.volleyball.links.useQuery(
    { schoolId: school.id },
    { enabled: activeTab === "links" }
  );

  // Separate head coaches (sortOrder < 100) from assistants (sortOrder >= 100)
  const headCoaches = useMemo(() => {
    if (!coachesData) return [];
    return coachesData.filter(c => c.sortOrder < 100);
  }, [coachesData]);

  const assistantCoaches = useMemo(() => {
    if (!coachesData) return [];
    return coachesData.filter(c => c.sortOrder >= 100);
  }, [coachesData]);

  // Primary head coach to display in the main card
  const primaryCoach = headCoaches[0] ?? null;
  // Additional head coaches (co-head coaches) go into the staff section
  const additionalHeadCoaches = headCoaches.slice(1);
  // All additional coaches for the dropdown
  const staffCoaches = [...additionalHeadCoaches, ...assistantCoaches];

  const handleCopyCoachEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedCoachEmail(email);
    setTimeout(() => setCopiedCoachEmail(null), 2000);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setTabFading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabFading(false);
    }, 100);
  };

  const handleCopyEmail = () => {
    if (school.coachEmail) {
      navigator.clipboard.writeText(school.coachEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  const totalGraduating = useMemo(() => {
    if (!players) return 0;
    return players.filter((p) => p.graduationYear && p.graduationYear <= 2026).length;
  }, [players]);

  const totalOpenings = useMemo(() => totalGraduating, [totalGraduating]);

  // ── Email tab state ──
  const [emailDraft, setEmailDraft] = useState("");
  const [emailEdited, setEmailEdited] = useState(false);
  const [emailCopiedDraft, setEmailCopiedDraft] = useState(false);
  const [emailTone, setEmailTone] = useState<EmailTone>("respectful");

  const generateEmailMutation = trpc.volleyball.generate.useMutation({
    onSuccess: (data) => {
      setEmailDraft(typeof data.email === 'string' ? data.email : '');
      setEmailEdited(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate email. Please try again.");
    },
  });

  const handleGenerateEmail = () => {
    if (emailEdited && emailDraft) {
      if (!window.confirm("Regenerating will overwrite your edits. Continue?")) return;
    }
    const p = loadAthleteProfile();
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || undefined;
    generateEmailMutation.mutate({
      schoolId: school.id,
      schoolName: school.school,
      division: school.division,
      conference: school.conference,
      coachName: school.coachName || undefined,
      tone: emailTone,
      // Core identity
      athleteName: fullName,
      athletePosition: p.positions || undefined,
      athleteGradYear: p.graduationYear || undefined,
      athleteGpa: p.gpa || undefined,
      athleteHeight: p.height || undefined,
      // Extended profile
      athleteWeight: p.weight || undefined,
      athleteSat: p.satScore || undefined,
      athleteAct: p.actScore || undefined,
      athleteIntendedMajor: p.intendedMajor || undefined,
      athleteHighSchool: p.highSchool || undefined,
      athleteCity: p.city || undefined,
      athleteState: p.state || undefined,
      athleteVerticalJump: p.verticalJump || undefined,
      athleteApproachJump: p.approachJump || undefined,
      athleteClubTeam: p.clubTeam || undefined,
      athleteHudlUrl: p.hudlUrl || undefined,
      athleteNcsaUrl: p.ncsaUrl || undefined,
      athleteInstagramUrl: p.instagramHandle ? `instagram.com/${p.instagramHandle}` : undefined,
      athleteKeyStats: p.keyStats || undefined,
      athleteHighlightUrl: p.highlightFilmUrl || undefined,
    });
  };

  const handleCopyDraft = () => {
    if (!emailDraft) return;
    navigator.clipboard.writeText(emailDraft);
    setEmailCopiedDraft(true);
    setTimeout(() => setEmailCopiedDraft(false), 2000);
  };

  // Gmail status query
  const { data: gmailStatus } = trpc.gmail.status.useQuery();

  // Email sending state
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [resolvedSendEmail, setResolvedSendEmail] = useState("");

  // Step 1: validate and open confirmation modal
  const handleSendEmail = () => {
    if (!emailDraft) return;

    // If Gmail not connected, prompt user to connect
    if (!gmailStatus?.connected) {
      toast.error(
        "Connect your Gmail account in Settings to send emails directly.",
        {
          action: {
            label: "Go to Settings",
            onClick: () => window.location.href = "/settings",
          },
          duration: 6000,
        }
      );
      return;
    }

    // Resolve the coach email: prefer coaches table (primaryCoach.email),
    // fall back to the denormalized schools.coachEmail field.
    const resolved = (primaryCoach?.email?.trim() || school.coachEmail?.trim()) ?? "";
    if (!resolved) {
      toast.error("No coach email address on file for this school.");
      return;
    }

    // Store resolved email and open confirmation modal
    setResolvedSendEmail(resolved);
    setShowConfirmModal(true);
  };

  // Step 2: actually send after user confirms
  const logEmailMutation = trpc.outreachTracker.log.useMutation();

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    setSending(true);
    const subject = `Prospective Student-Athlete — ${school.school}`;
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          to: resolvedSendEmail,
          subject,
          body: emailDraft,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "GMAIL_NOT_CONNECTED" || data.error === "GMAIL_REFRESH_INVALID") {
          toast.error("Your Gmail connection has expired. Please reconnect in Settings.", {
            action: { label: "Settings", onClick: () => window.location.href = "/settings" },
            duration: 6000,
          });
        } else if (data.error === "GMAIL_RATE_LIMIT") {
          toast.error("Gmail rate limit reached. Please wait a moment and try again.");
        } else {
          toast.error("Failed to send email. Please try again.");
        }
        return;
      }

      // Log to outreach tracker
      const coachDisplayName = primaryCoach
        ? `${primaryCoach.firstName} ${primaryCoach.lastName}`
        : (school.coachName || undefined);
      logEmailMutation.mutate({
        schoolId: school.id,
        schoolName: school.school,
        coachName: coachDisplayName,
        coachEmail: resolvedSendEmail,
        subject,
        body: emailDraft,
      });

      setEmailSent(true);
      setShowSuccessPopup(true);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "school", label: "SCHOOL INFO" },
    { id: "coach", label: "COACH INFO" },
    { id: "roster", label: "ROSTER GAP" },
    { id: "email", label: "EMAIL" },
    { id: "links", label: "LINKS" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          key="modal-body"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col w-full max-w-2xl"
          style={{
            background: "#131829",
            border: "1px solid #1E2A42",
            borderRadius: "18px",
            maxHeight: "90vh",
            overflow: "hidden",
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid #1E2A42", flexShrink: 0 }}
          >
            <div className="flex items-center gap-4">
              <SchoolLogo
                domain={school.athleticsDomain}
                logoUrl={school.logoUrl}
                brandColor={school.brandColor}
                name={school.school}
                size={48}
              />
              <div>
                <h2
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#F0F4FF",
                    lineHeight: 1.05,
                  }}
                >
                  {school.school.toUpperCase()}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                      color: "#8B9BB8",
                      padding: "2px 8px",
                      background: "#181E32",
                      border: "1px solid #1E2A42",
                      borderRadius: "6px",
                    }}
                  >
                    {school.division}
                  </span>
                  <span
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                      color: "#8B9BB8",
                      padding: "2px 8px",
                      background: "#181E32",
                      border: "1px solid #1E2A42",
                      borderRadius: "6px",
                    }}
                  >
                    {school.conference}
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#8B9BB8",
                    }}
                  >
                    {school.city}, {school.state}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                color: "#8B9BB8",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Tab Bar ── */}
          <div className="flex" style={{ borderBottom: "1px solid #1E2A42", flexShrink: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex-1 py-3.5 relative"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.12em",
                  color: activeTab === tab.id ? "#F5C518" : "#8B9BB8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 200ms ease",
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "#F5C518" }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: tabFading ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="p-6"
            >
              {/* ─── TAB 1: SCHOOL INFO ─────────────────────────────────────── */}
              {activeTab === "school" && (
                <div className="space-y-5">
                  <div
                    style={{
                      background: "#181E32",
                      border: "1px solid #1E2A42",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#8B9BB8",
                        marginBottom: "12px",
                      }}
                    >
                      PROGRAM OVERVIEW
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "SCHOOL", value: school.school },
                        { label: "SPORT", value: "Men's Volleyball", highlight: true },
                        { label: "DIVISION", value: school.division },
                        { label: "CONFERENCE", value: school.conference },
                        { label: "CITY", value: school.city },
                        { label: "STATE", value: school.state },
                      ].map(({ label, value, highlight }) => (
                        <div key={label}>
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px",
                              color: "#8B9BB8",
                              marginBottom: "2px",
                            }}
                          >
                            {label}
                          </p>
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "15px",
                              color: highlight ? "#F5C518" : "#F0F4FF",
                              fontWeight: 500,
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#181E32",
                      border: "1px solid #1E2A42",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#8B9BB8",
                        marginBottom: "12px",
                      }}
                    >
                      TAGS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        school.division,
                        school.conference,
                        `${school.city}, ${school.state}`,
                        "Men's Volleyball",
                      ].map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: "Barlow Condensed, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.1em",
                            color: "#8B9BB8",
                            padding: "4px 12px",
                            background: "#0C1020",
                            border: "1px solid #1E2A42",
                            borderRadius: "6px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {school.athleticsDomain && (
                    <a
                      href={`https://${school.athleticsDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full py-3 px-4"
                      style={{
                        background: "transparent",
                        border: "1px solid #1E2A42",
                        borderRadius: "8px",
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "13px",
                        letterSpacing: "0.1em",
                        color: "#8B9BB8",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={14} />
                      VISIT ATHLETICS WEBSITE
                    </a>
                  )}
                </div>
              )}

              {/* ─── TAB 2: COACH INFO ──────────────────────────────────────── */}
              {activeTab === "coach" && (
                <div className="space-y-5">
                  {/* ── Primary Head Coach Card ── */}
                  <div
                    style={{
                      background: "#181E32",
                      border: "1px solid #1E2A42",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#8B9BB8",
                        marginBottom: "16px",
                      }}
                    >
                      HEAD COACH
                    </p>
                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            color: "#8B9BB8",
                            marginBottom: "4px",
                          }}
                        >
                          NAME
                        </p>
                        <div
                          className="px-3 py-2.5"
                          style={{
                            background: "#0C1020",
                            border: "1px solid #1E2A42",
                            borderRadius: "8px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "15px",
                              color: primaryCoach ? "#F0F4FF" : "#4A5570",
                            }}
                          >
                            {primaryCoach
                              ? `${primaryCoach.firstName} ${primaryCoach.lastName}`
                              : (school.coachName && school.coachName !== "TBD" ? school.coachName : "—")}
                          </p>
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            color: "#8B9BB8",
                            marginBottom: "4px",
                          }}
                        >
                          TITLE
                        </p>
                        <div
                          className="px-3 py-2.5"
                          style={{
                            background: "#0C1020",
                            border: "1px solid #1E2A42",
                            borderRadius: "8px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "15px",
                              color: "#F0F4FF",
                            }}
                          >
                            {primaryCoach ? primaryCoach.position : (school.coachTitle || "Head Coach")}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            color: "#8B9BB8",
                            marginBottom: "4px",
                          }}
                        >
                          EMAIL
                        </p>
                        <div
                          className="flex items-center justify-between px-3 py-2.5"
                          style={{
                            background: "#0C1020",
                            border: "1px solid #1E2A42",
                            borderRadius: "8px",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Mail size={14} style={{ color: "#8B9BB8", flexShrink: 0 }} />
                            <p
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "15px",
                                color: (primaryCoach?.email || school.coachEmail) ? "#F0F4FF" : "#4A5570",
                                wordBreak: "break-all",
                              }}
                            >
                              {primaryCoach?.email || school.coachEmail || "—"}
                            </p>
                          </div>
                          {(primaryCoach?.email || school.coachEmail) && (
                            <button
                              onClick={() => handleCopyCoachEmail(primaryCoach?.email || school.coachEmail || "")}
                              style={{
                                color: copiedCoachEmail === (primaryCoach?.email || school.coachEmail) ? "#22C55E" : "#8B9BB8",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "2px",
                                flexShrink: 0,
                              }}
                            >
                              {copiedCoachEmail === (primaryCoach?.email || school.coachEmail) ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Coaching Staff Dropdown (assistant coaches + co-head coaches) ── */}
                  {staffCoaches.length > 0 && (
                    <div
                      style={{
                        background: "#181E32",
                        border: "1px solid #1E2A42",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      {/* Collapsible header */}
                      <button
                        onClick={() => setCoachStaffExpanded(prev => !prev)}
                        className="w-full flex items-center justify-between px-5 py-4"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Users size={14} style={{ color: "#8B9BB8" }} />
                          <p
                            style={{
                              fontFamily: "Barlow Condensed, sans-serif",
                              fontSize: "11px",
                              letterSpacing: "0.15em",
                              color: "#8B9BB8",
                              margin: 0,
                            }}
                          >
                            COACHING STAFF
                          </p>
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px",
                              color: "#4A5570",
                              background: "#1E2A42",
                              borderRadius: "10px",
                              padding: "1px 8px",
                            }}
                          >
                            {staffCoaches.length}
                          </span>
                        </div>
                        {coachStaffExpanded
                          ? <ChevronUp size={14} style={{ color: "#8B9BB8" }} />
                          : <ChevronDown size={14} style={{ color: "#8B9BB8" }} />}
                      </button>

                      {/* Expandable content */}
                      {coachStaffExpanded && (
                        <div
                          style={{
                            borderTop: "1px solid #1E2A42",
                            padding: "16px 20px",
                          }}
                        >
                          <div className="space-y-3">
                            {staffCoaches.map((coach) => (
                              <div
                                key={coach.id}
                                className="flex items-center justify-between"
                                style={{
                                  background: "#0C1020",
                                  border: "1px solid #1E2A42",
                                  borderRadius: "8px",
                                  padding: "12px 14px",
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: "14px",
                                      color: "#F0F4FF",
                                      fontWeight: 500,
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {coach.firstName} {coach.lastName}
                                  </p>
                                  <p
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: "12px",
                                      color: "#4A5570",
                                      marginBottom: coach.email ? "4px" : 0,
                                    }}
                                  >
                                    {coach.position}
                                  </p>
                                  {coach.email && (
                                    <p
                                      style={{
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: "12px",
                                        color: "#8B9BB8",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {coach.email}
                                    </p>
                                  )}
                                </div>
                                {coach.email && (
                                  <button
                                    onClick={() => handleCopyCoachEmail(coach.email!)}
                                    style={{
                                      color: copiedCoachEmail === coach.email ? "#22C55E" : "#4A5570",
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "4px",
                                      flexShrink: 0,
                                      marginLeft: "8px",
                                    }}
                                    title="Copy email"
                                  >
                                    {copiedCoachEmail === coach.email ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className="px-4 py-3"
                    style={{
                      background: "rgba(245,197,24,0.04)",
                      border: "1px solid rgba(245,197,24,0.15)",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        color: "#8B9BB8",
                        lineHeight: 1.5,
                      }}
                    >
                      Coach contact data is sourced from official athletics websites. Check the athletics website for the most current contact information.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: ROSTER GAP FINDER ───────────────────────────────── */}
              {activeTab === "roster" && (
                <div>
                  {/* ── Personalized grad-year warning banner ── */}
                  <RosterGapBanner athleteGradYear={athleteGradYear} />

                  {!school.hasRosterData ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                        style={{ background: "#181E32", border: "1px solid #1E2A42" }}
                      >
                        <Lock size={24} style={{ color: "#4A5570" }} />
                      </div>
                      <h3
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "24px",
                          color: "#F0F4FF",
                          marginBottom: "8px",
                        }}
                      >
                        ROSTER DATA COMING SOON
                      </h3>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          color: "#4A5570",
                          maxWidth: "320px",
                          lineHeight: 1.6,
                        }}
                      >
                        We're adding roster data for {school.school}. Check back soon for full
                        Roster Gap analysis.
                      </p>
                    </div>
                  ) : playersLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse"
                          style={{
                            background: "#181E32",
                            border: "1px solid #1E2A42",
                            borderRadius: "10px",
                          }}
                        />
                      ))}
                    </div>
                  ) : !players || players.length === 0 ? (
                    <div className="text-center py-16">
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          color: "#4A5570",
                        }}
                      >
                        No roster data available.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Summary */}
                      <div
                        style={{
                          background: "#181E32",
                          border: "1px solid #1E2A42",
                          borderRadius: "10px",
                          padding: "20px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "Barlow Condensed, sans-serif",
                            fontSize: "11px",
                            letterSpacing: "0.15em",
                            color: "#8B9BB8",
                            marginBottom: "16px",
                          }}
                        >
                          ROSTER GAP ANALYSIS — 2026
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "36px",
                                color: "#EF4444",
                                lineHeight: 1,
                              }}
                            >
                              {totalGraduating}
                            </p>
                            <p
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: "#8B9BB8",
                                marginTop: "4px",
                              }}
                            >
                              GRADUATING
                            </p>
                          </div>
                          <div
                            className="text-center"
                            style={{
                              borderLeft: "1px solid #1E2A42",
                              borderRight: "1px solid #1E2A42",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "36px",
                                color: "#4A5570",
                                lineHeight: 1,
                              }}
                            >
                              0
                            </p>
                            <p
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: "#8B9BB8",
                                marginTop: "4px",
                              }}
                            >
                              COMMITS FILLING
                            </p>
                          </div>
                          <div className="text-center">
                            <p
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "36px",
                                color: totalOpenings > 0 ? "#22C55E" : "#EF4444",
                                lineHeight: 1,
                              }}
                            >
                              {totalOpenings}
                            </p>
                            <p
                              style={{
                                fontFamily: "Barlow Condensed, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: "#8B9BB8",
                                marginTop: "4px",
                              }}
                            >
                              REAL OPENINGS
                            </p>
                          </div>
                        </div>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "13px",
                            color: "#8B9BB8",
                            marginTop: "16px",
                            lineHeight: 1.5,
                          }}
                        >
                          {school.school} loses{" "}
                          <strong style={{ color: "#F0F4FF" }}>
                            {totalGraduating} player{totalGraduating !== 1 ? "s" : ""}
                          </strong>{" "}
                          to graduation in 2026 with no known commits filling those spots, leaving{" "}
                          <strong
                            style={{ color: totalOpenings > 0 ? "#22C55E" : "#EF4444" }}
                          >
                            {totalOpenings} real opening{totalOpenings !== 1 ? "s" : ""}
                          </strong>{" "}
                          across all positions.
                        </p>
                      </div>

                      {/* VIEW FULL ROSTER toggle button */}
                      <button
                        onClick={() => setShowFullRoster((v) => !v)}
                        style={{
                          width: "100%",
                          background: "#181E32",
                          border: "1px solid #1E2A42",
                          borderRadius: "10px",
                          padding: "12px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,197,24,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E2A42";
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Barlow Condensed, sans-serif",
                            fontSize: "13px",
                            letterSpacing: "0.12em",
                            color: "#F5C518",
                          }}
                        >
                          {showFullRoster ? "HIDE ROSTER" : "VIEW FULL ROSTER"}
                        </span>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "14px",
                            color: "#F5C518",
                            transition: "transform 0.25s ease",
                            display: "inline-block",
                            transform: showFullRoster ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        >
                          ↓
                        </span>
                      </button>

                      {/* Per-position breakdown — hidden behind toggle */}
                      {showFullRoster && POSITIONS.map((pos) => {
                        const posPlayers = players.filter((p) => p.position === pos);
                        if (posPlayers.length === 0) return null;
                        const graduating = posPlayers.filter(
                          (p) => p.graduationYear && p.graduationYear <= 2026
                        );
                        return (
                          <div
                            key={pos}
                            style={{
                              background: "#181E32",
                              border: "1px solid #1E2A42",
                              borderRadius: "10px",
                              padding: "16px 20px",
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  style={{
                                    fontFamily: "Barlow Condensed, sans-serif",
                                    fontSize: "13px",
                                    letterSpacing: "0.12em",
                                    color: "#F5C518",
                                    padding: "2px 8px",
                                    background: "rgba(245,197,24,0.08)",
                                    border: "1px solid rgba(245,197,24,0.2)",
                                    borderRadius: "2px",
                                  }}
                                >
                                  {pos}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "13px",
                                    color: "#8B9BB8",
                                  }}
                                >
                                  {POSITION_LABELS[pos]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {graduating.length > 0 && (
                                  <span
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: "12px",
                                      color: "#EF4444",
                                    }}
                                  >
                                    {graduating.length} graduating
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "12px",
                                    color: "#4A5570",
                                  }}
                                >
                                  {posPlayers.length} total
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {posPlayers
                                .sort(
                                  (a, b) =>
                                    (a.graduationYear || 9999) - (b.graduationYear || 9999)
                                )
                                .map((player) => {
                                  const gradInfo = player.graduationYear
                                    ? GRAD_YEAR_COLORS[player.graduationYear]
                                    : null;
                                  const isGraduating =
                                    player.graduationYear && player.graduationYear <= 2026;
                                  return (
                                    <div
                                      key={player.id}
                                      className="flex items-center gap-1.5 px-2.5 py-1"
                                      style={{
                                        background: isGraduating
                                          ? "rgba(239,68,68,0.08)"
                                          : "#181E32",
                                        border: `1px solid ${isGraduating ? "rgba(239,68,68,0.25)" : "#1E2A42"}`,
                                        borderRadius: "3px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontFamily: "Inter, sans-serif",
                                          fontSize: "13px",
                                          color: isGraduating ? "#EF4444" : "#F0F4FF",
                                        }}
                                      >
                                        {player.name}
                                      </span>
                                      {gradInfo && (
                                        <span
                                          style={{
                                            fontFamily: "Barlow Condensed, sans-serif",
                                            fontSize: "10px",
                                            letterSpacing: "0.08em",
                                            color: gradInfo.color,
                                            background: gradInfo.bg,
                                            padding: "1px 4px",
                                            borderRadius: "2px",
                                          }}
                                        >
                                          {gradInfo.label} &apos;
                                          {String(player.graduationYear).slice(2)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Legend — only shown when roster is expanded */}
                      {showFullRoster && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {Object.entries(GRAD_YEAR_COLORS).map(([year, info]) => (
                            <div key={year} className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: info.color }}
                              />
                              <span
                                style={{
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: "12px",
                                  color: "#4A5570",
                                }}
                              >
                                {info.label} (Grad {year})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 4: EMAIL ─────────────────────────────────────────────── */}
              {activeTab === "email" && (
                <div className="space-y-5">
                  {/* Intro card */}
                  <div
                    style={{
                      background: "#181E32",
                      border: "1px solid #1E2A42",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#8B9BB8",
                        marginBottom: "8px",
                      }}
                    >
                      AI-GENERATED RECRUITING EMAIL
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        color: "#8B9BB8",
                        lineHeight: 1.5,
                      }}
                    >
                      Generate a personalized outreach email to {school.school}'s coaching staff.
                      The AI references real roster gaps and your athlete profile to craft a
                      concise, professional message.
                    </p>
                  </div>

                  {/* Tone selector */}
                  <div>
                    <p
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#8B9BB8",
                        marginBottom: "10px",
                      }}
                    >
                      TONE
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {TONE_OPTIONS.map((opt) => {
                        const isSelected = emailTone === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setEmailTone(opt.id)}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "8px",
                              border: isSelected ? "1px solid #F5C518" : "1px solid #1E2A42",
                              background: isSelected ? "#F5C518" : "#181E32",
                              color: isSelected ? "#090D18" : "#8B9BB8",
                              fontFamily: "Barlow Condensed, sans-serif",
                              fontSize: "12px",
                              letterSpacing: "0.12em",
                              cursor: "pointer",
                              transition: "all 200ms ease",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Generate / Regenerate button */}
                  {!emailDraft ? (
                    <button
                      onClick={handleGenerateEmail}
                      disabled={generateEmailMutation.isPending}
                      className="w-full py-3 flex items-center justify-center gap-2"
                      style={{
                        background: generateEmailMutation.isPending ? "#1E2A42" : "#F5C518",
                        color: generateEmailMutation.isPending ? "#4A5570" : "#090D18",
                        border: "none",
                        borderRadius: "10px",
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "14px",
                        letterSpacing: "0.12em",
                        cursor: generateEmailMutation.isPending ? "not-allowed" : "pointer",
                        transition: "background 200ms ease",
                        boxShadow: generateEmailMutation.isPending ? "none" : "0 4px 20px rgba(245,197,24,0.32)",
                      }}
                    >
                      {generateEmailMutation.isPending ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          GENERATING...
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          GENERATE EMAIL
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Editable textarea */}
                      <textarea
                        value={emailDraft}
                        onChange={(e) => {
                          setEmailDraft(e.target.value);
                          setEmailEdited(true);
                        }}
                        rows={12}
                        style={{
                          width: "100%",
                          background: "#0C1020",
                          border: "1px solid #1E2A42",
                          borderRadius: "10px",
                          color: "#F0F4FF",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          lineHeight: 1.65,
                          padding: "16px",
                          resize: "vertical",
                          outline: "none",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#F5C518";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#1E2A42";
                        }}
                      />

                      {/* Action buttons row */}
                      <div className="flex gap-2">
                        {/* Copy button */}
                        <button
                          onClick={handleCopyDraft}
                          className="flex items-center gap-1.5 px-4 py-2.5"
                          style={{
                            background: "transparent",
                            color: emailCopiedDraft ? "#22C55E" : "#8B9BB8",
                            border: `1px solid ${emailCopiedDraft ? "#22C55E" : "#1E2A42"}`,
                            borderRadius: "8px",
                            fontFamily: "Barlow Condensed, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.1em",
                            cursor: "pointer",
                            transition: "all 200ms ease",
                          }}
                        >
                          {emailCopiedDraft ? <Check size={13} /> : <Copy size={13} />}
                          {emailCopiedDraft ? "COPIED" : "COPY"}
                        </button>

                        {/* Regenerate button */}
                        <button
                          onClick={handleGenerateEmail}
                          disabled={generateEmailMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2.5"
                          style={{
                            background: "transparent",
                            color: generateEmailMutation.isPending ? "#4A5570" : "#8B9BB8",
                            border: "1px solid #1E2A42",
                            borderRadius: "8px",
                            fontFamily: "Barlow Condensed, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.1em",
                            cursor: generateEmailMutation.isPending ? "not-allowed" : "pointer",
                            transition: "all 200ms ease",
                          }}
                        >
                          <RefreshCw
                            size={13}
                            className={generateEmailMutation.isPending ? "animate-spin" : ""}
                          />
                          {generateEmailMutation.isPending ? "GENERATING..." : "REGENERATE"}
                        </button>

                        {/* Send button */}
                        <button
                          onClick={handleSendEmail}
                          disabled={sending || emailSent}
                          className="flex items-center gap-1.5 px-4 py-2.5 ml-auto"
                          style={{
                            background: emailSent ? "#22C55E" : sending ? "#1E2A42" : "#F5C518",
                            color: emailSent ? "#F0F4FF" : sending ? "#4A5570" : "#090D18",
                            border: "none",
                            borderRadius: "8px",
                            fontFamily: "Barlow Condensed, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.1em",
                            cursor: sending || emailSent ? "not-allowed" : "pointer",
                            transition: "all 200ms ease",
                            boxShadow: !sending && !emailSent ? "0 4px 20px rgba(245,197,24,0.32)" : "none",
                          }}
                        >
                          {emailSent ? (
                            <><Check size={13} /> SENT ✓</>
                          ) : sending ? (
                            <><RefreshCw size={13} className="animate-spin" /> SENDING...</>
                          ) : (
                            <><Send size={13} /> SEND EMAIL →</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 5: LINKS ─────────────────────────────────────────────── */}
              {activeTab === "links" && (
                <div className="space-y-4">
                  {/* Section label */}
                  <p
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      color: "#8B9BB8",
                      textTransform: "uppercase",
                      marginBottom: "16px",
                    }}
                  >
                    Official links for {school.school}
                  </p>

                  {/* Link 1 — Recruiting Questionnaire (primary, larger card) */}
                  <div
                    style={{
                      background: schoolLinks?.recruitingQuestionnaireUrl ? "#181E32" : "#131829",
                      border: "1px solid #1E2A42",
                      borderRadius: "10px",
                      padding: "20px",
                      opacity: schoolLinks?.recruitingQuestionnaireUrl ? 1 : 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    {/* Yellow dot */}
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: schoolLinks?.recruitingQuestionnaireUrl ? "#F5C518" : "#3A3A3A",
                        flexShrink: 0,
                      }}
                    />
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "11px",
                          letterSpacing: "0.15em",
                          color: "#8B9BB8",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        RECRUITING QUESTIONNAIRE
                      </p>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "15px",
                          color: schoolLinks?.recruitingQuestionnaireUrl ? "#F0F4FF" : "#4A5570",
                          fontWeight: 500,
                        }}
                      >
                        {schoolLinks?.recruitingQuestionnaireUrl
                          ? "Submit your info directly to the coaching staff"
                          : "Not available"}
                      </p>
                    </div>
                    {/* Button */}
                    {schoolLinks?.recruitingQuestionnaireUrl && (
                      <a
                        href={schoolLinks.recruitingQuestionnaireUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 18px",
                          background: "#F5C518",
                          color: "#090D18",
                          border: "none",
                          borderRadius: "8px",
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "14px",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                          textDecoration: "none",
                          flexShrink: 0,
                          fontWeight: 700,
                          boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                        }}
                      >
                        OPEN <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Link 2 — Athletics Website */}
                  <div
                    style={{
                      background: schoolLinks?.athleticsWebsiteUrl ? "#181E32" : "#131829",
                      border: "1px solid #1E2A42",
                      borderRadius: "10px",
                      padding: "16px 20px",
                      opacity: schoolLinks?.athleticsWebsiteUrl ? 1 : 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    {/* Yellow dot */}
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: schoolLinks?.athleticsWebsiteUrl ? "#F5C518" : "#3A3A3A",
                        flexShrink: 0,
                      }}
                    />
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "11px",
                          letterSpacing: "0.15em",
                          color: "#8B9BB8",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        ATHLETICS WEBSITE
                      </p>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          color: schoolLinks?.athleticsWebsiteUrl ? "#F0F4FF" : "#4A5570",
                          fontWeight: 500,
                        }}
                      >
                        {schoolLinks?.athleticsWebsiteUrl
                          ? "Official school athletics landing page"
                          : "Not available"}
                      </p>
                    </div>
                    {/* Button */}
                    {schoolLinks?.athleticsWebsiteUrl && (
                      <a
                        href={schoolLinks.athleticsWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "9px 16px",
                          background: "transparent",
                          color: "#F0F4FF",
                          border: "1px solid #1E2A42",
                          borderRadius: "8px",
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                          textDecoration: "none",
                          flexShrink: 0,
                        }}
                      >
                        VISIT <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between px-6 py-4 gap-3"
            style={{ borderTop: "1px solid #1E1E1E", flexShrink: 0 }}
          >
            <button
              onClick={onToggleOutreach}
              className="flex-1 py-2.5"
              style={{
                background: isInOutreachList ? "transparent" : "#F5C518",
                color: isInOutreachList ? "#F5C518" : "#0A0A0A",
                border: isInOutreachList ? "1px solid #F5C518" : "none",
                borderRadius: "0px",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "13px",
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              {isInOutreachList ? "✓ ADDED TO LIST" : "ADD TO LIST"}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5"
              style={{
                background: "transparent",
                color: "#6B6B6B",
                border: "1px solid #2A2A2A",
                borderRadius: "0px",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "13px",
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Pre-send Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: "#181E32",
                border: "1px solid #3A3A3A",
                borderRadius: "16px",
                padding: "32px",
                width: "100%",
                maxWidth: "480px",
                margin: "0 16px",
              }}
            >
              {/* Warning icon */}
              <div className="flex justify-center mb-5">
                <div
                  style={{
                    background: "rgba(245,197,24,0.12)",
                    borderRadius: "50%",
                    width: "56px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={28} style={{ color: "#F5C518" }} />
                </div>
              </div>

              {/* Headline */}
              <p
                className="text-center mb-6"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "26px",
                  letterSpacing: "0.06em",
                  color: "#FFFFFF",
                }}
              >
                REVIEW BEFORE SENDING
              </p>

              {/* Checklist */}
              <div className="space-y-3 mb-6">
                {[
                  "Double check the coach's name is spelled correctly",
                  "Make sure your name, position, and grad year are accurate",
                  "Confirm this email sounds like you — not a generic template",
                  "Check the subject line makes sense",
                  "You cannot unsend this email once it is sent",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#F5C518",
                        flexShrink: 0,
                        marginTop: "6px",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        color: "#C0C0C0",
                        lineHeight: 1.5,
                      }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {/* Email preview box */}
              <div
                style={{
                  background: "#0F0F0F",
                  border: "1px solid #2A2A2A",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: "#6B6B6B",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Subject
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#E0E0E0",
                    marginBottom: "12px",
                  }}
                >
                  Prospective Student-Athlete — {school.school}
                </p>
                <div
                  style={{
                    height: "1px",
                    background: "#1E2A42",
                    marginBottom: "12px",
                  }}
                />
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#8B9BB8",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {emailDraft.split("\n").slice(0, 3).join("\n")}
                  {emailDraft.split("\n").length > 3 && (
                    <span style={{ color: "#4A4A4A" }}> …</span>
                  )}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3"
                  style={{
                    background: "transparent",
                    color: "#6B6B6B",
                    border: "1px solid #3A3A3A",
                    borderRadius: "8px",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "14px",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                  }}
                >
                  GO BACK AND EDIT
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-1 py-3"
                  style={{
                    background: "#F5C518",
                    color: "#0A0A0A",
                    border: "none",
                    borderRadius: "8px",
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "14px",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  SEND NOW →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post-send Success Popup ── */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            key="success-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.80)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: "#181E32",
                border: "1px solid #3A3A3A",
                borderRadius: "16px",
                padding: "32px",
                width: "100%",
                maxWidth: "460px",
                margin: "0 16px",
              }}
            >
              {/* Green checkmark */}
              <div className="flex justify-center mb-5">
                <div
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    borderRadius: "50%",
                    width: "64px",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={36} style={{ color: "#22C55E" }} />
                </div>
              </div>

              {/* Headline */}
              <p
                className="text-center mb-2"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "32px",
                  letterSpacing: "0.06em",
                  color: "#FFFFFF",
                }}
              >
                EMAIL SENT
              </p>

              {/* Subtext */}
              <p
                className="text-center mb-6"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#8B9BB8",
                  lineHeight: 1.5,
                }}
              >
                Your email is on its way to{" "}
                <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                  {primaryCoach
                    ? `${primaryCoach.firstName} ${primaryCoach.lastName}`
                    : (school.coachName || "the coaching staff")}
                </span>{" "}
                at{" "}
                <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{school.school}</span>
              </p>

              {/* Yellow divider */}
              <div
                style={{
                  height: "2px",
                  background: "#F5C518",
                  borderRadius: "2px",
                  marginBottom: "20px",
                }}
              />

              {/* Important notice box */}
              <div
                style={{
                  background: "#111111",
                  borderLeft: "3px solid #F5C518",
                  borderRadius: "0 8px 8px 0",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    color: "#F5C518",
                    marginBottom: "8px",
                  }}
                >
                  IMPORTANT
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#C0C0C0",
                    lineHeight: 1.6,
                  }}
                >
                  Keep an eye on your personal Gmail inbox for replies from the coaching staff.
                  Coach responses will come directly to your email — not inside RecruitPath.
                  Check your inbox and spam folder regularly.
                </p>
              </div>

              {/* GOT IT button */}
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-3"
                style={{
                  background: "#F5C518",
                  color: "#0A0A0A",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "16px",
                  letterSpacing: "0.12em",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                GOT IT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
