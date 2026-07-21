/**
 * AuthSidebar — Fixed 232px left sidebar for all authenticated pages.
 * - Grouped nav (Recruiting / Account) with section labels
 * - Gold left-rail active state, visible focus rings, aria-current
 * - User identity card + logout pinned to bottom
 */
import React from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  School,
  User,
  Settings,
  Tag,
  LogOut,
  Mail,
  ClipboardList,
  DollarSign,
  Shield,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
  walkthrough?: string;
};

const RECRUITING_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schools", href: "/schools", icon: School, walkthrough: "nav-schools" },
  { label: "Outreach", href: "/outreach", icon: Mail, walkthrough: "nav-outreach" },
  { label: "Roster", href: "/roster", icon: ClipboardList },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: "Profile", href: "/profile", icon: User, walkthrough: "nav-profile" },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Pricing", href: "/pricing", icon: Tag },
];

const ADMIN_EMAILS = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <a
        data-walkthrough={item.walkthrough}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 mx-3 text-[13px] font-medium tracking-wide transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]/60 ${
          isActive
            ? "bg-[#F5B800]/[0.08] text-white"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
        }`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Gold active rail */}
        <span
          aria-hidden
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full transition-opacity duration-150 ${
            isActive ? "bg-[#F5B800] opacity-100" : "opacity-0"
          }`}
        />
        <Icon
          size={18}
          strokeWidth={isActive ? 2 : 1.75}
          className={`shrink-0 transition-colors duration-150 ${
            isActive ? "text-[#F5B800]" : "text-slate-500 group-hover:text-slate-300"
          }`}
        />
        <span className="select-none">{item.label}</span>
      </a>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 select-none">
      {children}
    </p>
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
  return (
    <NavLink
      item={{ label: "Affiliate", href: "/affiliate-dashboard", icon: DollarSign }}
      isActive={currentPath === "/affiliate-dashboard"}
    />
  );
}

export default function AuthSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");
  const isPro = subStatus?.hasPaidAccess ?? false;

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

  const initials = (user?.name ?? "A")
    .split(" ")
    .map(p => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (href: string) =>
    location === href || (href !== "/dashboard" && location.startsWith(href));

  return (
    <aside
      aria-label="Primary"
      className="fixed top-0 left-0 z-50 flex h-dvh w-[232px] flex-col overflow-y-auto border-r border-[#1E293B] bg-[#0A0E1A]"
    >
      {/* Wordmark */}
      <Link href="/">
        <a className="block shrink-0 px-6 pt-7 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]/60 rounded-lg mx-1 mt-1">
          <img src="/logos/logo-wordmark-yellow.svg" alt="RecruitPath" height="26" className="block h-[26px]" />
        </a>
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 pb-4">
        <SectionLabel>Recruiting</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {RECRUITING_ITEMS.map(item => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        <SectionLabel>Account</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {ACCOUNT_ITEMS.map(item => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
          {isAdmin && (
            <NavLink
              item={{ label: "Admin", href: "/admin/affiliates", icon: Shield }}
              isActive={location.startsWith("/admin/affiliates")}
            />
          )}
          <AffiliateNavItem currentPath={location} userEmail={user?.email ?? ""} />
        </div>
      </nav>

      {/* User identity card + logout */}
      <div className="shrink-0 border-t border-[#1E293B] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5B800]/[0.12] text-[12px] font-bold text-[#F5B800]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-slate-100">
              {user?.name ?? "Athlete"}
            </p>
            <p
              className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                isPro ? "text-[#F5B800]" : "text-slate-500"
              }`}
            >
              {isPro ? "Pro" : "Free plan"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400 outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
