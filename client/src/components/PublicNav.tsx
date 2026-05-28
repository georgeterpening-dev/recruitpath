/**
 * PublicNav — Standardized navigation for all public-facing pages
 * - Fixed top bar, 56px height, dark background with blur
 * - Left: RECRUITPATH logo → /
 * - Center: HOME, HOW IT WORKS, ABOUT, PRICING links with active state
 * - Right: Auth-aware button (SIGN IN or GO TO DASHBOARD)
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

interface PublicNavProps {
  currentPage?: "home" | "about" | "how-it-works" | "pricing";
}

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "HOW IT WORKS", href: "/how-it-works" },
  { label: "ABOUT", href: "/about" },
  { label: "PRICING", href: "/pricing" },
];

export default function PublicNav({ currentPage }: PublicNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Determine active page from URL if not explicitly provided
  const activePage = currentPage || (() => {
    if (location === "/") return "home";
    if (location === "/about") return "about";
    if (location === "/how-it-works") return "how-it-works";
    if (location === "/pricing") return "pricing";
    return undefined;
  })();

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        height: "56px",
        background: "rgba(9,13,24,0.92)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(30,42,66,0.5)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <span
            className="cursor-pointer flex-shrink-0"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              fontSize: "22px",
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

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = (href === "/" && activePage === "home") || 
                           (href !== "/" && activePage === href.slice(1));
            return (
              <Link key={href} href={href}>
                <span
                  className="cursor-pointer select-none relative pb-0.5 transition-colors duration-150"
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: isActive ? "#F0F4FF" : "#8B9BB8",
                    borderBottom: isActive ? "2px solid #F5C518" : "2px solid transparent",
                    paddingBottom: "2px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "#C8D4E8";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "#8B9BB8";
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth button */}
        <Link href={isAuthenticated ? "/dashboard" : "/signin"}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 rounded cursor-pointer flex-shrink-0"
            style={{
              background: "#F5C518",
              color: "#090D18",
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "none",
              padding: "8px 20px",
              borderRadius: "8px",
              boxShadow: "0 2px 12px rgba(245,197,24,0.28)",
            }}
          >
            {isAuthenticated ? "GO TO DASHBOARD →" : "SIGN IN →"}
          </motion.button>
        </Link>
      </div>
    </motion.header>
  );
}
