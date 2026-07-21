/*
 * RecruitPath — Sign Up Page
 * Design: Centered card on dark background, gold focus states
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const NBA_COURT_IMAGE = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=80";

// Google "G" logo SVG (official colors)
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignUp() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const affiliateRef = sessionStorage.getItem("affiliateRef") || localStorage.getItem("affiliateRef") || undefined;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password, name: name.trim(), affiliateRef }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      window.location.href = data.redirect || "/onboarding";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google?return=/dashboard";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pb-24 relative overflow-hidden"
      style={{
        background: `url(${NBA_COURT_IMAGE}) center/cover no-repeat fixed`,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 z-0" style={{ background: "rgba(0,0,0,0.65)" }} />
      {/* Dotted grid pattern */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md relative z-20"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span
              className="text-[#F5B800] text-3xl cursor-pointer"
              style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              RECRUITPATH
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rp-card p-8">
          {/* Free trial banner */}
          <div className="mb-6 pb-6 border-b border-[#1E293B]">
            <div className="flex justify-center mb-3">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{
                  background: "rgba(245,184,0,0.12)",
                  color: "#F5B800",
                  border: "1px solid rgba(245,184,0,0.25)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                FREE TO START -- NO CARD NEEDED
              </span>
            </div>
            <p
              className="text-center text-sm"
              style={{
                fontFamily: "Inter, sans-serif",
                color: "#94A3B8",
                lineHeight: 1.5,
              }}
            >
              Add up to 5 schools completely free. Upgrade to Pro from $25/month for unlimited access.
            </p>
          </div>

          <h1
            className="font-display text-white mb-2"
            style={{ fontSize: "32px" }}
          >
            CREATE ACCOUNT
          </h1>
          <p className="text-[#94A3B8] text-sm mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            Start your recruiting journey today
          </p>

          {/* Google Sign-In Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            whileHover={{ borderColor: "#1E293B" }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-[10px] mb-5 transition-colors"
            style={{
              background: "#111827",
              border: "1px solid #1E293B",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#F8FAFC",
              fontWeight: 500,
            }}
          >
            <GoogleLogo />
            CONTINUE WITH GOOGLE
          </motion.button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "#1E293B" }} />
            <span
              className="text-xs font-semibold tracking-widest"
              style={{ color: "#555", fontFamily: "Inter, sans-serif" }}
            >
              OR
            </span>
            <div className="flex-1 h-px" style={{ background: "#1E293B" }} />
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontFamily: "Inter, sans-serif" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="rp-input w-full px-4 py-3 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
                required
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rp-input w-full px-4 py-3 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
                required
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rp-input w-full px-4 py-3 text-sm pr-12"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.02, filter: "brightness(1.1)" }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className="w-full py-3.5 text-sm font-semibold tracking-wider uppercase rounded-lg mt-2"
              style={{ background: loading ? "#8A7000" : "#F5B800", color: "#0A0E1A", fontFamily: "Inter, sans-serif", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#94A3B8] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Already have an account?{" "}
              <Link href="/signin">
                <span className="text-[#F5B800] hover:underline cursor-pointer font-medium">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
