import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface ComingSoonGateProps {
  onUnlock: () => void;
  children?: React.ReactNode;
}

export default function ComingSoonGate({ onUnlock, children }: ComingSoonGateProps & { children?: React.ReactNode }) {
  const [showInput, setShowInput] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const joinMutation = trpc.waitlist.join.useMutation();

  const currentPath = window.location.pathname;
  if (currentPath === "/pricing" || currentPath === "/about") {
    return <>{children}</>;
  }

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    const result = await joinMutation.mutateAsync({ email, source: "coming_soon_gate" });
    if (result.success && result.alreadyExists) setStatus("duplicate");
    else if (result.success) setStatus("success");
    else setStatus("error");
  };

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  function handleAdminClick() {
    setShowInput(true);
    setError(false);
    setPassword("");
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (password === "Windward2026!!") {
      sessionStorage.setItem("siteUnlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setPassword("");
      if (inputRef.current) inputRef.current.focus();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        zIndex: 9999,
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1628 50%, #0a1020 100%)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Animated background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)",
          animation: "pulseGlow 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "500px",
          width: "100%",
          padding: "0 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0",
          paddingTop: "60px",
          paddingBottom: "60px",
        }}
      >
        {/* RECRUITPATH logo */}
        <img src="/logos/logo-yellow.svg" height="64" alt="RecruitPath" style={{ marginBottom: "24px", display: "block" }} />

        {/* COMING SOON headline */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "64px",
            letterSpacing: "0.02em",
            lineHeight: 1,
            background: "linear-gradient(135deg, #F5C518 0%, #FFD700 50%, #F5C518 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "20px",
          }}
        >
          COMING SOON
        </div>

        {/* Subtext */}
        <p
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
            margin: "0 0 48px 0",
            maxWidth: "380px",
          }}
        >
          The recruiting platform for men's volleyball athletes is almost here.
        </p>

        {status === "success" ? (
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <p style={{ fontFamily: "DM Sans, sans-serif", color: "#22C55E", fontSize: "15px", fontWeight: 600 }}>
              ✓ You're on the list! We'll email your 15% discount code at launch.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "32px", maxWidth: "400px", margin: "32px auto 0" }}>
            <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "13px", letterSpacing: "0.15em", color: "#F5C518", marginBottom: "6px" }}>
              FOUNDING MEMBER OFFER
            </p>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#888", marginBottom: "16px" }}>
              Join the waitlist and lock in <span style={{ color: "#F5C518", fontWeight: 700 }}>15% off forever</span> — founding members only.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#FFFFFF",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={status === "loading"}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#F5C518",
                  color: "#000",
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "16px",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
              >
                {status === "loading" ? "JOINING..." : "LOCK IN 15% OFF"}
              </button>
            </div>
            {status === "error" && (
              <p style={{ fontFamily: "DM Sans, sans-serif", color: "#EF4444", fontSize: "13px", marginTop: "8px" }}>
                Something went wrong. Try again.
              </p>
            )}
            {status === "duplicate" && (
              <p style={{ fontFamily: "DM Sans, sans-serif", color: "#F5C518", fontSize: "13px", marginTop: "8px" }}>
                You're already on the waitlist!
              </p>
            )}
          </div>
        )}

        {/* Admin unlock section */}
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {!showInput ? (
            <button
              onClick={handleAdminClick}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.25)",
                fontSize: "11px",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.05em",
                padding: "4px 8px",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
            >
              Admin
            </button>
          ) : (
            <form
              onSubmit={handleUnlock}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="Password"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${error ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "white",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                    width: "180px",
                    backdropFilter: "blur(8px)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => {
                    if (!error) e.target.style.borderColor = "rgba(245,197,24,0.4)";
                  }}
                  onBlur={e => {
                    if (!error) e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "#F5C518",
                    border: "none",
                    borderRadius: "20px",
                    padding: "10px 16px",
                    color: "#0a0f1e",
                    fontSize: "12px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  UNLOCK
                </button>
              </div>
              {error && (
                <span
                  style={{
                    color: "rgba(255,100,100,0.9)",
                    fontSize: "12px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Incorrect password
                </span>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Keyframe animation injected via style tag */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
