export interface RosterPlayer {
  name: string;
  position: string;
  year: string;
}

export interface CommittedRecruit {
  name: string;
  position: string;
  enrollmentYear: number;
}

export interface RosterSchool {
  schoolName: string;
  sport: string;
  roster: RosterPlayer[];
  commits: CommittedRecruit[];
}

export interface RosterGapAnalysis {
  openings: number;
  commits: number;
  netOpenings: number;
  matchScore: number;
  reason: string;
}

export const rosterDatabase: RosterSchool[];

export function calculateRosterGap(
  schoolName: string,
  sport: string,
  position: string,
  graduationYear: number
): RosterGapAnalysis;
