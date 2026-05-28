/**
 * RecruitPath — Athlete Profile Page
 * Design: Hero section + three-column photo panels + Profile card modal
 * Fields are inline-editable; saves to DB via tRPC on "Save" button click.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAthleteProfile, type AthleteProfile as ProfileData } from "@/hooks/useAthleteProfile";
import { trpc } from "@/lib/trpc";
import { useModal } from "@/contexts/ModalContext";
import AppFooter from "@/components/AppFooter";
import AppTopNav from "@/components/AppTopNav";

type ProfileTab = "personal" | "athletic" | "media";

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

const GPA_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => (1.0 + i * 0.1).toFixed(1)),
  "4.0+",
];

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
// INLINE EDITABLE FIELD
// ─────────────────────────────────────────────
interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}

function EditableField({ label, value, onChange, placeholder = "Not set", type = "text" }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div
      className="rounded-lg p-3 cursor-pointer group transition-colors duration-150"
      style={{ background: "#0C1020", border: editing ? "1px solid #F5C518" : "1px solid #1E2A42" }}
      onClick={() => !editing && setEditing(true)}
    >
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#8B9BB8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
        {label}
      </div>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditing(false); }}
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F0F4FF" }}
          placeholder={placeholder}
        />
      ) : (
        <div
          className="group-hover:text-white transition-colors duration-100"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: value ? "#F0F4FF" : "#4A5570" }}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SELECT FIELD (styled dark dropdown)
// ─────────────────────────────────────────────
function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Not set",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const hasValue = !!value;
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "#0C1020", border: "1px solid #1E2A42" }}
    >
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#8B9BB8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
        {label}
      </div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          color: hasValue ? "#F0F4FF" : "#4A5570",
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238B9BB8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 2px center",
          paddingRight: "20px",
        }}
      >
        <option value="" style={{ background: "#0C1020", color: "#8B9BB8" }}>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ background: "#0C1020", color: "#F0F4FF" }}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// Big stat select for HEIGHT / WEIGHT / POSITION blocks
function BigStatSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <div
      className="flex-1 rounded-lg p-4 text-center"
      style={{ background: "#0C1020", border: "1px solid #1E2A42" }}
    >
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: "28px",
          color: value ? "#F5C518" : "#4A5570",
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        <option value="" style={{ background: "#0C1020", color: "#8B9BB8" }}>—</option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ background: "#0C1020", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
            {opt}
          </option>
        ))}
      </select>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#8B9BB8", letterSpacing: "0.12em", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB CONTENT COMPONENTS
// ─────────────────────────────────────────────
function PersonalInfoTab({
  profileData,
  onChange,
  onSave,
  saving,
}: {
  profileData: ProfileData;
  onChange: (field: keyof ProfileData, val: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <EditableField label="First Name" value={profileData.firstName} onChange={(v) => onChange("firstName", v)} />
        <EditableField label="Last Name" value={profileData.lastName} onChange={(v) => onChange("lastName", v)} />
        <SelectField label="Graduation Year" value={profileData.graduationYear} options={GRAD_YEARS} onChange={(v) => onChange("graduationYear", v)} />
        <EditableField label="High School" value={profileData.highSchool} onChange={(v) => onChange("highSchool", v)} />
        <EditableField label="City" value={profileData.city} onChange={(v) => onChange("city", v)} />
        <SelectField label="State" value={profileData.state} options={US_STATES} onChange={(v) => onChange("state", v)} />
        <EditableField label="Email" value={profileData.email} onChange={(v) => onChange("email", v)} type="email" />
        <SelectField label="GPA" value={profileData.gpa} options={GPA_OPTIONS} onChange={(v) => onChange("gpa", v)} />
        <SelectField label="SAT Score" value={profileData.satScore} options={SAT_OPTIONS} onChange={(v) => onChange("satScore", v)} />
        <SelectField label="ACT Score" value={profileData.actScore} options={ACT_OPTIONS} onChange={(v) => onChange("actScore", v)} />
        <div className="col-span-2">
          <SelectField label="Intended Major" value={profileData.intendedMajor} options={MAJORS} onChange={(v) => onChange("intendedMajor", v)} />
        </div>
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  );
}

function AthleticInfoTab({
  profileData,
  onChange,
  onSave,
  saving,
}: {
  profileData: ProfileData;
  onChange: (field: keyof ProfileData, val: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Big stat display — controlled dropdowns */}
      <div className="flex gap-3">
        <BigStatSelectField
          label="HEIGHT"
          value={profileData.height}
          options={HEIGHT_OPTIONS}
          onChange={(v) => onChange("height", v)}
        />
        <BigStatSelectField
          label="WEIGHT"
          value={profileData.weight}
          options={WEIGHT_OPTIONS}
          onChange={(v) => onChange("weight", v)}
        />
        <BigStatSelectField
          label="POSITION"
          value={profileData.positions}
          options={POSITIONS}
          onChange={(v) => onChange("positions", v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <EditableField label="Club Team" value={profileData.clubTeam} onChange={(v) => onChange("clubTeam", v)} />
        <EditableField label="Jersey Number" value={profileData.jerseyNumber} onChange={(v) => onChange("jerseyNumber", v)} />
        <SelectField label="Vertical Jump" value={profileData.verticalJump} options={VERTICAL_OPTIONS} onChange={(v) => onChange("verticalJump", v)} />
        <SelectField label="Approach Jump" value={profileData.approachJump} options={APPROACH_OPTIONS} onChange={(v) => onChange("approachJump", v)} />
        <div className="col-span-2"><EditableField label="Key Stats & Achievements" value={profileData.keyStats} onChange={(v) => onChange("keyStats", v)} /></div>
        <div className="col-span-2"><EditableField label="Athletic Awards" value={profileData.awards} onChange={(v) => onChange("awards", v)} /></div>
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  );
}

