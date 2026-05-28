/*
 * RecruitPath — Contact Us Page
 * Design: Dark mode, Barlow Condensed headlines, Inter body, #F5C518 gold accents
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
          <Link href="/contact">
            <span className={`text-xs font-semibold tracking-widest transition-colors duration-150 cursor-pointer ${
              location === "/contact" ? "text-[#F8FAFC]" : "text-[#8B9BB8] hover:text-[#F8FAFC]"
            }`} style={{ fontFamily: "Inter, sans-serif" }}>
              CONTACT
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
          backgroundImage: "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80')",
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
          GET IN TOUCH
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[#8B9BB8] text-lg"
          style={{ fontFamily: "Inter, sans-serif", maxWidth: "600px", margin: "0 auto" }}
        >
          Have questions about RecruitPath? We'd love to hear from you. Send us a message and we'll get back to you as soon as possible.
        </motion.p>
      </div>
    </section>
  );
}

function ContactFormSection() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contactMutation = trpc.system.contactUs.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await contactMutation.mutateAsync(formData);
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 px-6" style={{ background: "#090D18" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-[#F8FAFC] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg text-[#F0F4FF] placeholder-[#4A5570] focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                style={{ fontFamily: "Inter, sans-serif", background: "#181E32", border: "1px solid #1E2A42" }}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#F8FAFC] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg text-[#F0F4FF] placeholder-[#4A5570] focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                style={{ fontFamily: "Inter, sans-serif", background: "#181E32", border: "1px solid #1E2A42" }}
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-semibold text-[#F8FAFC] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us what's on your mind..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg text-[#F0F4FF] placeholder-[#4A5570] focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
                style={{ fontFamily: "Inter, sans-serif", background: "#181E32", border: "1px solid #1E2A42" }}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 text-sm font-semibold tracking-widest uppercase rounded-lg cursor-pointer disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
                color: "#090D18",
                fontFamily: "Barlow Condensed, sans-serif",
                boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
              }}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <div style={{ background: "#090D18" }}>
      <TopNav />
      <HeroSection />
      <ContactFormSection />
      <div style={{ paddingBottom: "80px" }}>
        <AppFooter />
      </div>
    </div>
  );
}
