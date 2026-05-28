import { Home } from "lucide-react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: "#090D18" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center w-full"
        style={{ maxWidth: 480 }}
      >
        <p
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "120px",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #F5C518 0%, #FFD640 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "8px",
          }}
        >
          404
        </p>

        <h1
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            color: "#F0F4FF",
            letterSpacing: "0.04em",
            marginBottom: "12px",
          }}
        >
          PAGE NOT FOUND
        </h1>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "#8B9BB8",
            lineHeight: 1.6,
            marginBottom: "36px",
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <motion.button
            whileHover={{ filter: "brightness(1.08)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 cursor-pointer"
            style={{
              background: "#F5C518",
              color: "#090D18",
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              borderRadius: "10px",
              border: "none",
              boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
            }}
          >
            <Home size={16} />
            GO HOME
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
