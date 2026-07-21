import { eq, and, sql, asc, inArray } from "drizzle-orm";
import { calculateRosterGap, normalizePositionMulti } from "../shared/rosterGapCalculator";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, outreachList, InsertOutreachEntry, schools, players, athleteProfiles, type InsertAthleteProfile, coaches, sentEmails, type InsertSentEmail, commits, waitlist } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Outreach List Helpers ───────────────────────────────────────────────────

export async function getUserOutreachCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachList)
    .where(eq(outreachList.userId, userId));

  return result[0]?.count ?? 0;
}

/**
 * Returns the lifetime total number of unique schools ever added by this user.
 * This counter is stored on the user record and is NEVER decremented on remove.
 * Used to enforce the free tier 5-school limit exploit-free.
 */
export async function getUserTotalSchoolsAdded(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ totalSchoolsAdded: users.totalSchoolsAdded })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0]?.totalSchoolsAdded ?? 0;
}

export async function getUserOutreachList(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(outreachList)
    .where(eq(outreachList.userId, userId))
    .orderBy(outreachList.createdAt);
}

export async function toggleOutreachStarred(userId: number, schoolId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current starred state
  const existing = await db
    .select({ starred: outreachList.starred })
    .from(outreachList)
    .where(and(eq(outreachList.userId, userId), eq(outreachList.schoolId, schoolId)))
    .limit(1);

  if (existing.length === 0) throw new Error("School not in outreach list");

  const newStarred = !existing[0].starred;
  await db
    .update(outreachList)
    .set({ starred: newStarred })
    .where(and(eq(outreachList.userId, userId), eq(outreachList.schoolId, schoolId)));

  return newStarred;
}

export async function addToOutreachList(entry: InsertOutreachEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already added
  const existing = await db
    .select()
    .from(outreachList)
    .where(
      and(
        eq(outreachList.userId, entry.userId),
        eq(outreachList.schoolId, entry.schoolId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(outreachList).values(entry);

  // Increment the lifetime counter on the user record.
  // This counter is NEVER decremented — it tracks unique schools ever added,
  // not the current active count, to prevent the add/remove exploit.
  await db
    .update(users)
    .set({ totalSchoolsAdded: sql`${users.totalSchoolsAdded} + 1` })
    .where(eq(users.id, entry.userId));

  const inserted = await db
    .select()
    .from(outreachList)
    .where(
      and(
        eq(outreachList.userId, entry.userId),
        eq(outreachList.schoolId, entry.schoolId)
      )
    )
    .limit(1);

  return inserted[0];
}

export async function removeFromOutreachList(userId: number, schoolId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(outreachList)
    .where(
      and(
        eq(outreachList.userId, userId),
        eq(outreachList.schoolId, schoolId)
      )
    );
}

// ─── Volleyball Schools & Players ───────────────────────────────────────────

const OWNER_EMAIL = 'georgeterp27@gmail.com';

/**
 * Returns all schools visible to the given user.
 * Test schools (isTestSchool = true) are only returned when callerEmail matches OWNER_EMAIL.
 * Sort: 1) test schools always last, 2) division priority, 3) popularity rank, 4) alphabetical.
 */
export async function getAllSchools(callerEmail?: string | null) {
  const db = await getDb();
  if (!db) return [];
  const isOwner = callerEmail === OWNER_EMAIL;
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      city: schools.city,
      state: schools.state,
      division: schools.division,
      conference: schools.conference,
      hasRosterData: schools.hasRosterData,
      brandColor: schools.brandColor,
      athleticsDomain: schools.athleticsDomain,
      logoUrl: schools.logoUrl,
      logoBackgroundColor: schools.logoBackgroundColor,
      logoMixBlendMode: schools.logoMixBlendMode,
      coachTitle: schools.coachTitle,
      coachEmail: schools.coachEmail,
      sortOrder: schools.sortOrder,
      isTestSchool: schools.isTestSchool,
      createdAt: schools.createdAt,
      // Pull head coach name from coaches table (lowest sortOrder = primary coach)
      coachName: sql<string | null>`(
        SELECT CONCAT(c.firstName, ' ', c.lastName)
        FROM coaches c
        WHERE c.schoolId = ${sql.raw('schools.id')}
        ORDER BY c.sortOrder ASC
        LIMIT 1
      )`,
    })
    .from(schools)
    // Non-owners never see test schools
    .where(isOwner ? undefined : eq(schools.isTestSchool, false))
    .orderBy(
      // Test schools always sort to the very bottom
      asc(schools.isTestSchool),
      sql`CASE ${schools.division} WHEN 'D1' THEN 1 WHEN 'D2' THEN 2 WHEN 'D3' THEN 3 WHEN 'NAIA' THEN 4 WHEN 'CC' THEN 5 ELSE 6 END`,
      asc(schools.sortOrder),
      asc(schools.name)
    );
  return rows;
}

export async function getSchoolById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
  return result[0];
}

