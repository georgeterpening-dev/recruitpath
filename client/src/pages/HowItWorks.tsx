/*
 * RecruitPath — How It Works Page
 * Design: #090D18 background, #F5C518 gold accents, Barlow Condensed headings, Inter body
 * Sections: Hero, The Old Way, The RecruitPath Way, Step-by-Step (8 steps), Comparison, Social Proof, CTA
 */
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import AppFooter from "@/components/AppFooter";
import SchoolFinderQuiz from "@/components/SchoolFinderQuiz";

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(9,13,24,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(30,42,66,0.5)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <span
            className="cursor-pointer text-2xl tracking-tight"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RECRUITPATH
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {["ABOUT", "HOW IT WORKS"].map((label) => {
            const isActive = (label === "ABOUT" && location === "/about") || (label === "HOW IT WORKS" && location === "/how-it-works");
            return (
              <a
                key={label}
                href={label === "ABOUT" ? "/about" : "/how-it-works"}
                className={`text-xs font-semibold tracking-widest transition-colors duration-150 ${
                  isActive ? "text-[#F8FAFC]" : "text-[#8B9BB8] hover:text-[#F8FAFC]"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {label}
              </a>
            );
          })}
          <Link href="/pricing">
            <span className={`text-xs font-semibold tracking-widest transition-colors duration-150 cursor-pointer ${
              location === "/pricing" ? "text-[#F8FAFC]" : "text-[#8B9BB8] hover:text-[#F8FAFC]"
            }`} style={{ fontFamily: "Inter, sans-serif" }}>
              PRICING
            </span>
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <motion.span
                  whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-xs font-semibold tracking-widest uppercase rounded-lg cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Barlow Condensed, sans-serif",
                    boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                  }}
                >
                  GO TO DASHBOARD
                </motion.span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin">
                <span className="text-xs font-semibold tracking-widest text-[#8B9BB8] hover:text-[#F8FAFC] transition-colors duration-150 cursor-pointer" style={{ fontFamily: "Inter, sans-serif" }}>
                  SIGN IN
                </span>
              </Link>
              <Link href="/signup">
                <motion.span
                  whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-xs font-semibold tracking-widest uppercase rounded-lg cursor-pointer"
                  style={{
                    background: "#F5C518",
                    color: "#090D18",
                    fontFamily: "Barlow Condensed, sans-serif",
                    boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                  }}
                >
                  GET STARTED
                </motion.span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}

// ─── Section 1: Hero ─────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1400&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(9,13,24,0.75)" }} />
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Yellow pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "#F5C518", color: "#090D18", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.12em" }}
        >
          HOW IT WORKS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-white mb-6 leading-none"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(56px, 10vw, 96px)", letterSpacing: "0.04em" }}
        >
          FROM UNKNOWN<br />TO RECRUITED.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-[#8B9BB8] text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Most athletes send the same generic email to 50 coaches and hear nothing back. RecruitPath does something different. Here's how.
        </motion.p>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[#8B9BB8] text-xs tracking-widest uppercase" style={{ fontFamily: "Inter, sans-serif" }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-[#F5C518]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Section 2: The Old Way ───────────────────────────────────────────────────

function OldWaySection() {
  const painPoints = [
    {
      title: "GENERIC EMAILS",
      body: "Coaches can spot a copy-paste email in 3 seconds. It goes straight to the bottom of the pile.",
    },
    {
      title: "NO ROSTER INTEL",
      body: "You have no idea if a program even needs your position before you reach out.",
    },
    {
      title: "NO FOLLOW THROUGH",
      body: "Most athletes send one email and give up. Coaches recruit athletes who show consistent interest.",
    },
  ];

  return (
    <section className="py-28 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-3xl mx-auto text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#F5C518", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.12em" }}
        >
          THE OLD WAY
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-white mb-8"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 52px)", letterSpacing: "0.04em" }}
        >
          WHY MOST ATHLETES GET IGNORED
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          The traditional recruiting process looks like this: find a list of schools, copy and paste the same email, send it to 50 coaches, and wait. Maybe 2 respond. You have no idea why the others didn't. You don't know if the program even has a spot for you. You don't know if the coach is retiring. You don't know if they just signed someone at your position last week. You're shouting into the void.
        </motion.p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {painPoints.map((point, i) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="p-7 rounded-xl"
            style={{ background: "#131829", border: "1px solid #1E2A42" }}
          >
            <div className="w-8 h-0.5 mb-5" style={{ background: "#F5C518" }} />
            <h3
              className="text-white mb-3"
              style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "18px", letterSpacing: "0.05em" }}
            >
              {point.title}
            </h3>
            <p className="text-[#8B9BB8] text-sm leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              {point.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 3: The RecruitPath Way ──────────────────────────────────────────

const timelineSteps = [
  "Build Your Profile",
  "Find Your Schools",
  "Analyze Roster Gaps",
  "Generate Your Email",
  "Send & Track",
  "Reply & Follow Up",
];

function RecruitPathWaySection() {
  return (
    <section className="py-28 px-6" style={{ background: "#0C1020", borderTop: "1px solid #1E2A42", borderBottom: "1px solid #1E2A42" }}>
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(44px, 8vw, 72px)", letterSpacing: "0.04em", color: "#F5C518" }}
        >
          THERE IS A SMARTER WAY.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg leading-relaxed text-center max-w-2xl mx-auto mb-20"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          RecruitPath gives you the same information and tools that only well-connected club coaches and expensive recruiting consultants used to have. Now any athlete can use it.
        </motion.p>

        {/* Horizontal timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-0 right-0 h-0.5 hidden md:block"
            style={{ background: "linear-gradient(to right, #F5C518, #F5C518)", opacity: 0.3 }}
          />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {timelineSteps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="flex flex-col items-center text-center gap-3"
              >
                {/* Yellow dot */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10"
                  style={{ background: "#F5C518", color: "#090D18", fontFamily: "Barlow Condensed, sans-serif" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p
                  className="text-white text-xs font-semibold leading-tight"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {step}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Step by Step ──────────────────────────────────────────────────

type Step = {
  number: string;
  headline: string;
  body: string;
  tip: string;
  extra?: React.ReactNode;
  quizButton?: boolean;
};

const steps: Step[] = [
  {
    number: "01",
    headline: "START WITH YOUR PROFILE",
    body: "Before you do anything else, fill out your profile completely. Your name, grad year, position, height, GPA, club team, intended major, and media links. This is not just for show — every email RecruitPath generates pulls directly from your profile. The more complete it is, the more personalized your emails will be. A coach receiving an email that mentions your exact vertical jump, your GPA, and your intended major is going to take it far more seriously than one that says 'I am a volleyball player interested in your program.'",
    tip: "Pro tip: Add your Hudl link. Coaches who receive emails with a highlight link are significantly more likely to respond.",
  },
  {
    number: "02",
    headline: "LET THE DATA FIND YOUR SCHOOLS",
    body: "Don't start by randomly browsing 30 programs. Take the 8-question School Finder quiz first. Answer questions about your target division, location preferences, school size, academic priorities, budget, campus vibe, and how important name recognition is to you. RecruitPath scores every program against your answers and shows you your top matches ranked by fit percentage. You might be surprised — some of your best fits are programs you never considered.",
    tip: "Pro tip: Be honest about division. Targeting 10 realistic D2 programs is more effective than targeting 10 D1 programs you have no chance at.",
    quizButton: true,
    extra: (
      <div
        className="mt-6 p-5 rounded-xl flex flex-wrap gap-3"
        style={{ background: "#0C1020", border: "1px solid #1E2A42", borderRadius: "12px" }}
      >
        {["Division Level", "Location", "School Size", "Academics", "Budget", "Campus Vibe", "Name Recognition", "Conference"].map((q) => (
          <span
            key={q}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#181E32", color: "#8B9BB8", fontFamily: "Inter, sans-serif", border: "1px solid #1E2A42" }}
          >
            {q}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: "03",
    headline: "ONLY EMAIL PROGRAMS THAT NEED YOU",
    body: "This is RecruitPath's most powerful feature. Before you email a single coach, check the Roster Gap Finder for that school. It shows you exactly how many players at your position are graduating and when — so you can see if there will actually be a spot for you when you arrive. If a program has 4 outside hitters graduating in 2027 and you're a Class of 2027 outside hitter, that's a program you should be emailing first. If they just recruited two outside hitters for your class, move on. Stop wasting emails on programs that have no room for you.",
    tip: "Pro tip: Sort your dashboard by most openings at your position. Email those programs first.",
    extra: (
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "GRADUATING", value: "4", color: "#F5C518" },
          { label: "COMMITS FILLING", value: "1", color: "#8B9BB8" },
          { label: "REAL OPENINGS", value: "3", color: "#22C55E" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl text-center"
            style={{ background: "#0C1020", border: "1px solid #1E2A42", borderRadius: "12px" }}
          >
            <div
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "Barlow Condensed, sans-serif", color: stat.color, letterSpacing: "0.04em" }}
            >
              {stat.value}
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "#4A5570", fontFamily: "Inter, sans-serif" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "04",
    headline: "EMAILS THAT SOUND LIKE YOU WROTE THEM",
    body: "Once you've identified a program with roster openings that matches your profile, generate your email. RecruitPath's AI reads your entire profile — your position, grad year, GPA, club team, intended major, highlight links — and combines it with the school's real roster data to write an email that references actual openings at your position. It can even reference the school's academic strengths if they match your intended major. Choose from four tones: Confident, Respectful, Energetic, or Concise. Every email generated is different — no two emails are ever worded the same way.",
    tip: "Pro tip: Use Respectful tone for D1 programs and Energetic for D3 — coaches at smaller programs often appreciate personality.",
    extra: (
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "CONFIDENT", active: false },
          { label: "RESPECTFUL", active: true },
          { label: "ENERGETIC", active: false },
          { label: "CONCISE", active: false },
        ].map((tone) => (
          <span
            key={tone.label}
            className="px-4 py-2 rounded-lg text-xs font-semibold tracking-widest"
            style={{
              background: tone.active ? "#F5C518" : "#181E32",
              color: tone.active ? "#090D18" : "#8B9BB8",
              border: tone.active ? "none" : "1px solid #1E2A42",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {tone.label}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: "05",
    headline: "SEND FROM YOUR OWN EMAIL ADDRESS",
    body: "This is what makes RecruitPath different from every other platform. When you send an email through RecruitPath it does not come from a generic platform address — it comes directly from your personal Gmail account. The coach sees your name and your email address in their inbox, exactly like you sent it yourself. Connect your Gmail once in settings and every email you send through the app goes out as you. No copy-pasting. No switching apps. One click and it's sent.",
    tip: "Pro tip: Review the pre-send checklist carefully every time. A typo in the coach's name or your grad year can hurt your first impression.",
  },
  {
    number: "06",
    headline: "KNOW WHERE YOU STAND WITH EVERY PROGRAM",
    body: "After you send, your Outreach Tracker on the dashboard logs every email with the date, subject line, and school. Update the status as things progress — No Response, Response Received, Conversation Ongoing, Visit Scheduled, Offer Received. The tracker shows you a colored pill for each school indicating how many days since your last contact. Green means recent, yellow means it's been a while, red means it's time to follow up.",
    tip: "Pro tip: If a school goes red (22+ days with no response), that's your signal to send a follow up — not to give up.",
    extra: (
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "No Response", color: "#4A4A4A" },
          { label: "Response Received", color: "#22C55E" },
          { label: "Conversation Ongoing", color: "#3B82F6" },
          { label: "Visit Scheduled", color: "#A855F7" },
          { label: "Offer Received", color: "#F5C518" },
        ].map((status) => (
          <span
            key={status.label}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: `${status.color}22`, color: status.color, border: `1px solid ${status.color}44`, fontFamily: "Inter, sans-serif" }}
          >
            {status.label}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: "07",
    headline: "THE FOLLOW UP IS WHERE RECRUITING IS WON",
    body: "Most high school athletes send one email and never follow up. College coaches are busy. A second email 3-4 weeks later that briefly restates your interest and mentions something new — an upcoming tournament, new film, an academic achievement — shows persistence and genuine interest. RecruitPath generates follow up emails automatically. Just click Follow Up on any school in your tracker, hit Generate, and send. It references your original email so the coach has context.",
    tip: "Pro tip: Mention a specific upcoming event in your follow up — 'I will be competing at [tournament] on [date] if you are evaluating prospects.' Coaches love specifics.",
  },
  {
    number: "08",
    headline: "WHEN A COACH RESPONDS, BE READY",
    body: "Coach responses come to your personal Gmail inbox — keep an eye on it. When you receive a reply, come back to RecruitPath, open that school in your Outreach Tracker, paste the coach's response into the Reply Generator, and hit Analyze. RecruitPath reads the coach's email, tells you how interested they seem, what they asked for, and generates a tailored reply that addresses their specific questions and keeps the conversation moving.",
    tip: "Pro tip: Respond to coach emails within 24 hours. Response speed signals maturity and genuine interest.",
  },
];

function StepRow({ step, index, onOpenQuiz }: { step: Step; index: number; onOpenQuiz?: () => void }) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-10 md:gap-16 items-start py-16 border-b`}
      style={{ borderColor: "#181E32" }}
    >
      {/* Step number */}
      <div className="flex-shrink-0 w-full md:w-auto flex md:flex-col items-center md:items-start gap-4 md:gap-0">
        <span
          className="leading-none select-none"
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "clamp(72px, 10vw, 120px)",
            color: "#F5C518",
            letterSpacing: "0.02em",
            lineHeight: 1,
            opacity: 0.9,
          }}
        >
          {step.number}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3
          className="text-white mb-5"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "0.04em" }}
        >
          {step.headline}
        </h3>
        <p className="text-[#8B9BB8] text-base leading-relaxed mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
          {step.body}
        </p>

        {/* Optional extra visual */}
        {step.extra}

        {/* Yellow tip card */}
        <div
          className="mt-6 p-4 rounded-xl flex gap-3 items-start"
          style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.25)" }}
        >
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-sm leading-relaxed" style={{ color: "#F5C518", fontFamily: "Inter, sans-serif" }}>
            {step.tip}
          </p>
        </div>

        {/* Quiz CTA button — only for Step 02 */}
        {step.quizButton && onOpenQuiz && (
          <button
            onClick={onOpenQuiz}
            className="mt-5 flex items-center gap-2"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "15px",
              letterSpacing: "0.08em",
              color: "#090D18",
              background: "#F5C518",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              cursor: "pointer",
              transition: "filter 0.15s",
              boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
          >
            TAKE THE QUIZ NOW →
          </button>
        )}
      </div>
    </motion.div>
  );
}

