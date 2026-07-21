/**
 * Roster — /roster
 * Clean roster search tool. Not personalized.
 * - Search bar with dropdown matching school names
 * - Popular programs grid (6 schools)
 * - Roster display grouped by graduation year
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SchoolLogoImg from "@/components/SchoolLogo";
import SchoolDetailModal from "@/components/SchoolDetailModal";
import AppFooter from "@/components/AppFooter";

// Popular programs shown before any search
const POPULAR_SCHOOL_IDS = [
  "mvb-ucla",
  "mvb-usc",
  "mvb-stanford",
  "mvb-byu",
  "mvb-pepperdine",
  "mvb-hawaii",
];

type SchoolRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  division: string | null;
  conference: string | null;
  hasRosterData: boolean;
  brandColor: string | null;
  athleticsDomain: string | null;
  logoUrl: string | null;
  logoBackgroundColor: string | null;
  logoMixBlendMode: string | null;
  coachName: string | null;
  coachTitle: string | null;
  coachEmail: string | null;
};

function divisionBadgeStyle(division: string): React.CSSProperties {
  const map: Record<string, string> = {
    D1: "#1a3a5c",
    D2: "#1a3a2c",
    D3: "#2c1a3a",
    NAIA: "#3a2c1a",
    CC: "#2c2c1a",
  };
  return {
    background: map[division] ?? "#1a1f2e",
    color: "#94A3B8",
    fontFamily: "Bebas Neue, sans-serif",
    fontSize: "10px",
    letterSpacing: "0.12em",
    padding: "2px 7px",
    borderRadius: "4px",
    flexShrink: 0,
  };
}

function toModalSchool(s: SchoolRow) {
  return {
    id: s.id,
    school: s.name,
    city: s.city ?? "",
    state: s.state ?? "",
    division: s.division ?? "",
    conference: s.conference ?? "",
    sport: "Men's Volleyball",
    coachName: s.coachName ?? "",
    coachTitle: s.coachTitle ?? "Head Coach",
    coachEmail: s.coachEmail ?? "",
    athleticsDomain: s.athleticsDomain ?? "",
    brandColor: s.brandColor ?? "#1E293B",
    hasRosterData: s.hasRosterData,
    logoUrl: s.logoUrl ?? null,
    logoBackgroundColor: s.logoBackgroundColor ?? null,
    logoMixBlendMode: s.logoMixBlendMode ?? null,
  };
}

/** Roster display — players grouped by graduation year */
function RosterDisplay({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const { data: players, isLoading } = trpc.volleyball.players.useQuery({ schoolId });

  if (isLoading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#4a5568", fontFamily: "DM Sans, sans-serif", fontSize: "14px" }}>
        Loading roster...
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div style={{ padding: "64px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#4a5568" }}>
          Roster data coming soon for this program
        </p>
      </div>
    );
  }

  // Group by graduation year
  const byYear = players.reduce<Record<string, typeof players>>((acc, p) => {
    const yr = p.graduationYear ? String(p.graduationYear) : "Unknown";
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(p);
    return acc;
  }, {});

  const sortedYears = Object.keys(byYear).sort((a, b) => Number(a) - Number(b));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ marginTop: "32px" }}
    >
      {sortedYears.map((yr) => (
        <div key={yr} style={{ marginBottom: "28px" }}>
          {/* Year section header */}
          <div style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "11px",
            letterSpacing: "0.14em",
            color: "#4a5568",
            marginBottom: "10px",
            paddingBottom: "6px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {yr !== "Unknown" ? `CLASS OF ${yr}` : "UNKNOWN YEAR"}
          </div>
          {/* Player rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {byYear[yr].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 14px",
                  borderRadius: "6px",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#E2E8F0" }}>
                  {p.name ?? "—"}
                </span>
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#64748B" }}>
                  {p.position ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export default function RosterPage() {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null);
  const [modalSchool, setModalSchool] = useState<SchoolRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allSchools = [] } = trpc.volleyball.schools.useQuery();

  // Popular programs
  const popularSchools = useMemo(
    () => POPULAR_SCHOOL_IDS.map(id => allSchools.find(s => s.id === id)).filter(Boolean) as SchoolRow[],
    [allSchools]
  );

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return allSchools.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, allSchools]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectSchool(school: SchoolRow) {
    setSelectedSchool(school);
    setQuery(school.name);
    setDropdownOpen(false);
  }

  function clearSearch() {
    setQuery("");
    setSelectedSchool(null);
    setDropdownOpen(false);
    inputRef.current?.focus();
  }

  return (
    <>
      <div style={{ minHeight: "100vh", paddingBottom: "32px", background: "#0A0E1A", display: "flex", flexDirection: "column" }}>
        <div className="mx-auto" style={{ maxWidth: 860, paddingTop: "clamp(24px, 5vw, 64px)", paddingLeft: "clamp(16px, 4vw, 40px)", paddingRight: "clamp(16px, 4vw, 40px)", paddingBottom: "clamp(80px, 12vw, 32px)", flex: 1 }}>

          {/* ── PAGE HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ marginBottom: "40px" }}
          >
            <h1 style={{ fontFamily: "Bebas Neue, sans-serif", lineHeight: 0.95, marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "clamp(56px, 8vw, 80px)", color: "#F8FAFC" }}>
                ROSTER SEARCH
              </span>
            </h1>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: "#94A3B8", lineHeight: 1.5 }}>
              Search any program to view their current roster.
            </p>
          </motion.div>

          {/* ── SEARCH BAR ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "relative", marginBottom: "48px" }}
          >
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4a5568",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a school..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setDropdownOpen(true);
                  if (!e.target.value.trim()) setSelectedSchool(null);
                }}
                onFocus={() => query.length >= 2 && setDropdownOpen(true)}
                style={{
                  width: "100%",
                  height: "48px",
                  background: "#1a1f2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "0 44px 0 48px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "#F8FAFC",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  boxSizing: "border-box",
                }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = "#F5C518")}
                onBlurCapture={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              {query && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#4a5568",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown suggestions */}
            <AnimatePresence>
              {dropdownOpen && suggestions.length > 0 && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "#1a1f2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    zIndex: 50,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={s.id}
                      onMouseDown={() => selectSchool(s)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <SchoolLogoImg
                        name={s.name}
                        athleticsDomain={s.athleticsDomain}
                        logoUrl={s.logoUrl}
                        brandColor={s.brandColor}
                        size={28}
                      />
                      <div>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#E2E8F0" }}>
                          {s.name}
                        </div>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#64748B" }}>
                          {s.city}, {s.state} · {s.division}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── POPULAR PROGRAMS (shown before any search) ── */}
          <AnimatePresence mode="wait">
            {!selectedSchool ? (
              <motion.div
                key="popular"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <div style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: "#F5C518",
                  marginBottom: "16px",
                }}>
                  POPULAR PROGRAMS
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}>
                  {popularSchools.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                      onClick={() => selectSchool(s)}
                      style={{
                        background: "#1a1f2e",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "12px",
                        padding: "18px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        transition: "border-color 0.15s ease, background 0.15s ease",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,197,24,0.3)";
                        (e.currentTarget as HTMLDivElement).style.background = "#1e2535";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLDivElement).style.background = "#1a1f2e";
                      }}
                    >
                      <SchoolLogoImg
                        name={s.name}
                        athleticsDomain={s.athleticsDomain}
                        logoUrl={s.logoUrl}
                        brandColor={s.brandColor}
                        size={40}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#E2E8F0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "4px",
                        }}>
                          {s.name}
                        </div>
                        <span style={divisionBadgeStyle(s.division ?? "")}>{s.division}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`roster-${selectedSchool.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Selected school header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "8px",
                }}>
                  <SchoolLogoImg
                    name={selectedSchool.name}
                    athleticsDomain={selectedSchool.athleticsDomain}
                    logoUrl={selectedSchool.logoUrl}
                    brandColor={selectedSchool.brandColor}
                    size={48}
                  />
                  <div>
                    <div style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "28px",
                      letterSpacing: "0.04em",
                      color: "#F8FAFC",
                      lineHeight: 1,
                      marginBottom: "6px",
                    }}>
                      {selectedSchool.name.toUpperCase()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={divisionBadgeStyle(selectedSchool.division ?? "")}>{selectedSchool.division}</span>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#64748B" }}>
                        {selectedSchool.city}, {selectedSchool.state} · {selectedSchool.conference}
                      </span>
                    </div>
                  </div>
                  {/* View full profile button */}
                  <button
                    onClick={() => setModalSchool(selectedSchool)}
                    style={{
                      marginLeft: "auto",
                      background: "transparent",
                      border: "1px solid rgba(245,197,24,0.3)",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "12px",
                      letterSpacing: "0.1em",
                      color: "#F5C518",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,197,24,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    VIEW FULL PROFILE →
                  </button>
                </div>

                {/* Roster */}
                <RosterDisplay schoolId={selectedSchool.id} schoolName={selectedSchool.name} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        <div style={{ marginTop: "auto" }}>
          <AppFooter />
        </div>
      </div>

      {/* School Detail Modal */}
      {modalSchool && (
        <SchoolDetailModal
          school={toModalSchool(modalSchool)}
          onClose={() => setModalSchool(null)}
          initialTab="roster"
        />
      )}
    </>
  );
}
