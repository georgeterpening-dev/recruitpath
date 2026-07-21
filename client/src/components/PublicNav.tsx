/*
 * PublicNav — Standardized navigation for all public-facing pages
 * - Fixed top bar, 56px height, dark background with blur
 * - Left: RECRUITPATH logo → /
 * - Right: Nav links (ABOUT, HOW IT WORKS, PRICING, AFFILIATES) + Auth button
 * - Mobile: Hamburger menu with smooth animated dropdown and morphing icon
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

interface PublicNavProps {
  currentPage?: "home" | "about" | "how-it-works" | "pricing" | "contact" | "affiliates";
}

const NAV_LINKS = [
  { label: "ABOUT", href: "/about" },
  { label: "HOW IT WORKS", href: "/how-it-works" },
  { label: "PRICING", href: "/pricing" },
  { label: "AFFILIATES", href: "/affiliates" },
];

/** Animated hamburger / X icon using three CSS lines */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div
      className="relative flex flex-col justify-center items-center cursor-pointer"
      style={{ width: 24, height: 24 }}
      aria-hidden="true"
    >
      {/* Line 1 */}
      <span
        style={{
          display: "block",
          position: "absolute",
          height: "2px",
          width: "20px",
          background: "#888888",
          borderRadius: "2px",
          transition: "transform 0.25s ease, opacity 0.25s ease, top 0.25s ease",
          top: open ? "11px" : "7px",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
      />
      {/* Line 2 */}
      <span
        style={{
          display: "block",
          position: "absolute",
          height: "2px",
          width: "20px",
          background: "#888888",
          borderRadius: "2px",
          top: "11px",
          transition: "opacity 0.25s ease",
          opacity: open ? 0 : 1,
        }}
      />
      {/* Line 3 */}
      <span
        style={{
          display: "block",
          position: "absolute",
          height: "2px",
          width: "20px",
          background: "#888888",
          borderRadius: "2px",
          transition: "transform 0.25s ease, opacity 0.25s ease, top 0.25s ease",
          top: open ? "11px" : "15px",
          transform: open ? "rotate(-45deg)" : "rotate(0deg)",
        }}
      />
    </div>
  );
}

export default function PublicNav({ currentPage }: PublicNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    if (location === "/contact") return "contact";
    if (location === "/affiliates") return "affiliates";
    return undefined;
  })();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          height: "56px",
          background: scrolled ? "rgba(10,14,26,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(30,41,59,0.6)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <img 
              src="/logos/logo-wordmark-yellow.svg" 
              alt="RecruitPath" 
              style={{ height: "48px", width: "auto", display: "block", flexShrink: 0, minWidth: "186px", cursor: "pointer" }} 
            />
          </Link>

          {/* Desktop nav links and auth button - right aligned */}
          <div className="hidden md:flex items-center gap-8">
            {/* Nav links */}
            <nav className="flex items-center gap-8">
              {NAV_LINKS.map(({ label, href }) => {
                const isActive = activePage === href.slice(1);
                return (
                  <a
                    key={href}
                    href={href}
                    className="cursor-pointer select-none transition-colors duration-150"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "1.2px",
                      textTransform: "uppercase",
                      color: isActive ? "#F8FAFC" : "#94A3B8",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.color = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                    }}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>

            {/* Auth button */}
            <Link href={isAuthenticated ? "/dashboard" : "/signin"}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded cursor-pointer flex-shrink-0"
                style={{
                  background: "#F5B800",
                  color: "#0A0E1A",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                }}
              >
                {isAuthenticated ? "GO TO DASHBOARD" : "SIGN IN"}
              </motion.button>
            </Link>
          </div>

          {/* Mobile hamburger button — morphing three-line → X */}
          <button
            className="md:hidden flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            style={{ background: "none", border: "none", padding: "4px" }}
          >
            <HamburgerIcon open={mobileMenuOpen} />
          </button>
        </div>
      </motion.header>

      {/* Mobile menu dropdown — animated with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop — blurs in smoothly */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 top-[56px] z-30"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Dropdown panel */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, scaleY: 0, y: -8 }}
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              exit={{ opacity: 0, scaleY: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed top-[56px] left-0 right-0 z-40 w-full overflow-hidden"
              style={{
                background: "rgba(10,10,20,0.97)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                transformOrigin: "top right",
              }}
            >
              {/* Nav links with stagger */}
              <div className="flex flex-col">
                {NAV_LINKS.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={handleNavClick}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 1) * 0.05, duration: 0.22, ease: "easeOut" }}
                    className="px-6 py-[18px] text-white font-semibold"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>

              {/* Auth button */}
              <motion.div
                className="px-6 py-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (NAV_LINKS.length + 1) * 0.05, duration: 0.22, ease: "easeOut" }}
              >
                {isAuthenticated ? (
                  <a href="/dashboard">
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      className="w-full px-6 py-4 text-sm font-semibold tracking-widest uppercase rounded-full text-center cursor-pointer"
                      style={{
                        background: "#F5B800",
                        color: "#0A0E1A",
                        fontFamily: "DM Sans, sans-serif",
                      }}
                      onClick={handleNavClick}
                    >
                      GO TO DASHBOARD →
                    </motion.div>
                  </a>
                ) : (
                  <a href="/signin">
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      className="w-full px-6 py-4 text-sm font-semibold tracking-widest uppercase rounded-full text-center cursor-pointer"
                      style={{
                        background: "#F5B800",
                        color: "#0A0E1A",
                        fontFamily: "DM Sans, sans-serif",
                      }}
                      onClick={handleNavClick}
                    >
                      SIGN IN →
                    </motion.div>
                  </a>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
