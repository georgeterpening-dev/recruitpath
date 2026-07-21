/**
 * AppTopNav — Fixed top navigation bar for all authenticated pages.
 * - 56px height, #0A0A0A bg with backdrop blur
 * - Left: RECRUITPATH logo → / (home page)
 * - Center: DASHBOARD, SCHOOLS, PROFILE, PRICING, SETTINGS links
 * - Right: user avatar (initials) + first name → dropdown (View Profile, Sign Out)
 * - Mobile (<768px): hide center links, show hamburger → full-width dropdown panel
 */
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "SCHOOLS", href: "/schools" },
  { label: "PROFILE", href: "/profile" },
  { label: "PRICING", href: "/pricing" },
  { label: "SETTINGS", href: "/settings" },
];

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getFirstName(name?: string | null): string {
  if (!name) return "User";
  return name.trim().split(/\s+/)[0];
}

export default function AppTopNav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = getInitials(user?.name);
  const firstName = getFirstName(user?.name);

  return (
    <>
      {/* Fixed top bar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
        style={{
          height: "56px",
          background: scrolled ? "rgba(10,14,26,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(30,41,59,0.6)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {/* Left: Logo */}
        <Link href="/">
          <img src="/logos/logo-wordmark-yellow.svg" alt="RecruitPath" height="24" style={{ display: "block" }} />
        </Link>

        {/* Center: Nav links (desktop only) - centered */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <span
                  className={`text-xs font-semibold tracking-widest transition-colors duration-150 cursor-pointer relative ${
                    isActive ? "text-[#F8FAFC]" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {label}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-8px",
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "#F5C518",
                      }}
                    />
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right: Avatar + name + hamburger */}
        <div className="flex items-center gap-3">
          {/* Avatar dropdown (desktop) */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setDropdownOpen(v => !v)}
              style={{ background: "none", border: "none", padding: 0 }}
            >
              {/* Avatar circle */}
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#F5C518",
                  letterSpacing: "0.5px",
                }}
              >
                {initials}
              </div>
              {/* First name (desktop only) */}
              <span
                className="hidden md:block"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  color: "#FFFFFF",
                  fontWeight: 500,
                }}
              >
                {firstName}
              </span>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 py-1 z-50"
                style={{
                  top: "100%",
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "8px",
                  minWidth: "160px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                <Link href="/profile">
                  <div
                    className="px-4 py-2.5 cursor-pointer transition-colors duration-100"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#2A2A2A")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setDropdownOpen(false)}
                  >
                    View Profile
                  </div>
                </Link>
                <div
                  className="px-4 py-2.5 cursor-pointer transition-colors duration-100"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    color: "#888888",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget.style.background = "#2A2A2A");
                    (e.currentTarget.style.color = "#FFFFFF");
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget.style.background = "transparent");
                    (e.currentTarget.style.color = "#888888");
                  }}
                  onClick={() => {
                    setDropdownOpen(false);
                    logoutMutation.mutate();
                  }}
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="flex md:hidden items-center justify-center cursor-pointer"
            style={{ background: "none", border: "none", padding: "4px", color: "#888888" }}
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown panel */}
      {mobileMenuOpen && (
        <div
          className="fixed left-0 right-0 z-40 md:hidden"
          style={{
            top: "56px",
            background: "rgba(10,10,10,0.97)",
            borderBottom: "1px solid #1A1A1A",
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className="flex items-center px-6 cursor-pointer"
                  style={{
                    height: "48px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                    letterSpacing: "1.5px",
                    color: isActive ? "#FFFFFF" : "#888888",
                    borderLeft: isActive ? "3px solid #F5C518" : "3px solid transparent",
                    background: isActive ? "rgba(245,197,24,0.06)" : "transparent",
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
