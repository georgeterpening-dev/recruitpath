/**
 * AuthSidebar — Fixed 200px left sidebar for all authenticated pages.
 * - Icon + text label rows, evenly spaced through full height
 * - Bebas Neue "YOUR MOVE, [NAME]." greeting at top
 * - Yellow active state with soft rounded background highlight
 * - Pinned Logout at bottom
 */
import React from "react";
import { useLocation, Link } from "wouter";
import { LayoutDashboard, School, User, Settings, Tag, LogOut, Mail, ClipboardList, DollarSign, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schools",   href: "/schools",   icon: School },
  { label: "Outreach",  href: "/outreach",  icon: Mail },
  { label: "Roster",    href: "/roster",    icon: ClipboardList },
  { label: "Profile",   href: "/profile",   icon: User },
  { label: "Settings",  href: "/settings",  icon: Settings },
  { label: "Pricing",   href: "/pricing",   icon: Tag },
];

const ADMIN_EMAILS = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];

/** Conditionally rendered admin nav item — only shown to admin emails */
function AdminNavItem({ currentPath, userEmail }: { currentPath: string; userEmail: string }) {
  if (!ADMIN_EMAILS.includes(userEmail)) return null;

  const isActive = currentPath === "/admin/affiliates" || currentPath.startsWith("/admin/affiliates/");
  return (
    <div style={{ flexShrink: 0, padding: "4px 0 0" }}>
      <Link href="/admin/affiliates">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            margin: "0 8px",
            borderRadius: "10px",
            background: isActive ? "rgba(245,197,24,0.1)" : "transparent",
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          <Shield
            size={18}
            style={{ color: isActive ? "#F5C518" : "#5a6478", flexShrink: 0, transition: "color 0.15s ease" }}
            strokeWidth={1.75}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.3px",
              color: isActive ? "#ffffff" : "#5a6478",
              fontWeight: isActive ? 500 : 400,
              transition: "color 0.15s ease",
              userSelect: "none",
            }}
          >
            Admin
          </span>
        </div>
      </Link>
    </div>
  );
}

/** Conditionally rendered affiliate nav item — only shown to approved affiliates */
function AffiliateNavItem({ currentPath, userEmail }: { currentPath: string; userEmail: string }) {
  const [isAffiliate, setIsAffiliate] = React.useState(false);

  React.useEffect(() => {
    if (!userEmail) return;
    fetch("/api/affiliate/status", { credentials: "include" })
      .then(r => r.json())
      .then((data: { isAffiliate: boolean }) => setIsAffiliate(data.isAffiliate))
      .catch(() => setIsAffiliate(false));
  }, [userEmail]);

  if (!isAffiliate) return null;

  const isActive = currentPath === "/affiliate-dashboard";
  return (
    <div style={{ flexShrink: 0, padding: "4px 0 0" }}>
      <Link href="/affiliate-dashboard">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            margin: "0 8px",
            borderRadius: "10px",
            background: isActive ? "rgba(245,197,24,0.1)" : "transparent",
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          <DollarSign
            size={18}
            style={{ color: isActive ? "#F5C518" : "#5a6478", flexShrink: 0, transition: "color 0.15s ease" }}
            strokeWidth={1.75}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.3px",
              color: isActive ? "#ffffff" : "#5a6478",
              fontWeight: isActive ? 500 : 400,
              transition: "color 0.15s ease",
              userSelect: "none",
            }}
          >
            Affiliate
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function AuthSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const handleLogout = async () => {
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
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "200px",
        height: "100vh",
        background: "rgba(8,14,28,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {/* ── RECRUITPATH wordmark logo ── */}
      <Link href="/">
        <div
          style={{
            padding: "28px 20px 20px",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <img src="/logos/logo-wordmark-yellow.svg" alt="RecruitPath" height="28" style={{ display: "block" }} />
        </div>
      </Link>

      {/* ── Nav items — evenly spaced through remaining height ── */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          padding: "8px 0",
        }}
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            location === href ||
            (href !== "/dashboard" && location.startsWith(href));

          // data-walkthrough attribute for the walkthrough overlay
          const walkthroughAttr =
            href === "/schools" ? "nav-schools" :
            href === "/profile" ? "nav-profile" :
            href === "/outreach" ? "nav-outreach" :
            undefined;

          return (
            <Link key={href} href={href}>
              <div
                data-walkthrough={walkthroughAttr}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 20px",
                  margin: "0 8px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(245,197,24,0.08) 0%, transparent 100%)"
                    : "transparent",
                  boxShadow: isActive ? "inset 3px 0 0 #F5C518" : "none",
                  transition: "background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color: isActive ? "#F5C518" : "#5a6478",
                    flexShrink: 0,
                    transition: "color 0.15s ease",
                  }}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    letterSpacing: "0.3px",
                    color: isActive ? "#ffffff" : "#5a6478",
                    fontWeight: isActive ? 500 : 400,
                    transition: "color 0.15s ease",
                    userSelect: "none",
                  }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Admin link — only for owner ── */}
      <AdminNavItem currentPath={location} userEmail={user?.email ?? ""} />

      {/* ── Affiliate link — only for approved affiliates ── */}
      <AffiliateNavItem currentPath={location} userEmail={user?.email ?? ""} />

      {/* ── Logout — pinned to bottom ── */}
      <div style={{ flexShrink: 0, padding: "12px 0 24px" }}>
        <div
          onClick={() => handleLogout()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            margin: "0 8px",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(226,75,74,0.1)";
            const icon = e.currentTarget.querySelector(".logout-icon") as SVGElement | null;
            const label = e.currentTarget.querySelector(".logout-label") as HTMLElement | null;
            if (icon) icon.style.color = "#E24B4A";
            if (label) label.style.color = "#E24B4A";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            const icon = e.currentTarget.querySelector(".logout-icon") as SVGElement | null;
            const label = e.currentTarget.querySelector(".logout-label") as HTMLElement | null;
            if (icon) icon.style.color = "#5a6478";
            if (label) label.style.color = "#5a6478";
          }}
        >
          <LogOut
            className="logout-icon"
            size={18}
            style={{ color: "#5a6478", flexShrink: 0, transition: "color 0.15s ease" }}
            strokeWidth={1.75}
          />
          <span
            className="logout-label"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.3px",
              color: "#5a6478",
              fontWeight: 400,
              transition: "color 0.15s ease",
              userSelect: "none",
            }}
          >
            Logout
          </span>
        </div>
      </div>
    </div>
  );
}
