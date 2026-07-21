/**
 * AppWalkthrough — first-time user walkthrough overlay
 *
 * Renders a full-screen semi-transparent backdrop with a spotlight cutout
 * around the highlighted element. A tooltip card with progress dots, Skip,
 * and Next/Let's go buttons guides the user through 5 steps.
 *
 * Usage:
 *   <AppWalkthrough onComplete={handleComplete} onSkip={handleSkip} />
 *
 * The parent is responsible for deciding whether to show this component
 * (based on hasSeenWalkthrough) and for calling the tRPC mutation on
 * complete/skip.
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

// ─── Step definitions ─────────────────────────────────────────────────────────

interface WalkthroughStep {
  /** CSS selector for the element to highlight */
  selector: string;
  title: string;
  body: string;
  /** Preferred tooltip placement */
  placement: "below" | "above" | "right";
}

const STEPS: WalkthroughStep[] = [
  {
    selector: "[data-walkthrough='stat-blocks']",
    title: "YOUR COMMAND CENTER",
    body: "This is your dashboard. Track your open roster windows, emails sent, and profile strength all in one place.",
    placement: "below",
  },
  {
    selector: "[data-walkthrough='nav-schools']",
    title: "FIND YOUR PROGRAMS",
    body: "Browse all 324 men's volleyball programs across D1, D2, and D3. Add schools you're interested in to your dashboard.",
    placement: "right",
  },
  {
    selector: "[data-walkthrough='nav-profile']",
    title: "BUILD YOUR PROFILE",
    body: "Fill out your profile completely. Every email we generate pulls directly from your stats, grad year, and links. The more complete it is, the better your emails.",
    placement: "right",
  },
  {
    selector: "[data-walkthrough='nav-outreach']",
    title: "TRACK YOUR OUTREACH",
    body: "Every email you send appears here. Track responses, generate follow ups, and analyze coach replies — all in one place.",
    placement: "right",
  },
  {
    selector: "[data-walkthrough='target-schools']",
    title: "START HERE",
    body: "Add schools to your dashboard, check their roster gaps, and generate a personalized email to the coach — sent directly from your Gmail.",
    placement: "above",
  },
];

// ─── Rect helper ─────────────────────────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElementRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// ─── Tooltip positioning ──────────────────────────────────────────────────────

const TOOLTIP_WIDTH = 300;
const TOOLTIP_PADDING = 16; // gap between spotlight and tooltip
const ARROW_SIZE = 8;

interface TooltipPos {
  top: number;
  left: number;
  arrowSide: "top" | "bottom" | "left" | "right";
  arrowOffset: number; // px from the start of the arrow side
}

function computeTooltipPos(
  rect: Rect,
  placement: WalkthroughStep["placement"],
  tooltipHeight: number,
  isMobile: boolean
): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (isMobile) {
    // Always bottom-center on mobile
    return {
      top: vh - tooltipHeight - 32,
      left: (vw - TOOLTIP_WIDTH) / 2,
      arrowSide: "bottom",
      arrowOffset: TOOLTIP_WIDTH / 2 - ARROW_SIZE,
    };
  }

  const PADDING = TOOLTIP_PADDING;

  if (placement === "below") {
    const top = rect.top + rect.height + PADDING;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 8));
    const arrowOffset = rect.left + rect.width / 2 - left - ARROW_SIZE;
    return { top, left, arrowSide: "top", arrowOffset: Math.max(8, Math.min(arrowOffset, TOOLTIP_WIDTH - 24)) };
  }

  if (placement === "above") {
    const top = rect.top - tooltipHeight - PADDING;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 8));
    const arrowOffset = rect.left + rect.width / 2 - left - ARROW_SIZE;
    return { top, left, arrowSide: "bottom", arrowOffset: Math.max(8, Math.min(arrowOffset, TOOLTIP_WIDTH - 24)) };
  }

  // right
  const top = Math.max(8, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, vh - tooltipHeight - 8));
  const left = rect.left + rect.width + PADDING;
  const arrowOffset = rect.top + rect.height / 2 - top - ARROW_SIZE;
  return { top, left, arrowSide: "left", arrowOffset: Math.max(8, Math.min(arrowOffset, tooltipHeight - 24)) };
}

// ─── Spotlight SVG ────────────────────────────────────────────────────────────

const SPOTLIGHT_PADDING = 8;

function SpotlightOverlay({ rect }: { rect: Rect | null }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect) {
    // Full-screen dim, no cutout
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 9998,
          pointerEvents: "none",
        }}
      />
    );
  }

  const pad = SPOTLIGHT_PADDING;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const r = 10; // border-radius of cutout

  // SVG path: full screen rect with a rounded-rect hole cut out
  const path = `
    M 0 0 H ${vw} V ${vh} H 0 Z
    M ${x + r} ${y}
    H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r}
    V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h}
    H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r}
    V ${y + r} Q ${x} ${y} ${x + r} ${y}
    Z
  `;

  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        pointerEvents: "none",
        width: vw,
        height: vh,
      }}
    >
      <path d={path} fill="rgba(0,0,0,0.6)" fillRule="evenodd" />
    </svg>
  );
}

// ─── Arrow ────────────────────────────────────────────────────────────────────

