import { eq, and, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, outreachList, InsertOutreachEntry, schools, players, athleteProfiles, type InsertAthleteProfile, coaches, sentEmails, type InsertSentEmail } from "../drizzle/schema";
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

/** Returns a map of schoolId → number of graduating players (graduationYear <= 2026) for all schools */
export async function getOpeningCountsForAllSchools(): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db
    .select({
      schoolId: players.schoolId,
      count: sql<number>`COUNT(*)`,
    })
    .from(players)
    .where(sql`${players.graduationYear} <= 2026`)
    .groupBy(players.schoolId);
  const map: Record<string, number> = {};
  for (const row of rows) {
    if (row.schoolId) map[row.schoolId] = Number(row.count);
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
