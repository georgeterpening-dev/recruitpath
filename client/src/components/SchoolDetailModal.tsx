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
import ProGate from "@/components/ProGate";
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

function getStoredGradYear(): string {
  const p = loadAthleteProfile();
  return p.graduationYear ?? "";
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
              fontFamily: "Bebas Neue, sans-serif",
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
              fontFamily: "DM Sans, sans-serif",
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

  // Subscription status for feature gating
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    staleTime: 60_000,
  });
  const hasPaidAccess = subStatus?.hasPaidAccess ?? true; // default true to avoid flash of gate on load
  const [showFullRoster, setShowFullRoster] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  // Year toggle for Roster Gap tab — defaults to athlete's grad year (set once gapData loads)
  const [displayYear, setDisplayYear] = useState<number | null>(null);
  
  const { data: serverProfile } = trpc.athleteProfile.get.useQuery();
  const resolvedGradYear = athleteGradYear
    || serverProfile?.graduationYear
    || getStoredGradYear()
    || "";
  
  const [selectedRosterYear, setSelectedRosterYear] = useState<number>(() => {
    const year = parseInt(athleteGradYear || getStoredGradYear() || "");
    return isNaN(year) ? 2027 : year;
  });

  useEffect(() => {
    if (selectedRosterYear === 2027) {
      const year = parseInt(resolvedGradYear);
      if (!isNaN(year)) setSelectedRosterYear(year);
    }
  }, [resolvedGradYear]);
  const [tabFading, setTabFading] = useState(false);
  const [coachStaffExpanded, setCoachStaffExpanded] = useState(false);
  const [copiedCoachEmail, setCopiedCoachEmail] = useState<string | null>(null);

  // Use schoolGap as single source of truth: players + gap data in one query
  const { data: schoolGapResult, isLoading: playersLoading } = trpc.volleyball.schoolGap.useQuery(
    { schoolId: school.id },
    { enabled: activeTab === "roster" && !!school.hasRosterData }
  );

  // Separate gap query keyed to the roster tab being active
  const { data: gapResult } = trpc.volleyball.schoolGap.useQuery(
    { schoolId: school.id },
    { enabled: activeTab === "roster" && !!school.id }
  );

  const { data: schoolCommits = [] } = trpc.volleyball.commitsForSchool.useQuery(
    { schoolId: school.id },
    { enabled: activeTab === "roster" && !!school.id }
  );

  const players = schoolGapResult?.players ?? [];
  const gapData = schoolGapResult; // shape: { players, gradYear, athletePositions, gap }

  // Set displayYear from gapData on first load
  useEffect(() => {
    if (schoolGapResult?.gradYear && displayYear === null) {
      setDisplayYear(schoolGapResult.gradYear);
    }
  }, [schoolGapResult?.gradYear, displayYear]);

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

  // Derived gap values — use selectedRosterYear for filtering
  const totalGraduating = useMemo(() => {
    if (!players) return 0;
    const graduatingNames = new Set(
      players
        .filter(pl => pl.graduationYear === selectedRosterYear)
        .map(pl => pl.name?.trim().toLowerCase())
        .filter(Boolean)
    );
    return graduatingNames.size;
  }, [players, selectedRosterYear]);
  const positionOpenings = gapResult?.gap?.atPosition ?? 0;
  const positionGraduating = positionOpenings;
  const graduatingNames = new Set<string>(
    (gapResult?.gap?.graduatingNames ?? []).map((n: string) => n.trim().toLowerCase())
  );
  const positionGraduatingNames = new Set<string>(
    (gapResult?.gap?.positionGraduatingNames ?? []).map((n: string) => n.trim().toLowerCase())
  );
  const athleteGradYearFromGap = gapData?.gradYear;
  const athletePositionsFromGap = gapData?.athletePositions ?? [];
  const totalOpenings = useMemo(() => totalGraduating, [totalGraduating]);

  // ── Email tab state ──
  const [emailDraft, setEmailDraft] = useState("");
  const [emailEdited, setEmailEdited] = useState(false);
  const [emailCopiedDraft, setEmailCopiedDraft] = useState(false);
  const [specificMention, setSpecificMention] = useState("");

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
      specificMention: specificMention || undefined,
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
  const [showCommitsModal, setShowCommitsModal] = useState(false);
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
    const subject = `Prospective Student-Athlete - ${school.school}`;
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
        className="fixed inset-0 z-50 flex md:items-center md:justify-center md:p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        {/* Mobile: iOS bottom sheet; Desktop: centered modal */}
        <motion.div
          key="modal-body"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="school-modal-container flex flex-col w-full md:max-w-2xl"
          style={{
            background: "#111111",
            border: "1px solid #2A2A2A",
            overflow: "hidden",
          } as React.CSSProperties}
        >
          {/* Drag handle (mobile only) */}
          <div className="flex justify-center pt-3 pb-1 md:hidden" style={{ flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
          </div>
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-4 md:px-6 py-3 md:py-5"
            style={{ borderBottom: "1px solid #1E1E1E", flexShrink: 0 }}
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
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "clamp(20px, 5vw, 28px)",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    lineHeight: 1.05,
                  }}
                >
                  {school.school.toUpperCase()}
                </h2>
                {school.id === "mvb-202" && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(245,197,24,0.12)",
                    border: "1px solid rgba(245,197,24,0.3)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    marginTop: "6px",
                  }}>
                    <span style={{ fontSize: "11px", color: "#F5C518", fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.1em" }}>
                      ⭐ INAUGURAL SEASON 2026–2027
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                      color: "#6B6B6B",
                      padding: "2px 8px",
                      background: "#1A1A1A",
                      border: "1px solid #2A2A2A",
                      borderRadius: "2px",
                    }}
                  >
                    {school.division}
                  </span>
                  <span
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                      color: "#6B6B6B",
                      padding: "2px 8px",
                      background: "#1A1A1A",
                      border: "1px solid #2A2A2A",
                      borderRadius: "2px",
                    }}
                  >
                    {school.conference}
                  </span>
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "12px",
                      color: "#6B6B6B",
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
                color: "#6B6B6B",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Tab Bar ── */}
          <div className="flex" style={{ borderBottom: "1px solid #1E1E1E", flexShrink: 0, overflowX: "auto" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex-1 relative"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "clamp(11px, 2.5vw, 13px)",
                  letterSpacing: "0.12em",
                  color: activeTab === tab.id ? "#F5C518" : "#6B6B6B",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 200ms ease",
                  minWidth: "80px",
                  height: "44px",
                  whiteSpace: "nowrap",
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
              className="p-4 md:p-6"
            >
              {/* ─── TAB 1: SCHOOL INFO ─────────────────────────────────────── */}
              {activeTab === "school" && (
                <div className="space-y-5">
                  <div
                    style={{
                      background: "#141414",
                      border: "1px solid #1E1E1E",
                      borderRadius: "4px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#6B6B6B",
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
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "11px",
                              color: "#6B6B6B",
                              marginBottom: "2px",
                            }}
                          >
                            {label}
                          </p>
                          <p
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "15px",
                              color: highlight ? "#F5C518" : "#FFFFFF",
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
                      background: "#141414",
                      border: "1px solid #1E1E1E",
                      borderRadius: "4px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#6B6B6B",
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
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.1em",
                            color: "#A3A3A3",
                            padding: "4px 12px",
                            background: "#1A1A1A",
                            border: "1px solid #2A2A2A",
                            borderRadius: "2px",
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
                        border: "1px solid #2A2A2A",
                        borderRadius: "4px",
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "13px",
                        letterSpacing: "0.1em",
                        color: "#A3A3A3",
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
                      background: "#141414",
                      border: "1px solid #1E1E1E",
                      borderRadius: "4px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#6B6B6B",
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
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "11px",
                            color: "#6B6B6B",
                            marginBottom: "4px",
                          }}
                        >
                          NAME
                        </p>
                        <div
                          className="px-3 py-2.5"
                          style={{
                            background: "#0A0A0A",
                            border: "1px solid #2A2A2A",
                            borderRadius: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "15px",
                              color: primaryCoach ? "#FFFFFF" : "#6B6B6B",
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
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "11px",
                            color: "#6B6B6B",
                            marginBottom: "4px",
                          }}
                        >
                          TITLE
                        </p>
                        <div
                          className="px-3 py-2.5"
                          style={{
                            background: "#0A0A0A",
                            border: "1px solid #2A2A2A",
                            borderRadius: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "15px",
                              color: "#FFFFFF",
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
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "11px",
                            color: "#6B6B6B",
                            marginBottom: "4px",
                          }}
                        >
                          EMAIL
                        </p>
                        <div
                          className="flex items-center justify-between px-3 py-2.5"
                          style={{
                            background: "#0A0A0A",
                            border: "1px solid #2A2A2A",
                            borderRadius: "4px",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Mail size={14} style={{ color: "#6B6B6B", flexShrink: 0 }} />
                            <p
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: "15px",
                                color: (primaryCoach?.email || school.coachEmail) ? "#FFFFFF" : "#6B6B6B",
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
                                color: copiedCoachEmail === (primaryCoach?.email || school.coachEmail) ? "#22C55E" : "#6B6B6B",
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
                        background: "#141414",
                        border: "1px solid #1E1E1E",
                        borderRadius: "4px",
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
                          <Users size={14} style={{ color: "#6B6B6B" }} />
                          <p
                            style={{
                              fontFamily: "Bebas Neue, sans-serif",
                              fontSize: "11px",
                              letterSpacing: "0.15em",
                              color: "#6B6B6B",
                              margin: 0,
                            }}
                          >
                            COACHING STAFF
                          </p>
                          <span
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "11px",
                              color: "#4A4A4A",
                              background: "#1E1E1E",
                              borderRadius: "10px",
                              padding: "1px 8px",
                            }}
                          >
                            {staffCoaches.length}
                          </span>
                        </div>
                        {coachStaffExpanded
                          ? <ChevronUp size={14} style={{ color: "#6B6B6B" }} />
                          : <ChevronDown size={14} style={{ color: "#6B6B6B" }} />}
                      </button>

                      {/* Expandable content */}
                      {coachStaffExpanded && (
                        <div
                          style={{
                            borderTop: "1px solid #1E1E1E",
                            padding: "16px 20px",
                          }}
                        >
                          <div className="space-y-3">
                            {staffCoaches.map((coach) => (
                              <div
                                key={coach.id}
                                className="flex items-center justify-between"
                                style={{
                                  background: "#0A0A0A",
                                  border: "1px solid #2A2A2A",
                                  borderRadius: "4px",
                                  padding: "12px 14px",
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p
                                    style={{
                                      fontFamily: "DM Sans, sans-serif",
                                      fontSize: "14px",
                                      color: "#FFFFFF",
                                      fontWeight: 500,
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {coach.firstName} {coach.lastName}
                                  </p>
                                  <p
                                    style={{
                                      fontFamily: "DM Sans, sans-serif",
                                      fontSize: "12px",
                                      color: "#6B6B6B",
                                      marginBottom: coach.email ? "4px" : 0,
                                    }}
                                  >
                                    {coach.position}
                                  </p>
                                  {coach.email && (
                                    <p
                                      style={{
                                        fontFamily: "DM Sans, sans-serif",
                                        fontSize: "12px",
                                        color: "#A3A3A3",
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
                                      color: copiedCoachEmail === coach.email ? "#22C55E" : "#6B6B6B",
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
                      borderRadius: "4px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        color: "#A3A3A3",
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
                  {/* ── Pro gate for free users ── */}
                  {!hasPaidAccess ? (
                    <ProGate
                      headline="ROSTER GAP FINDER"
                      subtext="See exactly which programs have openings at your position when you'd arrive. Available on Pro."
                    />
                  ) : (
                  <>
                  {/* ── Personalized grad-year warning banner ── */}
                  <RosterGapBanner athleteGradYear={resolvedGradYear} />

                  {!school.hasRosterData ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                        style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
                      >
                        <Lock size={24} style={{ color: "#6B6B6B" }} />
                      </div>
                      <h3
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "24px",
                          color: "#FFFFFF",
                          marginBottom: "8px",
                        }}
                      >
                        ROSTER DATA COMING SOON
                      </h3>
                      <p
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "14px",
                          color: "#6B6B6B",
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
                            background: "#141414",
                            border: "1px solid #1E1E1E",
                            borderRadius: "4px",
                          }}
                        />
                      ))}
                    </div>
                  ) : (!players || players.length === 0) && schoolCommits.length === 0 ? (
                    <div className="text-center py-16">
                      <p
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "14px",
                          color: "#6B6B6B",
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
                          background: "#141414",
                          border: "1px solid #1E1E1E",
                          borderRadius: "4px",
                          padding: "20px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                          <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "11px", letterSpacing: "0.15em", color: "#6B6B6B", margin: 0 }}>
                            ROSTER GAP ANALYSIS
                          </p>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {[2026, 2027, 2028, 2029].map((yr) => (
                              <button
                                key={yr}
                                onClick={() => setSelectedRosterYear(yr)}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "999px",
                                  fontSize: "11px",
                                  fontFamily: "DM Sans, sans-serif",
                                  cursor: "pointer",
                                  border: selectedRosterYear === yr ? "none" : "1px solid rgba(255,255,255,0.08)",
                                  background: selectedRosterYear === yr ? "#F5C518" : "rgba(255,255,255,0.04)",
                                  color: selectedRosterYear === yr ? "#000" : "#888",
                                  fontWeight: selectedRosterYear === yr ? 700 : 400,
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {yr}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Old year toggle pills - to be removed */}
                        <div className="flex items-center gap-2 mb-4" style={{ display: "none" }}>
                          {[2025, 2026, 2027, 2028, 2029].map((yr) => {
                            const isActive = (displayYear || athleteGradYearFromGap || 2027) === yr;
                            return (
                              <button
                                key={yr}
                                onClick={() => setDisplayYear(yr)}
                                style={{
                                  fontFamily: "Bebas Neue, sans-serif",
                                  fontSize: "13px",
                                  letterSpacing: "0.08em",
                                  padding: "4px 12px",
                                  borderRadius: "3px",
                                  border: isActive ? "1px solid #F5C518" : "1px solid #2A2A2A",
                                  background: isActive ? "rgba(245,197,24,0.12)" : "transparent",
                                  color: isActive ? "#F5C518" : "#6B6B6B",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {yr}
                              </button>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "36px",
                                color: "#EF4444",
                                lineHeight: 1,
                              }}
                            >
                              {totalGraduating}
                            </p>
                            <p
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: "#6B6B6B",
                                marginTop: "4px",
                              }}
                            >
                              GRADUATING
                            </p>
                          </div>
                          <div
                            className="text-center"
                            style={{
                              borderLeft: "1px solid #1E1E1E",
                              borderRight: "1px solid #1E1E1E",
                            }}
                          >
                            <button
                              onClick={() => schoolCommits.length > 0 && setShowCommitsModal(true)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: schoolCommits.length > 0 ? "pointer" : "default",
                                width: "100%",
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: "Bebas Neue, sans-serif",
                                  fontSize: "36px",
                                  color: schoolCommits.length > 0 ? "#F5C518" : "#6B6B6B",
                                  lineHeight: 1,
                                }}
                              >
                                {schoolCommits.length}
                              </p>
                              <p
                                style={{
                                  fontFamily: "Bebas Neue, sans-serif",
                                  fontSize: "11px",
                                  letterSpacing: "0.1em",
                                  color: schoolCommits.length > 0 ? "#F5C518" : "#6B6B6B",
                                  marginTop: "4px",
                                  textDecoration: schoolCommits.length > 0 ? "underline" : "none",
                                }}
                              >
                                COMMITS FILLING
                              </p>
                            </button>
                          </div>
                          <div className="text-center">
                            <p
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "36px",
                                color: totalOpenings > 0 ? "#22C55E" : "#EF4444",
                                lineHeight: 1,
                              }}
                            >
                              {totalOpenings}
                            </p>
                            <p
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                color: "#6B6B6B",
                                marginTop: "4px",
                              }}
                            >
                              SPOTS OPENING
                            </p>
                          </div>
                        </div>
                        <p
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "13px",
                            color: "#A3A3A3",
                            marginTop: "16px",
                            lineHeight: 1.5,
                          }}
                        >
                          {school.school} loses{" "}
                          <strong style={{ color: "#FFFFFF" }}>
                            {totalGraduating} player{totalGraduating !== 1 ? "s" : ""}
                          </strong>{" "}
                          to graduation in {displayYear || athleteGradYearFromGap || 2027} with no known commits filling those spots, leaving{" "}
                          <strong
                            style={{ color: totalOpenings > 0 ? "#22C55E" : "#EF4444" }}
                          >
                            {totalOpenings} real opening{totalOpenings !== 1 ? "s" : ""}
                          </strong>{" "}
                          across all positions.
                        </p>
                        {/* Position-specific openings one-liner */}
                        {positionGraduating > 0 && athletePositionsFromGap.length > 0 && (
                          <p
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "12.5px",
                              color: "#F5C518",
                              marginTop: "10px",
                              lineHeight: 1.5,
                              padding: "8px 12px",
                              background: "rgba(245,197,24,0.06)",
                              border: "1px solid rgba(245,197,24,0.15)",
                              borderRadius: "4px",
                            }}
                          >
                            ⚡ <strong>{positionGraduating}</strong> of those openings are at{" "}
                            <strong>your position{athletePositionsFromGap.length > 1 ? "s" : ""}</strong>{" "}
                            ({athletePositionsFromGap.join(", ")})
                          </p>
                        )}
                      </div>

                      {/* VIEW FULL ROSTER toggle button */}
                      <button
                        onClick={() => setShowFullRoster((v) => !v)}
                        style={{
                          width: "100%",
                          background: "#141414",
                          border: "1px solid #2A2A2A",
                          borderRadius: "4px",
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
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2A2A2A";
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "13px",
                            letterSpacing: "0.12em",
                            color: "#F5C518",
                          }}
                        >
                          {showFullRoster ? "HIDE ROSTER" : "VIEW FULL ROSTER"}
                        </span>
                        <span
                          style={{
                            fontFamily: "DM Sans, sans-serif",
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
                        const posPlayers = players.filter((p) => {
                          if (!p.position) return false;
                          const playerPositions = p.position.split("/").map((s: string) => s.trim().toUpperCase());
                          return playerPositions.includes(pos);
                        });
                        if (posPlayers.length === 0) return null;
                        const graduating = posPlayers.filter((p) => p.graduationYear === selectedRosterYear);
                        return (
                          <div
                            key={pos}
                            style={{
                              background: "#141414",
                              border: "1px solid #1E1E1E",
                              borderRadius: "4px",
                              padding: "16px 20px",
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  style={{
                                    fontFamily: "Bebas Neue, sans-serif",
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
                                    fontFamily: "DM Sans, sans-serif",
                                    fontSize: "13px",
                                    color: "#A3A3A3",
                                  }}
                                >
                                  {POSITION_LABELS[pos]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {graduating.length > 0 && (
                                  <span
                                    style={{
                                      fontFamily: "DM Sans, sans-serif",
                                      fontSize: "12px",
                                      color: "#EF4444",
                                    }}
                                  >
                                    {graduating.length} graduating
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    fontSize: "12px",
                                    color: "#6B6B6B",
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
                                  // Use server-computed graduating names set for exact match (lowercased)
                                  const isGraduating = player.graduationYear === selectedRosterYear;
                                  return (
                                    <div
                                      key={player.id}
                                      className="flex items-center gap-1.5 px-2.5 py-1"
                                      style={{
                                        background: isGraduating
                                          ? "rgba(239,68,68,0.08)"
                                          : "#1A1A1A",
                                        border: `1px solid ${isGraduating ? "rgba(239,68,68,0.25)" : "#2A2A2A"}`,
                                        borderRadius: "3px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontFamily: "DM Sans, sans-serif",
                                          fontSize: "13px",
                                          color: isGraduating ? "#EF4444" : "#FFFFFF",
                                        }}
                                      >
                                        {player.name}
                                      </span>
                                      {gradInfo && (
                                        <span
                                          style={{
                                            fontFamily: "Bebas Neue, sans-serif",
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
                                  fontFamily: "DM Sans, sans-serif",
                                  fontSize: "12px",
                                  color: "#6B6B6B",
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
                  </>
                  )}
                </div>
              )}

              {/* ─── TAB 4: EMAIL ─────────────────────────────────────────────────────── */}
              {activeTab === "email" && (
                <div className="space-y-5">
                  {/* ── Pro gate for free users ── */}
                  {!hasPaidAccess ? (
                    <ProGate
                      headline="AI EMAIL GENERATION"
                      subtext="Generate personalized outreach emails referencing real roster data and send directly from your Gmail. Available on Pro."
                    />
                  ) : (
                  <>
                  {/* Intro card */}
                  <div
                    style={{
                      background: "#141414",
                      border: "1px solid #1E1E1E",
                      borderRadius: "4px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "11px",
                        letterSpacing: "0.15em",
                        color: "#6B6B6B",
                        marginBottom: "8px",
                      }}
                    >
                      AI-GENERATED RECRUITING EMAIL
                    </p>
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        color: "#94A3B8",
                        lineHeight: 1.5,
                      }}
                    >
                      Generate a personalized outreach email to {school.school}'s coaching staff.
                      The AI references real roster gaps and your athlete profile to craft a
                      concise, professional message.
                    </p>
                  </div>

                  {/* Anything Specific to Mention? */}
                  <div>
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#F8FAFC",
                        marginBottom: "8px",
                      }}
                    >
                      ANYTHING SPECIFIC TO MENTION?
                    </p>
                    <textarea
                      value={specificMention}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setSpecificMention(e.target.value);
                        }
                      }}
                      placeholder="e.g. I saw you won the MPSF tournament, I noticed you lost two setters to graduation, I watched your match last week..."
                      style={{
                        width: "100%",
                        height: "80px",
                        background: "#1A1A1A",
                        border: "2px solid #2A2A2A",
                        borderLeft: "3px solid #F5C518",
                        borderRadius: "8px",
                        color: "#F8FAFC",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        padding: "12px",
                        resize: "none",
                        transition: "border-color 0.2s ease",
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLTextAreaElement).style.borderColor = "#F5C518";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLTextAreaElement).style.borderColor = "#2A2A2A";
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "12px",
                        color: "#5a6478",
                        marginTop: "6px",
                        marginBottom: "10px",
                      }}
                    >
                      Reference something specific about this program — the AI will weave it in naturally. {specificMention.length}/200
                    </p>
                    {school.athleticsDomain && (
                      <button
                        onClick={() => {
                          const url = school.athleticsDomain.startsWith("http")
                            ? school.athleticsDomain
                            : `https://${school.athleticsDomain}`;
                          window.open(url, "_blank");
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "transparent",
                          border: "1px solid #2A2A2A",
                          borderRadius: "8px",
                          color: "#F8FAFC",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "11px",
                          letterSpacing: "0.05em",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#F5C518";
                          (e.currentTarget as HTMLButtonElement).style.color = "#F5C518";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2A2A2A";
                          (e.currentTarget as HTMLButtonElement).style.color = "#F8FAFC";
                        }}
                      >
                        🔗 FIND RECENT NEWS →
                      </button>
                    )}
                  </div>

                  {/* Generate / Regenerate button */}
                  {!emailDraft ? (
                    <button
                      onClick={handleGenerateEmail}
                      disabled={generateEmailMutation.isPending}
                      className="w-full py-3 flex items-center justify-center gap-2"
                      style={{
                        background: generateEmailMutation.isPending ? "#2A2A2A" : "#F5C518",
                        color: generateEmailMutation.isPending ? "#6B6B6B" : "#0A0A0A",
                        border: "none",
                        borderRadius: "0px",
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "14px",
                        letterSpacing: "0.12em",
                        cursor: generateEmailMutation.isPending ? "not-allowed" : "pointer",
                        transition: "background 200ms ease",
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
                          background: "#0D0D0D",
                          border: "1px solid #2A2A2A",
                          borderRadius: "4px",
                          color: "#F8FAFC",
                          fontFamily: "DM Sans, sans-serif",
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
                          e.currentTarget.style.borderColor = "#2A2A2A";
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
                            color: emailCopiedDraft ? "#22C55E" : "#94A3B8",
                            border: `1px solid ${emailCopiedDraft ? "#22C55E" : "#2A2A2A"}`,
                            borderRadius: "0px",
                            fontFamily: "Bebas Neue, sans-serif",
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
                            color: generateEmailMutation.isPending ? "#6B6B6B" : "#94A3B8",
                            border: "1px solid #2A2A2A",
                            borderRadius: "0px",
                            fontFamily: "Bebas Neue, sans-serif",
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
                            background: emailSent ? "#22C55E" : sending ? "#2A2A2A" : "#F5C518",
                            color: emailSent ? "#FFFFFF" : sending ? "#6B6B6B" : "#0A0A0A",
                            border: "none",
                            borderRadius: "0px",
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.1em",
                            cursor: sending || emailSent ? "not-allowed" : "pointer",
                            transition: "all 200ms ease",
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
                  </>
                  )}
                </div>
              )}

              {/* ─── TAB 5: LINKS ───────────────────────────────────────────────────── */}
              {activeTab === "links" && (
                <div className="space-y-4">
                  {/* Section label */}
                  <p
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                      color: "#6B6B6B",
                      textTransform: "uppercase",
                      marginBottom: "16px",
                    }}
                  >
                    Official links for {school.school}
                  </p>

                  {/* Link 1 — Recruiting Questionnaire (primary, larger card) */}
                  <div
                    style={{
                      background: schoolLinks?.recruitingQuestionnaireUrl ? "#1A1A1A" : "#141414",
                      border: "1px solid #2A2A2A",
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
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          color: "#6B6B6B",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        RECRUITING QUESTIONNAIRE
                      </p>
                      <p
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "15px",
                          color: schoolLinks?.recruitingQuestionnaireUrl ? "#FFFFFF" : "#4A4A4A",
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
                          color: "#0A0A0A",
                          border: "none",
                          borderRadius: "6px",
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "14px",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                          textDecoration: "none",
                          flexShrink: 0,
                          fontWeight: 700,
                        }}
                      >
                        OPEN <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Link 2 — Athletics Website */}
                  <div
                    style={{
                      background: schoolLinks?.athleticsWebsiteUrl ? "#1A1A1A" : "#141414",
                      border: "1px solid #2A2A2A",
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
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          color: "#6B6B6B",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        ATHLETICS WEBSITE
                      </p>
                      <p
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "14px",
                          color: schoolLinks?.athleticsWebsiteUrl ? "#FFFFFF" : "#4A4A4A",
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
                          color: "#FFFFFF",
                          border: "1px solid #FFFFFF",
                          borderRadius: "6px",
                          fontFamily: "Bebas Neue, sans-serif",
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
                fontFamily: "Bebas Neue, sans-serif",
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
                fontFamily: "Bebas Neue, sans-serif",
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

      {/* ── Commits Modal ── */}
      {showCommitsModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowCommitsModal(false)}
        >
          <div
            style={{
              background: "#1A1A1A", border: "1px solid #2A2A2A",
              borderRadius: "12px", width: "100%", maxWidth: "480px",
              maxHeight: "70vh", overflow: "hidden", display: "flex", flexDirection: "column",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #2A2A2A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "18px", color: "#F5C518", letterSpacing: "0.05em", margin: 0 }}>
                  KNOWN COMMITS — CLASS OF {selectedRosterYear}
                </p>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", marginTop: "4px" }}>
                  {schoolCommits.length} verified commit{schoolCommits.length !== 1 ? "s" : ""} · sourced from MiddleHitter.com
                </p>
              </div>
              <button onClick={() => setShowCommitsModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B6B", fontSize: "20px", lineHeight: 1 }}>×</button>
            </div>
            {/* Commit list */}
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px 20px" }}>
              {schoolCommits.map((commit, i) => (
                <div
                  key={commit.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: i < schoolCommits.length - 1 ? "1px solid #222" : "none",
                  }}
                >
                  <div>
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
                      {commit.name}
                    </p>
                    {(commit.club || commit.highSchool) && (
                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6B6B6B", margin: "2px 0 0" }}>
                        {[commit.club, commit.highSchool].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {commit.position && (
                    <span style={{
                      fontFamily: "Bebas Neue, sans-serif", fontSize: "13px",
                      color: "#F5C518", letterSpacing: "0.05em",
                      background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)",
                      borderRadius: "4px", padding: "3px 8px",
                    }}>
                      {commit.position}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              className="pre-send-modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: "#1A1A1A",
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
                  fontFamily: "Bebas Neue, sans-serif",
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
                        fontFamily: "DM Sans, sans-serif",
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
                    fontFamily: "DM Sans, sans-serif",
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
                    fontFamily: "DM Sans, sans-serif",
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
                    background: "#2A2A2A",
                    marginBottom: "12px",
                  }}
                />
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    color: "#94A3B8",
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
                    fontFamily: "Bebas Neue, sans-serif",
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
                    fontFamily: "Bebas Neue, sans-serif",
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
                background: "#1A1A1A",
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
                  fontFamily: "Bebas Neue, sans-serif",
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
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "#94A3B8",
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
                    fontFamily: "Bebas Neue, sans-serif",
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
                    fontFamily: "DM Sans, sans-serif",
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
                  fontFamily: "Bebas Neue, sans-serif",
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
