/**
 * SchoolLogo — displays a school's logo with three-tier priority:
 *   1. logoUrl override (direct URL from DB, typically SVG from athletics site)
 *   2. Logo.dev lookup via athleticsDomain
 *   3. Initials avatar fallback
 *
 * CSS strategy:
 * - logoUrl overrides (SVG, transparent bg): dark container (#111827) + mix-blend-mode: screen
 *   → White/colored SVG paths become visible against dark background
 * - Logo.dev PNGs (white bg + colored logo): white circular container, no blend mode
 *   → Clean white badge look, standard for dark-background apps
 * - onError fallback to initials if any image fails to load
 */
import { useState } from "react";

const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN ?? "";

interface SchoolLogoProps {
  /** Full school name, used to derive the initials fallback */
  name: string;
  /** Athletics domain for Logo.dev lookup, e.g. "uclabruins.com" */
  athleticsDomain?: string | null;
  /**
   * Direct logo URL override — if set, this image is used instead of Logo.dev.
   * Use this for schools where Logo.dev returns the wrong logo or a broken image.
   */
  logoUrl?: string | null;
  /** Avatar diameter in pixels (default 48) */
  size?: number;
  /** Brand color for the initials fallback background (default #1E293B) */
  brandColor?: string | null;
  /** Extra className applied to the outer wrapper */
  className?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function SchoolLogo({
  name,
  athleticsDomain,
  logoUrl,
  size = 48,
  brandColor,
  className = "",
}: SchoolLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);

  const hasImage = (logoUrl || (athleticsDomain && LOGO_DEV_TOKEN)) && !imgFailed;

  // Initials fallback
  if (!hasImage) {
    const bg = brandColor || "#1E293B";
    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          flexShrink: 0,
        }}
        className={className}
        aria-label={name}
      >
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1,
            fontFamily: "Barlow Condensed, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {initials}
        </span>
      </div>
    );
  }

  const padding = Math.round(size * 0.1);
  const imgSize = size - padding * 2;

  // ── Priority 1: logoUrl override (SVG from official athletics site) ──────────
  // These SVGs typically have transparent backgrounds with white/colored paths.
  // Strategy: dark container (#111827) + mix-blend-mode: screen
  //   • White paths (#fff) screen against dark (#111827) → white (visible)
  //   • Colored paths screen against dark → vivid colors (visible)
  //   • Transparent areas → dark container shows through (correct)
  if (logoUrl && !imgFailed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          border: "1px solid #333333",
          flexShrink: 0,
        }}
        className={className}
        aria-label={name}
      >
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={imgSize}
          height={imgSize}
          style={{
            objectFit: "contain",
            width: imgSize,
            height: imgSize,
            flexShrink: 0,
            mixBlendMode: "screen",
          }}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  // ── Priority 2: Logo.dev PNG ─────────────────────────────────────────────────
  // Logo.dev returns PNGs with white backgrounds and colored/dark logos.
  // Strategy: white circular container with subtle border — clean badge look.
  // This is the standard pattern for displaying logos on dark backgrounds
  // (used by Spotify, LinkedIn, etc.). The white circle acts as a clean canvas.
  const logoDevUrl = `https://img.logo.dev/${athleticsDomain}?token=${LOGO_DEV_TOKEN}&size=${size * 2}&format=png`;

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
      }}
      className={className}
      aria-label={name}
    >
      <img
        src={logoDevUrl}
        alt={`${name} logo`}
        width={imgSize}
        height={imgSize}
        style={{
          objectFit: "contain",
          width: imgSize,
          height: imgSize,
          flexShrink: 0,
        }}
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}
