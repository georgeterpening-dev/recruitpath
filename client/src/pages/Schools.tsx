/**
 * RecruitPath — Men's Volleyball School & Coach Directory
 * All schools loaded from DB via tRPC volleyball.schools
 * 22 schools with full roster data + 8 locked schools
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, X, ExternalLink, Plus, Check, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SchoolLogoImg from "@/components/SchoolLogo";
import AppFooter from "@/components/AppFooter";
import AppTopNav from "@/components/AppTopNav";
import { useIntersectionAnimation } from "@/hooks/useIntersectionAnimation";
const ATHLETE_STORAGE_KEY = "recruitpath_athlete_profile";

const STADIUM_BG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663375439833/QSDwGxzAotjQMGLA.jpg";
const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

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
  staggerIndex = 0,
}: {
  school: DBSchool;
  isAdded: boolean;
  onAdd: () => void;
  isLocked: boolean;
  onLockedClick: () => void;
  isPending: boolean;
  staggerIndex?: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const animationRef = useIntersectionAnimation({
    threshold: 0.1,
    staggerIndex,
    staggerDelay: 60,
  });

  const handleCardClick = () => {
    if (isLocked && !isAdded) {
      onLockedClick();
      return;
    }
    setFlipped((f) => !f);
  };

  return (
    <div
      ref={animationRef}
      className="h-56"
      style={{
        perspective: "800px",
        opacity: isLocked && !isAdded ? 0.4 : 1,
        cursor: isLocked && !isAdded ? "not-allowed" : "pointer",
        transition: "opacity 300ms ease",
      }}
      onMouseEnter={() => !isLocked && setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={handleCardClick}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped && !isLocked ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            background: isAdded ? "rgba(245,197,24,0.05)" : "#131829",
            border: isAdded ? "2px solid #F5C518" : "1px solid #1E2A42",
            borderRadius: "12px",
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
                background: "#F5C518",
                color: "#090D18",
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
              style={{ background: "#F5C518" }}
            >
              <Check size={12} style={{ color: "#090D18" }} />
            </div>
          )}
          {!school.hasRosterData && !isAdded && (
            <div className="absolute top-3 right-3">
              <Lock size={14} style={{ color: "#8B9BB8" }} />
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
                    color: "#8B9BB8",
                    padding: "2px 8px",
                    background: "#181E32",
                    border: "1px solid #1E2A42",
                    borderRadius: "6px",
                  }}
                >
                  {school.division || "—"}
                </span>
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
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
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
              {school.conference || "—"}
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "#F5C518",
                marginBottom: "4px",
              }}
            >
              MEN'S VOLLEYBALL
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF" }}>
              {school.coachName || "Coach TBD"}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
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
            background: "#131829",
            border: "1px solid #F5C518",
            borderRadius: "12px",
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
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
                  {school.coachTitle || "Head Coach"} · {school.name}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8", marginBottom: "2px" }}>
                {school.conference} · {school.division}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
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
                background: isAdded ? "transparent" : "#F5C518",
                color: isAdded ? "#F5C518" : "#090D18",
                border: isAdded ? "1px solid #F5C518" : "none",
                borderRadius: "8px",
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
                style={{ border: "1px solid #1E2A42", borderRadius: "0px" }}
              >
                <ExternalLink size={14} style={{ color: "#8B9BB8" }} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Schools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [showTargetList, setShowTargetList] = useState(false);
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // ── Profile completeness check ────────────────────────────────────────────
  const missingProfileFields = useMemo(() => {
    if (!isAuthenticated) return []; // only check for logged-in users
    try {
      const raw = localStorage.getItem(ATHLETE_STORAGE_KEY);
      const profile = raw ? JSON.parse(raw) : {};
      const missing: string[] = [];
      if (!profile.firstName?.trim()) missing.push("First Name");
      if (!profile.lastName?.trim()) missing.push("Last Name");
      if (!profile.graduationYear?.trim()) missing.push("Graduation Year");
      if (!profile.positions?.trim()) missing.push("Position");
      if (!profile.highSchool?.trim()) missing.push("High School");
      return missing;
    } catch {
      return [];
    }
  }, [isAuthenticated]);
  const utils = trpc.useUtils();

  // Load all volleyball schools from DB
  const { data: schoolsData, isLoading: schoolsLoading } = trpc.volleyball.schools.useQuery();

  // Real subscription status from API
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
    <AppTopNav />
    <div className="min-h-screen pb-8" style={{ background: "#090D18", paddingTop: "56px" }}>
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
                  background: "rgba(245,197,24,0.1)",
                  border: "1px solid rgba(245,197,24,0.25)",
                }}
              >
                <Lock size={32} color="#F5C518" />
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
                  color: "#8B9BB8",
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
                      color: "#F5C518",
                      background: "rgba(245,197,24,0.1)",
                      border: "1px solid rgba(245,197,24,0.3)",
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
                  color: "#090D18",
                  background: "#F5C518",
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
            className="sticky top-0 z-30 px-6 py-3"
            style={{ background: "#090D18" }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "18px",
                  color: "#F5C518",
                  letterSpacing: "0.05em",
                }}
              >
                YOU'VE REACHED THE FREE LIMIT — GET FULL ACCESS FOR UNLIMITED SCHOOLS →
              </span>
              <Link href="/pricing">
                <button
                  className="px-5 py-2 text-sm font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Barlow Condensed, sans-serif",
                    letterSpacing: "0.1em",
                    border: "none",
                    borderRadius: "6px",
                  }}
                >
                  SEE PLANS →
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
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,13,24,0.95) 0%, rgba(9,13,24,0.5) 100%)" }} />
        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.15em",
                  color: "#8B9BB8",
                }}
              >
                MEN'S VOLLEYBALL — COACH DIRECTORY
              </span>
              <h1
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "clamp(28px, 5vw, 48px)",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                FIND YOUR COACHES
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "18px",
                  color: isAtLimit ? "#FF4444" : "#F5C518",
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
                  background: schoolsUsed > 0 ? "#F5C518" : "transparent",
                  color: schoolsUsed > 0 ? "#090D18" : "#FFFFFF",
                  border: schoolsUsed > 0 ? "none" : "1px solid #1E2A42",
                  borderRadius: "8px",
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

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8B9BB8" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by school, coach, or city..."
            className="w-full pl-10 pr-4 py-3"
            style={{
              background: "#181E32",
              border: "1px solid #1E2A42",
              borderRadius: "9px",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              color: "#FFFFFF",
              outline: "none",
            }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div
              style={{
                background: "#131829",
                border: "1px solid #1E2A42",
                borderRadius: "12px",
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
                      color: "#F5C518",
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
                    color: "#8B9BB8",
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
                          background: selectedDivisions.includes(div) ? "#F5C518" : "transparent",
                          border: selectedDivisions.includes(div) ? "none" : "1px solid #1E2A42",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {selectedDivisions.includes(div) && <Check size={10} style={{ color: "#090D18" }} />}
                      </div>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          color: selectedDivisions.includes(div) ? "#FFFFFF" : "#8B9BB8",
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
                    color: "#8B9BB8",
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
                    background: "#181E32",
                    border: "1px solid #1E2A42",
                    borderRadius: "4px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: selectedState ? "#FFFFFF" : "#8B9BB8",
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
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8B9BB8" }}>
                Showing <span style={{ color: "#FFFFFF", fontWeight: 500 }}>{filteredSchools.filter(s => !s.isTestSchool).length}</span> programs
                {" · "}
                <span style={{ color: "#F5C518" }}>Men's Volleyball</span>
              </p>
            </div>

            {schoolsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse"
                    style={{ background: "#131829", border: "1px solid #1E2A42", borderRadius: "12px" }}
                  />
                ))}
              </div>
            ) : filteredSchools.length === 0 ? (
              <div
                className="p-12 text-center"
                style={{ background: "#131829", border: "1px solid #1E2A42", borderRadius: "12px" }}
              >
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8" }}>
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
                    staggerIndex={i}
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
              background: "#131829",
              borderLeft: "1px solid #1E2A42",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #1E2A42" }}>
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
                style={{ color: "#8B9BB8", background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!outreachData || outreachData.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8" }}>
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
                      style={{ background: "#090D18", border: "1px solid #1E2A42", borderRadius: "10px" }}
                    >
                      <div className="flex items-start gap-3">
                        {dbEntry && (
                          <SchoolLogo domain={dbEntry.athleticsDomain} brandColor={dbEntry.brandColor} size={40} name={dbEntry.name} logoUrl={dbEntry.logoUrl} />
                        )}
                        <div>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF", fontWeight: 500 }}>
                            {item.schoolName || dbEntry?.name || "Unknown School"}
                          </p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8B9BB8" }}>
                            {item.coachName || dbEntry?.coachName || ""} · Men's Volleyball
                          </p>
                          <span
                            style={{
                              fontFamily: "Barlow Condensed, sans-serif",
                              fontSize: "11px",
                              letterSpacing: "0.1em",
                              color: "#8B9BB8",
                              padding: "1px 6px",
                              background: "#181E32",
                              border: "1px solid #1E2A42",
                              borderRadius: "6px",
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
                        style={{ color: "#8B9BB8", background: "none", border: "none", cursor: "pointer", marginTop: "2px" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {outreachData && outreachData.length > 0 && (
              <div className="p-4" style={{ borderTop: "1px solid #1E2A42" }}>
                <button
                  className="w-full py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Barlow Condensed, sans-serif",
                    letterSpacing: "0.1em",
                    border: "none",
                    borderRadius: "8px",
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
                background: "#131829",
                border: "2px solid #F5C518",
                borderRadius: "14px",
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
                  style={{ color: "#8B9BB8", background: "none", border: "none" }}
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
                You've reached the 5 school limit for free accounts. Unlock full access for $49.99 to add unlimited schools.
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "#8B9BB8",
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
                      background: "#F5C518",
                      color: "#090D18",
                      fontFamily: "Barlow Condensed, sans-serif",
                      letterSpacing: "0.1em",
                      border: "none",
                      borderRadius: "8px",
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
                    borderRadius: "8px",
                  }}
                >
                  DISMISS
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