function StepByStepSection({ onOpenQuiz }: { onOpenQuiz: () => void }) {
  return (
    <section className="py-20 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold tracking-widest uppercase mb-4 text-center"
          style={{ color: "#F5C518", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.12em" }}
        >
          THE RECOMMENDED PATH
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-white text-center mb-16"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 52px)", letterSpacing: "0.04em" }}
        >
          STEP BY STEP
        </motion.h2>

        {steps.map((step, i) => (
          <StepRow key={step.number} step={step} index={i} onOpenQuiz={onOpenQuiz} />
        ))}
      </div>
    </section>
  );
}

// ─── Section 5: Comparison Table ─────────────────────────────────────────────

const comparisonRows = [
  { feature: "Personalized emails", traditional: "Generic templates", recruitpath: "AI-generated from your real profile" },
  { feature: "Roster intelligence", traditional: "None", recruitpath: "Real roster gap data by position and grad year" },
  { feature: "Sends from your email", traditional: "No — sends from platform address", recruitpath: "Yes — sends from your Gmail" },
  { feature: "Coach reply analysis", traditional: "None", recruitpath: "AI analyzes coach responses and suggests replies" },
  { feature: "Follow up generation", traditional: "None", recruitpath: "Auto-generated based on days elapsed" },
  { feature: "Outreach tracking", traditional: "Basic or none", recruitpath: "Full tracker with status and timeline" },
  { feature: "School matching", traditional: "Manual browsing", recruitpath: "8-question quiz with fit score algorithm" },
  { feature: "Price", traditional: "$99–$299/month", recruitpath: "$49.99 one time" },
];

