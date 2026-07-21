/**
 * MobileWalkthrough — full-screen swipeable 3-slide onboarding
 * Shown on mobile only (max-width 767px) when hasSeenWalkthrough is false.
 * Swipe left/right or tap NEXT to advance. After slide 3, calls onComplete.
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileWalkthroughProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SLIDES = [
  {
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Volleyball icon */}
        <circle cx="60" cy="60" r="50" stroke="#F5C518" strokeWidth="3" fill="none" opacity="0.15" />
        <circle cx="60" cy="60" r="36" stroke="#F5C518" strokeWidth="2.5" fill="none" opacity="0.3" />
        <circle cx="60" cy="60" r="22" fill="#F5C518" opacity="0.9" />
        <path d="M60 38 L60 82" stroke="#0d1117" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 49 L78 71" stroke="#0d1117" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 71 L78 49" stroke="#0d1117" strokeWidth="2.5" strokeLinecap="round" />
        {/* Stars */}
        <circle cx="20" cy="25" r="2" fill="#F5C518" opacity="0.5" />
        <circle cx="100" cy="30" r="1.5" fill="#F5C518" opacity="0.4" />
        <circle cx="15" cy="80" r="1.5" fill="#F5C518" opacity="0.3" />
        <circle cx="105" cy="85" r="2" fill="#F5C518" opacity="0.5" />
      </svg>
    ),
    headline: "WELCOME TO RECRUITPATH.",
    subtext: "The only recruiting platform built specifically for men's volleyball athletes.",
  },
  {
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Search/target icon */}
        <circle cx="60" cy="55" r="32" stroke="#F5C518" strokeWidth="3" fill="none" opacity="0.2" />
        <circle cx="60" cy="55" r="20" stroke="#F5C518" strokeWidth="2.5" fill="none" opacity="0.4" />
        <circle cx="60" cy="55" r="8" fill="#F5C518" opacity="0.9" />
        {/* Crosshair lines */}
        <line x1="60" y1="15" x2="60" y2="35" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1="60" y1="75" x2="60" y2="95" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1="20" y1="55" x2="40" y2="55" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1="80" y1="55" x2="100" y2="55" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        {/* Opening badge */}
        <rect x="72" y="72" width="36" height="20" rx="10" fill="#F5C518" />
        <text x="90" y="86" textAnchor="middle" fill="#0d1117" fontSize="9" fontFamily="Bebas Neue, sans-serif" letterSpacing="0.5">OPEN</text>
      </svg>
    ),
    headline: "FIND YOUR OPENING.",
    subtext: "See which programs have roster spots at your position before you send a single email.",
  },
  {
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Email/send icon */}
        <rect x="15" y="30" width="90" height="60" rx="10" stroke="#F5C518" strokeWidth="3" fill="none" opacity="0.2" />
        <rect x="15" y="30" width="90" height="60" rx="10" fill="#F5C518" opacity="0.06" />
        {/* Envelope flap */}
        <path d="M15 40 L60 68 L105 40" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
        {/* Send arrow */}
        <circle cx="88" cy="32" r="16" fill="#F5C518" opacity="0.9" />
        <path d="M80 32 L96 32 M90 26 L96 32 L90 38" stroke="#0d1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    headline: "SEND YOUR STORY.",
    subtext: "Generate a personalized email and send it directly from your Gmail. Coaches see your name, not a platform.",
  },
];

export default function MobileWalkthrough({ onComplete, onSkip }: MobileWalkthroughProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goToNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only register horizontal swipes (dx > dy in magnitude)
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && currentSlide < SLIDES.length - 1) {
      // Swipe left → next
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else if (dx > 0 && currentSlide > 0) {
      // Swipe right → previous
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col overflow-hidden"
      style={{ background: "#0d1117" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
          >
            {/* Top half: icon illustration */}
            <div className="flex items-center justify-center mb-12" style={{ flex: "0 0 auto" }}>
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: "rgba(245,197,24,0.06)",
                  border: "1px solid rgba(245,197,24,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {slide.icon}
              </div>
            </div>

            {/* Bottom half: text */}
            <div className="text-center">
              <h1
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "32px",
                  letterSpacing: "0.04em",
                  color: "#FFFFFF",
                  lineHeight: 1.1,
                  marginBottom: "16px",
                }}
              >
                {slide.headline}
              </h1>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.6,
                  maxWidth: "300px",
                  margin: "0 auto",
                }}
              >
                {slide.subtext}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div
        style={{
          padding: "0 24px",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
          flexShrink: 0,
        }}
      >
        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentSlide ? 1 : -1);
                setCurrentSlide(i);
              }}
              style={{
                width: i === currentSlide ? "20px" : "6px",
                height: "6px",
                borderRadius: "999px",
                background: i === currentSlide ? "#F5C518" : "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Skip link */}
        <div className="text-center mb-3">
          <button
            onClick={onSkip}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.3)",
              padding: "4px 8px",
            }}
          >
            Skip
          </button>
        </div>

        {/* Next / Let's Go button */}
        <button
          onClick={goToNext}
          style={{
            width: "100%",
            height: "52px",
            borderRadius: "999px",
            background: "#F5C518",
            border: "none",
            cursor: "pointer",
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "14px",
            letterSpacing: "0.12em",
            color: "#0d1117",
            boxShadow: "0 4px 20px rgba(245,197,24,0.3)",
          }}
        >
          {isLast ? "LET'S GO →" : "NEXT →"}
        </button>
      </div>
    </div>
  );
}
