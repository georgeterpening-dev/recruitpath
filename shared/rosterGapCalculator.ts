/**
 * rosterGapCalculator.ts
 *
 * THE SINGLE SOURCE OF TRUTH for all roster gap math.
 * No other file may calculate graduating counts, openings,
 * or position-specific gaps independently.
 */

export interface PlayerRecord {
  player_name?: string;
  playerName?: string;
  position?: string | null;
  graduation_year?: number | string | null;
  graduationYear?: number | string | null;
  [key: string]: unknown;
}

export interface RosterGapResult {
  /** Shown as GRADUATING stat block */
  totalGraduating: number;
  /** Shown as COMMITS FILLING stat block (always 0 until commit tracking is built) */
  totalCommits: number;
  /** Shown as REAL OPENINGS stat block */
  totalOpenings: number;
  /** Used for MY POSITION openings count on dashboard cards */
  graduatingAtUserPosition: number;
  /** Used for MY POSITION openings on dashboard cards */
  openingsAtUserPosition: number;
  /**
   * The EXACT array of player objects that are graduating.
   * Use this for red highlights in the roster view — guarantees
   * the count always matches what is visually highlighted.
   */
  graduatingPlayers: PlayerRecord[];
}

/**
 * Normalize a single position token to a canonical abbreviation.
 * Handles full names ("Outside Hitter"), abbreviations ("OH"),
 * and slash-separated combos ("OH/OPP") by splitting first.
 */
export function normalizePosition(pos: string | null | undefined): string {
  if (!pos) return "";
  const p = pos.toString().trim().toLowerCase();
  if (["oh", "outside hitter", "outside", "pin", "wing"].includes(p)) return "OH";
  if (["mb", "middle blocker", "middle", "mh"].includes(p)) return "MB";
  if (["opp", "opposite", "rs", "right side"].includes(p)) return "OPP";
  if (["s", "setter", "set"].includes(p)) return "S";
  if (["l", "libero", "lib"].includes(p)) return "L";
  if (["ds", "defensive specialist", "def specialist", "defensive"].includes(p)) return "DS";
  return pos.toString().trim().toUpperCase();
}

/**
 * Normalize a position string that may contain slash-separated values.
 * Returns an array of canonical abbreviations (e.g. "OH/OPP" → ["OH", "OPP"]).
 */
export function normalizePositionMulti(pos: string | null | undefined): string[] {
  if (!pos) return [];
  const parts = pos.split(/[/,]/).map((p) => p.trim());
  const result = new Set<string>();
  for (const part of parts) {
    const norm = normalizePosition(part);
    if (norm) result.add(norm);
  }
  return Array.from(result);
}

/**
 * Calculate the roster gap for ONE school.
 *
 * @param players       Array of player objects for ONE school from the database.
 *                      Each object must have graduation_year (or graduationYear) and position.
 * @param userGradYear  The athlete's graduation year as an integer (e.g. 2027).
 * @param userPositions Array of the athlete's positions (e.g. ["Libero", "Defensive Specialist"]).
 *                      Pass an empty array to skip position-specific calculations.
 */
export function calculateRosterGap(
  players: PlayerRecord[],
  userGradYear: number | string,
  userPositions: string[]
): RosterGapResult {
  // STEP 1: Normalize user's positions to canonical abbreviations
  const normalizedUserPositions = new Set<string>();
  for (const pos of userPositions) {
    for (const norm of normalizePositionMulti(pos)) {
      normalizedUserPositions.add(norm);
    }
  }

  // STEP 2: Parse userGradYear to integer
  const targetYear = parseInt(String(userGradYear), 10);

  // STEP 3: Filter players graduating in user's grad year ONLY (strict equality)
  const graduatingPlayers = players.filter((p) => {
    const rawYear = p.graduation_year ?? p.graduationYear;
    return parseInt(String(rawYear), 10) === targetYear;
  });

  // STEP 4: Total graduating count
  const totalGraduating = graduatingPlayers.length;

  // STEP 5: Position-specific graduating count
  // Count players whose normalized position matches ANY of the user's positions.
  // Handles slash-separated positions (e.g. "OH/OPP") correctly.
  const graduatingAtUserPosition =
    normalizedUserPositions.size === 0
      ? 0
      : graduatingPlayers.filter((p) => {
          const playerNorms = normalizePositionMulti(p.position as string | null | undefined);
          return playerNorms.some((n) => normalizedUserPositions.has(n));
        }).length;

  // STEP 6: Commits (hardcoded as 0 until commit tracking is built)
  const totalCommits = 0;
  const commitsAtUserPosition = 0;

  // STEP 7: Calculate openings — never go below 0
  const totalOpenings = Math.max(0, totalGraduating - totalCommits);
  const openingsAtUserPosition = Math.max(0, graduatingAtUserPosition - commitsAtUserPosition);

  return {
    totalGraduating,
    totalCommits,
    totalOpenings,
    graduatingAtUserPosition,
    openingsAtUserPosition,
    graduatingPlayers,
  };
}
