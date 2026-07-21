/**
 * PaymentSuccess — /success
 *
 * Shown immediately after a successful Stripe checkout.
 * Verifies the session_id from the URL, marks the user as paid,
 * fires a confetti burst, and presents the branded success UI.
 *
 * Security: if no valid session_id is present or the session is not paid,
 * the user is redirected to /pricing instead of seeing this page.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { trpc } from "@/lib/trpc";
import { Check } from "lucide-react";

const FEATURES = [
  "Unlimited school tracking",
  "Roster Gap Finder for every program",
  "AI-powered email generation",
  "Gmail integration — send directly from your account",
  "Outreach tracker and follow-up generator",
  "School finder quiz",
  "Coach directory access",
];

function AnimatedCheckmark() {
  return (
    <div className="checkmark-wrapper" aria-hidden="true">
      <svg
        className="checkmark-svg"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle */}
        <circle
          className="checkmark-circle"
          cx="40"
          cy="40"
          r="36"
          stroke="#F5B800"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Check */}
        <polyline
          className="checkmark-tick"
          points="24,40 35,52 56,28"
          stroke="#F5B800"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "invalid">("verifying");
  const confettiFired = useRef(false);

  // Extract session_id and plan from URL
  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  const planParam = new URLSearchParams(window.location.search).get("plan") as "monthly" | "annual" | null;

  const verifyMutation = trpc.subscription.verifySession.useMutation({
    onSuccess: (data) => {
      if (data.activated) {
        setStatus("success");
      } else {
        // Payment not completed — redirect away
        navigate("/pricing?upgrade=canceled");
      }
    },
    onError: () => {
      navigate("/pricing?upgrade=canceled");
    },
  });

  useEffect(() => {
    if (!sessionId) {
      // No session_id — someone navigated here directly
      navigate("/pricing");
      return;
    }
    verifyMutation.mutate({ sessionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Fire confetti once when status becomes "success"
  useEffect(() => {
    if (status !== "success" || confettiFired.current) return;
    confettiFired.current = true;

    const end = Date.now() + 2800;
    const colors = ["#F5B800", "#FFFFFF", "#FFE066", "#FFF8DC"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        gravity: 1.1,
        scalar: 0.9,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        gravity: 1.1,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [status]);

  // ─── Loading / verifying state ───────────────────────────────────────────────
  if (status === "verifying") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0A0E1A" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#F5B800", borderTopColor: "transparent" }}
          />
          <p
            className="text-sm tracking-widest uppercase"
            style={{ color: "#64748B", fontFamily: "Inter, sans-serif" }}
          >
            Confirming your payment…
          </p>
        </div>
      </div>
    );
  }

  // ─── Success state ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Inline CSS for SVG animations */}
      <style>{`
        @keyframes drawCircle {
          from { stroke-dashoffset: 226; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawTick {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        .checkmark-wrapper {
          width: 80px;
          height: 80px;
          margin: 0 auto 28px;
        }
        .checkmark-svg {
          width: 80px;
          height: 80px;
        }
        .checkmark-circle {
          stroke-dasharray: 226;
          stroke-dashoffset: 226;
          animation: drawCircle 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
        }
        .checkmark-tick {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: drawTick 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.75s forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .success-content {
          animation: fadeUp 0.6s ease 0.2s both;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 pb-[100px] md:pb-12"
        style={{ background: "#0A0E1A" }}
      >
        <div className="success-content w-full" style={{ maxWidth: 560 }}>
          {/* Animated checkmark */}
          <AnimatedCheckmark />

          {/* Pill */}
          <div className="flex justify-center mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{
                background: "rgba(245,184,0,0.12)",
                color: "#F5B800",
                border: "1px solid rgba(245,184,0,0.25)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Check size={11} strokeWidth={3} />
              Payment Confirmed
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-center mb-3 leading-none"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "clamp(64px, 14vw, 96px)",
              color: "#FFFFFF",
              letterSpacing: "0.01em",
            }}
          >
            YOU'RE IN.
          </h1>

          {/* Subheadline */}
          <p
            className="text-center mb-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 17,
              color: "#94A3B8",
              lineHeight: 1.6,
            }}
          >
            Welcome to RecruitPath Pro. You now have full access to every feature.
            {planParam === "annual" && (
              <span style={{ display: "block", marginTop: "6px", fontSize: 14, color: "#64748B" }}>
                Annual plan — $220/year. Renews automatically. Cancel anytime from Settings.
              </span>
            )}
            {planParam === "monthly" && (
              <span style={{ display: "block", marginTop: "6px", fontSize: 14, color: "#64748B" }}>
                Monthly plan — $25/month. Renews automatically. Cancel anytime from Settings.
              </span>
            )}
          </p>

          {/* Feature card */}
          <div
            className="mb-8 rounded-2xl overflow-hidden"
            style={{
              background: "#111827",
              border: "1px solid #1E293B",
            }}
          >
            {FEATURES.map((feature, i) => (
              <div
                key={feature}
                className="flex items-center gap-4 px-6 py-4"
                style={{
                  borderBottom: i < FEATURES.length - 1 ? "1px solid #1E293B" : "none",
                }}
              >
                {/* Yellow number */}
                <span
                  className="flex-shrink-0 w-6 text-center font-bold text-sm"
                  style={{ color: "#F5B800", fontFamily: "Inter, sans-serif" }}
                >
                  <Check size={16} strokeWidth={3} />
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#E2E8F0",
                    lineHeight: 1.5,
                  }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Primary */}
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "#F5B800",
                color: "#0A0E1A",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              GO TO MY DASHBOARD →
            </button>

            {/* Secondary */}
            <button
              onClick={() => navigate("/profile")}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-150 hover:bg-white/5 active:scale-[0.98]"
              style={{
                background: "transparent",
                color: "#F8FAFC",
                border: "1px solid #1E293B",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              COMPLETE MY PROFILE →
            </button>

            {/* Tertiary */}
            <button
              onClick={() => navigate("/how-it-works")}
              className="w-full py-2 text-sm transition-colors duration-150 hover:text-white"
              style={{
                background: "transparent",
                border: "none",
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
              }}
            >
              How does RecruitPath work? →
            </button>
          </div>

          {/* Footer note */}
          <p
            className="text-center mt-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            A receipt has been sent to your email.{" "}
            Questions?{" "}
            <a
              href="mailto:contact.recruitpath@gmail.com"
              style={{ color: "#64748B", textDecoration: "underline" }}
            >
              contact.recruitpath@gmail.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
