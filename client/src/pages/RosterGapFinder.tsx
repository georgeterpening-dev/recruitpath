import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { calculateRosterGap, rosterDatabase } from "@shared/rosterData";
import { SCHOOL_DATABASE } from "@/data/schoolDatabase";
import AppTopNav from "@/components/AppTopNav";

type Sport = "Men's Basketball" | "Men's Volleyball";
type Position = "Guard" | "Forward" | "Center" | "Outside Hitter" | "Middle Blocker" | "Setter" | "Opposite" | "Libero" | "Defensive Specialist";

const POSITION_OPTIONS: Record<Sport, Position[]> = {
  "Men's Basketball": ["Guard", "Forward", "Center"],
  "Men's Volleyball": ["Outside Hitter", "Middle Blocker", "Setter", "Opposite", "Libero", "Defensive Specialist"],
};

interface GapResult {
  schoolName: string;
  sport: Sport;
  openings: number;
  commits: number;
  netOpenings: number;
  matchScore: number;
  reason: string;
}

export default function RosterGapFinder() {
  const { user } = useAuth();
  const [sport, setSport] = useState<Sport>("Men's Basketball");
  const [position, setPosition] = useState<Position>("Guard");
  const [graduationYear, setGraduationYear] = useState<number>(2026);
  const [results, setResults] = useState<GapResult[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, { enabled: !!user });
  const isPro = subStatus?.hasPaidAccess ?? false;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter schools by sport and calculate gaps
    const gapResults = rosterDatabase
      .filter((school: any) => school.sport === sport)
      .map((school: any) => {
        const gap = calculateRosterGap(school.schoolName, sport, position, graduationYear);
        return {
          schoolName: school.schoolName,
          sport: school.sport as Sport,
          ...gap,
        };
      })
      .sort((a: GapResult, b: GapResult) => b.matchScore - a.matchScore);

    setResults(gapResults);
    setSubmitted(true);
  };

  const getCoachInfo = (schoolName: string) => {
    const school = SCHOOL_DATABASE.find((s) => s.school === schoolName && s.sport === sport);
    if (!school) return null;
    return {
      name: school?.coachName || "",
      title: school?.coachTitle || "",
      email: school?.coachEmail || "",
    };
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 60) return "text-[#F5C518]";
    if (score >= 30) return "text-[#C8D4E8]";
    return "text-[#8B9BB8]";
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 60) return "border-[#F5C518]";
    if (score >= 30) return "border-[#1E2A42]";
    return "border-[#1E2A42]";
  };

  const visibleResults = isPro ? results : results.slice(0, 3);
  const hasMoreResults = !isPro && results.length > 3;

  return (
    <>
    <AppTopNav />
    <div className="min-h-screen bg-[#090D18] text-white py-12 px-6 pb-8" style={{ paddingTop: "68px" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl mb-2" style={{ fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.05em" }}>
            ROSTER GAP FINDER
          </h1>
          <p className="text-[#8B9BB8] text-lg mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Find programs that actually have room for you
          </p>
          <p className="text-[#4A5570] max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
            This tool analyzes graduating seniors and committed recruits to show real openings at each program. Discover where you can make an impact.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-[#131829] border border-[#1E2A42] p-8 mb-12 max-w-2xl mx-auto" style={{ borderRadius: "12px" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Sport Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                SPORT
              </label>
              <select
                value={sport}
                onChange={(e) => {
                  setSport(e.target.value as Sport);
                  setPosition(POSITION_OPTIONS[e.target.value as Sport][0]);
                }}
                className="w-full bg-[#090D18] border border-[#1E2A42] text-white px-4 py-2 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <option value="Men's Basketball">Men's Basketball</option>
                <option value="Men's Volleyball">Men's Volleyball</option>
              </select>
            </div>

            {/* Position Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                POSITION
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full bg-[#090D18] border border-[#1E2A42] text-white px-4 py-2 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {POSITION_OPTIONS[sport].map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Graduation Year Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                GRADUATION YEAR
              </label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                className="w-full bg-[#090D18] border border-[#1E2A42] text-white px-4 py-2 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full bg-[#F5C518] text-[#090D18] font-bold py-3 text-sm tracking-widest uppercase"
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
            }}
          >
            FIND MY OPPORTUNITIES
          </button>
        </form>

        {/* Results */}
        {submitted && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="font-display text-3xl mb-4" style={{ fontFamily: "Barlow Condensed, sans-serif" }}>
                  NO DATA AVAILABLE FOR THIS POSITION YET
                </h2>
                <p className="text-[#8B9BB8]" style={{ fontFamily: "Inter, sans-serif" }}>
                  More sports and positions coming soon. Check back later!
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {visibleResults.map((result) => {
                    const coach = getCoachInfo(result.schoolName);
                    return (
                      <div
                        key={result.schoolName}
                        className={`bg-[#131829] border border-[#1E2A42] p-6 flex flex-col ${getMatchScoreBg(result.matchScore)}`}
                        style={{ borderRadius: "12px" }}
                      >
                        {/* School Name */}
                        <h3 className="font-display text-xl mb-4" style={{ fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.05em" }}>
                          {result.schoolName}
                        </h3>

                        {/* Match Score */}
                        <div className="mb-4">
                          <p className={`font-display text-4xl font-bold ${getMatchScoreColor(result.matchScore)}`} style={{ fontFamily: "Barlow Condensed, sans-serif" }}>
                            {result.matchScore}%
                          </p>
                          <p className="text-xs text-[#8B9BB8] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                            MATCH SCORE
                          </p>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-[#F0F4FF] mb-4 flex-grow" style={{ fontFamily: "Inter, sans-serif" }}>
                          {result.reason}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                          <div>
                            <p className="text-[#8B9BB8] text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                              REAL OPENINGS
                            </p>
                            <p className="font-bold text-lg" style={{ fontFamily: "Barlow Condensed, sans-serif" }}>
                              {result.netOpenings}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#8B9BB8] text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                              COMMITS FILLING SPOTS
                            </p>
                            <p className="font-bold text-lg" style={{ fontFamily: "Barlow Condensed, sans-serif" }}>
                              {result.commits}
                            </p>
                          </div>
                        </div>

                        {/* Coach Info Button */}
                        {coach && coach.email && (
                          <button
                            onClick={() => setSelectedSchool(result.schoolName)}
                            className="bg-[#F5C518] text-[#090D18] font-bold py-2 text-xs tracking-widest uppercase w-full"
                            style={{
                              fontFamily: "Barlow Condensed, sans-serif",
                              borderRadius: "8px",
                              boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                            }}
                          >
                            VIEW COACH INFO
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pro Gate Overlay */}
                {hasMoreResults && (
                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 pointer-events-none">
                      {results.slice(3).map((result) => (
                        <div key={result.schoolName} className="bg-[#131829] border border-[#1E2A42] p-6 h-64" style={{ borderRadius: "12px" }}></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center">
                        <p className="text-white font-bold mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                          GET FULL ACCESS TO SEE ALL OPPORTUNITIES
                        </p>
                        <Link href="/pricing">
                          <button
                            className="bg-[#F5C518] text-[#090D18] font-bold py-2 px-6 text-sm tracking-widest uppercase"
                            style={{
                              fontFamily: "Barlow Condensed, sans-serif",
                              borderRadius: "8px",
                              boxShadow: "0 4px 20px rgba(245,197,24,0.32)",
                            }}
                          >
                            GET FULL ACCESS — $49.99 →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Coach Info Modal */}
      {selectedSchool && (
        <Dialog open={!!selectedSchool} onOpenChange={() => setSelectedSchool(null)}>
          <DialogContent className="bg-[#131829] border border-[#1E2A42] text-white">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.05em" }}>
                {selectedSchool.toUpperCase()} — COACH CONTACT
              </DialogTitle>
            </DialogHeader>
            {getCoachInfo(selectedSchool) && (
              <div className="space-y-4">
                <div>
                  <p className="text-[#8B9BB8] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                    COACH NAME
                  </p>
                  <p className="font-bold text-lg" style={{ fontFamily: "Barlow Condensed, sans-serif" }}>
                    {getCoachInfo(selectedSchool)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[#8B9BB8] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                    TITLE
                  </p>
                  <p className="text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    {getCoachInfo(selectedSchool)?.title}
                  </p>
                </div>
                <div>
                  <p className="text-[#8B9BB8] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                    EMAIL
                  </p>
                  <a
                    href={`mailto:${getCoachInfo(selectedSchool)?.email}`}
                    className="text-[#F5C518] hover:underline break-all"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {getCoachInfo(selectedSchool)?.email}
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
    </>
  );
}
