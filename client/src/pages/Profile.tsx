/**
 * RecruitPath — Athlete Profile Page
 * Design: Full-screen hero + single CTA button → 2-panel profile modal
 *         Left nav (160px) + full-width content panel, one section at a time.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAthleteProfile, type AthleteProfile as ProfileData } from "@/hooks/useAthleteProfile";
import { trpc } from "@/lib/trpc";
import { useModal } from "@/contexts/ModalContext";
import AppFooter from "@/components/AppFooter";


// ─────────────────────────────────────────────
// DROPDOWN OPTIONS
// ─────────────────────────────────────────────
const GRAD_YEARS = ["2025", "2026", "2027", "2028", "2029", "2030"];
const POSITIONS = ["Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero", "Defensive Specialist"];

function buildHeightOptions() {
  const opts: string[] = [];
  for (let totalInches = 60; totalInches <= 84; totalInches++) {
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    opts.push(`${ft}'${inch}"`);
  }
  return opts;
}
const HEIGHT_OPTIONS = buildHeightOptions();
const WEIGHT_OPTIONS = Array.from({ length: 41 }, (_, i) => `${100 + i * 5} lbs`);
const GPA_OPTIONS = [...Array.from({ length: 31 }, (_, i) => (1.0 + i * 0.1).toFixed(1)), "4.0+"];
const SAT_OPTIONS = Array.from({ length: 81 }, (_, i) => `${800 + i * 10}`);
const ACT_OPTIONS = Array.from({ length: 36 }, (_, i) => `${i + 1}`);
const VERTICAL_OPTIONS = Array.from({ length: 31 }, (_, i) => `${18 + i}"`);
const APPROACH_OPTIONS = Array.from({ length: 31 }, (_, i) => `${20 + i}"`);
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];
const MAJORS = [
  "Undecided","Business","Computer Science","Engineering","Kinesiology/Exercise Science",
  "Biology","Psychology","Communications","Education","Economics",
  "Political Science","Pre-Med","Architecture","Film/Media","Other",
];

// ─────────────────────────────────────────────
// PROFILE STRENGTH CALCULATION (16 fields)
// ─────────────────────────────────────────────
const STRENGTH_FIELDS: (keyof ProfileData)[] = [
  "firstName", "lastName", "graduationYear", "positions", "highSchool",
  "city", "gpa", "satScore", "actScore", "intendedMajor",
  "height", "weight", "clubTeam", "verticalJump", "approachJump", "hudlUrl",
];

function calcStrength(profile: ProfileData): number {
  let filled = 0;
  for (const field of STRENGTH_FIELDS) {
    if (profile[field]) filled++;
  }
  return Math.round((filled / STRENGTH_FIELDS.length) * 100);
}

// ─────────────────────────────────────────────
// SHARED FIELD COMPONENTS
// ─────────────────────────────────────────────
const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontSize: "10px",
  color: "#777",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  marginBottom: "6px",
};

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ paddingBottom: "20px", borderBottom: "1px solid #111827" }}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: value ? "#FFFFFF" : "#2E2E2E" }}>
        {value || "Not added"}
      </div>
    </div>
  );
}

function EditTextField({
  label, value, onChange, placeholder = "Not set", type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ paddingBottom: "20px", borderBottom: "1px solid #111827" }}>
      <div style={fieldLabelStyle}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "#111827", border: "1px solid #1E293B",
          borderRadius: "6px", padding: "9px 12px", outline: "none",
          fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#F5B800")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#1E293B")}
      />
    </div>
  );
}

function EditTextAreaField({
  label, value, onChange, placeholder = "Not set",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ paddingBottom: "20px", borderBottom: "1px solid #111827" }}>
      <div style={fieldLabelStyle}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: "100%", background: "#111827", border: "1px solid #1E293B",
          borderRadius: "6px", padding: "9px 12px", outline: "none",
          fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FFFFFF",
          boxSizing: "border-box", resize: "vertical",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#F5B800")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#1E293B")}
      />
    </div>
  );
}

function EditSelectField({
  label, value, options, onChange, placeholder = "Not set",
}: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ paddingBottom: "20px", borderBottom: "1px solid #111827" }}>
      <div style={fieldLabelStyle}>{label}</div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", background: "#111827", border: "1px solid #1E293B",
          borderRadius: "6px", padding: "9px 12px", outline: "none",
          fontFamily: "Inter, sans-serif", fontSize: "14px",
          color: value ? "#FFFFFF" : "#555",
          cursor: "pointer", appearance: "none", WebkitAppearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
          paddingRight: "32px", boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#F5B800")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#1E293B")}
      >
        <option value="" style={{ background: "#111827", color: "#888" }}>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ background: "#111827", color: "#FFF" }}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER (EDIT ↔ SAVE toggle)
// ─────────────────────────────────────────────
function SectionHeader({
  title, editing, onEdit, onSave, saving,
}: { title: string; editing: boolean; onEdit: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
      <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "18px", color: "#FFFFFF", letterSpacing: "1px" }}>
        {title}
      </span>
      <button
        onClick={editing ? onSave : onEdit}
        style={{
          fontFamily: "Inter, sans-serif", fontSize: "10px",
          color: editing ? "#F5B800" : "#94A3B8",
          background: "transparent", border: "none", cursor: "pointer",
          letterSpacing: "0.5px",
        }}
      >
        {editing ? (saving ? "Saving…" : "SAVE ✓") : "EDIT →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONTENT PANELS
// ─────────────────────────────────────────────
function PersonalPanel({
  profile, editing, onEdit, onSave, saving, onChange,
}: {
  profile: ProfileData; editing: boolean; onEdit: () => void; onSave: () => void;
  saving: boolean; onChange: (f: keyof ProfileData, v: string) => void;
}) {
  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px) clamp(16px, 4vw, 40px)", overflowY: "auto", flex: 1 }}>
      <SectionHeader title="PERSONAL INFO" editing={editing} onEdit={onEdit} onSave={onSave} saving={saving} />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "0 32px" }}>
        {editing ? (
          <>
            <EditTextField label="First Name" value={profile.firstName} onChange={(v) => onChange("firstName", v)} />
            <EditTextField label="Last Name" value={profile.lastName} onChange={(v) => onChange("lastName", v)} />
            <EditSelectField label="Graduation Year" value={profile.graduationYear} options={GRAD_YEARS} onChange={(v) => onChange("graduationYear", v)} />
            <EditTextField label="High School" value={profile.highSchool} onChange={(v) => onChange("highSchool", v)} />
            <EditTextField label="City" value={profile.city} onChange={(v) => onChange("city", v)} />
            <EditSelectField label="State" value={profile.state} options={US_STATES} onChange={(v) => onChange("state", v)} />
            <EditSelectField label="GPA" value={profile.gpa} options={GPA_OPTIONS} onChange={(v) => onChange("gpa", v)} />
            <EditSelectField label="SAT Score" value={profile.satScore} options={SAT_OPTIONS} onChange={(v) => onChange("satScore", v)} />
            <EditSelectField label="ACT Score" value={profile.actScore} options={ACT_OPTIONS} onChange={(v) => onChange("actScore", v)} />
            <EditSelectField label="Intended Major" value={profile.intendedMajor} options={MAJORS} onChange={(v) => onChange("intendedMajor", v)} />
          </>
        ) : (
          <>
            <ReadField label="Full Name" value={[profile.firstName, profile.lastName].filter(Boolean).join(" ")} />
            <ReadField label="Graduation Year" value={profile.graduationYear} />
            <ReadField label="High School" value={profile.highSchool} />
            <ReadField label="Location" value={[profile.city, profile.state].filter(Boolean).join(", ")} />
            <ReadField label="GPA" value={profile.gpa} />
            <ReadField label="SAT Score" value={profile.satScore} />
            <ReadField label="ACT Score" value={profile.actScore} />
            <ReadField label="Intended Major" value={profile.intendedMajor} />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// POSITION MULTI-SELECT PILLS
// ─────────────────────────────────────────────
function PositionMultiSelect({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  // Parse current value (JSON array string or plain string)
  const selected: string[] = (() => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      return value ? [value] : [];
    } catch {
      return value ? [value] : [];
    }
  })();

  const toggle = (pos: string) => {
    const next = selected.includes(pos)
      ? selected.filter((p) => p !== pos)
      : [...selected, pos];
    onChange(next.length > 0 ? JSON.stringify(next) : "");
  };

  return (
    <div style={{ paddingBottom: "20px", borderBottom: "1px solid #111827", gridColumn: "1 / -1" }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#777", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>Position</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {POSITIONS.map((pos) => {
          const isSelected = selected.includes(pos);
          return (
            <button
              key={pos}
              type="button"
              onClick={() => toggle(pos)}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${isSelected ? "#F5B800" : "#1E293B"}`,
                background: isSelected ? "#F5B800" : "#111827",
                color: isSelected ? "#000" : "#888",
                cursor: "pointer",
                transition: "all 0.15s",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {pos}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AthleticPanel({
  profile, editing, onEdit, onSave, saving, onChange,
}: {
  profile: ProfileData; editing: boolean; onEdit: () => void; onSave: () => void;
  saving: boolean; onChange: (f: keyof ProfileData, v: string) => void;
}) {
  // Parse positions for read view
  const positionsDisplay = (() => {
    if (!profile.positions) return "";
    try {
      const parsed = JSON.parse(profile.positions);
      if (Array.isArray(parsed)) return parsed.join(" · ");
      return profile.positions;
    } catch {
      return profile.positions;
    }
  })();

  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px) clamp(16px, 4vw, 40px)", overflowY: "auto", flex: 1 }}>
      <SectionHeader title="ATHLETIC INFO" editing={editing} onEdit={onEdit} onSave={onSave} saving={saving} />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "0 32px" }}>
        {editing ? (
          <>
            <PositionMultiSelect value={profile.positions} onChange={(v) => onChange("positions", v)} />
            <EditSelectField label="Height" value={profile.height} options={HEIGHT_OPTIONS} onChange={(v) => onChange("height", v)} />
            <EditSelectField label="Weight" value={profile.weight} options={WEIGHT_OPTIONS} onChange={(v) => onChange("weight", v)} />
            <EditTextField label="Club Team" value={profile.clubTeam} onChange={(v) => onChange("clubTeam", v)} />
            <EditTextField label="Jersey Number" value={profile.jerseyNumber} onChange={(v) => onChange("jerseyNumber", v)} />
            <EditSelectField label="Vertical Jump" value={profile.verticalJump} options={VERTICAL_OPTIONS} onChange={(v) => onChange("verticalJump", v)} />
            <EditSelectField label="Approach Jump" value={profile.approachJump} options={APPROACH_OPTIONS} onChange={(v) => onChange("approachJump", v)} />
            <div style={{ gridColumn: "1 / -1" }}>
              <EditTextAreaField label="Key Stats & Achievements" value={profile.keyStats} onChange={(v) => onChange("keyStats", v)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <EditTextAreaField label="Athletic Awards" value={profile.awards} onChange={(v) => onChange("awards", v)} />
            </div>
          </>
        ) : (
          <>
            <ReadField label="Position" value={positionsDisplay} />
            <ReadField label="Height" value={profile.height} />
            <ReadField label="Weight" value={profile.weight} />
            <ReadField label="Club Team" value={profile.clubTeam} />
            <ReadField label="Jersey Number" value={profile.jerseyNumber} />
            <ReadField label="Vertical Jump" value={profile.verticalJump} />
            <ReadField label="Approach Jump" value={profile.approachJump} />
            <div style={{ gridColumn: "1 / -1" }}>
              <ReadField label="Key Stats & Achievements" value={profile.keyStats} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <ReadField label="Athletic Awards" value={profile.awards} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const MEDIA_LINKS: { field: keyof ProfileData; label: string; description: string; placeholder: string }[] = [
  { field: "hudlUrl", label: "Hudl", description: "Game film & highlights", placeholder: "https://hudl.com/..." },
  { field: "ncsaUrl", label: "NCSA", description: "Recruiting profile", placeholder: "https://ncsa..." },
  { field: "highlightFilmUrl", label: "Highlight Film", description: "Best plays compilation", placeholder: "https://..." },
  { field: "instagramHandle", label: "Instagram", description: "Social media", placeholder: "@handle" },
  { field: "twitterHandle", label: "Twitter/X", description: "Social media", placeholder: "@handle" },
];

function MediaPanel({
  profile, editing, onEdit, onSave, saving, onChange,
}: {
  profile: ProfileData; editing: boolean; onEdit: () => void; onSave: () => void;
  saving: boolean; onChange: (f: keyof ProfileData, v: string) => void;
}) {
  // Per-row inline editing state: field key → draft value string, or null if not editing
  const [rowEditing, setRowEditing] = useState<Partial<Record<keyof ProfileData, string>>>({})

  const startRowEdit = (field: keyof ProfileData, currentVal: string) => {
    setRowEditing((prev) => ({ ...prev, [field]: currentVal }));
  };

  const cancelRowEdit = (field: keyof ProfileData) => {
    setRowEditing((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const saveRowEdit = (field: keyof ProfileData) => {
    const draft = rowEditing[field];
    if (draft !== undefined) {
      onChange(field, draft);
    }
    cancelRowEdit(field);
    onSave();
  };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px) clamp(16px, 4vw, 40px)", overflowY: "auto", flex: 1 }}>
      <SectionHeader title="MEDIA & LINKS" editing={editing} onEdit={onEdit} onSave={onSave} saving={saving} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {MEDIA_LINKS.map(({ field, label, description, placeholder }) => {
          const rawVal = profile[field] as string;
          const isHandle = field === "instagramHandle" || field === "twitterHandle";
          const displayVal = isHandle && rawVal && !rawVal.startsWith("@") ? `@${rawVal}` : rawVal;
          const isRowEditing = field in rowEditing;
          const draftVal = rowEditing[field] ?? "";

          return (
            <div
              key={field}
              style={{
                background: "#111827", borderRadius: "10px",
                padding: "18px 24px", border: `1px solid ${isRowEditing ? "#1E293B" : "#111827"}`,
                transition: "border-color 0.15s",
              }}
            >
              {/* Top row: platform name + description + value/add-link */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                {/* Left: platform name + description */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", color: "#FFFFFF", letterSpacing: "1px", marginBottom: "4px" }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#555" }}>
                    {description}
                  </div>
                </div>

                {/* Right: value or "Add link →" button */}
                {!isRowEditing && (
                  rawVal ? (
                    <a
                      href={rawVal.startsWith("http") ? rawVal : `https://${rawVal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#F5B800",
                        textDecoration: "none", maxWidth: "240px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        flexShrink: 0, cursor: "pointer",
                      }}
                      onClick={(e) => { e.preventDefault(); startRowEdit(field, rawVal); }}
                    >
                      {displayVal}
                    </a>
                  ) : (
                    <button
                      onClick={() => startRowEdit(field, "")}
                      style={{
                        fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94A3B8",
                        background: "transparent", border: "none", cursor: "pointer", padding: 0,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#F5B800")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                    >
                      Add link →
                    </button>
                  )
                )}
              </div>

              {/* Inline edit row — shown only when this row is being edited */}
              {isRowEditing && (
                <div style={{ marginTop: "12px" }}>
                  <input
                    type="text"
                    value={draftVal}
                    autoFocus
                    onChange={(e) => setRowEditing((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRowEdit(field);
                      if (e.key === "Escape") cancelRowEdit(field);
                    }}
                    style={{
                      width: "100%", background: "#111", border: "1px solid #F5B800",
                      borderRadius: "6px", padding: "9px 12px", outline: "none",
                      fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#FFFFFF",
                      boxSizing: "border-box", marginBottom: "10px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => saveRowEdit(field)}
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif", fontSize: "11px", letterSpacing: "1px",
                        padding: "7px 16px", borderRadius: "6px",
                        background: "#F5B800", color: "#000", border: "none", cursor: "pointer",
                      }}
                    >
                      SAVE →
                    </button>
                    <button
                      onClick={() => cancelRowEdit(field)}
                      style={{
                        fontFamily: "Barlow Condensed, sans-serif", fontSize: "11px", letterSpacing: "1px",
                        padding: "7px 16px", borderRadius: "6px",
                        background: "transparent", border: "1px solid #1E293B",
                        color: "#555", cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#444"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1E293B"; }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Tip card */}
        <div
          style={{
            marginTop: "8px",
            background: "#111827",
            borderLeft: "2px solid #F5B800",
            borderRadius: "6px",
            padding: "14px 18px",
          }}
        >
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#777", margin: 0, lineHeight: 1.6 }}>
            Your Hudl link and NCSA profile are automatically included in every email you generate. Add them to improve your response rate.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE MODAL
// ─────────────────────────────────────────────
type NavSection = "personal" | "athletic" | "media";

const NAV_ITEMS: { key: NavSection; label: string }[] = [
  { key: "personal", label: "PERSONAL" },
  { key: "athletic", label: "ATHLETIC" },
  { key: "media", label: "MEDIA & LINKS" },
];

function ProfileModal({
  profileData,
  onClose,
  onChange,
  onSave,
  saving,
}: {
  profileData: ProfileData;
  onClose: () => void;
  onChange: (field: keyof ProfileData, val: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [activeSection, setActiveSection] = useState<NavSection>("personal");
  const [editingSection, setEditingSection] = useState<NavSection | null>(null);

  const fullName = [profileData.firstName, profileData.lastName].filter(Boolean).join(" ") || "YOUR NAME";
  const initials = [profileData.firstName?.[0], profileData.lastName?.[0]].filter(Boolean).join("") || "YN";
  const pct = calcStrength(profileData);

  const handleNavClick = (key: NavSection) => {
    setActiveSection(key);
    setEditingSection(null);
  };

  const handleEdit = (section: NavSection) => setEditingSection(section);
  const handleSaveSection = () => {
    onSave();
    setEditingSection(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex md:items-center md:justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", padding: "clamp(0px, 2vw, 20px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="profile-modal-container md:w-[min(96vw,1100px)] md:h-[min(96vh,90vh)] md:rounded-[20px]"
        style={{
          maxWidth: "1100px",
          background: "#111111", border: "1px solid #1E293B",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" style={{ flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* ── MOBILE COMPACT HEADER ── */}
        <div
          className="flex md:hidden items-center justify-between"
          style={{
            background: "#0A0E1A", borderBottom: "1px solid #111827",
            padding: "0 16px", height: "56px", flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", letterSpacing: "0.1em", color: "#F5B800" }}>RECRUITPATH</span>
          <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "14px", letterSpacing: "0.08em", color: "#FFFFFF", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>EDIT PROFILE</span>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: "0", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── MODAL HEADER (desktop only) ── */}
        <div
          className="hidden md:flex"
          style={{
            background: "#0A0E1A", borderBottom: "1px solid #111827",
            padding: "clamp(14px, 3vw, 24px) clamp(16px, 4vw, 36px)", flexShrink: 0,
            alignItems: "center", justifyContent: "space-between",
          }}
        >
          {/* Left: avatar + name + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: "#111827", border: "2px solid #F5B800",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {profileData.profilePhoto ? (
                <img src={profileData.profilePhoto} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "24px", color: "#F5B800" }}>{initials}</span>
              )}
            </div>
            <div>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "26px", color: "#FFFFFF", lineHeight: 1.1, marginBottom: "8px" }}>
                {fullName.toUpperCase()}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(() => {
                  // Parse positions into individual badges
                  const positionBadges: string[] = [];
                  if (profileData.positions) {
                    try {
                      const parsed = JSON.parse(profileData.positions);
                      if (Array.isArray(parsed)) positionBadges.push(...parsed);
                      else positionBadges.push(profileData.positions);
                    } catch {
                      positionBadges.push(profileData.positions);
                    }
                  }
                  const badges = [
                    profileData.graduationYear ? `CLASS OF ${profileData.graduationYear}` : null,
                    ...positionBadges,
                    profileData.highSchool || null,
                    profileData.city ? `${profileData.city}${profileData.state ? `, ${profileData.state}` : ""}` : null,
                  ].filter(Boolean) as string[];
                  return badges.map((badge, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "Inter, sans-serif", fontSize: "10px",
                        color: "#AAAAAA", background: "#111827",
                        border: "1px solid #1E293B", borderRadius: "4px",
                        padding: "3px 8px", letterSpacing: "0.5px",
                      }}
                    >
                      {badge}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Right: profile strength + close */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                Profile Strength
              </div>
              <div style={{ width: "160px", height: "4px", background: "#1E293B", borderRadius: "2px", marginBottom: "4px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#F5B800", borderRadius: "2px", transition: "width 0.4s ease" }} />
              </div>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", color: "#F5B800", letterSpacing: "1px" }}>
                {pct}%
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: "0", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F5B800")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── MOBILE TOP NAV TABS ── */}
        <div
          className="flex md:hidden"
          style={{ borderBottom: "1px solid #111827", flexShrink: 0 }}
        >
          {NAV_ITEMS.map(({ key, label }) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                style={{
                  flex: 1,
                  height: "44px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: isActive ? "#F5B800" : "#555",
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid #F5B800" : "2px solid transparent",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── MODAL BODY: LEFT NAV + CONTENT PANEL ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left nav: hidden on mobile */}
          <div
            className="hidden md:flex"
            style={{
              width: "160px", flexShrink: 0,
              background: "#0A0E1A", borderRight: "1px solid #111827",
              flexDirection: "column",
            }}
          >
            {/* Nav items */}
            <div style={{ flex: 1 }}>
              {NAV_ITEMS.map(({ key, label }) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleNavClick(key)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "20px 20px",
                      fontFamily: "Barlow Condensed, sans-serif", fontSize: "12px", letterSpacing: "2px",
                      color: isActive ? "#F5B800" : "#444",
                      background: isActive ? "#0F172A" : "transparent",
                      border: "none",
                      borderLeft: isActive ? "3px solid #F5B800" : "3px solid transparent",
                      cursor: "pointer",
                      transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#888"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#444"; }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Profile strength pinned at bottom of nav */}
            <div style={{ padding: "16px 16px 20px", borderTop: "1px solid #111827" }}>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", color: "#F5B800", lineHeight: 1, marginBottom: "4px" }}>
                {pct}%
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "9px", color: "#555", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                COMPLETE
              </div>
              <div style={{ width: "100%", height: "3px", background: "#111827", borderRadius: "2px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#F5B800", borderRadius: "2px", transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>

          {/* Content panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {activeSection === "personal" && (
              <PersonalPanel
                profile={profileData}
                editing={editingSection === "personal"}
                onEdit={() => handleEdit("personal")}
                onSave={handleSaveSection}
                saving={saving}
                onChange={onChange}
              />
            )}
            {activeSection === "athletic" && (
              <AthleticPanel
                profile={profileData}
                editing={editingSection === "athletic"}
                onEdit={() => handleEdit("athletic")}
                onSave={handleSaveSection}
                saving={saving}
                onChange={onChange}
              />
            )}
            {activeSection === "media" && (
              <MediaPanel
                profile={profileData}
                editing={editingSection === "media"}
                onEdit={() => handleEdit("media")}
                onSave={handleSaveSection}
                saving={saving}
                onChange={onChange}
              />
            )}
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div
          className="flex flex-col md:flex-row md:justify-end"
          style={{
            borderTop: "1px solid #111827",
            padding: "clamp(14px, 3vw, 18px) clamp(16px, 4vw, 36px)",
            flexShrink: 0,
            gap: "10px",
          }}
        >
          {/* CLOSE button: desktop only */}
          <button
            onClick={onClose}
            className="hidden md:block w-full md:w-auto"
            style={{
              fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", letterSpacing: "1.5px",
              height: "44px", padding: "0 24px", borderRadius: "8px",
              background: "transparent", border: "1px solid #1E293B",
              color: "#555", cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#888"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#555"; }}
          >
            CLOSE
          </button>
          {/* SAVE button: full-width gradient on mobile, normal on desktop */}
          <button
            onClick={() => { onSave(); setEditingSection(null); }}
            disabled={saving}
            className="w-full md:w-auto"
            style={{
              fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", letterSpacing: "1.5px",
              height: "50px", padding: "0 28px", borderRadius: "8px",
              background: saving ? "#B89000" : "linear-gradient(90deg, #F5B800 0%, #FFD740 100%)",
              color: "#0A0E1A", border: "none", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.8 : 1,
              boxShadow: "0 4px 20px rgba(245,184,0,0.3)",
            }}
          >
            {saving ? "SAVING…" : "SAVE CHANGES →"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function Profile() {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { profile: profileData, updateProfile, setField } = useAthleteProfile();
  const { openModal, closeModal } = useModal();

  const { data: dbProfile } = trpc.athleteProfile.get.useQuery(undefined, { retry: false });

  const mergedRef = useRef(false);
  useEffect(() => {
    if (dbProfile && !mergedRef.current) {
      mergedRef.current = true;
      const merged: Partial<typeof profileData> = {};
      const fields = Object.keys(dbProfile) as (keyof typeof dbProfile)[];
      for (const field of fields) {
        if (field === "id" || field === "userId" || field === "createdAt" || field === "updatedAt") continue;
        const val = dbProfile[field];
        if (val !== null && val !== undefined) {
          (merged as any)[field] = String(val);
        }
      }
      updateProfile(merged);
    }
  }, [dbProfile]);

  const saveMutation = trpc.athleteProfile.save.useMutation();

  const handleChange = (field: keyof typeof profileData, val: string) => {
    setField(field, val);
  };

  const handleSave = async () => {
    if (profileData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }
    setSaving(true);
    try {
      const payload: Record<string, string | null | undefined> = {};
      const keys = Object.keys(profileData) as (keyof typeof profileData)[];
      for (const key of keys) {
        const val = profileData[key];
        payload[key] = val === "" ? undefined : (val as string);
      }
      await saveMutation.mutateAsync(payload as any);
      toast.success("Saved ✓");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenModal = () => {
    setProfileModalOpen(true);
    openModal();
  };

  const handleCloseModal = () => {
    setProfileModalOpen(false);
    closeModal();
  };

  const fullName = [profileData.firstName, profileData.lastName].filter(Boolean).join(" ");
  const initials = [profileData.firstName?.[0], profileData.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const strengthPct = calcStrength(profileData);

  const positionBadges: string[] = (() => {
    if (!profileData.positions) return [];
    try {
      const parsed = JSON.parse(profileData.positions);
      return Array.isArray(parsed) ? parsed : [profileData.positions];
    } catch {
      return [profileData.positions];
    }
  })();
  const summaryBadges = [
    profileData.graduationYear ? `Class of ${profileData.graduationYear}` : null,
    ...positionBadges,
    profileData.highSchool || null,
    profileData.city ? `${profileData.city}${profileData.state ? `, ${profileData.state}` : ""}` : null,
  ].filter(Boolean) as string[];

  const keyFacts: { label: string; value: string }[] = [
    { label: "GPA", value: profileData.gpa },
    { label: "SAT", value: profileData.satScore },
    { label: "ACT", value: profileData.actScore },
    { label: "Height", value: profileData.height },
    { label: "Weight", value: profileData.weight },
    { label: "Club Team", value: profileData.clubTeam },
    { label: "Vertical", value: profileData.verticalJump },
    { label: "Approach", value: profileData.approachJump },
  ].filter(f => f.value?.trim());

  return (
    <>
      <div className="profile-page-wrapper min-h-screen pb-24 md:pb-8" style={{ background: "#0A0E1A" }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-10">
          <p className="section-label mb-1">Athlete Profile</p>
          <h1 className="page-title text-4xl md:text-5xl mb-2">This Is What Coaches See</h1>
          <p className="text-[#94A3B8] text-sm mb-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Keep it current — coaches check this before they reply to your emails.
          </p>

          {/* ── SUMMARY CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rp-card p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Avatar */}
              <div
                className="flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden mx-auto sm:mx-0"
                style={{ width: 88, height: 88, background: "rgba(245,184,0,0.1)", border: "1px solid rgba(245,184,0,0.25)" }}
              >
                {profileData.profilePhoto ? (
                  <img src={profileData.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "32px", color: "#F5B800" }}>{initials}</span>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "28px", color: "#FFFFFF", lineHeight: 1.1 }}>
                  {(fullName || "Add your name").toUpperCase()}
                </h2>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {summaryBadges.length > 0 ? summaryBadges.map((badge, i) => (
                    <span
                      key={i}
                      className="text-[10px] uppercase tracking-wider rounded-md px-2.5 py-1"
                      style={{ fontFamily: "Inter, sans-serif", color: "#94A3B8", background: "#0F172A", border: "1px solid #1E293B" }}
                    >
                      {badge}
                    </span>
                  )) : (
                    <span className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                      No details yet — add your grad year, position, and school.
                    </span>
                  )}
                </div>
              </div>

              {/* Profile strength ring */}
              <div className="flex flex-col items-center flex-shrink-0 mx-auto sm:mx-0">
                <div
                  className="relative flex items-center justify-center rounded-full"
                  style={{
                    width: 64, height: 64,
                    background: `conic-gradient(#F5B800 ${strengthPct * 3.6}deg, #1E293B 0deg)`,
                  }}
                >
                  <div className="absolute rounded-full flex items-center justify-center" style={{ inset: 4, background: "#111827" }}>
                    <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", color: "#FFFFFF" }}>{strengthPct}%</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  Complete
                </span>
              </div>
            </div>

            {/* Key facts grid */}
            {keyFacts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6" style={{ borderTop: "1px solid #1E293B" }}>
                {keyFacts.map(fact => (
                  <div key={fact.label}>
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                      {fact.label}
                    </p>
                    <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", color: "#F8FAFC" }}>
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center sm:justify-start">
              <button
                onClick={handleOpenModal}
                className="rounded-lg cursor-pointer"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  padding: "12px 28px",
                  background: "#F5B800",
                  color: "#0A0E1A",
                  border: "none",
                  transition: "filter 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              >
                Edit Profile →
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-12">
          <AppFooter />
        </div>
      </div>

      {/* ── PROFILE MODAL ── */}
      <AnimatePresence>
        {profileModalOpen && (
          <ProfileModal
            profileData={profileData}
            onClose={handleCloseModal}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </>
  );
}
