/*
 * RecruitPath — Admin Panel (/admin)
 * Design: Functional dark dashboard — CSV upload, stats, flagged records
 * Access: Hidden route — only accessible to admin email (env var ADMIN_EMAIL)
 * For Phase 1: UI shell with mock data
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, X, Check, AlertTriangle, Database, Clock, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// Mock admin check — in production, verify against ADMIN_EMAIL env var via backend
const MOCK_IS_ADMIN = true;

const MOCK_STATS = {
  total: 1247,
  byDivision: { D1: 412, D2: 289, D3: 334, NAIA: 156, JUCO: 56 },
  lastUpload: "2026-02-15T14:32:00Z",
};

const MOCK_FLAGGED = [
  { id: "1", school: "Northfield University", coach: "Tom Bradley", sport: "Football", reason: "Coach name not found on athletic dept page", flaggedAt: "2026-02-10" },
  { id: "2", school: "Westbrook College", coach: "Sarah Chen", sport: "Women's Volleyball", reason: "Athletic department URL returning 404", flaggedAt: "2026-02-10" },
  { id: "3", school: "Lakeside State", coach: "Marcus Williams", sport: "Men's Basketball", reason: "Coach name not found on roster page", flaggedAt: "2026-02-10" },
];

const REQUIRED_COLUMNS = ["school_name", "division", "conference", "sport", "coach_name", "coach_title", "email", "state", "athletic_dept_url"];

function CountUpNumber({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count.toLocaleString()}</>;
}

export default function Admin() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [flaggedRecords, setFlaggedRecords] = useState(MOCK_FLAGGED);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!MOCK_IS_ADMIN) {
    return null; // Silently redirect in real app
  }

  const parseCSV = (text: string): string[][] => {
    return text.split("\n").filter(Boolean).map((row) =>
      row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
    );
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) return;
    setSelectedFile(file);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length > 0) {
        setPreviewHeaders(rows[0]);
        setPreviewData(rows.slice(1, 11)); // First 10 data rows
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    // Simulate processing
    setTimeout(() => {
      setUploadResult({ inserted: 47, updated: 12, skipped: 3, errors: ["Row 15: Missing required field 'email'", "Row 23: Invalid division value 'D4'", "Row 41: Missing required field 'school_name'"] });
      setIsUploading(false);
    }, 1800);
  };

  const markReviewed = (id: string) => {
    setFlaggedRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen pb-16" style={{ background: "#0A0E1A" }}>
      {/* Admin header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "#111827", borderBottom: "1px solid #1E293B" }}
      >
        <div className="flex items-center gap-4">
          <Link href="/">
            <span
              className="text-[#F5B800] text-xl cursor-pointer"
              style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              RECRUITPATH
            </span>
          </Link>
          <span
            className="px-2 py-0.5 text-xs font-semibold rounded"
            style={{ background: "rgba(245,184,0,0.15)", color: "#F5B800", border: "1px solid rgba(245,184,0,0.3)", fontFamily: "Inter, sans-serif" }}
          >
            ADMIN
          </span>
        </div>
        <span className="text-[#94A3B8] text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
          admin@recruitpath.com
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Database Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-display text-white text-2xl mb-5">DATABASE STATS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rp-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-[#F5B800]" />
                <span className="text-xs text-[#94A3B8] font-semibold tracking-wider uppercase" style={{ fontFamily: "Inter, sans-serif" }}>Total Coaches</span>
              </div>
              <div className="font-display text-white" style={{ fontSize: "40px" }}>
                <CountUpNumber target={MOCK_STATS.total} />
              </div>
            </div>
            {Object.entries(MOCK_STATS.byDivision).map(([div, count]) => (
              <div key={div} className="rp-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="division-badge text-white"
                    style={{ background: { D1: "#1E3A8A", D2: "#065F46", D3: "#7C3AED", NAIA: "#9A3412", JUCO: "#374151" }[div] || "#374151" }}
                  >
                    {div}
                  </span>
                </div>
                <div className="font-display text-white" style={{ fontSize: "40px" }}>
                  <CountUpNumber target={count} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
            <Clock size={12} />
            Last upload: {formatDate(MOCK_STATS.lastUpload)}
          </div>
        </motion.section>

        {/* CSV Upload */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="font-display text-white text-2xl mb-5">CSV UPLOAD</h2>

          {/* Required columns reference */}
          <div
            className="mb-4 p-4 rounded-xl text-xs"
            style={{ background: "rgba(245,184,0,0.05)", border: "1px solid rgba(245,184,0,0.15)", fontFamily: "Inter, sans-serif" }}
          >
            <p className="text-[#F5B800] font-semibold mb-2">Required CSV Columns:</p>
            <p className="text-[#94A3B8]">{REQUIRED_COLUMNS.join(", ")}</p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-12 text-center cursor-pointer transition-all duration-200"
            style={{
              border: `2px ${isDragOver ? "solid" : "dashed"} ${isDragOver ? "#F5B800" : "rgba(245,184,0,0.3)"}`,
              background: isDragOver ? "rgba(245,184,0,0.05)" : "transparent",
              transform: isDragOver ? "scale(1.01)" : "scale(1)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload size={32} className="mx-auto mb-3 text-[#F5B800]" />
            <p className="text-[#F8FAFC] text-sm font-medium mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
              {isDragOver ? "Drop your CSV file here" : "Drag & drop a CSV file, or click to browse"}
            </p>
            <p className="text-[#94A3B8] text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              .csv files only
            </p>
          </div>

          {/* File selected + preview */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#F5B800]" />
                    <span className="text-sm text-[#F8FAFC] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedFile(null); setPreviewData([]); setPreviewHeaders([]); setUploadResult(null); }}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Preview table */}
                {previewData.length > 0 && (
                  <div className="rp-card overflow-hidden mb-4">
                    <div className="p-3 text-xs text-[#94A3B8]" style={{ borderBottom: "1px solid #1E293B", fontFamily: "Inter, sans-serif" }}>
                      Preview — first {previewData.length} rows
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #1E293B" }}>
                            {previewHeaders.map((h) => (
                              <th key={h} className="text-left px-3 py-2 text-[#F5B800] font-semibold tracking-wider uppercase whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-3 py-2 text-[#94A3B8] whitespace-nowrap max-w-32 truncate">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Upload button */}
                {!uploadResult && (
                  <motion.button
                    whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold tracking-wider uppercase rounded-lg"
                    style={{
                      background: isUploading ? "rgba(245,184,0,0.5)" : "#F5B800",
                      color: "#0A0E1A",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {isUploading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 rounded-full border-2 border-[#0A0E1A] border-t-transparent"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Upload to Database
                      </>
                    )}
                  </motion.button>
                )}

                {/* Upload result */}
                <AnimatePresence>
                  {uploadResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rp-card p-5"
                    >
                      <h3 className="font-display text-white text-xl mb-4">UPLOAD COMPLETE</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                          <div className="font-display text-[#22C55E] text-3xl">{uploadResult.inserted}</div>
                          <div className="text-xs text-[#94A3B8] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>Inserted</div>
                        </div>
                        <div className="text-center p-3 rounded-lg" style={{ background: "rgba(245,184,0,0.1)", border: "1px solid rgba(245,184,0,0.2)" }}>
                          <div className="font-display text-[#F5B800] text-3xl">{uploadResult.updated}</div>
                          <div className="text-xs text-[#94A3B8] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>Updated</div>
                        </div>
                        <div className="text-center p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <div className="font-display text-[#EF4444] text-3xl">{uploadResult.skipped}</div>
                          <div className="text-xs text-[#94A3B8] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>Skipped</div>
                        </div>
                      </div>
                      {uploadResult.errors.length > 0 && (
                        <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <p className="text-xs font-semibold text-[#EF4444] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                            Skipped Rows:
                          </p>
                          {uploadResult.errors.map((err, i) => (
                            <p key={i} className="text-xs text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Flagged Records */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-white text-2xl">FLAGGED RECORDS</h2>
            {flaggedRecords.length > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded-full"
                style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", fontFamily: "Inter, sans-serif" }}
              >
                {flaggedRecords.length} pending
              </span>
            )}
          </div>

          {flaggedRecords.length === 0 ? (
            <div className="rp-card p-8 text-center">
              <Check size={24} className="mx-auto mb-2 text-[#22C55E]" />
              <p className="text-[#94A3B8] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                All records reviewed. No flags pending.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedRecords.map((record) => (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rp-card p-4 flex items-start justify-between gap-4"
                  style={{ border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#F8FAFC] text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                        {record.school} — {record.coach}
                      </p>
                      <p className="text-[#94A3B8] text-xs mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                        {record.sport} · Flagged {record.flaggedAt}
                      </p>
                      <p className="text-[#EF4444] text-xs mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                        {record.reason}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => markReviewed(record.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase flex-shrink-0"
                    style={{
                      border: "1px solid #22C55E",
                      color: "#22C55E",
                      background: "rgba(34,197,94,0.08)",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <Check size={10} />
                    Mark Reviewed
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Waitlist ─────────────────────────────────────────────────────── */}
        <WaitlistSection />
      </div>
    </div>
  );
}

function WaitlistSection() {
  const { data: entries, isLoading } = trpc.waitlist.list.useQuery();

  const downloadCSV = () => {
    if (!entries || entries.length === 0) return;
    const header = "email,source,joined";
    const rows = [...entries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(e => `${e.email},${e.source ?? "landing_page"},${new Date(e.createdAt).toISOString()}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sorted = entries ? [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "22px", letterSpacing: "0.06em", color: "#F5B800", marginBottom: "2px" }}>WAITLIST</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#64748B" }}>
            {isLoading ? "Loading..." : `${sorted.length} total signup${sorted.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={!entries || entries.length === 0}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(245,184,0,0.4)",
            background: "rgba(245,184,0,0.08)",
            color: "#F5B800",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            cursor: entries && entries.length > 0 ? "pointer" : "not-allowed",
            opacity: entries && entries.length > 0 ? 1 : 0.4,
          }}
        >
          Export CSV
        </button>
      </div>

      {isLoading ? (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#64748B", textAlign: "center", padding: "24px 0" }}>Loading...</p>
      ) : sorted.length === 0 ? (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#64748B", textAlign: "center", padding: "24px 0" }}>No signups yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Email</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Source</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                  <td style={{ padding: "10px 12px", color: "#F8FAFC" }}>{entry.email}</td>
                  <td style={{ padding: "10px 12px", color: "#94A3B8" }}>{entry.source ?? "landing_page"}</td>
                  <td style={{ padding: "10px 12px", color: "#94A3B8" }}>{new Date(entry.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}
