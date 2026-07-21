/*
 * RecruitPath — AI Email Generator
 * Design: Left school list + right email preview panel
 * Features: Typewriter animation (30 chars/sec), blinking gold cursor, copy/regenerate
 * Schools are fetched from the user's outreach list via tRPC — no hardcoded defaults.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Copy, RefreshCw, Check, Mail, ChevronRight, Target, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { SCHOOL_DATABASE } from "@/data/schoolDatabase";


const DIVISION_COLORS: Record<string, string> = {
  D1: "#1E3A8A",
  D2: "#065F46",
  D3: "#7C3AED",
  NAIA: "#9A3412",
  JUCO: "#374151",
};

interface OutreachSchool {
  id: number;
  schoolId: string;
  schoolName: string | null;
  coachName: string | null;
  sport: string | null;
  division: string | null;
}

function generateEmailText(school: OutreachSchool): string {
  const coachLast = school.coachName?.split(" ").pop() || "Coach";
  const schoolName = school.schoolName || "your university";
  const sport = school.sport || "athletics";

  return `Dear Coach ${coachLast},

My name is [Your Name], and I am a [year] [position] at [Your High School] in [City, State]. I am writing to express my strong interest in the ${sport} program at ${schoolName}.

This past season, I [describe key stats/achievements]. I carry a [GPA] GPA and am committed to performing at the highest level both on the field and in the classroom. I believe ${schoolName}'s program aligns perfectly with my athletic and academic goals.

I would be honored to have the opportunity to visit campus and speak with you about how I might contribute to your program. I have attached my highlight film for your review.

Highlight Video: [Your highlight link]

Thank you for your time and consideration. I look forward to hearing from you.

Respectfully,
[Your Name]
[Your High School] | Class of [Year]
[Phone] | [Email]`;
}

const TYPEWRITER_SPEED = 30; // chars per second

function TypewriterEmail({
  text,
  isTyping,
  onComplete,
}: {
  text: string;
  isTyping: boolean;
  onComplete: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!isTyping) return;
    setDisplayedText("");
    setCharIndex(0);
  }, [text, isTyping]);

  useEffect(() => {
    if (!isTyping) return;
    if (charIndex >= text.length) {
      onComplete();
      return;
    }
    const delay = 1000 / TYPEWRITER_SPEED;
    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, charIndex + 1));
      setCharIndex((i) => i + 1);
    }, delay);
    return () => clearTimeout(timeout);
  }, [charIndex, text, isTyping, onComplete]);

  const isComplete = charIndex >= text.length;

  return (
    <div className="relative">
      <pre
        className="whitespace-pre-wrap text-sm leading-relaxed text-[#F8FAFC]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {displayedText}
        {isTyping && !isComplete && <span className="typewriter-cursor" />}
      </pre>
    </div>
  );
}

export default function Emails() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState<OutreachSchool | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailText, setEmailText] = useState("");

  // Fetch user's real outreach list from tRPC
  const { data: outreachData, isLoading: outreachLoading } = trpc.outreach.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const schools: OutreachSchool[] = useMemo(() => {
    if (!outreachData) return [];
    return outreachData.map((entry: any) => ({
      id: entry.id,
      schoolId: entry.schoolId,
      schoolName: entry.schoolName,
      coachName: entry.coachName,
      sport: entry.sport,
      division: entry.division,
    }));
  }, [outreachData]);

  const startGeneration = useCallback((school: OutreachSchool) => {
    setSelectedSchool(school);
    setEmailText(generateEmailText(school));
    setIsTyping(true);
    setIsComplete(false);
    setCopied(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsTyping(false);
    setIsComplete(true);
  }, []);

  const handleRegenerate = () => {
    if (!selectedSchool) return;
    setIsTyping(true);
    setIsComplete(false);
    setCopied(false);
    setEmailText(generateEmailText(selectedSchool));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const hasSchools = schools.length > 0;

  return (
    <>
    <div className="min-h-screen pb-8" style={{ background: "#0A0E1A" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-10">
        <p className="section-label mb-1">Outreach</p>
        <h1 className="page-title text-4xl md:text-5xl">Email Generator</h1>
        <p className="text-[#94A3B8] text-sm mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
          AI-personalized intro emails for every coach on your list.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Loading state */}
        {outreachLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={32} className="text-[#F5B800] animate-spin mb-4" />
            <p
              className="text-[#94A3B8] text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Loading your schools...
            </p>
          </div>
        ) : !hasSchools ? (
          /* ─── Empty State: No Schools Selected ──────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: "rgba(245,184,0,0.08)",
                border: "1px solid rgba(245,184,0,0.2)",
              }}
            >
              <Target size={36} className="text-[#F5B800]" />
            </div>
            <h2
              className="font-display text-white mb-3"
              style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
            >
              NO SCHOOLS SELECTED YET
            </h2>
            <p
              className="text-[#94A3B8] text-base max-w-md mb-8 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Add schools to your target list in the Coach Directory first.
              Once you've selected schools, come back here to generate
              personalized intro emails for each coach.
            </p>
            <Link href="/schools">
              <motion.button
                whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 text-sm font-semibold tracking-wider uppercase rounded-lg cursor-pointer"
                style={{
                  background: "#F5B800",
                  color: "#0A0E1A",
                  fontFamily: "Inter, sans-serif",
                  border: "none",
                }}
              >
                SELECT YOUR SCHOOLS →
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          /* ─── Main Layout: School List + Email Preview ──────────────────── */
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
            {/* Left: School list */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:w-72 flex-shrink-0"
            >
              <div className="rp-card h-full flex flex-col">
                <div className="p-5" style={{ borderBottom: "1px solid #1E293B" }}>
                  <h2 className="font-display text-white text-xl">TARGET SCHOOLS</h2>
                  <p
                    className="text-[#94A3B8] text-xs mt-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Select a school to generate your personalized intro email
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {schools.map((school) => (
                    <motion.button
                      key={school.schoolId}
                      whileHover={{ x: 2 }}
                      onClick={() => startGeneration(school)}
                      className="w-full text-left p-3 rounded-lg transition-all duration-150 flex items-center justify-between group"
                      style={{
                        background:
                          selectedSchool?.schoolId === school.schoolId
                            ? "rgba(245,184,0,0.08)"
                            : "transparent",
                        border: `1px solid ${
                          selectedSchool?.schoolId === school.schoolId
                            ? "rgba(245,184,0,0.3)"
                            : "#1E293B"
                        }`,
                      }}
                    >
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            color:
                              selectedSchool?.schoolId === school.schoolId
                                ? "#F5B800"
                                : "#F8FAFC",
                          }}
                        >
                          {school.schoolName || school.schoolId}
                        </p>
                        <p
                          className="text-[#94A3B8] text-xs mt-0.5"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {school.coachName || "Coach TBD"} · {school.sport || "—"}
                        </p>
                        {school.division && (
                          <span
                            className="division-badge text-white mt-1 inline-block"
                            style={{
                              background:
                                DIVISION_COLORS[school.division] || "#374151",
                            }}
                          >
                            {school.division}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-[#94A3B8] group-hover:text-[#F5B800] transition-colors flex-shrink-0"
                      />
                    </motion.button>
                  ))}
                </div>
                <div className="p-4" style={{ borderTop: "1px solid #1E293B" }}>
                  <p
                    className="text-[#94A3B8] text-xs text-center"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Add more schools in the{" "}
                    <Link href="/schools">
                      <span className="text-[#F5B800] hover:underline cursor-pointer">
                        Coach Directory
                      </span>
                    </Link>
                  </p>
                </div>
              </div>
            </motion.aside>

            {/* Right: Email preview */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <div className="rp-card h-full flex flex-col">
                {/* Email header */}
                <div
                  className="p-5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid #1E293B" }}
                >
                  <div>
                    {selectedSchool ? (
                      <>
                        <h2 className="font-display text-white text-xl">
                          EMAIL TO{" "}
                          {(
                            selectedSchool.schoolName || selectedSchool.schoolId
                          ).toUpperCase()}
                        </h2>
                        <p
                          className="text-[#94A3B8] text-xs mt-0.5"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Attn: {selectedSchool.coachName || "Head Coach"} ·{" "}
                          {selectedSchool.sport || "—"}
                        </p>
                      </>
                    ) : (
                      <h2 className="font-display text-white text-xl">
                        EMAIL PREVIEW
                      </h2>
                    )}
                  </div>
                  <AnimatePresence>
                    {isComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleRegenerate}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                          style={{
                            border: "1px solid #1E293B",
                            color: "#94A3B8",
                            fontFamily: "Inter, sans-serif",
                            background: "transparent",
                          }}
                        >
                          <RefreshCw size={12} />
                          Regenerate
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase cursor-pointer"
                          style={{
                            background: copied
                              ? "rgba(34,197,94,0.15)"
                              : "#F5B800",
                            color: copied ? "#22C55E" : "#0A0E1A",
                            border: copied ? "1px solid #22C55E" : "none",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? "Copied!" : "Copy Email"}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {!selectedSchool ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                          background: "rgba(245,184,0,0.08)",
                          border: "1px solid rgba(245,184,0,0.2)",
                        }}
                      >
                        <Mail size={28} className="text-[#F5B800]" />
                      </div>
                      <h3 className="font-display text-white text-2xl mb-2">
                        READY TO GENERATE
                      </h3>
                      <p
                        className="text-[#94A3B8] text-sm max-w-sm"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Select a school from your target list to generate a
                        personalized intro email powered by AI.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="p-5 rounded-xl"
                      style={{
                        background: "#0A0E1A",
                        border: "1px solid #1E293B",
                      }}
                    >
                      {/* Email metadata */}
                      <div
                        className="mb-5 pb-4"
                        style={{ borderBottom: "1px solid #1E293B" }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="text-xs text-[#94A3B8]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            To:
                          </span>
                          <span
                            className="text-sm text-[#F8FAFC]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {(() => {
                            const dbEntry = SCHOOL_DATABASE.find(s => s.id === selectedSchool.schoolId);
                            const email = dbEntry?.coachEmail || "coach@university.edu";
                            return `${selectedSchool.coachName || "Head Coach"} <${email}>`;
                          })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs text-[#94A3B8]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Subject:
                          </span>
                          <span
                            className="text-sm text-[#F8FAFC]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Prospective Athlete Introduction — [Your Name],{" "}
                            {selectedSchool.sport || "Athlete"}, Class of [Year]
                          </span>
                        </div>
                      </div>

                      {/* Typewriter content */}
                      {isTyping || isComplete ? (
                        <TypewriterEmail
                          text={emailText}
                          isTyping={isTyping}
                          onComplete={handleComplete}
                        />
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status bar */}
                {isTyping && (
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ borderTop: "1px solid #1E293B" }}
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#F5B800" }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs text-[#94A3B8]"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Generating personalized email...
                    </span>
                  </div>
                )}
              </div>
            </motion.main>
          </div>
        )}
      </div>

    </div>
    </>
  );
}