function BigStatField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div
      className="flex-1 rounded-lg p-4 text-center cursor-pointer transition-colors duration-150"
      style={{ background: "#0C1020", border: editing ? "1px solid #F5C518" : "1px solid #1E2A42" }}
      onClick={() => !editing && setEditing(true)}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditing(false); }}
          className="w-full bg-transparent outline-none text-center"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "32px", color: "#F5C518", lineHeight: 1 }}
        />
      ) : (
        <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "32px", color: "#F5C518", lineHeight: 1 }}>
          {value || "—"}
        </div>
      )}
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#8B9BB8", letterSpacing: "0.12em", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function MediaLinksTab({
  profileData,
  onChange,
  onSave,
  saving,
}: {
  profileData: ProfileData;
  onChange: (field: keyof ProfileData, val: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const links: { label: string; icon: string; field: keyof ProfileData; isHandle?: boolean }[] = [
    { label: "Hudl", icon: "🎬", field: "hudlUrl" },
    { label: "Instagram", icon: "📸", field: "instagramHandle", isHandle: true },
    { label: "NCSA", icon: "🏆", field: "ncsaUrl" },
    { label: "Highlight Film", icon: "🎥", field: "highlightFilmUrl" },
    { label: "Twitter/X", icon: "🐦", field: "twitterHandle", isHandle: true },
  ];

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const rawValue = profileData[link.field] as string;
        const displayValue = link.isHandle && rawValue && !rawValue.startsWith("@") ? `@${rawValue}` : rawValue;
        return (
          <MediaLinkField
            key={link.field as string}
            label={link.label}
            icon={link.icon}
            value={rawValue}
            displayValue={displayValue}
            isHandle={link.isHandle}
            onChange={(v) => onChange(link.field, v)}
          />
        );
      })}
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  );
}

function MediaLinkField({
  label, icon, value, displayValue, isHandle, onChange,
}: {
  label: string; icon: string; value: string; displayValue: string; isHandle?: boolean; onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors duration-150"
      style={{ background: "#0C1020", border: editing ? "1px solid #F5C518" : "1px solid #1E2A42" }}
      onClick={() => !editing && setEditing(true)}
    >
      <span style={{ fontSize: "20px", width: "28px", textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8B9BB8", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditing(false); }}
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F0F4FF", marginTop: "2px" }}
            placeholder={isHandle ? "@handle" : "https://..."}
          />
        ) : (
          <div
            className="truncate"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: value ? "#F0F4FF" : "#4A5570", marginTop: "2px" }}
          >
            {displayValue || "Not set"}
          </div>
        )}
      </div>
      {value && !editing && (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 rounded transition-colors flex-shrink-0"
          style={{ background: "#1E2A42", color: "#F5C518", fontFamily: "Inter, sans-serif", textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          Open →
        </a>
      )}
    </div>
  );
}

