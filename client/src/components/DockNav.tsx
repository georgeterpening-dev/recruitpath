/*
 * RecruitPath — DockNav Component
 * Design: Floating pill-shaped dock, fixed bottom center
 * Behavior: Spring expand on hover (desktop), always expanded (mobile)
 * Frosted glass: backdrop-blur(24px), rgba(10,10,15,0.45), subtle border
 * Nav items: Dashboard · Schools · Outreach · Profile · Menu(☰)
 *
 * MODAL BEHAVIOR:
 * When isModalOpen=true → slides left to 24px from left edge + collapses to 44px circle (350ms)
 * When isModalOpen=false → slides back to center + expands to full pill (350ms)
 * Clicking the collapsed circle while modal is open calls closeModal()
 *
 * MENU SHEET:
 * Hamburger (☰) opens a bottom sheet with: Outreach, Roster, Settings, Pricing, Admin (if admin), Affiliate, Logout
 */
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  Home,
  LayoutDashboard,
  School,
  Mail,
  User,
  Menu,
  X,
  ClipboardList,
  Settings as SettingsIcon,
  Tag,
  Shield,
  Star,
  LogOut,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useRef, useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/_core/hooks/useAuth";

const MAIN_NAV_ITEMS = [
  { icon: Home, label: "HOME", href: "/" },
  { icon: LayoutDashboard, label: "DASHBOARD", href: "/dashboard" },
  { icon: School, label: "SCHOOLS", href: "/schools" },
  { icon: User, label: "PROFILE", href: "/profile" },
];

const MODAL_EASING = [0.16, 1, 0.3, 1] as [number, number, number, number];
const MODAL_DURATION = 0.35;

function DockItem({
  item,
  isActive,
  mouseX,
}: {
  item: (typeof MAIN_NAV_ITEMS)[0];
  isActive: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-120, 0, 120], [44, 58, 44]);
  const heightTransform = useTransform(distance, [-120, 0, 120], [44, 58, 44]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        className="relative flex flex-col items-center justify-center group"
        title={item.label}
      >
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl transition-colors duration-150"
          style={{ width, height }}
        >
          <Icon
            size={20}
            className={`transition-colors duration-150 ${
              isActive ? "text-[#F5B800]" : "text-[#94A3B8] group-hover:text-[#F5B800]"
            }`}
          />
        </motion.div>
        {/* Tooltip label on hover */}
        <motion.span
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-widest text-[#F5B800] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden md:block"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {item.label}
        </motion.span>
        {/* Active dot */}
        {isActive && (
          <motion.div
            layoutId="dock-active-dot"
            className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#F5B800]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

function MenuSheet({
  isOpen,
  onClose,
  userRole,
  onLogout,
  currentPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onLogout: () => void;
  currentPath: string;
}) {
  const [, navigate] = useLocation();

  const menuItems = [
    { icon: Mail, label: "Outreach", href: "/outreach" },
    { icon: ClipboardList, label: "Roster", href: "/roster" },
    { icon: SettingsIcon, label: "Settings", href: "/settings" },
    { icon: Tag, label: "Pricing", href: "/pricing" },
    ...(userRole === "admin" ? [{ icon: Shield, label: "Admin", href: "/admin" }] : []),
    { icon: Star, label: "Affiliate", href: "/affiliate-dashboard" },
  ];
  // Note: Outreach is in the More sheet; Home/Dashboard/Schools/Profile are in the main dock

  const handleNavigate = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay */}
          <motion.div
            key="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55]"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
          />
          {/* Bottom sheet */}
          <motion.div
            key="menu-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[60]"
            style={{
              borderRadius: "20px 20px 0 0",
              background: "rgba(12,16,26,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "none",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.2)",
                }}
              />
            </div>

            {/* Menu items */}
            <div className="px-4 pb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="w-full flex items-center gap-4 px-2"
                    style={{
                      height: 52,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <Icon
                      size={20}
                      style={{ color: isActive ? "#F5C518" : "rgba(255,255,255,0.6)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 15,
                        color: isActive ? "#F5C518" : "#FFFFFF",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-2 mt-1"
                style={{
                  height: 52,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <LogOut size={20} style={{ color: "rgba(255,100,100,0.8)", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 15,
                    color: "rgba(255,100,100,0.9)",
                  }}
                >
                  Logout
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function DockNav() {
  const [location] = useLocation();
  const mouseX = useMotionValue(Infinity);
  const { isModalOpen, closeModal } = useModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          left: isModalOpen ? 24 : "50%",
          x: isModalOpen ? 0 : "-50%",
        }}
        transition={{ duration: MODAL_DURATION, ease: MODAL_EASING as any }}
        className="fixed bottom-6 z-50"
        style={{ left: "50%", x: "-50%" }}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {/* Collapsed circle state (modal open) */}
        <AnimatePresence mode="wait">
          {isModalOpen ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: MODAL_DURATION * 0.6, ease: MODAL_EASING }}
              onClick={closeModal}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                background: "rgba(17, 24, 39, 0.92)",
                border: "1px solid rgba(245, 184, 0, 0.5)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,184,0,0.08)",
              }}
              aria-label="Close modal"
            >
              <X size={16} style={{ color: "#F5C518" }} />
            </motion.button>
          ) : (
            /* Full pill state (modal closed) */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: MODAL_DURATION * 0.6, ease: MODAL_EASING }}
              className="flex items-center gap-1 px-4 py-2.5 rounded-2xl"
              style={{
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                background: "rgba(10, 10, 15, 0.45)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* Main nav items */}
              {MAIN_NAV_ITEMS.map((item) => (
                <DockItem
                  key={item.href}
                  item={item}
                  isActive={
                    item.href === "/"
                      ? location === "/"
                      : location.startsWith(item.href)
                  }
                  mouseX={mouseX}
                />
              ))}

              {/* Menu (hamburger) button */}
              <motion.button
                onClick={() => setMenuOpen(true)}
                className="relative flex flex-col items-center justify-center group"
                style={{ width: 44, height: 44 }}
                title="MENU"
                whileTap={{ scale: 0.9 }}
              >
                <Menu
                  size={20}
                  className="transition-colors duration-150 text-[#94A3B8] group-hover:text-[#F5B800]"
                />
                <motion.span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-widest text-[#F5B800] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden md:block"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  MENU
                </motion.span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Menu bottom sheet */}
      <MenuSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        userRole={user?.role}
        onLogout={logout}
        currentPath={location}
      />
    </>
  );
}
