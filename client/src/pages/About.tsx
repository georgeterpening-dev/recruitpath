/*
 * RecruitPath — About Page
 * Design: Dark mode, Barlow Condensed headlines, Inter body, #F5C518 gold accents
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AppFooter from "@/components/AppFooter";

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
            className="text-2xl tracking-tight cursor-pointer"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
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
                    background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
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
                    background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
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

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" style={{ background: "#090D18" }}>
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-white mb-6"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(48px, 8vw, 72px)", letterSpacing: "0.05em" }}
        >
          BUILT FOR ATHLETES.
          <br />
          BY ATHLETES.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg"
          style={{ fontFamily: "Inter, sans-serif", maxWidth: "600px", margin: "0 auto" }}
        >
          RecruitPath was built because the college volleyball recruiting process is broken. We're fixing it.
        </motion.p>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-white mb-8"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 48px)", letterSpacing: "0.05em" }}
        >
          THE PROBLEM
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Every year thousands of talented volleyball players miss out on their dream program not because they weren't good enough — but because they didn't know how to navigate the recruiting process. Cold emails get ignored. Rosters are hard to read. Coaches are hard to reach. Most athletes have no idea which programs even have openings for their position and graduation year.
        </motion.p>
      </div>
    </section>
  );
}

function SolutionSection() {
  const cards = [
    {
      title: "ROSTER GAP FINDER",
      description: "See exactly which programs have openings at your position before you reach out. Stop emailing coaches who have no room for you.",
    },
    {
      title: "AI EMAIL GENERATION",
      description: "Generate personalized outreach emails that reference real roster data, your actual stats, and the school's specific program strengths.",
    },
    {
      title: "OUTREACH TRACKER",
      description: "Track every email you send, monitor responses, and generate follow ups — all in one place.",
    },
  ];

  return (
    <section className="py-24 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-white mb-16 text-center"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 48px)", letterSpacing: "0.05em" }}
        >
          WHAT WE BUILT
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="p-8"
              style={{ background: "#131829", border: "1px solid #1E2A42", borderRadius: "12px" }}
            >
              <h3
                className="text-white mb-4"
                style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", letterSpacing: "0.05em" }}
              >
                {card.title}
              </h3>
              <p className="text-[#8B9BB8]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}>
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoItForSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-white mb-8"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 48px)", letterSpacing: "0.05em" }}
        >
          WHO IT'S FOR
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          RecruitPath is currently built specifically for men's volleyball student athletes in the Class of 2026, 2027, 2028, and 2029 who are serious about playing at the college level. We are starting with men's volleyball and expanding to other sports soon.
        </motion.p>
      </div>
    </section>
  );
}

function BetaSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-white mb-6"
          style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "clamp(36px, 6vw, 48px)", letterSpacing: "0.05em" }}
        >
          WE'RE IN BETA
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg leading-relaxed mb-8"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          RecruitPath is currently in beta. That means you're getting early access at a reduced price, and your feedback directly shapes what we build next. If something is broken or missing, reach out — we want to know.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Link href="/signup">
            <motion.span
              whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-block px-8 py-3.5 text-sm font-semibold tracking-wider uppercase rounded-lg cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
                color: "#090D18",
                fontFamily: "Barlow Condensed, sans-serif",
                boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
              }}
            >
              GET STARTED →
            </motion.span>
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-sm mt-6"
          style={{ color: "#4A5570", fontFamily: "Inter, sans-serif" }}
        >
          Questions? <a href="mailto:contact.recruitpath@gmail.com" className="text-[#8B9BB8] hover:text-[#F5C518] transition-colors">contact.recruitpath@gmail.com</a>
        </motion.p>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div style={{ background: "#090D18" }}>
      <TopNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <WhoItForSection />
      <BetaSection />
      <div style={{ paddingBottom: "80px" }}>
        <AppFooter />
      </div>
    </div>
  );
}
