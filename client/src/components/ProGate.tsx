/**
 * ProGate — Consistent subscription gate overlay component.
 * Used in: Outreach page (full-page), Roster Gap tab, Email tab (inline).
 *
 * Spec:
 *   Background: rgba(10, 15, 26, 0.95)
 *   Border: 1px solid rgba(255,255,255,0.06)
 *   Border-radius: 14px
 *   Lock icon: #F5B800 yellow, 24px
 *   Headline: Bebas Neue 22px white
 *   Subtext: DM Sans 13px #64748B
 *   Upgrade button: yellow gradient, black text, border-radius 8px
 *   Pricing subtext: DM Sans 11px rgba(255,255,255,0.3)
 */
import { Lock } from "lucide-react";
import { Link } from "wouter";

interface ProGateProps {
  headline: string;
  subtext: string;
  /** If true, renders as a full-page centered card. If false, fills its container. */
  fullPage?: boolean;
  /** Optional pricing subtext below the button (e.g. "From $25/month · Cancel anytime") */
  pricingNote?: string;
}

export default function ProGate({
  headline,
  subtext,
  fullPage = false,
  pricingNote,
}: ProGateProps) {
  const card = (
    <div
      style={{
        background: "rgba(10, 15, 26, 0.95)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        padding: fullPage ? "48px 40px" : "36px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: "420px",
        width: "100%",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Lock icon */}
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(245,184,0,0.1)",
          border: "1px solid rgba(245,184,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          flexShrink: 0,
        }}
      >
        <Lock size={24} style={{ color: "#F5B800" }} />
      </div>

      {/* Headline */}
      <h2
        style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: "22px",
          color: "#FFFFFF",
          letterSpacing: "0.04em",
          marginBottom: "12px",
          lineHeight: 1.1,
        }}
      >
        {headline}
      </h2>

      {/* Subtext */}
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          color: "#64748B",
          lineHeight: 1.6,
          marginBottom: "28px",
          maxWidth: "320px",
        }}
      >
        {subtext}
      </p>

      {/* Upgrade button */}
      <Link href="/pricing">
        <div
          style={{
            background: "linear-gradient(135deg, #F5B800, #FFD700)",
            color: "#0A0E1A",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: "8px",
            padding: "12px 28px",
            boxShadow: "0 4px 20px rgba(245,184,0,0.35)",
            cursor: "pointer",
            display: "inline-block",
            textDecoration: "none",
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.opacity = "0.9";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.opacity = "1";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          }}
        >
          UPGRADE TO PRO →
        </div>
      </Link>

      {/* Pricing note */}
      {pricingNote && (
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "rgba(255,255,255,0.3)",
            marginTop: "12px",
          }}
        >
          {pricingNote}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0E1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        {card}
      </div>
    );
  }

  // Inline (tab content) — fills container, centered
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        minHeight: "280px",
      }}
    >
      {card}
    </div>
  );
}
