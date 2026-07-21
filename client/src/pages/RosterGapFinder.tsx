import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { calculateRosterGap, rosterDatabase } from "@shared/rosterData";
import { SCHOOL_DATABASE } from "@/data/schoolDatabase";


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
    if (score >= 60) return "text-green-400";
    if (score >= 30) return "text-yellow-400";
    return "text-red-400";
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 60) return "border-green-400";
    if (score >= 30) return "border-yellow-400";
    return "border-red-400";
  };

  const visibleResults = isPro ? results : results.slice(0, 3);
  const hasMoreResults = !isPro && results.length > 3;

  return (
    <>
    <div className="min-h-screen bg-[#0A0E1A] text-white py-12 px-6 pb-[100px] md:pb-8" style={{ paddingTop: "24px" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl mb-2" style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.05em" }}>
            ROSTER GAP FINDER
          </h1>
          <p className="text-gray-400 text-lg mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Find programs that actually have room for you
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto" style={{ fontFamily: "DM Sans, sans-serif" }}>
            This tool analyzes graduating seniors and committed recruits to show real openings at each program. Discover where you can make an impact.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-[#1a1f2e] border border-[#2a3142] p-8 mb-12 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Sport Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                SPORT
              </label>
              <select
                value={sport}
                onChange={(e) => {
                  setSport(e.target.value as Sport);
                  setPosition(POSITION_OPTIONS[e.target.value as Sport][0]);
                }}
                className="w-full bg-[#0A0E1A] border border-[#2a3142] text-white px-4 py-2 text-sm"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                <option value="Men's Basketball">Men's Basketball</option>
                <option value="Men's Volleyball">Men's Volleyball</option>
              </select>
            </div>

            {/* Position Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                POSITION
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full bg-[#0A0E1A] border border-[#2a3142] text-white px-4 py-2 text-sm"
                style={{ fontFamily: "DM Sans, sans-serif" }}
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
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                GRADUATION YEAR
              </label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                className="w-full bg-[#0A0E1A] border border-[#2a3142] text-white px-4 py-2 text-sm"
                style={{ fontFamily: "DM Sans, sans-serif" }}
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
            className="w-full bg-[#F5B800] text-[#0A0E1A] font-bold py-3 text-sm tracking-widest uppercase"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            FIND MY OPPORTUNITIES
          </button>
        </form>

        {/* Results */}
        {submitted && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="font-display text-3xl mb-4" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                  NO DATA AVAILABLE FOR THIS POSITION YET
                </h2>
                <p className="text-gray-400" style={{ fontFamily: "DM Sans, sans-serif" }}>
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
                        className={`bg-[#1a1f2e] border border-[#2a3142] p-6 flex flex-col ${getMatchScoreBg(result.matchScore)}`}
                      >
                        {/* School Name */}
                        <h3 className="font-display text-xl mb-4" style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.05em" }}>
                          {result.schoolName}
                        </h3>

                        {/* Match Score */}
                        <div className="mb-4">
                          <p className={`font-display text-4xl font-bold ${getMatchScoreColor(result.matchScore)}`} style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                            {result.matchScore}%
                          </p>
                          <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                            MATCH SCORE
                          </p>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-gray-300 mb-4 flex-grow" style={{ fontFamily: "DM Sans, sans-serif" }}>
                          {result.reason}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>
                              REAL OPENINGS
                            </p>
                            <p className="font-bold text-lg" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                              {result.netOpenings}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>
                              COMMITS FILLING SPOTS
                            </p>
                            <p className="font-bold text-lg" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                              {result.commits}
                            </p>
                          </div>
                        </div>

                        {/* Coach Info Button */}
                        {coach && coach.email && (
                          <button
                            onClick={() => setSelectedSchool(result.schoolName)}
                            className="bg-[#F5B800] text-[#0A0E1A] font-bold py-2 text-xs tracking-widest uppercase w-full"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
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
                        <div key={result.schoolName} className="bg-[#1a1f2e] border border-[#2a3142] p-6 h-64"></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center">
                        <p className="text-white font-bold mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>
                          UPGRADE TO PRO TO SEE ALL OPPORTUNITIES
                        </p>
                        <Link href="/pricing">
                          <button className="bg-[#F5B800] text-[#0A0E1A] font-bold py-2 px-6 text-sm tracking-widest uppercase">
                            UPGRADE TO PRO — FROM $25/MO →
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
          <DialogContent className="bg-[#1a1f2e] border border-[#2a3142] text-white">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.05em" }}>
                {selectedSchool.toUpperCase()} — COACH CONTACT
              </DialogTitle>
            </DialogHeader>
            {getCoachInfo(selectedSchool) && (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    COACH NAME
                  </p>
                  <p className="font-bold text-lg" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                    {getCoachInfo(selectedSchool)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    TITLE
                  </p>
                  <p className="text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    {getCoachInfo(selectedSchool)?.title}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    EMAIL
                  </p>
                  <a
                    href={`mailto:${getCoachInfo(selectedSchool)?.email}`}
                    className="text-[#F5B800] hover:underline break-all"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
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
