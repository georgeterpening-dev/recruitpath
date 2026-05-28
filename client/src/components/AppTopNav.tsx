/**
 * AppTopNav — Fixed top navigation bar for authenticated pages.
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = getInitials(user?.name);
  const firstName = getFirstName(user?.name);

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
        style={{
          height: "56px",
          background: scrolled ? "rgba(9,13,24,0.94)" : "rgba(9,13,24,0.80)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: scrolled ? "1px solid rgba(30,42,66,0.7)" : "1px solid rgba(30,42,66,0.4)",
          boxShadow: scrolled ? "0 1px 0 rgba(245,197,24,0.04), 0 4px 24px rgba(0,0,0,0.3)" : "none",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left: Logo */}
        <Link href="/">
          <span
            className="cursor-pointer"
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

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <span
                  className="relative cursor-pointer"
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    letterSpacing: "0.12em",
                    color: isActive ? "#F0F4FF" : "#8B9BB8",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#C8D4E8"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#8B9BB8"; }}
                >
                  {label}
                  {isActive && <span className="nav-active-indicator" />}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right: Avatar + hamburger */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setDropdownOpen(v => !v)}
              style={{ background: "none", border: "none", padding: 0 }}
            >
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  background: "linear-gradient(135deg, #1A2035 0%, #131829 100%)",
                  border: "1.5px solid rgba(245,197,24,0.35)",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#F5C518",
                  letterSpacing: "0.5px",
                }}
              >
                {initials}
              </div>
              <span
                className="hidden md:block"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#C8D4E8", fontWeight: 500 }}
              >
                {firstName}
              </span>
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-2 z-50"
                style={{
                  top: "100%",
                  background: "#131829",
                  border: "1px solid #1E2A42",
                  borderRadius: "12px",
                  minWidth: "168px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  padding: "4px",
                }}
              >
                <Link href="/profile">
                  <div
                    className="px-3 py-2.5 cursor-pointer rounded-[8px]"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#F0F4FF", transition: "background 120ms ease" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1A2240")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setDropdownOpen(false)}
                  >
                    View Profile
                  </div>
                </Link>
                <div style={{ height: "1px", background: "#1E2A42", margin: "2px 0" }} />
                <div
                  className="px-3 py-2.5 cursor-pointer rounded-[8px]"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8B9BB8", transition: "background 120ms ease, color 120ms ease" }}
                  onMouseEnter={e => {
                    (e.currentTarget.style.background = "#1A2240");
                    (e.currentTarget.style.color = "#F0F4FF");
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget.style.background = "transparent");
                    (e.currentTarget.style.color = "#8B9BB8");
                  }}
                  onClick={() => { setDropdownOpen(false); logoutMutation.mutate(); }}
                >
                  Sign Out
                </div>
              </motion.div>
            )}
          </div>

          <button
            className="flex md:hidden items-center justify-center cursor-pointer"
            style={{ background: "none", border: "none", padding: "4px", color: "#8B9BB8" }}
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-0 right-0 z-40 md:hidden"
          style={{
            top: "56px",
            background: "rgba(9,13,24,0.97)",
            borderBottom: "1px solid #1E2A42",
            backdropFilter: "blur(20px)",
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={`mobile-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}
    </>
  );
}