function ComparisonSection() {
  return (
    <section className="py-28 px-6" style={{ background: "#090D18", borderTop: "1px solid #1E2A42" }}>
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-white text-center mb-4"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 52px)", letterSpacing: "0.04em" }}
        >
          WHY RECRUITPATH WORKS BETTER
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-[#8B9BB8] text-center mb-14"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "16px" }}
        >
          Here's how we compare to the traditional approach and other platforms
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #1E2A42" }}
        >
          {/* Header row */}
          <div className="grid grid-cols-3 text-xs font-semibold tracking-widest uppercase" style={{ background: "#131829" }}>
            <div className="p-4 text-[#4A5570]" style={{ fontFamily: "Inter, sans-serif" }}>Feature</div>
            <div className="p-4 text-[#4A5570] border-l" style={{ fontFamily: "Inter, sans-serif", borderColor: "#1E2A42" }}>Traditional / Other Platforms</div>
            <div className="p-4 border-l" style={{ fontFamily: "Inter, sans-serif", borderColor: "#1E2A42", color: "#F5C518", background: "rgba(245,197,24,0.06)" }}>RecruitPath</div>
          </div>

          {comparisonRows.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-3 text-sm"
              style={{ borderTop: "1px solid #1E2A42", background: i % 2 === 0 ? "#090D18" : "#0C1020" }}
            >
              <div className="p-4 font-medium text-white" style={{ fontFamily: "Inter, sans-serif" }}>{row.feature}</div>
              <div className="p-4 text-[#4A5570] border-l" style={{ fontFamily: "Inter, sans-serif", borderColor: "#1E2A42" }}>{row.traditional}</div>
              <div
                className="p-4 border-l font-medium"
                style={{
                  fontFamily: "Inter, sans-serif",
                  borderColor: "#1E2A42",
                  color: "#F5C518",
                  background: "rgba(245,197,24,0.04)",
                }}
              >
                {row.recruitpath}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 6: CTA ───────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-32 px-6 text-center" style={{ background: "#090D18", borderTop: "1px solid #1E2A42" }}>
      <div className="max-w-2xl mx-auto">
        {/* Beta pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-8 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "#181E32", color: "#F5C518", border: "1px solid #1E2A42", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.12em" }}
        >
          BETA — MEN'S VOLLEYBALL
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-white mb-5"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(44px, 8vw, 72px)", letterSpacing: "0.04em" }}
        >
          READY TO GET RECRUITED?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg mb-10"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Join athletes already using RecruitPath to find their program.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 text-base font-semibold tracking-wider uppercase rounded-xl"
              style={{
                background: "#F5C518",
                color: "#090D18",
                fontFamily: "Barlow Condensed, sans-serif",
                boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
              }}
            >
              GET STARTED — $49.99 →
            </motion.button>
          </Link>
          <p
            className="mt-4 text-xs"
            style={{ color: "#4A5570", fontFamily: "Inter, sans-serif" }}
          >
            One time payment. No subscription. No hidden fees.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function HowItWorks() {
  const [quizOpen, setQuizOpen] = useState(false);
  return (
    <div style={{ background: "#090D18" }}>
      <TopNav />
      <HeroSection />
      <OldWaySection />
      <RecruitPathWaySection />
      <StepByStepSection onOpenQuiz={() => setQuizOpen(true)} />
      <ComparisonSection />
      <CTASection />
      <div style={{ paddingBottom: "120px" }}>
        <AppFooter />
      </div>
      <SchoolFinderQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
