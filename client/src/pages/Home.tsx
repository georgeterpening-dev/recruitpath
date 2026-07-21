/*
 * RecruitPath — Homepage
 * Design: Full-screen hero with image background, How It Works, Stats Bar, Footer
 * Typography: Barlow Condensed 800 for display, Inter for body
 * Colors: #0A0E1A bg, #F5B800 gold accent, #F8FAFC text
 */
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import PublicNav from "@/components/PublicNav";
import SchoolFinderQuiz from "@/components/SchoolFinderQuiz";
import AppFooter from "@/components/AppFooter";


const HERO_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663375439833/BnDiRFtcsvRMuQV7pTFbtY/vb_1_web_1e3efc62.mp4";

// TopNav is now handled by PublicNav component

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fix iOS video autoplay — iOS requires muted, playsInline, and webkit-playsinline
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay blocked — try again on user interaction
        document.addEventListener("touchstart", () => video.play(), { once: true });
      });
    }
  }, []);

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        webkit-playsinline="true"
        x5-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.58)", zIndex: 1 }} />
      {/* Dotted grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
        {/* Beta badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <span
            style={{
              background: "#1A1A1A",
              color: "#F5C518",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              letterSpacing: "2px",
              padding: "4px 12px",
              borderRadius: "999px",
              fontWeight: 600,
              border: "1px solid rgba(245,197,24,0.25)",
            }}
          >
            BETA — MEN’S VOLLEYBALL
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="section-label mb-6"
        >
          THE RECRUITING PLATFORM FOR ATHLETES
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="font-display mb-6 leading-none"
          style={{ fontSize: "clamp(56px, 10vw, 96px)" }}
        >
          <span style={{ color: "#FFFFFF", display: "block" }}>YOUR FUTURE PROGRAM</span>
          <span
            className="is-waiting-gradient"
            style={{
              fontFamily: "inherit",
              fontWeight: "inherit",
              fontSize: "inherit",
              letterSpacing: "inherit",
              display: "block",
              backgroundImage: "linear-gradient(90deg, #C8860A 0%, #F5B800 40%, #FFD700 70%, #FFEC6E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >IS WAITING.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-[#94A3B8] text-xl mb-10 max-w-xl mx-auto"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
        >
          Build your profile. Find your coaches. Send your story.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
            <div>
              <motion.button
                whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 text-sm font-semibold tracking-wider uppercase rounded-lg"
                style={{ background: "#F5B800", color: "#0A0E1A", fontFamily: "Inter, sans-serif" }}
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </motion.button>
              {!isAuthenticated && (
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#888", marginTop: "8px" }}>
                  First 5 schools free — no credit card required
                </p>
              )}
            </div>
          </Link>
          <Link href="/how-it-works">
            <motion.button
              whileHover={{ scale: 1.03, background: "rgba(245,184,0,0.12)" }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 text-sm font-semibold tracking-wider uppercase rounded-lg border"
              style={{
                borderColor: "rgba(245,184,0,0.6)",
                color: "#F5B800",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                fontFamily: "Inter, sans-serif",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              How It Works
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-[#94A3B8]" />
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
        "Browse our directory of coaches at every level — D1, D2, D3, NAIA, and Community College. Filter by division, state, and conference to find the right men's volleyball program for you.",
    },
    {
      number: "03",
      title: "Send Your Story",
      description:
        "AI generates personalized intro emails to every coach you choose, pulling directly from your profile. Each email is unique, professional, and ready to send in seconds.",
    },
  ];

  return (
    <section id="how-it-works" className="py-32 px-6" style={{ background: "#0A0E1A" }}>
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="section-label mb-4 text-center"
        >
          THE PROCESS
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-white text-center mb-20"
          style={{ fontSize: "clamp(40px, 6vw, 56px)" }}
        >
          THREE STEPS TO YOUR FUTURE PROGRAM
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative"
            >
              {/* Ghost number */}
              <div
                className="ghost-number absolute -top-8 -left-2 select-none pointer-events-none"
                aria-hidden="true"
              >
                {step.number}
              </div>
              <div className="relative pt-16">
                <div
                  className="w-10 h-0.5 mb-6"
                  style={{ background: "#F5B800" }}
                />
                <h3
                  className="font-display text-white mb-4"
                  style={{ fontSize: "28px" }}
                >
                  {step.title.toUpperCase()}
                </h3>
                <p
                  className="text-[#94A3B8] leading-relaxed"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "15px" }}
                >
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
    { value: "324", label: "Programs" },
    { value: "All Divisions", label: "D1 · D2 · D3 · NAIA · CC" },
    { value: "Men's Volleyball", label: "D1, D2, D3, NAIA & CC" },
  ];

  return (
    <section className="py-16 px-6" style={{ background: "#F5B800" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className="font-display leading-none mb-2"
                style={{
                  fontSize: "clamp(36px, 5vw, 56px)",
                  color: "#0A0E1A",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "rgba(10,14,26,0.65)", fontFamily: "Inter, sans-serif" }}
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
    <section className="py-24 px-6" style={{ background: "#0A0A0A", borderTop: "1px solid #1E293B" }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "clamp(52px, 8vw, 80px)", color: "#F8FAFC", lineHeight: 1, letterSpacing: "-0.01em" }}
        >
          FIND YOUR FIT.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 mb-10"
          style={{ fontFamily: "DM Sans, sans-serif", fontSize: "17px", color: "#888888" }}
        >
          Answer 8 questions. See which programs match you.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03, filter: "brightness(1.08)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenQuiz}
          className="px-10 py-4 rounded-xl font-bold tracking-wider"
          style={{ background: "#F5C518", color: "#0A0A0A", fontFamily: "DM Sans, sans-serif", fontSize: "15px", letterSpacing: "0.08em" }}
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

  // Capture affiliate referral code from ?ref= query param (sessionStorage so it clears when tab closes)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("affiliateRef", ref.toUpperCase());
    }
  }, []);

  return (
    <div className="min-h-screen pb-[120px]" style={{ background: "#0A0E1A" }}>
      <PublicNav currentPage="home" />
      <HeroSection isAuthenticated={isAuthenticated} />
      <FindYourFitSection onOpenQuiz={() => setQuizOpen(true)} />
      <HowItWorksSection />
      <StatsBar />
      <AppFooter />
      <SchoolFinderQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