function SaveButton({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all duration-150 mt-2"
      style={{
        background: saving ? "#B89000" : "#F5C518",
        color: "#090D18",
        fontFamily: "Barlow Condensed, sans-serif",
        fontSize: "15px",
        letterSpacing: "0.1em",
        borderRadius: "10px",
        boxShadow: saving ? "none" : "0 4px 20px rgba(245,197,24,0.32)",
        cursor: saving ? "not-allowed" : "pointer",
        opacity: saving ? 0.8 : 1,
      }}
    >
      {saving ? "Saving…" : "Save ✓"}
    </button>
  );
}

// ─────────────────────────────────────────────
// PROFILE CARD MODAL
// ─────────────────────────────────────────────
interface ProfileCardModalProps {
  profileData: ProfileData;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onClose: () => void;
  onChange: (field: keyof ProfileData, val: string) => void;
  onSave: (tab: ProfileTab) => void;
  saving: boolean;
}

function ProfileCardModal({ profileData, activeTab, onTabChange, onClose, onChange, onSave, saving }: ProfileCardModalProps) {
  const fullName = [profileData.firstName, profileData.lastName].filter(Boolean).join(" ") || "YOUR NAME";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "YOUR";
  const lastName = nameParts.slice(1).join(" ") || "NAME";
  const initials = [profileData.firstName?.[0], profileData.lastName?.[0]].filter(Boolean).join("") || "YN";

  const TABS: { key: ProfileTab; label: string }[] = [
    { key: "personal", label: "Personal Info" },
    { key: "athletic", label: "Athletic Info" },
    { key: "media", label: "Media & Links" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl rounded-xl overflow-hidden"
        style={{ background: "#0C1020", border: "1px solid #1E2A42", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-2xl leading-none transition-colors"
          style={{ color: "#4A5570", fontFamily: "Inter, sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5C518")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4A5570")}
        >
          ×
        </button>

        {/* Hero section — updates in real time */}
        <div
          className="relative p-6 pb-0"
          style={{ background: "linear-gradient(135deg, #181E32 0%, #0C1020 100%)", borderBottom: "1px solid #1E2A42" }}
        >
          <div className="flex items-start gap-5 mb-5">
            {/* Avatar */}
            <div
              className="flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ width: 80, height: 80, background: "#131829", border: "2px solid #1E2A42" }}
            >
              {profileData.profilePhoto ? (
                <img src={profileData.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "28px", color: "#F5C518" }}>{initials}</span>
              )}
            </div>

            {/* Name + badge */}
            <div className="flex-1 min-w-0">
              {profileData.positions && (
                <span
                  className="inline-block mb-2 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "#F5C518", color: "#090D18", fontFamily: "Inter, sans-serif" }}
                >
                  {profileData.positions.split(",")[0].trim()}
                </span>
              )}
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "42px", lineHeight: 1, letterSpacing: "0.04em" }}>
                <span style={{ color: "#F0F4FF" }}>{firstName} </span>
                <span style={{ color: "#F5C518" }}>{lastName}</span>
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8B9BB8", marginTop: "4px" }}>
                {[profileData.highSchool, profileData.graduationYear ? `Class of ${profileData.graduationYear}` : ""].filter(Boolean).join(" · ") || "Add your school & grad year"}
              </p>
            </div>
          </div>

          {/* Stat bar — live updates */}
          <div className="flex gap-0 mb-0" style={{ borderTop: "1px solid #1E2A42" }}>
            {[
              { label: "HEIGHT", value: profileData.height || "—" },
              { label: "GRAD YEAR", value: profileData.graduationYear || "—" },
              { label: "GPA", value: profileData.gpa || "—" },
              { label: "SCHOOLS", value: "8" },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                className="flex-1 py-3 text-center"
                style={{ borderRight: i < arr.length - 1 ? "1px solid #1E2A42" : "none" }}
              >
                <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", color: "#F0F4FF", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#8B9BB8", letterSpacing: "0.1em", marginTop: "2px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className="px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: activeTab === tab.key ? "#F5C518" : "#8B9BB8",
                  borderBottom: activeTab === tab.key ? "2px solid #F5C518" : "2px solid transparent",
                  background: "transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6" style={{ background: "#131829" }}>
          {activeTab === "personal" && (
            <PersonalInfoTab profileData={profileData} onChange={onChange} onSave={() => onSave("personal")} saving={saving} />
          )}
          {activeTab === "athletic" && (
            <AthleticInfoTab profileData={profileData} onChange={onChange} onSave={() => onSave("athletic")} saving={saving} />
          )}
          {activeTab === "media" && (
            <MediaLinksTab profileData={profileData} onChange={onChange} onSave={() => onSave("media")} saving={saving} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// COLUMN PANEL (view-only, click opens modal)
// ─────────────────────────────────────────────
interface ColumnPanelProps {
  columnKey: string;
  title: string;
  onClick: () => void;
}

function ColumnPanel({ columnKey, title, onClick }: ColumnPanelProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative cursor-pointer group overflow-hidden flex-1"
      style={{
        background: "#131829",
        borderRight: "1px solid #1E2A42",
        backgroundImage:
          columnKey === "personal"
            ? "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663375439833/BnDiRFtcsvRMuQV7pTFbtY/MicahGoss_a9d9a0d1.webp')"
            : columnKey === "athletic"
            ? "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663375439833/BnDiRFtcsvRMuQV7pTFbtY/CooperRobinson_63a2e2a8.jpg')"
            : "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663375439833/BnDiRFtcsvRMuQV7pTFbtY/HawaiiCoach_22bc1751.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0 z-0 transition-opacity duration-300 group-hover:opacity-60"
        style={{ background: "rgba(0, 0, 0, 0.4)" }}
      />
      <div className="relative z-20 h-full flex flex-col p-8">
        <h2
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "36px",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            transition: "color 200ms",
          }}
          className="group-hover:text-[#F5C518]"
        >
          {title}
        </h2>
        <div
          className="absolute bottom-8 left-0 right-0 text-center group-hover:text-[#F5C518] transition-colors z-20"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8B9BB8" }}
        >
          Click to view & edit →
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function Profile() {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("personal");
  const [saving, setSaving] = useState(false);

  const { profile: profileData, updateProfile, setField } = useAthleteProfile();
  const { openModal, closeModal } = useModal();

  // Load profile from DB on mount (if authenticated)
  const { data: dbProfile } = trpc.athleteProfile.get.useQuery(undefined, {
    retry: false,
  });

  // Merge DB data into local state when it loads (DB is source of truth)
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

  const handleSave = async (_tab: ProfileTab) => {
    // Validate email if provided
    if (profileData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }
    setSaving(true);
    try {
      // Build a clean payload — convert empty strings to undefined so DB stores null
      const payload: Record<string, string | null | undefined> = {};
      const keys = Object.keys(profileData) as (keyof typeof profileData)[];
      for (const key of keys) {
        const val = profileData[key];
        payload[key] = val === "" ? undefined : (val as string);
      }
      await saveMutation.mutateAsync(payload as any);
      toast.success("Saved ✓");
    } catch (err) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openModalOnTab = (tab: ProfileTab) => {
    setProfileTab(tab);
    setProfileModalOpen(true);
    openModal(); 
  };

  const handleCloseModal = () => {
    setProfileModalOpen(false);
    closeModal(); 
  };

  return (
    <>
    <AppTopNav />
    <div style={{ background: "#090D18", paddingTop: "56px", paddingBottom: "32px" }}>
      {/* ── HERO SECTION (unchanged) ── */}
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: "#090D18",
          backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663375439833/BnDiRFtcsvRMuQV7pTFbtY/UCLAgym_d9b2f0ed.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.65)" }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <h1
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "120px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            PROFILE
          </h1>
          <p
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#F5C518",
              marginTop: "16px",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            THIS IS WHAT COACHES SEE. MAKE IT COUNT.
          </p>
        </motion.div>
      </div>

      {/* ── THREE-PANEL COLUMNS SECTION ── */}
      <div className="relative min-h-screen" style={{ background: "#090D18" }}>
        <div className="flex h-screen">
          <ColumnPanel columnKey="personal" title="PERSONAL INFO" onClick={() => openModalOnTab("personal")} />
          <ColumnPanel columnKey="athletic" title="ATHLETIC INFO" onClick={() => openModalOnTab("athletic")} />
          <ColumnPanel columnKey="media" title="MEDIA & LINKS" onClick={() => openModalOnTab("media")} />
        </div>
      </div>

      {/* ── PROFILE CARD MODAL ── */}
      <AnimatePresence>
        {profileModalOpen && (
          <ProfileCardModal
            profileData={profileData}
            activeTab={profileTab}
            onTabChange={setProfileTab}
            onClose={handleCloseModal}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
    </>
  );
}
