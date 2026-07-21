/*
 * RecruitPath — Contact Us Page
 * Design: Dark mode, form with name/email/message fields, yellow submit button
 */
import { motion } from "framer-motion";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppFooter from "@/components/AppFooter";
import PublicNav from "@/components/PublicNav";

// TopNav is now handled by PublicNav component

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" style={{ background: "#0A0A0A" }}>
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
          style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "clamp(48px, 8vw, 72px)", letterSpacing: "0.05em" }}
        >
          GET IN TOUCH
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[#94A3B8] text-lg"
          style={{ fontFamily: "DM Sans, sans-serif", maxWidth: "600px", margin: "0 auto" }}
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
    <section className="py-24 px-6" style={{ background: "#0A0A0A" }}>
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
                className="w-full px-4 py-3 rounded-lg text-[#0A0E1A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                style={{ fontFamily: "Inter, sans-serif", background: "#1A1A1A", border: "1px solid #2A2A2A" }}
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
                className="w-full px-4 py-3 rounded-lg text-[#0A0E1A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                style={{ fontFamily: "Inter, sans-serif", background: "#1A1A1A", border: "1px solid #2A2A2A" }}
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
                className="w-full px-4 py-3 rounded-lg text-[#0A0E1A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#F5B800] resize-none"
                style={{ fontFamily: "Inter, sans-serif", background: "#1A1A1A", border: "1px solid #2A2A2A" }}
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
                background: "#F5B800",
                color: "#0A0E1A",
                fontFamily: "Inter, sans-serif",
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
    <div style={{ background: "#0A0A0A" }}>
      <PublicNav currentPage="contact" />
      <HeroSection />
      <ContactFormSection />
      <div style={{ paddingBottom: "80px" }}>
        <AppFooter />
      </div>
    </div>
  );
}
