import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),

  /** Subscription plan: free | pro | elite — kept for backward compat; use hasPaidAccess for gating */
  plan: mysqlEnum("plan", ["free", "pro", "elite"]).default("free").notNull(),
  /** One-time purchase: true = user has paid $49.99 for Full Access */
  hasPaidAccess: boolean("hasPaidAccess").default(false).notNull(),
  /** Pro Suite interest: true = user wants to be notified when Pro launches */
  interestedInPro: boolean("interestedInPro").default(false).notNull(),
  /** Stripe Customer ID — links this user to their Stripe customer record */
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  /** Stripe Subscription ID — kept for compat; not used for one-time payments */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  /** Stripe Payment Intent ID — for the one-time $49.99 purchase */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /**
   * Subscription billing period: 'monthly' ($25/mo), 'annual' ($220/yr),
   * or 'grandfathered' (legacy one-time $49.99 buyers who keep full access forever).
   * null = free tier.
   */
  subscriptionType: mysqlEnum("subscriptionType", ["monthly", "annual", "grandfathered"]),
  /**
   * Stripe subscription lifecycle status.
   * 'active' = currently paying, 'cancelled' = cancelled, 'past_due' = payment failed.
   * null = free tier or grandfathered (no subscription to track).
   */
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "cancelling", "cancelled", "past_due"]),

  /**
   * Lifetime counter of unique schools ever added to this user's outreach list.
   * Incremented on every addSchool call; NEVER decremented on remove.
   * Used to enforce the 5-school free tier limit so users cannot exploit
   * the limit by removing and re-adding different schools.
   */
  totalSchoolsAdded: int("totalSchoolsAdded").default(0).notNull(),

  // ─── Gmail OAuth ─────────────────────────────────────────────────────────────
  /** AES-256-GCM encrypted Gmail access token */
  gmailAccessToken: text("gmailAccessToken"),
  /** AES-256-GCM encrypted Gmail refresh token */
  gmailRefreshToken: text("gmailRefreshToken"),
  /** The Gmail address the user connected (e.g. athlete@gmail.com) */
  gmailConnectedEmail: varchar("gmailConnectedEmail", { length: 320 }),
  /** When the Gmail account was connected */
  gmailConnectedAt: timestamp("gmailConnectedAt"),
  /** Total emails sent through the app via Gmail */
  emailsSent: int("emailsSent").default(0).notNull(),

  /** Whether the user has seen the one-time welcome/onboarding overlay */
  hasSeenWelcome: boolean("hasSeenWelcome").default(false).notNull(),

  /** Whether the user has completed the required onboarding wizard */
  hasCompletedOnboarding: boolean("hasCompletedOnboarding").default(false).notNull(),

  /** Whether the user has seen the first-time app walkthrough overlay */
  hasSeenWalkthrough: boolean("hasSeenWalkthrough").default(false).notNull(),

  /** Whether this account was created via Google Sign-In (vs Manus OAuth) */
  googleAuthUser: boolean("googleAuthUser").default(false).notNull(),
  /** Google OAuth sub (unique ID from Google) — used to match returning Google users */
  googleId: varchar("googleId", { length: 255 }),

  /** bcrypt hash of the user's password — null for Google-only accounts */
  passwordHash: varchar("passwordHash", { length: 255 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Outreach list — tracks which schools a user has added to their target list.
 * Free users are limited to 5 entries; Pro/Elite users have unlimited.
 */
export const outreachList = mysqlTable("outreach_list", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  schoolId: varchar("schoolId", { length: 64 }).notNull(),
  schoolName: text("schoolName"),
  coachName: text("coachName"),
  sport: text("sport"),
  division: varchar("division", { length: 16 }),
  /** Whether the user has starred this school — starred schools appear at the top of the TARGET SCHOOLS list */
  starred: boolean("starred").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OutreachEntry = typeof outreachList.$inferSelect;
export type InsertOutreachEntry = typeof outreachList.$inferInsert;

/**
 * Volleyball schools — the 22 CSV schools + 8 locked schools.
 * hasRosterData = true for the 22 CSV schools, false for the 8 locked ones.
 */
export const schools = mysqlTable("schools", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  state: varchar("state", { length: 8 }),
  division: varchar("division", { length: 16 }),
  conference: varchar("conference", { length: 64 }),
  hasRosterData: boolean("hasRosterData").default(false).notNull(),
  brandColor: varchar("brandColor", { length: 16 }),
  logoBackgroundColor: varchar("logoBackgroundColor", { length: 16 }),
  logoMixBlendMode: varchar("logoMixBlendMode", { length: 32 }),
  athleticsDomain: text("athleticsDomain"),
  logoUrl: text("logoUrl"),
  coachName: text("coachName"),
  coachTitle: text("coachTitle"),
  coachEmail: text("coachEmail"),
  /** Popularity rank within division — lower = more prominent. Default 999 = unranked. */
  sortOrder: int("sortOrder").default(999).notNull(),
  /** Recruiting questionnaire URL — direct link to the coaching staff's recruiting form. */
  recruitingQuestionnaireUrl: text("recruitingQuestionnaireUrl"),
  /** Athletics website URL — official school athletics landing page for this sport. */
  athleticsWebsiteUrl: text("athleticsWebsiteUrl"),
  /** Dev-only flag — when true this school is only visible to the owner account (georgeterp27@gmail.com). */
  isTestSchool: boolean("isTestSchool").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

/**
 * Volleyball players — 431 players seeded from CSV, mapped to schools.
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: varchar("schoolId", { length: 64 }).notNull(),
  name: text("name").notNull(),
  position: varchar("position", { length: 32 }),
  year: varchar("year", { length: 32 }),
  graduationYear: int("graduationYear"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Athlete profile — one row per user, stores all recruiting profile fields.
 * userId references users.id (not a FK constraint to avoid migration complexity).
 */
export const athleteProfiles = mysqlTable("athlete_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  city: text("city"),
  state: varchar("state", { length: 8 }),
  zipCode: varchar("zipCode", { length: 16 }),
  graduationYear: varchar("graduationYear", { length: 8 }),
  gpa: varchar("gpa", { length: 8 }),
  satScore: varchar("satScore", { length: 8 }),
  actScore: varchar("actScore", { length: 8 }),
  intendedMajor: text("intendedMajor"),
  primarySport: text("primarySport"),
  positions: text("positions"),
  jerseyNumber: varchar("jerseyNumber", { length: 8 }),
  height: varchar("height", { length: 16 }),
  weight: varchar("weight", { length: 16 }),
  keyStats: text("keyStats"),
  awards: text("awards"),
  highlightFilmUrl: text("highlightFilmUrl"),
  secondaryVideoUrl: text("secondaryVideoUrl"),
  profilePhoto: text("profilePhoto"),
  actionPhoto: text("actionPhoto"),
  twitterHandle: varchar("twitterHandle", { length: 64 }),
  instagramHandle: varchar("instagramHandle", { length: 64 }),
  clubTeam: text("clubTeam"),
  verticalJump: varchar("verticalJump", { length: 16 }),
  approachJump: varchar("approachJump", { length: 16 }),
  ncsaUrl: text("ncsaUrl"),
  hudlUrl: text("hudlUrl"),
  highSchool: text("highSchool"),
  /** Date of birth collected during onboarding (stored as YYYY-MM-DD string) */
  dateOfBirth: varchar("dateOfBirth", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AthleteProfileRow = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = typeof athleteProfiles.$inferInsert;

/**
 * Coaches — one row per coach per school.
 * Multiple coaches can be associated with a single school.
 * sortOrder: 0 = primary head coach, higher numbers = assistants.
 */
export const coaches = mysqlTable("coaches", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: varchar("schoolId", { length: 64 }).notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  position: text("position").notNull(),
  email: text("email"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = typeof coaches.$inferInsert;

/**
 * Sent emails — one row per email sent through the app.
 * Used to power the Outreach Tracker on the dashboard.
 */
export const sentEmails = mysqlTable("sent_emails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  schoolId: varchar("schoolId", { length: 64 }).notNull(),
  schoolName: text("schoolName").notNull(),
  coachName: text("coachName"),
  coachEmail: varchar("coachEmail", { length: 320 }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  /** Outreach status — updated by the user in the tracker dropdown */
  status: varchar("status", { length: 32 }).default("no_response").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type SentEmail = typeof sentEmails.$inferSelect;
export type InsertSentEmail = typeof sentEmails.$inferInsert;

// ─── Affiliate Program ───────────────────────────────────────────────────────

/**
 * Affiliate applications — submitted via the public /affiliates page.
 */
export const affiliateApplications = mysqlTable("affiliateApplications", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  graduationYear: varchar("graduationYear", { length: 4 }).notNull(),
  position: varchar("position", { length: 64 }).notNull(),
  highSchool: varchar("highSchool", { length: 255 }).notNull(),
  clubTeam: varchar("clubTeam", { length: 255 }).notNull(),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  whyJoin: text("whyJoin").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
});
export type AffiliateApplication = typeof affiliateApplications.$inferSelect;
export type InsertAffiliateApplication = typeof affiliateApplications.$inferInsert;

/**
 * Approved affiliates — created when an application is approved.
 */
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  couponCode: varchar("couponCode", { length: 20 }).notNull().unique(),
  discountPercent: int("discountPercent").default(15).notNull(),
  commissionMonthly: decimal("commissionMonthly", { precision: 8, scale: 2 }).default("3.00").notNull(),
  commissionAnnual: decimal("commissionAnnual", { precision: 8, scale: 2 }).default("5.00").notNull(),
  totalConversions: int("totalConversions").default(0).notNull(),
  totalEarned: decimal("totalEarned", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalPaid: decimal("totalPaid", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

/**
 * Affiliate conversions — one row per subscription attributed to an affiliate.
 */
export const affiliateConversions = mysqlTable("affiliateConversions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  couponCode: varchar("couponCode", { length: 20 }).notNull(),
  convertedUserEmail: varchar("convertedUserEmail", { length: 320 }).notNull(),
  subscriptionType: mysqlEnum("subscriptionType", ["monthly", "annual"]).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 8, scale: 2 }).notNull(),
  paid: boolean("paid").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type InsertAffiliateConversion = typeof affiliateConversions.$inferInsert;

/**
 * Verified recruiting commits — sourced from MiddleHitter.com
 * One row per committed recruit. gradYear is the athlete's class year.
 */
export const commits = mysqlTable("commits", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: varchar("schoolId", { length: 64 }).notNull(),
  name: text("name").notNull(),
  position: varchar("position", { length: 32 }),
  club: text("club"),
  highSchool: text("highSchool"),
  gradYear: int("gradYear").default(2026).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Commit = typeof commits.$inferSelect;
export type InsertCommit = typeof commits.$inferInsert;

/**
 * Waitlist — emails collected from the landing page before/during launch.
 * Used to send founding member discount codes.
 */
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).default("landing_page"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
