/**
 * RecruitPath — Men's Volleyball School & Coach Directory
 * All schools loaded from DB via tRPC volleyball.schools
 * 22 schools with full roster data + 8 locked schools
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/useMobile";
import { Search, X, ExternalLink, Plus, Check, Lock, SlidersHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useModal } from "@/contexts/ModalContext";
import SchoolLogoImg from "@/components/SchoolLogo";
import SchoolDetailModal from "@/components/SchoolDetailModal";
import ProGate from "@/components/ProGate";
import AppFooter from "@/components/AppFooter";

const ATHLETE_STORAGE_KEY = "recruitpath_athlete_profile";

const STADIUM_BG = "/manus-storage/pasted_file_N6sbJH_image_0302cfa5.png";
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "CC"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const OPENING_POSITIONS = ["OH", "MB", "OPP", "S", "L", "DS"] as const;
const OPENING_POSITION_LABELS: Record<string, string> = {
  OH: "Outside Hitter",
  MB: "Middle Blocker",
  OPP: "Opposite",
  S: "Setter",
  L: "Libero",
  DS: "Defensive Specialist",
};
const OPENING_YEARS = ["2026", "2027", "2028", "2029"] as const;

function normalizeOpeningPosition(value: string): string | null {
  const token = value.trim().toLowerCase();
  if (!token) return null;
  if (["oh", "outside hitter", "outside", "pin", "wing"].includes(token)) return "OH";
  if (["mb", "middle blocker", "middle", "mh"].includes(token)) return "MB";
  if (["opp", "opposite", "rs", "right side"].includes(token)) return "OPP";
  if (["s", "setter", "set"].includes(token)) return "S";
  if (["l", "libero", "lib"].includes(token)) return "L";
  if (["ds", "defensive specialist", "def specialist", "defensive"].includes(token)) return "DS";
  return null;
}

function loadOpeningDefaults() {
  try {
    const raw = localStorage.getItem(ATHLETE_STORAGE_KEY);
    const profile = raw ? JSON.parse(raw) : {};
    const tokens = String(profile.positions || "")
      .split(/[,/&]|\band\b/gi)
      .map((token: string) => normalizeOpeningPosition(token))
      .filter(Boolean) as string[];
    return {
      positions: Array.from(new Set(tokens)),
      gradYear: String(profile.graduationYear || "2027").trim() || "2027",
    };
  } catch {
    return { positions: [], gradYear: "2027" };
  }
}

// ── FIND MY OPENING filter sheet (extracted component to satisfy React hooks rules) ──
const OPENING_DIVISIONS_CONST = ["D1", "D2", "D3", "NAIA", "CC"] as const;
function OpeningFilterSheet({
  initialSort,
  initialDivisions,
  onApply,
  onClose,
}: {
  initialSort: "most" | "least" | "az";
  initialDivisions: string[];
  onApply: (sort: "most" | "least" | "az", divisions: string[]) => void;
  onClose: () => void;
}) {
  const [draftSort, setDraftSort] = useState<"most" | "least" | "az">(initialSort);
  const [draftDivisions, setDraftDivisions] = useState<string[]>(initialDivisions);
  const toggleDiv = (d: string) => setDraftDivisions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  return (
    <motion.div
      key="opening-filter-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80]"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="absolute bottom-0 left-0 right-0"
        style={{ background: "rgba(12,16,26,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "20px 20px 0 0", padding: "20px 24px 40px", maxHeight: "80vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-5">
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.18)" }} />
        </div>
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", letterSpacing: "0.06em", color: "#FFFFFF" }}>FILTER RESULTS</h3>
          <button onClick={onClose} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {/* Sort by */}
        <div className="mb-6">
          <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.1em", color: "#F5B800", marginBottom: "12px" }}>SORT BY</p>
          <div className="flex flex-col gap-2">
            {(["most", "least", "az"] as const).map((opt) => {
              const labels = { most: "Most openings first", least: "Least openings first", az: "A–Z by school name" };
              return (
                <button key={opt} onClick={() => setDraftSort(opt)} className="flex items-center gap-3 cursor-pointer" style={{ padding: "12px 16px", borderRadius: "10px", border: draftSort === opt ? "1px solid #F5B800" : "1px solid rgba(255,255,255,0.08)", background: draftSort === opt ? "rgba(245,184,0,0.1)" : "rgba(255,255,255,0.03)", textAlign: "left" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: draftSort === opt ? "2px solid #F5B800" : "2px solid #555", background: draftSort === opt ? "#F5B800" : "transparent", flexShrink: 0 }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: draftSort === opt ? "#FFFFFF" : "#A3A3A3" }}>{labels[opt]}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Division */}
        <div className="mb-8">
          <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.1em", color: "#F5B800", marginBottom: "12px" }}>DIVISION</p>
          <div className="flex flex-col gap-2">
            {OPENING_DIVISIONS_CONST.map((div) => (
              <button key={div} onClick={() => toggleDiv(div)} className="flex items-center gap-3 cursor-pointer" style={{ padding: "12px 16px", borderRadius: "10px", border: draftDivisions.includes(div) ? "1px solid #F5B800" : "1px solid rgba(255,255,255,0.08)", background: draftDivisions.includes(div) ? "rgba(245,184,0,0.1)" : "rgba(255,255,255,0.03)", textAlign: "left" }}>
                <div className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: "3px", border: draftDivisions.includes(div) ? "none" : "2px solid #555", background: draftDivisions.includes(div) ? "#F5B800" : "transparent", flexShrink: 0 }}>
                  {draftDivisions.includes(div) && <Check size={10} style={{ color: "#0A0E1A" }} />}
                </div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: draftDivisions.includes(div) ? "#FFFFFF" : "#A3A3A3" }}>{div}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Apply / Clear */}
        <div className="flex gap-3">
          <button
            onClick={() => { onApply(draftSort, draftDivisions); onClose(); }}
            className="flex-1 cursor-pointer"
            style={{ height: "48px", background: "#F5B800", color: "#0A0E1A", border: "none", borderRadius: "10px", fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", letterSpacing: "0.08em" }}
          >
            APPLY
          </button>
          <button
            onClick={() => { setDraftSort("most"); setDraftDivisions(["D1", "D2", "D3", "NAIA", "CC"]); }}
            className="cursor-pointer"
            style={{ height: "48px", padding: "0 20px", background: "transparent", color: "#A3A3A3", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600 }}
          >
            CLEAR
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

type DBSchool = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  division: string | null;
  conference: string | null;
  hasRosterData: boolean;
  brandColor: string | null;
  athleticsDomain: string | null;
  coachName: string | null;
  coachTitle: string | null;
  coachEmail: string | null;
  logoUrl: string | null;
  logoBackgroundColor?: string | null;
  logoMixBlendMode?: string | null;
  /** Dev-only flag — true for the owner-only TEST SCHOOL entry */
  isTestSchool: boolean;
  createdAt: Date;
};

function SchoolLogo({ domain, brandColor, size = 48, name, logoUrl }: { domain: string | null; brandColor: string | null; size?: number; name?: string; logoUrl?: string | null }) {
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

function SchoolCard({
  school,
  isAdded,
  onAdd,
  isLocked,
  onLockedClick,
  isPending,
  isFlipped,
  onFlip,
}: {
  school: DBSchool;
  isAdded: boolean;
  onAdd: () => void;
  isLocked: boolean;
  onLockedClick: () => void;
  isPending: boolean;
  isFlipped: boolean;
  onFlip: () => void;
  staggerIndex?: number;
}) {
  const isMobile = useIsMobile();
  const handleCardClick = () => {
    if (isLocked && !isAdded) {
      onLockedClick();
      return;
    }
    onFlip();
  };
  return (
    <div
      className="school-card h-56"
      style={{
        perspective: "800px",
        opacity: isLocked && !isAdded ? 0.4 : 1,
        cursor: isLocked && !isAdded ? "not-allowed" : "pointer",
      }}
      onMouseEnter={() => { if (!isMobile && !isLocked) onFlip(); }}
      onMouseLeave={() => { if (!isMobile && !isLocked && isFlipped) onFlip(); }}
      onClick={handleCardClick}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped && !isLocked ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            background: isAdded ? "rgba(245,184,0,0.05)" : "#0F172A",
            border: isAdded ? "2px solid #F5B800" : "1px solid #1E293B",
            borderRadius: "4px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Yellow TEST badge — only visible on the dev test school */}
          {school.isTestSchool && (
            <div
              className="absolute top-3 left-3"
              style={{
                background: "#F5B800",
                color: "#0A0E1A",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "10px",
                letterSpacing: "0.12em",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "2px",
                lineHeight: 1.4,
              }}
            >
              TEST
            </div>
          )}
          {isAdded && (
            <div
              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#F5B800" }}
            >
              <Check size={12} style={{ color: "#0A0E1A" }} />
            </div>
          )}
          {!school.hasRosterData && !isAdded && (
            <div className="absolute top-3 right-3">
              <Lock size={14} style={{ color: "#94A3B8" }} />
            </div>
          )}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <SchoolLogo domain={school.athleticsDomain} brandColor={school.brandColor} size={48} name={school.name} logoUrl={school.logoUrl} />
                <span
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: "#94A3B8",
                    padding: "2px 8px",
                    background: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: "2px",
                  }}
                >
                  {school.division || "—"}
                </span>
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>
                {school.city}, {school.state}
              </span>
            </div>
            <h3
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.1,
                marginBottom: "4px",
              }}
            >
              {school.name.toUpperCase()}
            </h3>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>
              {school.conference || "—"}
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "#F5B800",
                marginBottom: "4px",
              }}
            >
              MEN'S VOLLEYBALL
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF" }}>
              {school.coachName || "Coach TBD"}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>
              {school.coachTitle || "Head Coach"}
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#0F172A",
            border: "1px solid #F5B800",
            borderRadius: "4px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <SchoolLogo domain={school.athleticsDomain} brandColor={school.brandColor} size={48} name={school.name} logoUrl={school.logoUrl} />
              <div>
                <h3
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    lineHeight: 1.1,
                  }}
                >
                  {(school.coachName || "Coach TBD").toUpperCase()}
                </h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>
                  {school.coachTitle || "Head Coach"} · {school.name}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>
                {school.conference} · {school.division}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>
                {school.city}, {school.state}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold tracking-wider uppercase"
              style={{
                background: isAdded ? "transparent" : "#F5B800",
                color: isAdded ? "#F5B800" : "#0A0E1A",
                border: isAdded ? "1px solid #F5B800" : "none",
                borderRadius: "0px",
                fontFamily: "Barlow Condensed, sans-serif",
                letterSpacing: "0.1em",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isAdded ? <Check size={12} /> : <Plus size={12} />}
              {isPending ? "..." : isAdded ? "ADDED" : "ADD TO LIST"}
            </button>
            {school.athleticsDomain && (
              <a
                href={`https://${school.athleticsDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-9"
                style={{ border: "1px solid #1E293B", borderRadius: "0px" }}
              >
                <ExternalLink size={14} style={{ color: "#94A3B8" }} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Schools() {
  const openingDefaults = loadOpeningDefaults();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [showFindOpeningsModal, setShowFindOpeningsModal] = useState(false);
  const [selectedOpeningPositions, setSelectedOpeningPositions] = useState<string[]>(openingDefaults.positions);
  const [selectedOpeningGradYear, setSelectedOpeningGradYear] = useState<string>(openingDefaults.gradYear);
  const [hasSearchedOpenings, setHasSearchedOpenings] = useState(false);
  const [selectedOpeningSchool, setSelectedOpeningSchool] = useState<DBSchool | null>(null);
  // FIND MY OPENING filter state
  const [showOpeningFilterSheet, setShowOpeningFilterSheet] = useState(false);
  const [openingSortBy, setOpeningSortBy] = useState<"most" | "least" | "az">("most");
  const [openingDivisionFilter, setOpeningDivisionFilter] = useState<string[]>(["D1", "D2", "D3", "NAIA", "CC"]);
  const OPENING_DIVISIONS = ["D1", "D2", "D3", "NAIA", "CC"];
  const isOpeningFilterActive = openingSortBy !== "most" || openingDivisionFilter.length !== OPENING_DIVISIONS.length;
  const { isAuthenticated } = useAuth();
  const { openModal, closeModal } = useModal();
  const [, navigate] = useLocation();

  // ── Profile completeness check — sourced from the real saved profile ──────
  const { data: dbAthleteProfile, isLoading: athleteProfileLoading } = trpc.athleteProfile.get.useQuery(
    undefined,
    { enabled: isAuthenticated, retry: false }
  );
  const missingProfileFields = useMemo(() => {
    if (!isAuthenticated || athleteProfileLoading) return []; // don't gate while loading or logged out
    const profile: Partial<Record<"firstName" | "lastName" | "graduationYear" | "positions" | "highSchool", string | null>> =
      dbAthleteProfile ?? {};
    const missing: string[] = [];
    if (!profile.firstName?.trim()) missing.push("First Name");
    if (!profile.lastName?.trim()) missing.push("Last Name");
    if (!profile.graduationYear?.trim()) missing.push("Graduation Year");
    if (!profile.positions?.trim()) missing.push("Position");
    if (!profile.highSchool?.trim()) missing.push("High School");
    return missing;
  }, [isAuthenticated, athleteProfileLoading, dbAthleteProfile]);
  const utils = trpc.useUtils();

  // Load all volleyball schools from DB
  const { data: schoolsData, isLoading: schoolsLoading } = trpc.volleyball.schools.useQuery();

  // Real subscription status from API
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Roster openings query — only fires after user clicks FIND MY OPENINGS
  const { data: rosterOpeningResults = [], isFetching: rosterOpeningsLoading } = trpc.volleyball.rosterOpenings.useQuery(
    { positions: selectedOpeningPositions, gradYear: selectedOpeningGradYear },
    { enabled: hasSearchedOpenings && selectedOpeningPositions.length > 0, staleTime: 60_000 }
  );

  // Outreach list from API
  const { data: outreachData } = trpc.outreach.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addedSchoolIds = useMemo(() => {
    if (!outreachData) return new Set<string>();
    return new Set(outreachData.map((item: any) => item.schoolId));
  }, [outreachData]);

  const addToOutreach = trpc.outreach.add.useMutation({
    onSuccess: () => {
      utils.outreach.list.invalidate();
      utils.subscription.status.invalidate();
    },
    onError: (err) => {
      if (err.message.includes("SCHOOL_LIMIT_REACHED")) {
        setShowUpgradeModal(true);
      } else {
        toast.error(err.message);
      }
    },
  });

  const removeFromOutreach = trpc.outreach.remove.useMutation({
    onSuccess: () => {
      utils.outreach.list.invalidate();
      utils.subscription.status.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const userPlan = subStatus?.plan || "free";
  const hasPaidAccess = subStatus?.hasPaidAccess ?? false;
  const schoolsLimit = subStatus?.schoolsLimit ?? 5;
  const schoolsUsed = subStatus?.schoolsUsed ?? 0;
  const isUnlimited = hasPaidAccess || schoolsLimit === -1;
  const isAtLimit = !isUnlimited && schoolsUsed >= schoolsLimit;

  const toggleDivision = (div: string) => {
    setSelectedDivisions((prev) =>
      prev.includes(div) ? prev.filter((d) => d !== div) : [...prev, div]
    );
  };

  const toggleOpeningPosition = (position: string) => {
    setSelectedOpeningPositions((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]
    );
  };

  const handleFindOpenings = () => {
    if (selectedOpeningPositions.length === 0) {
      toast.error("Select at least one position.");
      return;
    }
    setHasSearchedOpenings(true);
  };

  const handleToggleSchool = (school: DBSchool) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add schools to your list.");
      return;
    }
    if (addedSchoolIds.has(school.id)) {
      removeFromOutreach.mutate({ schoolId: school.id });
    } else {
      if (isAtLimit) {
        setShowUpgradeModal(true);
        return;
      }
      addToOutreach.mutate({
        schoolId: school.id,
        schoolName: school.name,
        coachName: school.coachName || undefined,
        sport: "Men's Volleyball",
        division: school.division || undefined,
      });
    }
  };

  const filteredSchools = useMemo(() => {
    if (!schoolsData) return [];
    return schoolsData.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.coachName || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchDivision =
        selectedDivisions.length === 0 || selectedDivisions.includes(s.division || "");
      const matchState = !selectedState || s.state === selectedState;
      return matchSearch && matchDivision && matchState;
    });
  }, [schoolsData, searchQuery, selectedDivisions, selectedState]);

  const availableDivisions = useMemo(() => {
    if (!schoolsData) return [];
    const divs = new Set(schoolsData.map((s) => s.division || ""));
    return DIVISIONS.filter((d) => divs.has(d));
  }, [schoolsData]);

  const counterText = isUnlimited
    ? `${schoolsUsed} SELECTED — UNLIMITED`
    : `${schoolsUsed} / ${schoolsLimit} SELECTED`;

  return (
    <>
    <div className="min-h-screen pb-8" style={{ background: "#0A0E1A" }}>
      {/* ── Profile Lock Screen ── */}
      <AnimatePresence>
        {isAuthenticated && missingProfileFields.length > 0 && (
          <motion.div
            key="profile-lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-8 py-12"
              style={{ maxWidth: 480 }}
            >
              {/* Lock icon */}
              <div
                className="flex items-center justify-center mb-6"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(245,184,0,0.1)",
                  border: "1px solid rgba(245,184,0,0.25)",
                }}
              >
                <Lock size={32} color="#F5B800" />
              </div>

              {/* Headline */}
              <h2
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "clamp(32px, 6vw, 48px)",
                  color: "#FFFFFF",
                  letterSpacing: "0.02em",
                  lineHeight: 1.05,
                  marginBottom: "16px",
                }}
              >
                COMPLETE YOUR PROFILE FIRST
              </h2>

              {/* Body */}
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#94A3B8",
                  lineHeight: 1.65,
                  marginBottom: "28px",
                }}
              >
                Fill in a few key details before exploring schools. Coaches need to know who you are.
              </p>

              {/* Missing field pills */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {missingProfileFields.map((field) => (
                  <span
                    key={field}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#F5B800",
                      background: "rgba(245,184,0,0.1)",
                      border: "1px solid rgba(245,184,0,0.3)",
                      borderRadius: "4px",
                      padding: "4px 10px",
                    }}
                  >
                    {field}
                  </span>
                ))}
              </div>

              {/* CTA button */}
              <motion.button
                whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/profile")}
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "18px",
                  letterSpacing: "0.1em",
                  color: "#0A0E1A",
                  background: "#F5B800",
                  border: "none",
                  borderRadius: "6px",
                  padding: "14px 36px",
                  cursor: "pointer",
                }}
              >
                COMPLETE MY PROFILE →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sticky limit banner */}
      <AnimatePresence>
        {isAtLimit && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="sticky top-0 z-30 px-4 md:px-6 py-3"
            style={{ background: "#0A0E1A" }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="hidden md:block text-[14px] md:text-[18px]"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  color: "#F5B800",
                  letterSpacing: "0.05em",
                  lineHeight: 1.3,
                }}
              >
                <span className="hidden md:inline">YOU'VE REACHED THE FREE LIMIT — UPGRADE TO PRO FOR UNLIMITED SCHOOLS →</span>
                <span className="md:hidden">FREE LIMIT REACHED — UPGRADE TO PRO →</span>
              </span>
              <Link href="/pricing">
                <button
                  className="shrink-0 hidden md:block font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "#F5B800",
                    color: "#0A0E1A",
                    fontFamily: "Barlow Condensed, sans-serif",
                    letterSpacing: "0.1em",
                    border: "none",
                    borderRadius: "0px",
                    height: "36px",
                    padding: "0 12px",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  SEE PLANS
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${STADIUM_BG})` }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(10,14,26,0.75)" }} />
        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <span
                className="hidden md:block"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.15em",
                  color: "#94A3B8",
                }}
              >
                MEN'S VOLLEYBALL — COACH DIRECTORY
              </span>
              <h1
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "clamp(22px, 5vw, 48px)",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                <span className="md:hidden">SCHOOLS</span>
                <span className="hidden md:inline">FIND YOUR COACHES</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden md:block"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "18px",
                  color: isAtLimit ? "#FF4444" : "#F5B800",
                  letterSpacing: "0.05em",
                }}
              >
                {counterText}
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowTargetList(!showTargetList)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase cursor-pointer"
                style={{
                  background: schoolsUsed > 0 ? "#F5B800" : "transparent",
                  color: schoolsUsed > 0 ? "#0A0E1A" : "#FFFFFF",
                  border: schoolsUsed > 0 ? "none" : "1px solid #1E293B",
                  borderRadius: "0px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  letterSpacing: "0.1em",
                }}
              >
                MY LIST ({schoolsUsed})
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {/* FIND MY OPENING card */}
        <button
          onClick={() => setShowFindOpeningsModal(true)}
          className="w-full mb-6 text-left cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(245,184,0,0.1), rgba(245,184,0,0.04))",
            border: "1px solid rgba(245,184,0,0.35)",
            borderRadius: "8px",
            padding: "18px 20px",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "clamp(22px, 3vw, 28px)",
                  letterSpacing: "0.05em",
                  color: "#F5B800",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span>FIND MY OPENING →</span>
                {!hasPaidAccess && <Lock size={16} style={{ color: "#F5B800" }} />}
              </div>
              <p
                style={{
                  marginTop: "8px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#A3A3A3",
                  lineHeight: 1.5,
                }}
              >
                Match your position and class year with real roster turnover across every program.
              </p>
            </div>
            <div
              className="hidden md:flex items-center justify-center flex-shrink-0"
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "rgba(245,184,0,0.12)",
                border: "1px solid rgba(245,184,0,0.2)",
                color: "#F5B800",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "18px",
              }}
            >
              GO
            </div>
          </div>
        </button>
        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by school, coach, or city..."
            className="w-full pl-10 pr-4 py-3"
            style={{
              background: "#111827",
              border: "1px solid #1E293B",
              borderRadius: "4px",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              color: "#FFFFFF",
              outline: "none",
            }}
          />
        </div>

        {/* Mobile filter row: horizontally scrollable division chips */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 -mx-4 px-4 mb-4" style={{ scrollbarWidth: 'none' }}>
          {availableDivisions.map((div) => (
            <button
              key={div}
              onClick={() => toggleDivision(div)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                background: selectedDivisions.includes(div) ? '#F5B800' : '#111827',
                color: selectedDivisions.includes(div) ? '#0A0E1A' : '#A3A3A3',
                border: selectedDivisions.includes(div) ? 'none' : '1px solid #1E293B',
                whiteSpace: 'nowrap',
              }}
            >
              {div}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar: hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:w-56 flex-shrink-0">
            <div
              style={{
                background: "#0F172A",
                border: "1px solid #1E293B",
                borderRadius: "4px",
                padding: "20px",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.15em",
                    color: "#FFFFFF",
                  }}
                >
                  FILTERS
                </h3>
                {(selectedDivisions.length > 0 || selectedState) && (
                  <button
                    onClick={() => { setSelectedDivisions([]); setSelectedState(""); }}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#F5B800",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Division filter */}
              <div className="mb-5">
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.15em",
                    color: "#94A3B8",
                    marginBottom: "12px",
                  }}
                >
                  DIVISION
                </p>
                <div className="space-y-2">
                  {availableDivisions.map((div) => (
                    <label key={div} className="flex items-center gap-2.5 cursor-pointer group">
                      <div
                        onClick={() => toggleDivision(div)}
                        className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                        style={{
                          background: selectedDivisions.includes(div) ? "#F5B800" : "transparent",
                          border: selectedDivisions.includes(div) ? "none" : "1px solid #1E293B",
                          borderRadius: "2px",
                          cursor: "pointer",
                        }}
                      >
                        {selectedDivisions.includes(div) && <Check size={10} style={{ color: "#0A0E1A" }} />}
                      </div>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          color: selectedDivisions.includes(div) ? "#FFFFFF" : "#A3A3A3",
                        }}
                      >
                        {div}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* State filter */}
              <div>
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.15em",
                    color: "#94A3B8",
                    marginBottom: "12px",
                  }}
                >
                  STATE
                </p>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: "4px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: selectedState ? "#FFFFFF" : "#94A3B8",
                    outline: "none",
                  }}
                >
                  <option value="">All States</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </aside>

          {/* School card grid */}
          <main className="flex-1 min-w-0">
            <div className="hidden md:flex items-center justify-between mb-4">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#94A3B8" }}>
                Showing <span style={{ color: "#FFFFFF", fontWeight: 500 }}>{filteredSchools.filter(s => !s.isTestSchool).length}</span> programs
                {" · "}
                <span style={{ color: "#F5B800" }}>Men's Volleyball</span>
              </p>
            </div>

            {schoolsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse"
                    style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "4px" }}
                  />
                ))}
              </div>
            ) : filteredSchools.length === 0 ? (
              <div
                className="p-12 text-center"
                style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "4px" }}
              >
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#94A3B8" }}>
                  No programs match your filters. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSchools.map((school, i) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    isAdded={addedSchoolIds.has(school.id)}
                    onAdd={() => handleToggleSchool(school)}
                    isLocked={isAtLimit && !addedSchoolIds.has(school.id)}
                    onLockedClick={() => setShowUpgradeModal(true)}
                    isPending={addToOutreach.isPending || removeFromOutreach.isPending}
                    isFlipped={flippedId === school.id}
                    onFlip={() => setFlippedId((prev) => prev === school.id ? null : school.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Target List Drawer */}
      <AnimatePresence>
        {showTargetList && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-40 flex flex-col"
            style={{
              background: "#0F172A",
              borderLeft: "1px solid #1E293B",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #1E293B" }}>
              <h2
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                MY TARGET SCHOOLS
              </h2>
              <button
                onClick={() => setShowTargetList(false)}
                style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!outreachData || outreachData.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#94A3B8" }}>
                    No schools added yet. Hover a card and click "Add to List".
                  </p>
                </div>
              ) : (
                outreachData.map((item: any) => {
                  const dbEntry = schoolsData?.find((s) => s.id === item.schoolId);
                  return (
                    <div
                      key={item.schoolId}
                      className="flex items-start justify-between p-3"
                      style={{ background: "#0A0E1A", border: "1px solid #1E293B", borderRadius: "4px" }}
                    >
                      <div className="flex items-start gap-3">
                        {dbEntry && (
                          <SchoolLogo domain={dbEntry.athleticsDomain} brandColor={dbEntry.brandColor} size={40} name={dbEntry.name} logoUrl={dbEntry.logoUrl} />
                        )}
                        <div>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF", fontWeight: 500 }}>
                            {item.schoolName || dbEntry?.name || "Unknown School"}
                          </p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>
                            {item.coachName || dbEntry?.coachName || ""} · Men's Volleyball
                          </p>
                          <span
                            style={{
                              fontFamily: "Barlow Condensed, sans-serif",
                              fontSize: "11px",
                              letterSpacing: "0.1em",
                              color: "#94A3B8",
                              padding: "1px 6px",
                              background: "#111827",
                              border: "1px solid #1E293B",
                              borderRadius: "2px",
                              display: "inline-block",
                              marginTop: "4px",
                            }}
                          >
                            {item.division || dbEntry?.division || "—"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromOutreach.mutate({ schoolId: item.schoolId })}
                        style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", marginTop: "2px" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {outreachData && outreachData.length > 0 && (
              <div className="p-4" style={{ borderTop: "1px solid #1E293B" }}>
                <button
                  className="w-full py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "#F5B800",
                    color: "#0A0E1A",
                    fontFamily: "Barlow Condensed, sans-serif",
                    letterSpacing: "0.1em",
                    border: "none",
                    borderRadius: "0px",
                  }}
                  onClick={() => window.location.href = "/dashboard"}
                >
                  GO TO DASHBOARD ({outreachData.length})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0F172A",
                border: "2px solid #F5B800",
                borderRadius: "4px",
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
                    color: "#FFFFFF",
                  }}
                >
                  YOU'VE HIT YOUR LIMIT.
                </h3>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-2xl cursor-pointer"
                  style={{ color: "#94A3B8", background: "none", border: "none" }}
                >
                  ×
                </button>
              </div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#A3A3A3",
                  marginBottom: "24px",
                  lineHeight: 1.6,
                }}
              >
                You've reached the 5 school limit for free accounts. Upgrade to Pro from $25/month to add unlimited schools.
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "#94A3B8",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}
              >
                Removing schools from your dashboard does not reset your limit.
              </p>
              <div className="flex gap-3">
                <Link href="/pricing" className="flex-1">
                  <button
                    className="w-full py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                    style={{
                      background: "#F5B800",
                      color: "#0A0E1A",
                      fontFamily: "Barlow Condensed, sans-serif",
                      letterSpacing: "0.1em",
                      border: "none",
                      borderRadius: "0px",
                    }}
                  >
                    SEE PRICING →
                  </button>
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "transparent",
                    color: "#FFFFFF",
                    fontFamily: "Barlow Condensed, sans-serif",
                    letterSpacing: "0.1em",
                    border: "1px solid #FFFFFF",
                    borderRadius: "0px",
                  }}
                >
                  DISMISS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIND MY OPENING Modal */}
      <AnimatePresence>
        {showFindOpeningsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.72)" }}
            onClick={() => setShowFindOpeningsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:max-w-4xl max-h-[90vh] overflow-y-auto"
              style={{
                background: "#10131D",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px 20px 0 0",
                padding: "24px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-4 md:hidden">
                <div style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "22px", letterSpacing: "0.05em", color: "#FFFFFF" }}>
                    FIND YOUR ROSTER OPENING
                  </h2>
                  <p style={{ marginTop: "8px", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#94A3B8", lineHeight: 1.6, maxWidth: "640px" }}>
                    Tell us your position and graduation year &mdash; we&apos;ll find every program with a real opening for you.
                  </p>
                </div>
                <button onClick={() => setShowFindOpeningsModal(false)} className="cursor-pointer flex-shrink-0" style={{ color: "#FFFFFF", background: "none", border: "none" }} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-5">
                <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.08em", color: "#F5B800", marginBottom: "12px" }}>POSITION</p>
                <div className="flex flex-wrap gap-2">
                  {OPENING_POSITIONS.map((position) => {
                    const active = selectedOpeningPositions.includes(position);
                    return (
                      <button key={position} onClick={() => toggleOpeningPosition(position)} className="cursor-pointer" style={{ padding: "10px 14px", borderRadius: 999, border: active ? "1px solid #F5B800" : "1px solid #1E293B", background: active ? "#F5B800" : "#0F172A", color: active ? "#0A0E1A" : "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}>
                        {position} &middot; {OPENING_POSITION_LABELS[position]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "0.08em", color: "#F5B800", marginBottom: "12px" }}>GRADUATION YEAR</p>
                <div className="flex flex-wrap gap-2">
                  {OPENING_YEARS.map((year) => {
                    const active = selectedOpeningGradYear === year;
                    return (
                      <button key={year} onClick={() => setSelectedOpeningGradYear(year)} className="cursor-pointer" style={{ padding: "10px 16px", borderRadius: 999, border: active ? "1px solid #F5B800" : "1px solid #1E293B", background: active ? "#F5B800" : "#0F172A", color: active ? "#0A0E1A" : "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}>
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleFindOpenings} className="w-full cursor-pointer" style={{ height: "48px", background: "#F5B800", color: "#0A0E1A", borderRadius: "8px", border: "none", fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", letterSpacing: "0.08em" }}>
                FIND MY OPENINGS →
              </button>

              {hasSearchedOpenings && (
                <div className="relative mt-6">
                  {/* Filter button row */}
                  {!rosterOpeningsLoading && rosterOpeningResults.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#94A3B8" }}>
                        {(() => {
                          const filtered = rosterOpeningResults
                            .filter(r => openingDivisionFilter.length === 0 || openingDivisionFilter.includes(r.division || ""))
                            .sort((a, b) => openingSortBy === "most" ? b.positionOpenings - a.positionOpenings : openingSortBy === "least" ? a.positionOpenings - b.positionOpenings : (a.schoolName || "").localeCompare(b.schoolName || ""));
                          return `${filtered.length} program${filtered.length !== 1 ? "s" : ""} found`;
                        })()}
                      </p>
                      <button
                        onClick={() => setShowOpeningFilterSheet(true)}
                        className="flex items-center gap-1.5 cursor-pointer relative"
                        style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#FFFFFF", letterSpacing: "0.04em" }}
                      >
                        <SlidersHorizontal size={13} />
                        FILTER
                        {isOpeningFilterActive && (
                          <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#F5B800", border: "1.5px solid #10131D" }} />
                        )}
                      </button>
                    </div>
                  )}
                  <div style={{ filter: !hasPaidAccess ? "blur(10px)" : "none", opacity: !hasPaidAccess ? 0.55 : 1, transition: "filter 0.2s ease, opacity 0.2s ease" }}>
                    {rosterOpeningsLoading ? (
                      <div style={{ padding: "24px 0", fontFamily: "Inter, sans-serif", color: "#94A3B8" }}>Finding roster openings...</div>
                    ) : rosterOpeningResults.length === 0 ? (
                      <div style={{ marginTop: "8px", background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px", padding: "20px", fontFamily: "Inter, sans-serif", color: "#CBD5E1" }}>
                        No openings found for your criteria. Try a different position or year.
                      </div>
                    ) : (() => {
                      const displayResults = rosterOpeningResults
                        .filter(r => openingDivisionFilter.length === 0 || openingDivisionFilter.includes(r.division || ""))
                        .sort((a, b) => openingSortBy === "most" ? b.positionOpenings - a.positionOpenings : openingSortBy === "least" ? a.positionOpenings - b.positionOpenings : (a.schoolName || "").localeCompare(b.schoolName || ""));
                      return displayResults.length === 0 ? (
                        <div style={{ marginTop: "8px", background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px", padding: "20px", fontFamily: "Inter, sans-serif", color: "#CBD5E1" }}>
                          No programs match your current filters.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {displayResults.map((result) => {
                            const school = schoolsData?.find((entry) => entry.id === result.schoolId);
                            if (!school) return null;
                            return (
                              <div key={result.schoolId} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px", padding: "18px" }}>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <SchoolLogo domain={school.athleticsDomain} brandColor={school.brandColor} size={44} name={school.name} logoUrl={school.logoUrl} />
                                    <div className="min-w-0">
                                      <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", color: "#FFFFFF", lineHeight: 1 }}>{school.name}</div>
                                      <div style={{ marginTop: "4px", fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8" }}>{school.division || "—"}</div>
                                    </div>
                                  </div>
                                  <div style={{ minWidth: "80px", textAlign: "center", background: "rgba(245,184,0,0.12)", border: "1px solid rgba(245,184,0,0.24)", borderRadius: "999px", padding: "8px 10px" }}>
                                    <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "18px", color: "#F5B800", lineHeight: 1 }}>{result.positionOpenings}</div>
                                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#F5B800", marginTop: "2px" }}>OPENINGS</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setSelectedOpeningSchool(school); setShowFindOpeningsModal(false); openModal(); }}
                                  className="w-full cursor-pointer"
                                  style={{ height: "42px", borderRadius: "8px", background: "transparent", border: "1px solid #F5B800", color: "#F5B800", fontFamily: "Barlow Condensed, sans-serif", fontSize: "14px", letterSpacing: "0.08em" }}
                                >
                                  VIEW SCHOOL →
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  {!hasPaidAccess && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <ProGate headline="UPGRADE TO PRO TO SEE YOUR OPENINGS" subtext="Free users can run the search, but Pro unlocks the ranked roster-opening results for every program." />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIND MY OPENING — Filter Sheet */}
      <AnimatePresence>
        {showOpeningFilterSheet && (
          <OpeningFilterSheet
            initialSort={openingSortBy}
            initialDivisions={openingDivisionFilter}
            onApply={(sort, divisions) => { setOpeningSortBy(sort); setOpeningDivisionFilter(divisions); }}
            onClose={() => setShowOpeningFilterSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* School Detail Modal opened from FIND MY OPENING results */}
      {selectedOpeningSchool && (
        <SchoolDetailModal
          school={{
            id: selectedOpeningSchool.id,
            school: selectedOpeningSchool.name,
            city: selectedOpeningSchool.city || "",
            state: selectedOpeningSchool.state || "",
            division: selectedOpeningSchool.division || "",
            conference: selectedOpeningSchool.conference || "",
            sport: "Men's Volleyball",
            coachName: selectedOpeningSchool.coachName || "TBD",
            coachTitle: selectedOpeningSchool.coachTitle || "Head Coach",
            coachEmail: selectedOpeningSchool.coachEmail || "",
            athleticsDomain: selectedOpeningSchool.athleticsDomain || "",
            brandColor: selectedOpeningSchool.brandColor || "#F5B800",
            hasRosterData: !!selectedOpeningSchool.hasRosterData,
            logoUrl: selectedOpeningSchool.logoUrl || null,
          }}
          onClose={() => { setSelectedOpeningSchool(null); closeModal(); }}
          isInOutreachList={addedSchoolIds.has(selectedOpeningSchool.id)}
          onToggleOutreach={() => handleToggleSchool(selectedOpeningSchool)}
          initialTab="school"
        />
      )}

      <AppFooter />
    </div>
    </>
  );
}