export async function getPlayersForSchool(schoolId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(players)
    .where(eq(players.schoolId, schoolId))
    .orderBy(players.graduationYear, players.name);
}

/**
 * POSITION NORMALIZATION — maps all raw DB position strings to standard codes
 */
export function normalizePosition(raw: string | null | undefined): string {
  if (!raw) return "";
  const p = raw.trim().toLowerCase();
  if (["oh","outside hitter","outside","pin","wing"].includes(p)) return "OH";
  if (["mb","middle blocker","middle","mh"].includes(p)) return "MB";
  if (["opp","opposite","right side","rs"].includes(p)) return "OPP";
  if (["s","setter","set"].includes(p)) return "S";
  if (["l","libero","lib"].includes(p)) return "L";
  if (["ds","defensive specialist","def specialist"].includes(p)) return "DS";
  return raw.trim().toUpperCase();
}

/** Split combined positions like "OH/OPP" or "S/DS" into an array of normalized codes */
export function splitPositions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[\/,]/).map(p => normalizePosition(p.trim())).filter(Boolean);
}

/**
 * Parse the athlete's positions from their profile.
 * The positions field may be stored as:
 * - JSON array string: '["OH","S"]'
 * - Comma separated: "OH,S"
 * - Single value: "OH"
 * Returns an array of normalized position codes.
 */
export function parseAthletePositions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizePosition).filter(Boolean);
  } catch {}
  return raw.split(",").map(s => normalizePosition(s.trim())).filter(Boolean);
}

/**
 * Get unique graduating players for a school in a given grad year.
 * DEDUPLICATES by player name — if a player has multiple position rows
 * they only count as ONE graduating player.
 * Returns: { total, atPositions, playerNames, positionPlayerNames }
 */
export async function getGraduatingPlayersForSchool(
  schoolId: string,
  gradYear: number,
  athletePositions: string[] = []
): Promise<{
  total: number;
  atPositions: number;
  playerNames: string[];
  positionPlayerNames: string[];
}> {
  const db = await getDb();
  if (!db) return { total: 0, atPositions: 0, playerNames: [], positionPlayerNames: [] };

  // Get ALL players for this school graduating in the target year
  const rows = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.schoolId, schoolId),
        eq(players.graduationYear, gradYear)
      )
    );

  // Deduplicate by player name — one player can have multiple position rows
  const uniqueNames = new Set<string>();
  const positionNames = new Set<string>();

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    uniqueNames.add(name);

    // Check if this player's position matches any of the athlete's positions
    if (athletePositions.length > 0) {
      const normalizedRowPos = normalizePosition(row.position);
      if (athletePositions.includes(normalizedRowPos)) {
        positionNames.add(name);
      }
    }
  }

  return {
    total: uniqueNames.size,
    atPositions: athletePositions.length > 0 ? positionNames.size : uniqueNames.size,
    playerNames: Array.from(uniqueNames),
    positionPlayerNames: Array.from(positionNames),
  };
}

/**
 * Get opening counts for ALL schools at once, for a specific athlete.
 * Used on the dashboard and schools page to show opening badges.
 * DEDUPLICATES players by name before counting.
 */
export async function getOpeningCountsForAthlete(
  gradYear: number,
  athletePositions: string[]
): Promise<Record<string, { total: number; atPositions: number }>> {
  const db = await getDb();
  if (!db) return {};

  // Get all players graduating in the athlete's year
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.graduationYear, gradYear));

  // Group by school, deduplicate by name within each school
  const schoolMap: Record<string, { allNames: Set<string>; positionNames: Set<string> }> = {};

  for (const row of rows) {
    const schoolId = row.schoolId;
    const name = row.name?.trim();
    if (!schoolId || !name) continue;

    if (!schoolMap[schoolId]) {
      schoolMap[schoolId] = { allNames: new Set(), positionNames: new Set() };
    }

    schoolMap[schoolId].allNames.add(name);

    if (athletePositions.length > 0) {
      const normalizedPos = normalizePosition(row.position);
      if (athletePositions.includes(normalizedPos)) {
        schoolMap[schoolId].positionNames.add(name);
      }
    }
  }

  const result: Record<string, { total: number; atPositions: number }> = {};
  for (const [schoolId, data] of Object.entries(schoolMap)) {
    result[schoolId] = {
      total: data.allNames.size,
      atPositions: athletePositions.length > 0 ? data.positionNames.size : data.allNames.size,
    };
  }
  return result;
}

