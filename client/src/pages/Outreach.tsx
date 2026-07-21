/**
 * RecruitPath — Outreach Page
 * Design: Matches Dashboard / Schools design system exactly
 * Colors: #0A0E1A bg, #0F172A cards, #1E293B borders, #F5B800 gold, #94A3B8 muted
 * Fonts: Barlow Condensed headlines, Inter body
 * Contains: Full OutreachTracker (status groups, follow-up, reply generator)
 */
import { motion } from "framer-motion";
import { useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useModal } from "@/contexts/ModalContext";
import { useState } from "react";
import { SCHOOL_DATABASE } from "@/data/schoolDatabase";
import OutreachTracker from "@/components/OutreachTracker";
import SchoolDetailModal from "@/components/SchoolDetailModal";
import AppFooter from "@/components/AppFooter";
import { getStoredGradYear } from "@/hooks/useAthleteProfile";
import { Link } from "wouter";
import ProGate from "@/components/ProGate";

export default function OutreachPage() {
  const { isAuthenticated, loading } = useAuth();
  const { openModal, closeModal } = useModal();
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl("/outreach");
    return null;
  }

  // Gate for free users — show after auth check resolves
  if (!loading && isAuthenticated && subStatus !== undefined && !subStatus.hasPaidAccess) {
    return (
      <ProGate
        fullPage
        headline="OUTREACH TRACKER"
        subtext="Track every email you send, monitor responses, generate follow ups, and analyze coach replies. Available on Pro."
        pricingNote="From $25/month · Cancel anytime"
      />
    );
  }

  return <OutreachPageInner />;
}

function OutreachPageInner() {
  const { openModal, closeModal } = useModal();
  const [selectedSchool, setSelectedSchool] = useState<{
    id: number;
    schoolId: string;
    schoolName: string | null;
    coachName: string | null;
    coachEmail: string | null;
    division: string | null;
    sport: string | null;
  } | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"school" | "coach" | "roster" | "email" | "links">("email");

  const { data: outreachList = [] } = trpc.outreach.list.useQuery();
  const { data: allSchoolsData = [] } = trpc.volleyball.schools.useQuery();
  const { data: athleteProfile } = trpc.athleteProfile.get.useQuery(undefined, { retry: false });
  const athleteGradYear = athleteProfile?.graduationYear || getStoredGradYear() || "";

  const handleSendReply = useCallback((schoolId: string, _subject: string, _body: string, _coachEmail: string | null) => {
    const school = outreachList.find((s) => s.schoolId === schoolId);
    if (school) {
      setModalInitialTab("email");
      setSelectedSchool({ ...school, coachEmail: null });
      openModal();
    }
  }, [outreachList, openModal]);

  const handleFollowUp = useCallback((schoolId: string) => {
    const school = outreachList.find((s) => s.schoolId === schoolId);
    if (school) {
      setModalInitialTab("email");
      setSelectedSchool({ ...school, coachEmail: null });
      openModal();
    }
  }, [outreachList, openModal]);

  return (
    <>
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", flexDirection: "column" }}>
        <div className="mx-auto pb-[100px] md:pb-8" style={{ maxWidth: 1080, paddingTop: "clamp(24px, 5vw, 56px)", paddingLeft: "clamp(16px, 4vw, 40px)", paddingRight: "clamp(16px, 4vw, 40px)", flex: 1 }}>

          {/* ── PAGE HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="mb-14"
          >
            <p className="section-label mb-1">Recruiting</p>
            <h1 className="page-title text-4xl md:text-5xl mb-2">Outreach</h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#94A3B8", lineHeight: 1.5 }}>
              Track your communication with every program.
            </p>
          </motion.div>

          {/* ── OUTREACH TRACKER ── */}
          <OutreachTracker
            onFollowUp={handleFollowUp}
            onSendReply={handleSendReply}
          />

        </div>

        <div style={{ marginTop: "auto" }}>
          <AppFooter />
        </div>
      </div>

      {/* ── SCHOOL DETAIL MODAL ── */}
      {selectedSchool && (() => {
        const dbSchool = allSchoolsData.find((s) => s.id === selectedSchool.schoolId);
        return (
          <SchoolDetailModal
            school={{
              id: selectedSchool.schoolId,
              school: dbSchool?.name || selectedSchool.schoolName || "Unknown",
              city: dbSchool?.city || "",
              state: dbSchool?.state || "",
              division: dbSchool?.division || selectedSchool.division || "",
              conference: dbSchool?.conference || "",
              sport: selectedSchool.sport || "Men's Volleyball",
              coachName: dbSchool?.coachName || selectedSchool.coachName || "TBD",
              coachTitle: dbSchool?.coachTitle || "Head Coach",
              coachEmail: dbSchool?.coachEmail || "",
              athleticsDomain: dbSchool?.athleticsDomain || "",
              brandColor: dbSchool?.brandColor || "#F5B800",
              hasRosterData: !!dbSchool?.hasRosterData,
              logoUrl: dbSchool?.logoUrl || null,
            }}
            onClose={() => { setSelectedSchool(null); closeModal(); }}
            isInOutreachList={true}
            onToggleOutreach={() => { closeModal(); }}
            athleteGradYear={athleteGradYear}
            initialTab={modalInitialTab}
          />
        );
      })()}
    </>
  );
}
