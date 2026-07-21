/*
 * RecruitPath — About Page
 * Design: Dark mode, Bebas Neue headlines, DM Sans body, #F5B800 yellow accents
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import AppFooter from "@/components/AppFooter";
import PublicNav from "@/components/PublicNav";

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" style={{ background: "#0A0E1A" }}>
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url('/manus-storage/about-hero_bff33832.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

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
          className="text-[#94A3B8] text-lg"
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
    <section className="py-24 px-6" style={{ background: "#0A0E1A" }}>
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
          className="text-[#94A3B8] text-lg leading-relaxed"
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
    <section className="py-24 px-6" style={{ background: "#0A0E1A" }}>
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
              className="p-8 rounded-lg"
              style={{ background: "#111111", border: "1px solid #1E293B" }}
            >
              <h3
                className="text-white mb-4"
                style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", letterSpacing: "0.05em" }}
              >
                {card.title}
              </h3>
              <p className="text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}>
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
    <section className="py-24 px-6" style={{ background: "#0A0E1A" }}>
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
          className="text-[#94A3B8] text-lg leading-relaxed"
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
    <section className="py-24 px-6" style={{ background: "#0A0E1A" }}>
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
          className="text-[#94A3B8] text-lg leading-relaxed mb-8"
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
                background: "#F5B800",
                color: "#0A0E1A",
                fontFamily: "Inter, sans-serif",
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
          className="text-[#4A4A4A] text-sm mt-6"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Questions? <a href="mailto:contact.recruitpath@gmail.com" className="text-[#94A3B8] hover:text-[#F5B800] transition-colors">contact.recruitpath@gmail.com</a>
        </motion.p>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div style={{ background: "#0A0E1A" }}>
      <PublicNav currentPage="about" />
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
