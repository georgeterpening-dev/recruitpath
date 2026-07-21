/**
 * MobileBottomTabBar — Floating pill-shaped bottom nav for authenticated pages on mobile (<768px).
 * Design: Instagram-style glassmorphism pill, scroll-aware shrink, icon-only, yellow active glow + dot.
 * Tabs: Dashboard, Schools, Outreach, Profile, More (slide-up sheet)
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  GraduationCap,
  Mail,
  User,
  MoreHorizontal,
  ClipboardList,
  Settings,
  Tag,
  Shield,
  DollarSign,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_EMAILS = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];

const PRIMARY_TABS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schools",   href: "/schools",   icon: GraduationCap },
  { label: "Outreach",  href: "/outreach",  icon: Mail },
  { label: "Profile",   href: "/profile",   icon: User },
];

export default function MobileBottomTabBar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  // Scroll-aware shrink
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Affiliate status
  useEffect(() => {
    if (!user?.email) return;
    fetch("/api/affiliate/status", { credentials: "include" })
      .then(r => r.json())
      .then((data: { isAffiliate: boolean }) => setIsAffiliate(data.isAffiliate))
      .catch(() => setIsAffiliate(false));
  }, [user?.email]);

  const handleLogout = useCallback(async () => {
    setMoreOpen(false);
    try {
      await fetch("/api/trpc/auth.logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // ignore
    }
    logout();
    window.location.href = "/";
  }, [logout]);

  const moreItems = [
    { label: "Roster",   href: "/roster",    icon: ClipboardList },
    { label: "Settings", href: "/settings",  icon: Settings },
    { label: "Pricing",  href: "/pricing",   icon: Tag },
    ...(isAdmin ? [{ label: "Admin", href: "/admin/affiliates", icon: Shield }] : []),
    ...(isAffiliate ? [{ label: "Affiliate", href: "/affiliate-dashboard", icon: DollarSign }] : []),
  ];

  const isMoreActive = moreItems.some(item => location === item.href || location.startsWith(item.href + "/"));

  // Pill style — transitions between default and scrolled states
  const pillStyle: React.CSSProperties = {
    position: "fixed",
    bottom: scrolled ? "16px" : "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: scrolled ? "calc(100% - 64px)" : "calc(100% - 48px)",
    height: scrolled ? "48px" : "60px",
    background: scrolled ? "rgba(10,10,15,0.55)" : "rgba(10,10,15,0.45)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "999px",
    boxShadow: scrolled
      ? "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
      : "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
    padding: "0 20px",
    paddingBottom: "env(safe-area-inset-bottom)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly",
    transition: "all 0.3s ease",
    zIndex: 50,
  };

  return (
    <>
      {/* Floating pill nav — mobile only */}
      <div className="md:hidden" style={pillStyle}>
        {PRIMARY_TABS.map(({ label, href, icon: Icon }) => {
          const isActive = location === href || (href !== "/dashboard" && location.startsWith(href + "/"));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center cursor-pointer select-none"
                style={{ position: "relative", padding: "4px 8px" }}
                aria-label={label}
              >
                <Icon
                  size={22}
                  style={{
                    color: isActive ? "#F5B800" : "rgba(255,255,255,0.5)",
                    filter: isActive ? "drop-shadow(0 0 6px rgba(245,184,0,0.6))" : "none",
                    transition: "color 0.2s ease, filter 0.2s ease",
                    flexShrink: 0,
                  }}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                {/* Active dot indicator */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "#F5B800",
                      boxShadow: "0 0 6px rgba(245,184,0,0.8)",
                    }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* More tab */}
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center justify-center cursor-pointer select-none"
          style={{ position: "relative", padding: "4px 8px" }}
          onClick={() => setMoreOpen(true)}
          aria-label="More"
        >
          <MoreHorizontal
            size={22}
            style={{
              color: isMoreActive ? "#F5B800" : "rgba(255,255,255,0.5)",
              filter: isMoreActive ? "drop-shadow(0 0 6px rgba(245,184,0,0.6))" : "none",
              transition: "color 0.2s ease, filter 0.2s ease",
              flexShrink: 0,
            }}
            strokeWidth={1.75}
          />
          {isMoreActive && (
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "#F5B800",
                boxShadow: "0 0 6px rgba(245,184,0,0.8)",
              }}
            />
          )}
        </motion.div>
      </div>

      {/* More sheet overlay — mobile only */}
      <AnimatePresence>
        {moreOpen && (
          <div className="md:hidden">
            {/* Backdrop */}
            <motion.div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                zIndex: 51,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 52,
                background: "rgba(12,16,26,0.97)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "20px 20px 0 0",
                padding: "20px 24px 40px",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            >
              {/* Drag handle */}
              <div
                style={{
                  width: "36px",
                  height: "4px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "2px",
                  margin: "0 auto 20px",
                }}
              />

              {/* Sheet items */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {moreItems.map(({ label, href, icon: Icon }) => {
                  const isActive = location === href || location.startsWith(href + "/");
                  return (
                    <Link key={href} href={href}>
                      <motion.div
                        whileTap={{ background: "rgba(255,255,255,0.06)" }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          height: "48px",
                          padding: "0 4px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                        }}
                        onClick={() => setMoreOpen(false)}
                      >
                        <Icon
                          size={20}
                          style={{ color: isActive ? "#F5B800" : "rgba(255,255,255,0.5)", flexShrink: 0 }}
                          strokeWidth={1.75}
                        />
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "15px",
                            color: isActive ? "#F8FAFC" : "#94A3B8",
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {label}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}

                {/* Logout */}
                <motion.div
                  whileTap={{ background: "rgba(255,255,255,0.06)" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    height: "48px",
                    padding: "0 4px",
                    cursor: "pointer",
                  }}
                  onClick={handleLogout}
                >
                  <LogOut size={20} style={{ color: "#E24B4A", flexShrink: 0 }} strokeWidth={1.75} />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "15px",
                      color: "#E24B4A",
                      fontWeight: 400,
                    }}
                  >
                    Logout
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
