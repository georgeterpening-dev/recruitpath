/*
 * RecruitPath — DockNav Component
 * Design: Floating pill-shaped dock, fixed bottom center
 * Behavior: Spring expand on hover (desktop), always expanded (mobile)
 * Frosted glass: backdrop-blur(20px), rgba(17,24,39,0.85), gold border
 * Nav items: Home, Dashboard, Profile, Schools, Pricing, Settings
 *
 * MODAL BEHAVIOR:
 * When isModalOpen=true → slides left to 24px from left edge + collapses to 44px circle (350ms)
 * When isModalOpen=false → slides back to center + expands to full pill (350ms)
 * Clicking the collapsed circle while modal is open calls closeModal()
 */
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Home, User, School, CreditCard, Settings as SettingsIcon, LayoutDashboard, X } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useRef } from "react";
import { useModal } from "@/contexts/ModalContext";

const NAV_ITEMS = [
  { icon: Home, label: "HOME", href: "/", badge: false },
  { icon: LayoutDashboard, label: "DASHBOARD", href: "/dashboard", badge: false },
  { icon: User, label: "PROFILE", href: "/profile", badge: false },
  { icon: School, label: "SCHOOLS", href: "/schools", badge: false },
  { icon: CreditCard, label: "PRICING", href: "/pricing", badge: true },
  { icon: SettingsIcon, label: "SETTINGS", href: "/settings", badge: false },
];

const MODAL_EASING = [0.16, 1, 0.3, 1] as [number, number, number, number];
const MODAL_DURATION = 0.35;

function DockItem({
  item,
  isActive,
  mouseX,
}: {
  item: (typeof NAV_ITEMS)[0];
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
              isActive ? "text-[#F5C518]" : "text-[#8B9BB8] group-hover:text-[#C8D4E8]"
            }`}
          />
          {/* Yellow dot badge for upgrade nudge */}
          {item.badge && (
            <motion.div
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "#F5C518" }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
        {/* Tooltip label on hover */}
        <motion.span
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-widest text-[#F5C518] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden md:block"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {item.label}
        </motion.span>
        {/* Active dot */}
        {isActive && (
          <motion.div
            layoutId="dock-active-dot"
            className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#F5C518]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

export default function DockNav() {
  const [location] = useLocation();
  const mouseX = useMotionValue(Infinity);
  const { isModalOpen, closeModal } = useModal();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        // When modal is open: slide to 24px from left edge
        // When modal is closed: back to center (left: 50%, translateX: -50%)
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
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              background: "rgba(9,13,24,0.96)",
              border: "1px solid #1E2A42",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
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
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              background: "rgba(9,13,24,0.96)",
              border: "1px solid #1E2A42",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {NAV_ITEMS.map((item) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
