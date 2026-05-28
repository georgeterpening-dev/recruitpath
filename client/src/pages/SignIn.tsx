/*
 * RecruitPath — Sign In Page
 * Design: Centered card on dark background, gold focus states, Framer Motion transitions
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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

export default function SignIn() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth logic would go here (Supabase)
    navigate("/profile");
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google?return=/dashboard";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pb-24"
      style={{ background: "#090D18" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span
              className="cursor-pointer"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 800,
                fontSize: "28px",
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
        </div>

        {/* Card */}
        <div className="rp-card p-8">
          <h1
            className="font-display text-white mb-2"
            style={{ fontSize: "32px" }}
          >
            WELCOME BACK
          </h1>
          <p className="text-[#8B9BB8] text-sm mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            Sign in to your RecruitPath account
          </p>

          {/* Google Sign-In Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            whileHover={{ borderColor: "#3A3A3A" }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-[10px] mb-5 transition-colors"
            style={{
              background: "#181E32",
              border: "1px solid #1E2A42",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#F0F4FF",
              fontWeight: 500,
            }}
          >
            <GoogleLogo />
            CONTINUE WITH GOOGLE
          </motion.button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "#1E2A42" }} />
            <span
              className="text-xs font-semibold tracking-widest"
              style={{ color: "#555", fontFamily: "Inter, sans-serif" }}
            >
              OR
            </span>
            <div className="flex-1 h-px" style={{ background: "#1E2A42" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold tracking-widest uppercase text-[#8B9BB8] mb-2"
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
                className="block text-xs font-semibold tracking-widest uppercase text-[#8B9BB8] mb-2"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B9BB8] hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 text-sm font-semibold tracking-wider uppercase rounded-lg mt-2"
              style={{
                background: "#F5C518",
                color: "#090D18",
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "15px",
                letterSpacing: "0.1em",
                boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
              }}
            >
              Sign In
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8B9BB8] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Don't have an account?{" "}
              <Link href="/signup">
                <span className="text-[#F5C518] hover:underline cursor-pointer font-medium">
                  Create one
                </span>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