/**
 * Single source of truth for roster gap calculations on the server.
 * Fetches all players for all schools in one query, then delegates all math
 * to calculateRosterGap from shared/rosterGapCalculator.ts.
 *
 * @param userGradYear - The user's graduation year (e.g. "2027"). If empty/invalid, defaults to 2026.
 * @param userPositions - Array of position strings (full names or abbreviations). Empty = no position filter.
 */
export async function getSchoolOpeningsBatch(
  userGradYear: string | number | null | undefined,
  userPositions: string[] = []
): Promise<Record<string, { graduating: number; positionGraduating: number; commits: number; openings: number; positionOpenings: number }>> {
  const db = await getDb();
  if (!db) return {};

  const gradYear = parseInt(String(userGradYear || "2026"), 10);
  const resolvedGradYear = isNaN(gradYear) ? 2026 : gradYear;

  // Fetch ALL players (all schools) in one query
  const allRows = await db
    .select({
      schoolId: players.schoolId,
      position: players.position,
      graduationYear: players.graduationYear,
      name: players.name,
    })
    .from(players);

  // Group players by school
  const bySchool: Record<string, typeof allRows> = {};
  for (const row of allRows) {
    if (!row.schoolId) continue;
    if (!bySchool[row.schoolId]) bySchool[row.schoolId] = [];
    bySchool[row.schoolId].push(row);
  }

  // Run calculateRosterGap for each school
  const map: Record<string, { graduating: number; positionGraduating: number; commits: number; openings: number; positionOpenings: number }> = {};

  for (const [schoolId, schoolPlayers] of Object.entries(bySchool)) {
    // Map DB rows to PlayerRecord shape
    const playerRecords = schoolPlayers.map(p => ({
      player_name: p.name ?? undefined,
      position: p.position ?? undefined,
      graduation_year: p.graduationYear ?? undefined,
    }));
    const result = calculateRosterGap(playerRecords, resolvedGradYear, userPositions);
    if (result.totalGraduating > 0 || result.graduatingAtUserPosition > 0) {
      map[schoolId] = {
        graduating: result.totalGraduating,
        positionGraduating: result.graduatingAtUserPosition,
        commits: result.totalCommits,
        openings: result.totalOpenings,
        positionOpenings: result.openingsAtUserPosition,
      };
    }
  }

  return map;
}



// ─── Coaches ─────────────────────────────────────────────────────────────────

/** Returns all coaches for a school, ordered by sortOrder (head coaches first). */
export async function getCoachesBySchool(schoolId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(coaches)
    .where(eq(coaches.schoolId, schoolId))
    .orderBy(asc(coaches.sortOrder), asc(coaches.lastName));
}

// ─── Subscription Helpers ────────────────────────────────────────────────────

export async function updateUserPlan(
  userId: number,
  plan: "free" | "pro" | "elite",
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { plan };
  if (stripeCustomerId !== undefined) updateData.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = stripeSubscriptionId;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

// ─── Athlete Profile ─────────────────────────────────────────────────────────

/** Load the athlete profile for a user. Returns null if not yet created. */
export async function getAthleteProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

/** Upsert (insert or update) the athlete profile for a user. */
export async function saveAthleteProfile(
  userId: number,
  data: Omit<InsertAthleteProfile, "id" | "userId" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if row exists
  const existing = await getAthleteProfile(userId);
  if (existing) {
    await db.update(athleteProfiles).set(data).where(eq(athleteProfiles.userId, userId));
  } else {
    await db.insert(athleteProfiles).values({ userId, ...data });
  }
}

// ─── Sent Emails (Outreach Tracker) ──────────────────────────────────────────

/** Log a sent email to the sent_emails table. Returns the inserted row id. */
export async function logSentEmail(
  data: Omit<InsertSentEmail, "id" | "sentAt" | "status">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sentEmails).values({ ...data, status: "no_response" });
  return (result as any)[0]?.insertId ?? 0;
}

/** Get all sent emails for a user, grouped by school (most recent per school). */
export async function getOutreachTracker(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Return all sent emails for this user, ordered newest first
  const rows = await db
    .select()
    .from(sentEmails)
    .where(eq(sentEmails.userId, userId))
    .orderBy(sql`${sentEmails.sentAt} DESC`);
  return rows;
}

