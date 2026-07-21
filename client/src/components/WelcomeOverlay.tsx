import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

const VOLLEYBALL_BG =
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=80";

const steps = [
  {
    num: "01",
    title: "BUILD YOUR PROFILE",
    desc: "Fill in your stats, position, and grad year",
  },
  {
    num: "02",
    title: "FIND YOUR SCHOOLS",
    desc: "Take the quiz or browse 30+ programs",
  },
  {
    num: "03",
    title: "CHECK ROSTER GAPS",
    desc: "See which programs need your position",
  },
  {
    num: "04",
    title: "SEND YOUR EMAIL",
    desc: "Generate and send directly from your Gmail",
  },
];

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

export default function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  const [, navigate] = useLocation();
  const dismissWelcome = trpc.auth.dismissWelcome.useMutation();
  const utils = trpc.useUtils();

  const handleDismiss = async () => {
    await dismissWelcome.mutateAsync();
    await utils.auth.me.invalidate();
    onDismiss();
  };

  const handleShowHowItWorks = async () => {
    await dismissWelcome.mutateAsync();
    await utils.auth.me.invalidate();
    onDismiss();
    navigate("/how-it-works");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        style={{ background: "rgba(10, 10, 10, 0.97)" }}
      >
        {/* Subtle volleyball video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none"
        >
          <source src={VOLLEYBALL_BG} type="video/mp4" />
        </video>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full flex flex-col items-center"
          style={{ maxWidth: 560 }}
        >
          {/* Yellow pill */}
          <div
            className="mb-6 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full"
            style={{
              background: "rgba(245, 184, 0, 0.12)",
              border: "1px solid rgba(245, 184, 0, 0.35)",
              color: "#F5B800",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            WELCOME TO RECRUITPATH
          </div>

          {/* Headline */}
          <h1
            className="text-white text-center mb-4 leading-none"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(44px, 8vw, 64px)",
              letterSpacing: "0.01em",
            }}
          >
            LET'S GET YOU RECRUITED.
          </h1>

          {/* Subtext */}
          <p
            className="text-center mb-8"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 15,
              color: "#94A3B8",
              lineHeight: 1.6,
              maxWidth: 460,
            }}
          >
            Before you dive in, take 3 minutes to learn exactly how RecruitPath
            works and what to do first. Athletes who follow the recommended path
            get significantly better results.
          </p>

          {/* 4-step card */}
          <div
            className="w-full mb-6"
            style={{
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  borderBottom: i < steps.length - 1 ? "1px solid #2A2A2A" : "none",
                }}
              >
                {/* Yellow step number */}
                <span
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: 22,
                    color: "#F5B800",
                    lineHeight: 1,
                    minWidth: 32,
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </span>

                {/* Text */}
                <div className="flex flex-col gap-0.5">
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#F8FAFC",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {step.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 12,
                      color: "#64748B",
                    }}
                  >
                    {step.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            {/* Primary: Show me how it works */}
            <motion.button
              whileHover={{ filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShowHowItWorks}
              disabled={dismissWelcome.isPending}
              className="w-full py-3.5 text-sm font-bold tracking-wider uppercase rounded-xl"
              style={{
                background: "#F5B800",
                color: "#0A0E1A",
                fontFamily: "DM Sans, sans-serif",
                letterSpacing: "0.06em",
              }}
            >
              SHOW ME HOW IT WORKS →
            </motion.button>

            {/* Secondary: Skip */}
            <motion.button
              whileHover={{ background: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDismiss}
              disabled={dismissWelcome.isPending}
              className="w-full py-3 text-sm font-semibold tracking-wider uppercase rounded-xl border"
              style={{
                borderColor: "#2A2A2A",
                color: "#64748B",
                background: "transparent",
                fontFamily: "DM Sans, sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              SKIP — TAKE ME TO MY DASHBOARD
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
