/**
 * RecruitPath — Public Affiliate Program Page (/affiliates)
 * Matches existing public page design: dark bg, Bebas Neue headlines, DM Sans body, yellow accents.
 */
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppFooter from "@/components/AppFooter";
import PublicNav from "@/components/PublicNav";

const POSITIONS = [
  "Outside Hitter",
  "Opposite Hitter",
  "Middle Blocker",
  "Setter",
  "Libero",
  "Defensive Specialist",
];

const GRAD_YEARS = ["2026", "2027", "2028", "2029"];

// TopNav is now handled by PublicNav component

export default function Affiliates() {
  const formRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    graduationYear: "",
    position: "",
    highSchool: "",
    clubTeam: "",
    instagramHandle: "",
    whyJoin: "",
  });

  const submitApplication = trpc.affiliate.submitApplication.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit application. Please try again.");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.graduationYear) {
      toast.error("Please select a graduation year.");
      return;
    }
    if (!form.position) {
      toast.error("Please select your position.");
      return;
    }
    submitApplication.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      graduationYear: form.graduationYear as "2026" | "2027" | "2028" | "2029",
      position: form.position,
      highSchool: form.highSchool,
      clubTeam: form.clubTeam,
      instagramHandle: form.instagramHandle || undefined,
      whyJoin: form.whyJoin,
    });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0A0A0A",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    padding: "12px 16px",
    color: "#FFFFFF",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "DM Sans, sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#6B6B6B",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <PublicNav currentPage="affiliates" />
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Pill badge */}
          <div className="inline-flex items-center justify-center mb-6">
            <span
              className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{
                border: "1px solid rgba(245,197,24,0.4)",
                color: "#F5C518",
                fontFamily: "DM Sans, sans-serif",
                background: "rgba(245,197,24,0.06)",
              }}
            >
              AFFILIATE PROGRAM
            </span>
          </div>

          <h1
            className="mb-6"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(48px, 8vw, 80px)",
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            EARN MONEY.{" "}
            <span style={{ color: "#F5C518" }}>HELP YOUR TEAMMATES</span>
            <br />
            GET RECRUITED.
          </h1>

          <p
            className="mb-10 mx-auto"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "18px",
              color: "#94A3B8",
              maxWidth: "520px",
              lineHeight: 1.65,
            }}
          >
            Get your own personal code. Share it anywhere. Earn cash every time a teammate signs up through you.
          </p>

          <button
            onClick={scrollToForm}
            className="px-8 py-4 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
            style={{
              background: "#F5C518",
              color: "#0A0A0A",
              fontFamily: "DM Sans, sans-serif",
              border: "none",
              fontSize: "13px",
            }}
          >
            APPLY NOW →
          </button>
        </motion.div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid #1E293B" }}>
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#F5C518",
              textTransform: "uppercase",
            }}
          >
            HOW IT WORKS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-16"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(36px, 5vw, 52px)",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            THREE STEPS TO START EARNING
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "APPLY",
                desc: "Fill out a short form. We review and approve within 48 hours.",
              },
              {
                step: "02",
                title: "GET YOUR CODE",
                desc: "Receive a personal coupon code tied to your name. Share it in your bio, group chats, at tournaments — anywhere.",
              },
              {
                step: "03",
                title: "GET PAID",
                desc: "Earn $3 for every monthly signup and $5 for every annual signup through your code. Paid monthly via Venmo or PayPal.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative pt-12"
              >
                <div
                  className="absolute top-0 left-0 select-none pointer-events-none"
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "80px",
                    color: "rgba(245,197,24,0.06)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.step}
                </div>
                <div
                  className="w-8 mb-5"
                  style={{ height: "2px", background: "#F5C518" }}
                />
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "24px",
                    color: "#FFFFFF",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "14px",
                    color: "#64748B",
                    lineHeight: 1.65,
                  }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── What You Get ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid #1E293B" }}>
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            WHAT YOU GET
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "YOUR OWN CODE",
                body: "A unique code like GEORGE27 that gives your teammates 15% off their first month. Yours forever.",
                icon: "🔑",
              },
              {
                title: "CASH COMMISSIONS",
                body: "$3 per monthly signup, $5 per annual signup. No cap, no expiration, paid monthly once you hit $10.",
                icon: "💰",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-sm p-8"
                style={{
                  background: "#111827",
                  border: "1px solid #1E293B",
                }}
              >
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "22px",
                    color: "#F5C518",
                    letterSpacing: "0.04em",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "14px",
                    color: "#64748B",
                    lineHeight: 1.65,
                  }}
                >
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Application Form ─────────────────────────────────────────────── */}
      <section
        ref={formRef}
        id="apply"
        className="py-20 px-6"
        style={{ borderTop: "1px solid #1E293B" }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-3"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(36px, 5vw, 52px)",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            APPLY TO BE AN AFFILIATE
          </motion.h2>
          <p
            className="mb-10"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "#64748B",
              lineHeight: 1.65,
            }}
          >
            Takes 2 minutes. We review every application and respond within 48 hours.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-sm p-10 text-center"
              style={{
                background: "#111827",
                border: "1px solid rgba(245,197,24,0.3)",
              }}
            >
              <div
                className="mb-4"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "32px",
                  color: "#F5C518",
                }}
              >
                APPLICATION RECEIVED
              </div>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  color: "#94A3B8",
                  lineHeight: 1.65,
                }}
              >
                You'll hear back within 48 hours.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                className="rounded-sm p-8"
                style={{ background: "#111827", border: "1px solid #1E293B" }}
              >
                {/* First / Last Name */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label style={labelStyle}>First Name *</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      placeholder="George"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name *</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Terpstra"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-5">
                  <label style={labelStyle}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="george@example.com"
                    style={inputStyle}
                  />
                </div>

                {/* Grad Year + Position */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label style={labelStyle}>Graduation Year *</label>
                    <select
                      name="graduationYear"
                      value={form.graduationYear}
                      onChange={handleChange}
                      required
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select year</option>
                      {GRAD_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Position *</label>
                    <select
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                      required
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select position</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* High School */}
                <div className="mb-5">
                  <label style={labelStyle}>High School *</label>
                  <input
                    name="highSchool"
                    value={form.highSchool}
                    onChange={handleChange}
                    required
                    placeholder="Lincoln High School"
                    style={inputStyle}
                  />
                </div>

                {/* Club Team */}
                <div className="mb-5">
                  <label style={labelStyle}>Club Team *</label>
                  <input
                    name="clubTeam"
                    value={form.clubTeam}
                    onChange={handleChange}
                    required
                    placeholder="Mizuno Long Beach 18 Elite"
                    style={inputStyle}
                  />
                </div>

                {/* Instagram */}
                <div className="mb-5">
                  <label style={labelStyle}>Instagram Handle (optional)</label>
                  <input
                    name="instagramHandle"
                    value={form.instagramHandle}
                    onChange={handleChange}
                    placeholder="@george.vball"
                    style={inputStyle}
                  />
                </div>

                {/* Why */}
                <div className="mb-8">
                  <label style={labelStyle}>
                    Why do you want to be a RecruitPath affiliate? * (200 chars max)
                  </label>
                  <textarea
                    name="whyJoin"
                    value={form.whyJoin}
                    onChange={handleChange}
                    required
                    maxLength={200}
                    rows={4}
                    placeholder="I want to help my teammates get recruited while earning some money on the side..."
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <div
                    className="mt-1 text-right"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "11px",
                      color: form.whyJoin.length >= 180 ? "#F5C518" : "#6B6B6B",
                    }}
                  >
                    {form.whyJoin.length}/200
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitApplication.isPending}
                  className="w-full py-4 text-sm font-bold tracking-widest uppercase rounded-sm cursor-pointer"
                  style={{
                    background: submitApplication.isPending ? "#2A2A2A" : "#F5C518",
                    color: submitApplication.isPending ? "#6B6B6B" : "#0A0A0A",
                    fontFamily: "DM Sans, sans-serif",
                    border: "none",
                    cursor: submitApplication.isPending ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {submitApplication.isPending ? "SUBMITTING..." : "SUBMIT APPLICATION →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
