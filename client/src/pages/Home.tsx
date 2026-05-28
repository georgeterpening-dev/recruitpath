/*
 * RecruitPath — Homepage
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import SchoolFinderQuiz from "@/components/SchoolFinderQuiz";
import AppFooter from "@/components/AppFooter";

const HERO_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663375439833/BnDiRFtcsvRMuQV7pTFbtY/vb_1_web_1e3efc62.mp4";

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(9,13,24,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(30,42,66,0.7)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(245,197,24,0.04)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <span
            className="cursor-pointer"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              fontSize: "24px",
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
          {["ABOUT", "HOW IT WORKS"].map((label) => (
            <a
              key={label}
              href={label === "ABOUT" ? "/about" : "/how-it-works"}
              style={{ color: "#8B9BB8", fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", transition: "color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB8")}
            >
              {label}
            </a>
          ))}
          <Link href="/pricing">
            <span
              className="cursor-pointer"
              style={{ color: "#8B9BB8", fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", transition: "color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB8")}
            >
              PRICING
            </span>
          </Link>
          <Link href="/contact">
            <span
              className="cursor-pointer"
              style={{ color: "#8B9BB8", fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", transition: "color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB8")}
            >
              CONTACT
            </span>
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <motion.span
                whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 cursor-pointer"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.1em",
                  background: "#F5C518",
                  color: "#090D18",
                  borderRadius: "8px",
                  display: "block",
                  boxShadow: "0 2px 12px rgba(245,197,24,0.28)",
                }}
              >
                GO TO DASHBOARD
              </motion.span>
            </Link>
          ) : (
            <>
              <Link href="/signin">
                <span
                  className="cursor-pointer"
                  style={{ color: "#8B9BB8", fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", transition: "color 150ms ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB8")}
                >
                  SIGN IN
                </span>
              </Link>
              <Link href="/signup">
                <motion.span
                  whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 cursor-pointer"
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontWeight: 700,
                    fontSize: "13px",
                    letterSpacing: "0.1em",
                    background: "#F5C518",
                    color: "#090D18",
                    borderRadius: "8px",
                    display: "block",
                    boxShadow: "0 2px 12px rgba(245,197,24,0.28)",
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

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Layered overlays */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.60)", zIndex: 1 }} />
      <div className="absolute inset-0 dot-grid" style={{ zIndex: 2 }} />
      {/* Bottom gradient fade into page bg */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: "200px", background: "linear-gradient(to top, #090D18 0%, transparent 100%)", zIndex: 3 }}
      />

      {/* Content */}
      <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
        {/* Beta badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-5"
        >
          <span
            style={{
              background: "rgba(245,197,24,0.1)",
              color: "#F5C518",
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.2em",
              padding: "5px 14px",
              borderRadius: "999px",
              fontWeight: 700,
              border: "1px solid rgba(245,197,24,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            BETA — MEN'S VOLLEYBALL
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="section-label mb-5"
        >
          THE RECRUITING PLATFORM FOR ATHLETES
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-white mb-6 leading-none"
          style={{ fontSize: "clamp(56px, 10vw, 96px)" }}
        >
          YOUR FUTURE PROGRAM
          <br />
          <span className="text-gold-gradient">IS WAITING.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl mb-10 max-w-xl mx-auto"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, color: "#8B9BB8", lineHeight: 1.6 }}
        >
          Build your profile. Find your coaches. Send your story.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
            <div>
              <motion.button
                whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  letterSpacing: "0.1em",
                  background: "#F5C518",
                  color: "#090D18",
                  borderRadius: "9px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                  cursor: "pointer",
                }}
              >
                {isAuthenticated ? "GO TO DASHBOARD" : "GET STARTED — FREE"}
              </motion.button>
              {!isAuthenticated && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(139,155,184,0.7)", marginTop: "8px" }}>
                  First 5 schools free — no credit card required
                </p>
              )}
            </div>
          </Link>
          <Link href="/how-it-works">
            <motion.button
              whileHover={{ scale: 1.02, borderColor: "rgba(245,197,24,0.7)", background: "rgba(245,197,24,0.08)" }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 700,
                fontSize: "15px",
                letterSpacing: "0.1em",
                borderRadius: "9px",
                border: "1.5px solid rgba(245,197,24,0.4)",
                color: "#F5C518",
                background: "transparent",
                cursor: "pointer",
                transition: "border-color 200ms ease, background 200ms ease",
                backdropFilter: "blur(8px)",
              }}
            >
              HOW IT WORKS
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 20 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} style={{ color: "rgba(139,155,184,0.6)" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Build Your Profile",
      description:
        "Enter your athletic and academic info once. Your profile becomes the foundation for every coach outreach — stats, highlights, GPA, and your personal story all in one place.",
    },
    {
      number: "02",
      title: "Find Your Coaches",
      description:
        "Browse our directory of coaches at every level — D1, D2, D3, NAIA, and JUCO. Filter by sport, division, state, and conference to find programs that fit your goals.",
    },
    {
      number: "03",
      title: "Send Your Story",
      description:
        "AI generates personalized intro emails to every coach you choose, pulling directly from your profile. Each email is unique, professional, and ready to send in seconds.",
    },
  ];

  return (
    <section id="how-it-works" className="py-32 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="section-label mb-4 text-center"
        >
          THE PROCESS
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-white text-center mb-20"
          style={{ fontSize: "clamp(40px, 6vw, 56px)" }}
        >
          THREE STEPS TO YOUR FUTURE PROGRAM
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div
                className="ghost-number absolute -top-8 -left-2 select-none pointer-events-none"
                aria-hidden="true"
              >
                {step.number}
              </div>
              <div className="step-card">
                <h3
                  className="font-display text-white mb-4"
                  style={{ fontSize: "30px" }}
                >
                  {step.title.toUpperCase()}
                </h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#8B9BB8", lineHeight: 1.7 }}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { value: "1,100+", label: "Schools" },
    { value: "All Divisions", label: "D1 · D2 · D3 · NAIA · JUCO" },
    { value: "Every Sport", label: "From Football to Fencing" },
  ];

  return (
    <section className="py-16 px-6 stats-bar-section">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="font-display leading-none mb-2"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", color: "#090D18", letterSpacing: "-0.02em" }}
              >
                {stat.value}
              </div>
              <div
                style={{ color: "rgba(9,13,24,0.55)", fontFamily: "Barlow Condensed, sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FindYourFitSection({ onOpenQuiz }: { onOpenQuiz: () => void }) {
  return (
    <section
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "#0C1020", borderTop: "1px solid #1E2A42" }}
    >
      {/* Ambient glow */}
      <div
        className="ambient-blob"
        style={{
          width: "500px",
          height: "300px",
          background: "rgba(245,197,24,0.05)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-white mb-4"
          style={{ fontSize: "clamp(52px, 8vw, 80px)", lineHeight: 1 }}
        >
          FIND YOUR FIT.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 mb-10"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "17px", color: "#8B9BB8", lineHeight: 1.6 }}
        >
          Answer 8 questions. See which programs match you.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenQuiz}
          className="px-10 py-4"
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "0.1em",
            background: "#F5C518",
            color: "#090D18",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(245,197,24,0.28)",
          }}
        >
          FIND MY SCHOOLS →
        </motion.button>
      </div>
    </section>
  );
}

export default function Home() {
  const [quizOpen, setQuizOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen" style={{ background: "#090D18" }}>
      <TopNav />
      <HeroSection isAuthenticated={isAuthenticated} />
      <FindYourFitSection onOpenQuiz={() => setQuizOpen(true)} />
      <HowItWorksSection />
      <StatsBar />
      <AppFooter />
      <SchoolFinderQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
