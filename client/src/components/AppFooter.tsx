import { Link } from "wouter";

export default function AppFooter() {
  return (
    <footer
      style={{
        background: "#070B16",
        borderTop: "1px solid #1E2A42",
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
        color: "#4A5570",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: brand + copyright */}
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              letterSpacing: "-0.01em",
              background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RECRUITPATH
          </span>
          <span style={{ color: "#2A3550" }}>·</span>
          <span>© 2026 All rights reserved.</span>
        </div>

        {/* Center: legal links */}
        <div className="flex items-center gap-6">
          <Link href="/terms">
            <span
              className="cursor-pointer"
              style={{ color: "#4A5570", transition: "color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8B9BB8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4A5570")}
            >
              Terms of Service
            </span>
          </Link>
          <Link href="/privacy">
            <span
              className="cursor-pointer"
              style={{ color: "#4A5570", transition: "color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8B9BB8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4A5570")}
            >
              Privacy Policy
            </span>
          </Link>
        </div>

        {/* Right: contact */}
        <a
          href="mailto:contact.recruitpath@gmail.com"
          style={{ color: "#4A5570", transition: "color 150ms ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5C518")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4A5570")}
        >
          contact.recruitpath@gmail.com
        </a>
      </div>
    </footer>
  );
}
