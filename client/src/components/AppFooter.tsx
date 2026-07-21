import { Link } from "wouter";

/**
 * AppFooter — consistent footer shown on every page.
 * Dark bg (#0A0A0A), muted gray text, DM Sans 12px.
 */
export default function AppFooter() {
  return (
    <footer
      style={{
        background: "#0A0A0A",
        borderTop: "1px solid #3A3A3A",
        fontFamily: "DM Sans, sans-serif",
        fontSize: "12px",
        color: "#888888",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6 py-5 pb-[100px] md:pb-5 flex flex-col items-center md:flex-row md:justify-between gap-3 text-center md:text-left"
      >
        {/* Left: copyright */}
        <span>© 2026 RecruitPath. All rights reserved.</span>

        {/* Center: legal links */}
        <div className="flex items-center gap-6">
          <Link href="/terms">
            <span
              className="cursor-pointer transition-colors duration-150"
              style={{ color: "#888888" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#cccccc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              Terms of Service
            </span>
          </Link>
          <Link href="/privacy">
            <span
              className="cursor-pointer transition-colors duration-150"
              style={{ color: "#888888" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#cccccc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              Privacy Policy
            </span>
          </Link>
        </div>

        {/* Right: contact email */}
        <a
          href="mailto:contact.recruitpath@gmail.com"
          style={{ color: "#888888" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#cccccc")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
          className="transition-colors duration-150"
        >
          contact.recruitpath@gmail.com
        </a>
      </div>
    </footer>
  );
}