function Arrow({ side, offset }: { side: "top" | "bottom" | "left" | "right"; offset: number }) {
  const size = ARROW_SIZE;
  const color = "#2a2a2a";
  const fillColor = "#1a1f2e";

  const style: React.CSSProperties = { position: "absolute" };

  if (side === "top") {
    style.top = -size;
    style.left = offset;
    return (
      <svg
        width={size * 2}
        height={size}
        style={style}
        viewBox={`0 0 ${size * 2} ${size}`}
      >
        <polygon points={`0,${size} ${size},0 ${size * 2},${size}`} fill={color} />
        <polygon points={`1,${size} ${size},1 ${size * 2 - 1},${size}`} fill={fillColor} />
      </svg>
    );
  }
  if (side === "bottom") {
    style.bottom = -size;
    style.left = offset;
    return (
      <svg
        width={size * 2}
        height={size}
        style={style}
        viewBox={`0 0 ${size * 2} ${size}`}
      >
        <polygon points={`0,0 ${size * 2},0 ${size},${size}`} fill={color} />
        <polygon points={`1,0 ${size * 2 - 1},0 ${size},${size - 1}`} fill={fillColor} />
      </svg>
    );
  }
  if (side === "left") {
    style.left = -size;
    style.top = offset;
    return (
      <svg
        width={size}
        height={size * 2}
        style={style}
        viewBox={`0 0 ${size} ${size * 2}`}
      >
        <polygon points={`${size},0 ${size},${size * 2} 0,${size}`} fill={color} />
        <polygon points={`${size},1 ${size},${size * 2 - 1} 1,${size}`} fill={fillColor} />
      </svg>
    );
  }
  // right
  style.right = -size;
  style.top = offset;
  return (
    <svg
      width={size}
      height={size * 2}
      style={style}
      viewBox={`0 0 ${size} ${size * 2}`}
    >
      <polygon points={`0,0 0,${size * 2} ${size},${size}`} fill={color} />
      <polygon points={`0,1 0,${size * 2 - 1} ${size - 1},${size}`} fill={fillColor} />
    </svg>
  );
}

// ─── Tooltip card ─────────────────────────────────────────────────────────────

interface TooltipCardProps {
  step: WalkthroughStep;
  stepIndex: number;
  totalSteps: number;
  pos: TooltipPos;
  visible: boolean;
  onNext: () => void;
  onSkip: () => void;
}

function TooltipCard({ step, stepIndex, totalSteps, pos, visible, onNext, onSkip }: TooltipCardProps) {
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: TOOLTIP_WIDTH,
        zIndex: 10000,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          background: "#1a1f2e",
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          padding: "20px 24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          position: "relative",
        }}
      >
        <Arrow side={pos.arrowSide} offset={pos.arrowOffset} />

        {/* Title */}
        <div
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: 16,
            color: "#ffffff",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          {step.title}
        </div>

        {/* Body */}
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: "#94a3b8",
            lineHeight: 1.55,
            marginBottom: 20,
          }}
        >
          {step.body}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i === stepIndex ? "#F5C518" : "#2a3a50",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onSkip}
            style={{
              background: "transparent",
              border: "none",
              color: "#4a5568",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 0",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4a5568"; }}
          >
            Skip tour
          </button>
          <button
            onClick={onNext}
            style={{
              background: "#F5C518",
              border: "none",
              color: "#0a0e1a",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              padding: "8px 18px",
              borderRadius: 8,
              transition: "filter 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
          >
            {isLast ? "Let's go →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Glow ring ────────────────────────────────────────────────────────────────

function GlowRing({ rect }: { rect: Rect | null }) {
  if (!rect) return null;
  const pad = SPOTLIGHT_PADDING;
  return (
    <div
      style={{
        position: "fixed",
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 10,
        boxShadow: "0 0 0 3px rgba(245,197,24,0.4)",
        zIndex: 9999,
        pointerEvents: "none",
        transition: "all 0.25s ease",
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AppWalkthroughProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function AppWalkthrough({ onComplete, onSkip }: AppWalkthroughProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0, arrowSide: "top", arrowOffset: 20 });
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 640;

  const step = STEPS[stepIndex];

  const measureAndPosition = useCallback(() => {
    const r = getElementRect(step.selector);
    setRect(r);

    // Estimate tooltip height (we'll use a fixed estimate since we can't measure before render)
    const estimatedHeight = 200;
    if (r) {
      const pos = computeTooltipPos(r, step.placement, estimatedHeight, isMobile);
      setTooltipPos(pos);
    }
  }, [step, isMobile]);

  // Measure on step change
  useLayoutEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => {
      measureAndPosition();
      setVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [stepIndex, measureAndPosition]);

  // Re-measure on resize/scroll
  useEffect(() => {
    const handler = () => measureAndPosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [measureAndPosition]);

  // ESC key dismissal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSkip]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      // Final step — fade out then complete
      setVisible(false);
      setTimeout(onComplete, 250);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(onSkip, 250);
  };

  return createPortal(
    <>
      {/* Backdrop with spotlight cutout */}
      <SpotlightOverlay rect={rect} />

      {/* Yellow glow ring around highlighted element */}
      <GlowRing rect={rect} />

      {/* Tooltip card */}
      <div ref={tooltipRef}>
        <TooltipCard
          step={step}
          stepIndex={stepIndex}
          totalSteps={STEPS.length}
          pos={tooltipPos}
          visible={visible}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </div>

      {/* Intercept clicks outside tooltip — do nothing */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </>,
    document.body
  );
}