/** Get the most recent sent email per school for a user (for tracker rows). */
export async function getLatestEmailPerSchool(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Subquery: max sentAt per schoolId for this user
  const rows = await db
    .select()
    .from(sentEmails)
    .where(eq(sentEmails.userId, userId))
    .orderBy(sql`${sentEmails.sentAt} DESC`);

  // Deduplicate: keep only the most recent row per schoolId
  const seen = new Set<string>();
  const latest: typeof rows = [];
  for (const row of rows) {
    if (!seen.has(row.schoolId)) {
      seen.add(row.schoolId);
      latest.push(row);
    }
  }
  return latest;
}

/** Update the status field on the most recent sent email for a given school/user. */
export async function updateEmailStatus(userId: number, schoolId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Find the most recent email for this school
  const rows = await db
    .select({ id: sentEmails.id })
    .from(sentEmails)
    .where(and(eq(sentEmails.userId, userId), eq(sentEmails.schoolId, schoolId)))
    .orderBy(sql`${sentEmails.sentAt} DESC`)
    .limit(1);
  if (!rows[0]) return;
  await db.update(sentEmails).set({ status }).where(eq(sentEmails.id, rows[0].id));
}

/** Count total emails sent by a user. */
export async function getEmailsSentCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sentEmails)
    .where(eq(sentEmails.userId, userId));
  return Number(rows[0]?.count ?? 0);
}

/** Get set of schoolIds where the user has an active status (not no_response). */
export async function getActiveOutreachSchoolIds(userId: number): Promise<Set<string>> {
  const db = await getDb();
  if (!db) return new Set();
  const rows = await db
    .select({ schoolId: sentEmails.schoolId })
    .from(sentEmails)
    .where(
      and(
        eq(sentEmails.userId, userId),
        sql`${sentEmails.status} IN ('response_received','conversation_ongoing','visit_scheduled','offer_received')`
      )
    );
  return new Set(rows.map((r) => r.schoolId));
}

/** Get set of ALL schoolIds where the user has sent at least one email. */
export async function getSentSchoolIds(userId: number): Promise<Set<string>> {
  const db = await getDb();
  if (!db) return new Set();
  const rows = await db
    .select({ schoolId: sentEmails.schoolId })
    .from(sentEmails)
    .where(eq(sentEmails.userId, userId));
  return new Set(rows.map((r) => r.schoolId));
}

/** Get recruiting questionnaire URL and athletics website URL for a school. */
export async function getSchoolLinks(schoolId: string): Promise<{
  recruitingQuestionnaireUrl: string | null;
  athleticsWebsiteUrl: string | null;
}> {
  const db = await getDb();
  if (!db) return { recruitingQuestionnaireUrl: null, athleticsWebsiteUrl: null };
  const rows = await db
    .select({
      recruitingQuestionnaireUrl: schools.recruitingQuestionnaireUrl,
      athleticsWebsiteUrl: schools.athleticsWebsiteUrl,
    })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);
  if (!rows[0]) return { recruitingQuestionnaireUrl: null, athleticsWebsiteUrl: null };
  return {
    recruitingQuestionnaireUrl: rows[0].recruitingQuestionnaireUrl ?? null,
    athleticsWebsiteUrl: rows[0].athleticsWebsiteUrl ?? null,
  };
}


// ─── Sync hasRosterData flags ────────────────────────────────────────────────
/**
 * Syncs the hasRosterData boolean in the schools table based on whether
 * players actually exist for each school. Safe to run on every startup.
 */
export async function syncHasRosterDataFlags() {
  const db = await getDb();
  if (!db) return;

  // Get all schoolIds that have at least one player
  const schoolsWithPlayers = await db
    .selectDistinct({ schoolId: players.schoolId })
    .from(players);

  const schoolIdsWithData = new Set(schoolsWithPlayers.map(r => r.schoolId));

  // Get all schools
  const allSchools = await db.select({ id: schools.id }).from(schools);

  // Update all schools — set hasRosterData=true if they have players, false otherwise
  for (const school of allSchools) {
    await db
      .update(schools)
      .set({ hasRosterData: schoolIdsWithData.has(school.id) })
      .where(eq(schools.id, school.id));
  }

  console.log(`[syncHasRosterData] Updated ${schoolIdsWithData.size} schools to hasRosterData=true out of ${allSchools.length} total`);
}

/**
 * Returns a map of schoolId → count of UNIQUE graduating players for a specific year.
 * Uses exact year match. Deduplicates by player name.
 * One player = one roster spot regardless of positions played.
 */
