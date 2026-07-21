/**
 * NotificationPortal — Global "Response Received" notification
 *
 * Completely decoupled from the outreach tracker component tree.
 * Listens for a custom browser event and renders via ReactDOM.createPortal
 * directly into document.body, so no re-render anywhere in the app can touch it.
 *
 * Events consumed:
 *   window: CustomEvent 'showReplyNotification' { detail: { schoolId: string, schoolName: string } }
 *
 * Events emitted:
 *   window: CustomEvent 'openReplyGenerator' { detail: { schoolId: string } }
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const DISMISSED_KEY = "rp_reply_notif_dismissed_v2";

function getDismissedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistDismissed(schoolId: string) {
  const set = getDismissedSet();
  set.add(schoolId);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
}

function isDismissed(schoolId: string): boolean {
  return getDismissedSet().has(schoolId);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotifState {
  schoolId: string;
  schoolName: string;
}

export default function NotificationPortal() {
  const [notif, setNotif] = useState<NotifState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotif(null);
  }, []);

  const dismissAndPersist = useCallback((schoolId: string) => {
    persistDismissed(schoolId);
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { schoolId, schoolName } = (e as CustomEvent<{ schoolId: string; schoolName: string }>).detail;

      // Never show if already dismissed for this school
      if (isDismissed(schoolId)) return;

      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      setNotif({ schoolId, schoolName });

      // Auto-dismiss after 10 seconds
      timerRef.current = setTimeout(() => {
        setNotif(null);
        timerRef.current = null;
      }, 10_000);
    };

    window.addEventListener("showReplyNotification", handler);
    return () => {
      window.removeEventListener("showReplyNotification", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleGenerateReply = useCallback(() => {
    if (!notif) return;
    // Fire event so OutreachTracker can expand the correct row
    window.dispatchEvent(
      new CustomEvent("openReplyGenerator", { detail: { schoolId: notif.schoolId } })
    );
    dismissAndPersist(notif.schoolId);
  }, [notif, dismissAndPersist]);

  const handleAlreadyReplied = useCallback(() => {
    if (!notif) return;
    dismissAndPersist(notif.schoolId);
  }, [notif, dismissAndPersist]);

  return createPortal(
    <AnimatePresence>
      {notif && (
        <motion.div
          key={notif.schoolId}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 340,
            background: "#1E1A0A",
            border: "1px solid rgba(245,197,24,0.35)",
            borderRadius: "12px",
            padding: "16px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Bell
              size={16}
              style={{ color: "#F5C518", flexShrink: 0, marginTop: 2 }}
            />
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                color: "#F8FAFC",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Got a reply from{" "}
              <span style={{ color: "#F5C518", fontWeight: 600 }}>
                {notif.schoolName}
              </span>
              ? Paste it in and we'll help you respond.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleGenerateReply}
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                color: "#0A0A0A",
                background: "#F5C518",
                border: "none",
                borderRadius: "6px",
                padding: "7px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              GENERATE REPLY →
            </button>
            <button
              onClick={handleAlreadyReplied}
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                color: "#6B6B6B",
                background: "transparent",
                border: "1px solid #3A3A3A",
                borderRadius: "6px",
                padding: "7px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              I ALREADY REPLIED
            </button>
          </div>

          {/* Progress bar showing 10s countdown */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 10, ease: "linear" }}
            style={{
              height: 2,
              background: "rgba(245,197,24,0.4)",
              borderRadius: 2,
              transformOrigin: "left center",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