/**
 * Returns a map of schoolId → { total, atPosition } for a specific grad year.
 * total = all unique graduating players
 * atPosition = unique graduating players at the athlete's positions
 */
export async function getOpeningCountsForAllSchools(
  gradYear: number,
  athletePositions: string[] = []
): Promise<Record<string, { total: number; atPosition: number }>> {
  const db = await getDb();
  if (!db) return {};

  const rows = await db
    .select({ schoolId: players.schoolId, name: players.name, position: players.position })
    .from(players)
    .where(eq(players.graduationYear, gradYear));

  const schoolMap: Record<string, { allNames: Set<string>; posNames: Set<string> }> = {};

  for (const row of rows) {
    if (!row.schoolId || !row.name) continue;
    if (!schoolMap[row.schoolId]) schoolMap[row.schoolId] = { allNames: new Set(), posNames: new Set() };
    const name = row.name.trim().toLowerCase();
    schoolMap[row.schoolId].allNames.add(name);

    if (athletePositions.length > 0 && row.position) {
      const playerPositions = row.position.split("/").map(p => p.trim().toUpperCase());
      if (playerPositions.some(p => athletePositions.includes(p))) {
        schoolMap[row.schoolId].posNames.add(name);
      }
    }
  }

  const result: Record<string, { total: number; atPosition: number }> = {};
  for (const [schoolId, data] of Object.entries(schoolMap)) {
    result[schoolId] = {
      total: data.allNames.size,
      atPosition: athletePositions.length > 0 ? data.posNames.size : data.allNames.size,
    };
  }
  return result;
}

/**
 * Returns graduating player details for one school at a specific year.
 * Deduplicates by name. Handles combo positions like OH/OPP.
 */
export async function getSchoolGapData(
  schoolId: string,
  gradYear: number,
  athletePositions: string[]
): Promise<{
  total: number;
  atPosition: number;
  graduatingNames: string[];
  positionGraduatingNames: string[];
}> {
  const db = await getDb();
  if (!db) return { total: 0, atPosition: 0, graduatingNames: [], positionGraduatingNames: [] };

  const rows = await db
    .select({ name: players.name, position: players.position })
    .from(players)
    .where(
      and(
        eq(players.schoolId, schoolId),
        eq(players.graduationYear, gradYear)
      )
    );

  // Deduplicate by name — one player = one roster spot
  const uniquePlayers = new Map<string, string | null>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!uniquePlayers.has(key)) uniquePlayers.set(key, row.position);
  }

  const graduatingNames: string[] = [];
  const positionGraduatingNames: string[] = [];

  for (const [key, position] of Array.from(uniquePlayers.entries())) {
    const originalName = rows.find(
      r => r.name?.trim().toLowerCase() === key
    )?.name?.trim() ?? key;
    graduatingNames.push(originalName);

    if (athletePositions.length > 0 && position) {
      const playerPositions = position.split("/").map((p: string) => p.trim().toUpperCase());
      if (playerPositions.some((p: string) => athletePositions.includes(p))) {
        positionGraduatingNames.push(originalName);
      }
    }
  }

  return {
    total: uniquePlayers.size,
    atPosition: athletePositions.length > 0
      ? positionGraduatingNames.length
      : uniquePlayers.size,
    graduatingNames,
    positionGraduatingNames,
  };
}

/** Returns all commits for a school, optionally filtered by grad year */
export async function getCommitsForSchool(schoolId: string, gradYear?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(commits.schoolId, schoolId)];
  if (gradYear) conditions.push(eq(commits.gradYear, gradYear));

  return db
    .select()
    .from(commits)
    .where(and(...conditions))
    .orderBy(commits.name);
}

/** Returns a map of schoolId → commit count for a specific grad year */
export async function getCommitCountsForAllSchools(gradYear: number): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};

  const rows = await db
    .select({ schoolId: commits.schoolId, count: sql<number>`COUNT(*)` })
    .from(commits)
    .where(eq(commits.gradYear, gradYear))
    .groupBy(commits.schoolId);

  const map: Record<string, number> = {};
  for (const row of rows) {
    if (row.schoolId) map[row.schoolId] = Number(row.count);
  }
  return map;
}

export async function addToWaitlist(email: string, source = "landing_page") {
  const db = await getDb();
  if (!db) return { success: false, error: "db_unavailable" };
  try {
    await db.insert(waitlist).values({ email: email.trim().toLowerCase(), source });
    return { success: true, alreadyExists: false };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return { success: true, alreadyExists: true };
    }
    return { success: false, error: "unknown" };
  }
}

export async function getWaitlistEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(waitlist).orderBy(waitlist.createdAt);
}
