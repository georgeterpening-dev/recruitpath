import { COOKIE_NAME } from "../shared/const";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getStripe } from "./stripe/client";
import { PRO_MONTHLY_PRICE_ID, PRO_ANNUAL_PRICE_ID, getSchoolsLimit, hasProAccess } from "./stripe/products";
import {
  getUserOutreachCount,
  getUserTotalSchoolsAdded,
  getUserOutreachList,
  addToOutreachList,
  removeFromOutreachList,
  updateUserPlan,
  getAllSchools,
  getSchoolById,
  getPlayersForSchool,
  getSchoolOpeningsBatch,
  getAthleteProfile,
  parseAthletePositions,
  getGraduatingPlayersForSchool,
  getOpeningCountsForAthlete,
  normalizePosition,
  splitPositions,
  getOpeningCountsForAllSchools,
  getSchoolGapData,
  saveAthleteProfile,
  getCoachesBySchool,
  getSchoolLinks,
  logSentEmail,
  getLatestEmailPerSchool,
  updateEmailStatus,
  getEmailsSentCount,
  getActiveOutreachSchoolIds,
  getSentSchoolIds,
  toggleOutreachStarred,
  getCommitsForSchool,
  getCommitCountsForAllSchools,
  addToWaitlist,
  getWaitlistEntries,
} from "./db";
import { getDb } from "./db";
import { users, players, schools } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendPurchaseConfirmationEmail } from "./email";
import { affiliateRouter } from "./affiliate";

export const appRouter = router({
  system: systemRouter,
  affiliate: affiliateRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    /** Mark the welcome overlay as seen — called when user dismisses or clicks through it */
    dismissWelcome: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      await db!.update(users).set({ hasSeenWelcome: true }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
    /** Mark the walkthrough as seen — called when user completes or skips it */
    completeWalkthrough: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      await db!.update(users).set({ hasSeenWalkthrough: true }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
    /** Reset the walkthrough so it shows again — called from Settings replay link */
    resetWalkthrough: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      await db!.update(users).set({ hasSeenWalkthrough: false }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ─── Subscription & Stripe ──────────────────────────────────────────────────
  subscription: router({
    /** Get current user's access status */
    status: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const subscriptionType = user.subscriptionType ?? null;
      const subscriptionStatus = user.subscriptionStatus ?? null;
      const hasPaidAccess = hasProAccess(user.hasPaidAccess ?? false, subscriptionType, subscriptionStatus);
      const schoolsUsed = await getUserOutreachCount(user.id);
      const schoolsLimit = getSchoolsLimit(hasPaidAccess);
      // Lifetime counter: how many unique schools the user has ever added
      const totalSchoolsAdded = await getUserTotalSchoolsAdded(user.id);

      return {
        hasPaidAccess,
        interestedInPro: user.interestedInPro ?? false,
        // Legacy fields kept for backward compat
        plan: hasPaidAccess ? "pro" : "free",
        subscriptionType,
        subscriptionStatus,
        schoolsUsed,
        schoolsLimit: schoolsLimit === Infinity ? -1 : schoolsLimit, // -1 = unlimited
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId ?? null,
        /** Lifetime total of unique schools ever added — used for Settings display */
        totalSchoolsAdded,
      };
    }),

    /** Create a Stripe Checkout Session for a Pro subscription (monthly or annual) */
    createCheckout: protectedProcedure
      .input(z.object({ billingPeriod: z.enum(["monthly", "annual"]), affiliateCode: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const stripe = getStripe();
        const origin = ctx.req.headers.origin || "http://localhost:3000";

        const priceId = input.billingPeriod === "annual" ? PRO_ANNUAL_PRICE_ID : PRO_MONTHLY_PRICE_ID;

        if (!priceId) {
          throw new Error(`Stripe price ID for ${input.billingPeriod} plan is not configured. Contact support.`);
        }

        // Build base metadata
        const baseMetadata: Record<string, string> = {
          user_id: ctx.user.id.toString(),
          billing_period: input.billingPeriod,
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        };

        // Determine if we should apply an affiliate discount
        let discounts: { promotion_code: string }[] | undefined;
        let useAllowPromoCodes = true;

        if (input.affiliateCode) {
          try {
            const { affiliates: affiliatesTable } = await import("../drizzle/schema");
            const { eq: eqOp } = await import("drizzle-orm");
            const db = await getDb();
            if (db) {
              const affiliateRows = await db
                .select()
                .from(affiliatesTable)
                .where(eqOp(affiliatesTable.couponCode, input.affiliateCode.toUpperCase()))
                .limit(1);
              if (affiliateRows.length > 0 && affiliateRows[0].status === "active") {
                const promoCodes = await stripe.promotionCodes.list({ code: input.affiliateCode.toUpperCase(), limit: 1 });
                if (promoCodes.data.length > 0 && promoCodes.data[0].active) {
                  discounts = [{ promotion_code: promoCodes.data[0].id }];
                  useAllowPromoCodes = false; // cannot combine allow_promotion_codes with discounts
                  baseMetadata.affiliateCode = input.affiliateCode.toUpperCase();
                  console.log(`[checkout] Applied affiliate discount for code: ${input.affiliateCode}`);
                }
              }
            }
          } catch (affiliateErr: any) {
            console.warn("[checkout] Affiliate code lookup failed, proceeding without discount:", affiliateErr.message);
          }
        }

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          client_reference_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || undefined,
          metadata: baseMetadata,
          ...(discounts ? { discounts } : { allow_promotion_codes: useAllowPromoCodes }),
          success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${input.billingPeriod}`,
          cancel_url: `${origin}/pricing?upgrade=canceled`,
        });

        return { sessionUrl: session.url };
      }),

    /** Verify a Stripe Checkout Session and activate Pro subscription */
    verifySession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const stripe = getStripe();

        try {
          const session = await stripe.checkout.sessions.retrieve(input.sessionId);

          if (session.metadata?.user_id !== ctx.user.id.toString()) {
            throw new Error("Session does not belong to this user");
          }

          if (session.payment_status !== "paid") {
            return { activated: false, message: "Payment not yet completed" };
          }

          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const billingPeriod = (session.metadata?.billing_period ?? "monthly") as "monthly" | "annual";

          const db = await getDb();
          if (db) {
            await db
              .update(users)
              .set({
                hasPaidAccess: true,
                plan: "pro",
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionType: billingPeriod,
                subscriptionStatus: "active",
              })
              .where(eq(users.id, ctx.user.id));
          }

          console.log(`[verifySession] User ${ctx.user.id} activated Pro (${billingPeriod})`);

          // Send confirmation email (fire-and-forget — don't block the response)
          if (ctx.user.email) {
            const origin = ctx.req.headers.origin || "https://recruitpath.manus.space";
            sendPurchaseConfirmationEmail({
              toEmail: ctx.user.email,
              toName: ctx.user.name || "Athlete",
              dashboardUrl: `${origin}/dashboard`,
            }).catch(err => console.error("[verifySession] Email send failed:", err));
          }

          return { activated: true, message: `Pro ${billingPeriod} plan activated!` };
        } catch (err: any) {
          console.error("[verifySession] Error:", err.message);
          throw new Error(`Failed to verify session: ${err.message}`);
        }
      }),

    /** Save interest in the Pro Communication Suite (notify me at launch) */
    notifyProInterest: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (db) {
        await db
          .update(users)
          .set({ interestedInPro: true })
          .where(eq(users.id, ctx.user.id));
      }
      return { saved: true };
    }),

    /** Create a Stripe Customer Portal session for managing billing */
    createPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      const user = ctx.user;

      if (!user.stripeCustomerId) {
        throw new Error("No Stripe customer found. Please contact support.");
      }

      const origin = ctx.req.headers.origin || "http://localhost:3000";

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/settings`,
      });

      return { portalUrl: portalSession.url };
    }),

    /** Cancel subscription at period end (cancel_at_period_end: true) */
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      const user = ctx.user;

      if (!user.stripeSubscriptionId) {
        throw new Error("No active subscription found.");
      }

      // Tell Stripe to cancel at period end — user keeps access until then
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Retrieve the subscription to get current_period_end
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      // Store cancelling status and period end in DB
      const db = await getDb();
      if (db) {
        await db
          .update(users)
          .set({ subscriptionStatus: "cancelling" })
          .where(eq(users.id, ctx.user.id));
      }

      // Return the period end date so the UI can display it
      const periodEnd = new Date((subscription as any).current_period_end * 1000);
      console.log(`[subscription.cancel] User ${ctx.user.id} cancellation scheduled for ${periodEnd.toISOString()}`);

      return { success: true, periodEnd };
    }),

    /** Reactivate a subscription that was set to cancel at period end */
    reactivate: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      const user = ctx.user;

      if (!user.stripeSubscriptionId) {
        throw new Error("No subscription found to reactivate.");
      }

      // Remove the cancel_at_period_end flag
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Restore status to active
      const db = await getDb();
      if (db) {
        await db
          .update(users)
          .set({ subscriptionStatus: "active" })
          .where(eq(users.id, ctx.user.id));
      }

      console.log(`[subscription.reactivate] User ${ctx.user.id} reactivated subscription`);

      return { success: true };
    }),
  }),

  // ─── Volleyball Schools & Players ───────────────────────────────────────────────────
  volleyball: router({
    /** Get all schools visible to the caller.
     * Test schools are only returned when the caller is the owner (georgeterp27@gmail.com). */
    schools: publicProcedure.query(async ({ ctx }) => {
      return getAllSchools(ctx.user?.email ?? null);
    }),

    /** Get a single school by ID */
    school: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return getSchoolById(input.id);
      }),

    /** Get all players for a school. 22 schools are public; 8 locked schools return empty (UI shows upgrade prompt). */
    players: publicProcedure
      .input(z.object({ schoolId: z.string() }))
      .query(async ({ input }) => {
        return getPlayersForSchool(input.schoolId);
        // Locked schools (hasRosterData=false) return empty — UI shows upgrade prompt
      }),

    /** Opening counts using athlete's real grad year — deduplicates by name, exact year match */
    openingCounts: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getAthleteProfile(ctx.user.id);
      const gradYear = parseInt(profile?.graduationYear ?? "2027");
      if (isNaN(gradYear)) return {};

      // Map full position names (stored in profile) to abbreviations (stored in players table)
      const POSITION_MAP: Record<string, string> = {
        "outside hitter": "OH",
        "middle blocker": "MB",
        "opposite": "OPP",
        "setter": "S",
        "libero": "L",
        "defensive specialist": "DS",
        "oh": "OH", "mb": "MB", "opp": "OPP",
        "s": "S", "l": "L", "ds": "DS",
      };

      let athletePositions: string[] = [];
      const rawPositions = profile?.positions ?? "";
      if (rawPositions) {
        try {
          const parsed = JSON.parse(rawPositions);
          const arr = Array.isArray(parsed) ? parsed : [rawPositions];
          athletePositions = arr
            .map((p: string) => POSITION_MAP[p.trim().toLowerCase()] ?? p.trim().toUpperCase())
            .filter(Boolean);
        } catch {
          athletePositions = rawPositions
            .split(",")
            .map((p: string) => POSITION_MAP[p.trim().toLowerCase()] ?? p.trim().toUpperCase())
            .filter(Boolean);
        }
      }

      return getOpeningCountsForAllSchools(gradYear, athletePositions);
    }),

    commitCounts: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getAthleteProfile(ctx.user.id);
      const gradYear = parseInt(profile?.graduationYear ?? "2027");
      if (isNaN(gradYear)) return {};
      return getCommitCountsForAllSchools(gradYear);
    }),

    commitsForSchool: publicProcedure
      .input(z.object({ schoolId: z.string(), gradYear: z.number().optional() }))
      .query(async ({ input }) => {
        return getCommitsForSchool(input.schoolId, input.gradYear);
      }),

    debugCommits: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { error: "no db" };
      const [count] = await db.execute("SELECT COUNT(*) as total FROM commits");
      const [sample] = await db.execute("SELECT schoolId, name, gradYear FROM commits LIMIT 5");
      const [schoolMatch] = await db.execute(
        "SELECT c.schoolId, COUNT(*) as count FROM commits c INNER JOIN schools s ON c.schoolId = s.id GROUP BY c.schoolId LIMIT 5"
      );
      const [gradYears] = await db.execute("SELECT gradYear, COUNT(*) as count FROM commits GROUP BY gradYear");
      return { count, sample, schoolMatch, gradYears };
    }),

    /**
     * Single source of truth for roster gap calculations.
     * Returns graduating, positionGraduating, commits, openings, positionOpenings per school.
     * Uses exact graduation_year = userGradYear matching.
     */
    openingsBatch: publicProcedure
      .input(z.object({
        userGradYear: z.string().optional(),
        userPositions: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return getSchoolOpeningsBatch(input.userGradYear, input.userPositions ?? []);
      }),

    /** Get gap data for a specific school — uses athlete's real grad year and positions */
    schoolGapData: protectedProcedure
      .input(z.object({ schoolId: z.string(), gradYear: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const profile = await getAthleteProfile(ctx.user.id);
        const profileGradYear = parseInt(profile?.graduationYear ?? "2027");
        const gradYear = input.gradYear ?? (isNaN(profileGradYear) ? 2027 : profileGradYear);
        const positions = parseAthletePositions(profile?.positions);

        const [allPlayers, gapData] = await Promise.all([
          getPlayersForSchool(input.schoolId),
          getGraduatingPlayersForSchool(input.schoolId, gradYear, positions),
        ]);

        return {
          players: allPlayers,
          gradYear,
          athletePositions: positions,
          graduating: {
            total: gapData.total,
            atPositions: gapData.atPositions,
            graduatingNames: gapData.playerNames,
            positionGraduatingNames: gapData.positionPlayerNames,
          },
        };
      }),

    /** School-specific gap data using getSchoolGapData — handles combined positions, deduplicates by name */
    schoolGap: protectedProcedure
      .input(z.object({
        schoolId: z.string(),
        gradYear: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const profile = await getAthleteProfile(ctx.user.id);
        const gradYear = input.gradYear ?? parseInt(profile?.graduationYear ?? "2027");

        let athletePositions: string[] = [];
        const rawPositions = profile?.positions ?? "";
        if (rawPositions) {
          try {
            const parsed = JSON.parse(rawPositions);
            if (Array.isArray(parsed)) {
              athletePositions = parsed.map((p: string) => p.trim().toUpperCase()).filter(Boolean);
            }
          } catch {
            athletePositions = rawPositions.split(",").map((p: string) => p.trim().toUpperCase()).filter(Boolean);
          }
        }

        const [allPlayers, gapData] = await Promise.all([
          getPlayersForSchool(input.schoolId),
          getSchoolGapData(input.schoolId, isNaN(gradYear) ? 2027 : gradYear, athletePositions),
        ]);

        return {
          players: allPlayers,
          gradYear: isNaN(gradYear) ? 2027 : gradYear,
          athletePositions,
          gap: {
            total: gapData.total,
            atPosition: gapData.atPosition,
            graduatingNames: gapData.graduatingNames,
            positionGraduatingNames: gapData.positionGraduatingNames,
          },
        };
      }),

    coaches: publicProcedure
      .input(z.object({ schoolId: z.string() }))
      .query(async ({ input }) => {
        return getCoachesBySchool(input.schoolId);
      }),

    /** Get recruiting questionnaire and athletics website URLs for a school */
    links: publicProcedure
      .input(z.object({ schoolId: z.string() }))
      .query(async ({ input }) => {
        return getSchoolLinks(input.schoolId);
      }),

    /** Generate a personalized recruiting email using the LLM, roster gap data, and athlete profile */
    generate: protectedProcedure
      .input(
        z.object({
          schoolId: z.string(),
          schoolName: z.string(),
          coachName: z.string().optional(),
          division: z.string().optional(),
          conference: z.string().optional(),
          // Athlete core fields — optional to handle incomplete profiles
          athleteName: z.string().optional(),
          athletePosition: z.string().optional(),
          athleteYear: z.string().optional(),
          athleteGradYear: z.string().optional(), // alias for athleteYear
          athleteGpa: z.string().optional(),
          athleteHeight: z.string().optional(),
          athleteHometown: z.string().optional(),
          athleteHighlightUrl: z.string().optional(),
          athleteHudlUrl: z.string().optional(),
          athleteNcsaUrl: z.string().optional(),
          athleteStats: z.string().optional(),
          athleteKeyStats: z.string().optional(),
          athleteAcademicInterest: z.string().optional(),
          athleteIntendedMajor: z.string().optional(),
          athletePersonalNote: z.string().optional(),
          athletePhoneNumber: z.string().optional(),
          // Extended profile fields
          athleteInstagram: z.string().optional(),
          athleteInstagramUrl: z.string().optional(),
          athleteTwitter: z.string().optional(),
          athleteMaxVertical: z.string().optional(),
          athleteVerticalJump: z.string().optional(),
          athleteBlockHeight: z.string().optional(),
          athleteServiceType: z.string().optional(),
          athletePassingRating: z.string().optional(),
          athleteHittingPercentage: z.string().optional(),
          athleteAces: z.string().optional(),
          athleteApproachJump: z.string().optional(),
          athleteWeight: z.string().optional(),
          athleteSat: z.string().optional(),
          athleteAct: z.string().optional(),
          athleteHighSchool: z.string().optional(),
          athleteCity: z.string().optional(),
          athleteState: z.string().optional(),
          athleteClubTeam: z.string().optional(),
          athleteAwards: z.string().optional(),
          // Optional free-text note about the program (from the Email tab UI)
          programNotes: z.string().max(200).optional(),
          // Specific mention about the school/program (from Email tab)
          specificMention: z.string().max(200).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Import email generation helpers
        const { buildClaudeSystemPrompt } = await import("./emailGeneration");

        // Parse athletePosition — may be a JSON array string (multi-position)
        const athletePositionDisplay = (() => {
          if (!input.athletePosition) return "volleyball";
          try {
            const parsed = JSON.parse(input.athletePosition);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.length === 1
                ? parsed[0]
                : parsed.slice(0, -1).join(", ") + " and " + parsed[parsed.length - 1];
            }
            return input.athletePosition;
          } catch {
            return input.athletePosition;
          }
        })();

        // Fetch roster gap data for this school using the athlete's REAL grad year and normalized positions
        const userGradYear = input.athleteGradYear || input.athleteYear || "2027";
        const parsedGradYear = parseInt(userGradYear);
        const effectiveGradYear = isNaN(parsedGradYear) ? 2027 : parsedGradYear;
        const athletePositions = parseAthletePositions(input.athletePosition);
        const gapData = await getGraduatingPlayersForSchool(input.schoolId, effectiveGradYear, athletePositions);
        const graduatingAtUserPosition = gapData.atPositions;
        const openingsAtUserPosition = gapData.atPositions; // openings = graduating at position (deduplicated)
        const totalGraduating = gapData.total;

        // School-specific academic program strengths
        const academicStrengths: Record<string, string> = {
          "mvb-ucla": "UCLA is known for strong programs in business, engineering, and pre-med",
          "mvb-stanford": "Stanford is world-renowned for engineering, computer science, and pre-med",
          "mvb-usc": "USC is known for business (Marshall), film, and communications",
          "mvb-hawaii": "UH Mānoa is known for marine biology, oceanography, and Pacific Island studies",
          "mvb-pepperdine": "Pepperdine is known for business, law, and communications",
          "mvb-byu": "BYU is known for business, engineering, and accounting",
          "mvb-ohio-state": "Ohio State is known for business, engineering, and sports management",
          "mvb-penn-state": "Penn State is known for engineering, business, and kinesiology",
        };
        const academicMatch = academicStrengths[input.schoolId] || undefined;

        // Build the new Claude system prompt with roster data and position-specific rules
        const systemPrompt = buildClaudeSystemPrompt(
          input.athleteName || "Athlete",
          athletePositionDisplay,
          userGradYear,
          input.athleteHeight,
          input.athleteGpa,
          input.athleteClubTeam,
          input.athleteHighSchool,
          input.athleteCity,
          input.athleteState,
          input.athleteVerticalJump,
          input.athleteApproachJump,
          input.athleteIntendedMajor,
          input.athleteHudlUrl,
          input.athleteNcsaUrl,
          input.athleteKeyStats,
          input.athleteAwards,
          input.schoolName,
          input.division,
          input.conference,
          input.coachName,
          graduatingAtUserPosition,
          openingsAtUserPosition,
          totalGraduating,
          userGradYear,
          athletePositionDisplay,
          input.programNotes,
          academicMatch
        );

        // Build athlete profile context for user prompt
        const profileLines = [
          `Name: ${input.athleteName}`,
          `Position: ${athletePositionDisplay}`,
          `Graduation Year: ${userGradYear}`,
          input.athleteHeight ? `Height: ${input.athleteHeight}` : "",
          input.athleteGpa ? `GPA: ${input.athleteGpa}` : "",
          input.athleteClubTeam ? `Club Team: ${input.athleteClubTeam}` : "",
          input.athleteVerticalJump ? `Vertical Jump: ${input.athleteVerticalJump}` : "",
          input.athleteApproachJump ? `Approach Jump: ${input.athleteApproachJump}` : "",
          input.athleteKeyStats ? `Key Stats: ${input.athleteKeyStats}` : "",
          input.athleteIntendedMajor ? `Intended Major: ${input.athleteIntendedMajor}` : "",
          input.athleteHudlUrl ? `Hudl: ${input.athleteHudlUrl}` : "",
          input.athleteNcsaUrl ? `NCSA: ${input.athleteNcsaUrl}` : "",
        ].filter(Boolean).join("\n");

        let userPrompt = `Write a recruiting email from this athlete to the ${input.schoolName} coaching staff.

Athlete profile:
${profileLines}

Requirements:
- Apply ALL structural variety rules from the system prompt — vary the opening, information order, closing question, tone, and length
- Weave in the roster intelligence naturally as if the athlete researched it themselves
- Reference specific details about ${input.schoolName}'s volleyball program if known
- Include media links only if provided — do not invent URLs
- The email MUST end with a genuine question (see closing rules above)
- Apply all banned phrase rules — especially: do NOT start with "Dear Coach", "My name is", or any line beginning with "I"
- Subject line must follow the formula: grad year + position + hook. No stats in the subject line.`;

        // Add specific mention if provided
        if (input.specificMention) {
          userPrompt += `\n\nAdditional context about ${input.schoolName}:\n${input.specificMention}\n\nWeave this context naturally into the email — paraphrase it, do not copy it verbatim.`;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        console.log(`[volleyball.generate] Generated email for ${input.athleteName} to ${input.schoolName} (Coach: ${input.coachName || 'N/A'}, GradYear: ${userGradYear})`);

        const content = response.choices[0]?.message?.content || "";
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        console.log(`[volleyball.generate] Email preview: ${contentStr.substring(0, 100)}...`);
        return { email: contentStr };
      }),

    /**
     * FIND MY OPENING — returns schools with position openings for given positions and grad year.
     * Uses getOpeningCountsForAthlete which DEDUPLICATES by player name.
     * Sorted by most positionOpenings first. Premium-gated on the frontend.
     */
    rosterOpenings: publicProcedure
      .input(z.object({
        positions: z.array(z.string()),
        gradYear: z.string(),
      }))
      .query(async ({ input }) => {
        const allSchools = await getAllSchools();
        const parsedGradYear = parseInt(input.gradYear);
        const effectiveGradYear = isNaN(parsedGradYear) ? 2027 : parsedGradYear;
        const normalizedPositions = input.positions.map(normalizePosition).filter(Boolean);
        const openings = await getOpeningCountsForAthlete(effectiveGradYear, normalizedPositions);
        const results = allSchools
          .filter(s => !s.isTestSchool)
          .map(s => {
            const data = openings[s.id];
            return {
              schoolId: s.id,
              schoolName: s.name,
              division: s.division,
              logoUrl: s.logoUrl,
              logoBackgroundColor: s.logoBackgroundColor,
              logoMixBlendMode: s.logoMixBlendMode as string | null,
              brandColor: s.brandColor,
              positionOpenings: data?.atPositions ?? 0,
              totalOpenings: data?.total ?? 0,
            };
          })
          .filter(s => s.positionOpenings > 0)
          .sort((a, b) => b.positionOpenings - a.positionOpenings);
        return results;
      }),

    /**
     * Admin-only: delete all players and re-seed from ROSTER_DATA with corrected combo-position split logic.
     * Allowed emails: georgeterp27@gmail.com, contact.recruitpath@gmail.com
     */
    reseedPlayers: protectedProcedure.mutation(async ({ ctx }) => {
      const allowedEmails = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];
      if (!allowedEmails.includes(ctx.user?.email ?? "")) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("No DB connection");

      // Delete all existing player rows
      await db.delete(players);

      // Import ROSTER_DATA from the shared data file (extracted from seed-volleyball.mjs)
      const { ROSTER_DATA } = await import("../shared/volleyballRosterData");
      const rosterData = ROSTER_DATA;
      if (!Array.isArray(rosterData)) throw new Error("Could not load ROSTER_DATA from shared/volleyballRosterData");

      // Build schoolName -> schoolId map (column is 'name' in the schools table)
      const allSchools = await db.select({ id: schools.id, name: schools.name }).from(schools);
      const nameToId: Record<string, string> = {};
      for (const s of allSchools) if (s.name) nameToId[s.name.toLowerCase()] = s.id;

      // Full position normalisation matching reseed-from-csv.mjs
      const POS_MAP: Record<string, string | null> = {
        "MH": "MB", "RS": "OPP", "LB": "L",
        "L/DS": "L", "DS/L": "L", "DS/LB": "L",
        "UT": "OH", "UTL": "OH", "PIN": "OH",
        "OPPO": "OPP", "Opp": "OPP",
        "MBB": "MB",
        "OH-MB": "OH", "L-S": "L",
        "N/A": null,
      };
      const CANONICAL = new Set(["OH", "MB", "OPP", "S", "L", "DS"]);
      const YEAR_MAP: Record<string, string> = {
        "Fr.": "Freshman", "Fy.": "Freshman", "Fr": "Freshman",
        "So.": "Sophomore", "So": "Sophomore",
        "Jr.": "Junior", "Jr": "Junior",
        "Sr.": "Senior", "Sr": "Senior",
        "Gr.": "Graduate", "Gr": "Graduate",
        "R-Fr.": "Redshirt Freshman", "R-Fr": "Redshirt Freshman",
        "R-So.": "Redshirt Sophomore", "R-So": "Redshirt Sophomore",
        "R-Jr.": "Redshirt Junior", "R-Jr": "Redshirt Junior",
        "R-Sr.": "Redshirt Senior", "R-Sr": "Redshirt Senior",
      };

      const normPos = (raw: string): string | null => {
        if (!raw || raw === "N/A") return null;
        const t = raw.trim();
        if (POS_MAP[t] !== undefined) return POS_MAP[t];
        if (CANONICAL.has(t)) return t;
        if (CANONICAL.has(t.toUpperCase())) return t.toUpperCase();
        return t;
      };
      const splitPos = (posStr: string): string[] => {
        if (!posStr || posStr === "N/A") return [];
        const parts = posStr.split(/[\/\-]/);
        const normed = parts.map(p => normPos(p.trim())).filter((p): p is string => !!p);
        return Array.from(new Set(normed));
      };
      const normYear = (y: string): string => YEAR_MAP[y?.trim()] ?? (y?.trim() ?? y);

      let insertedCount = 0;
      let skippedCount = 0;
      for (const [schoolName, name, position, year, graduationYear] of rosterData) {
        const schoolId = nameToId[schoolName.toLowerCase()];
        if (!schoolId) { skippedCount++; continue; }
        const gradYear = Number(graduationYear);
        if (isNaN(gradYear) || gradYear === 0) { skippedCount++; continue; }
        const posStr = String(position ?? "");
        let normPositions = splitPos(posStr);
        if (normPositions.length === 0) normPositions = [posStr || "OH"];
        const ny = normYear(String(year ?? ""));
        for (const pos of normPositions) {
          await db.insert(players).values({
            schoolId,
            name: String(name),
            position: pos,
            year: ny,
            graduationYear: gradYear,
          });
          insertedCount++;
        }
      }

      // Re-sync hasRosterData flags
      const { syncHasRosterDataFlags } = await import("./db");
      await syncHasRosterDataFlags();

      return { success: true, insertedCount, skippedCount, totalRosterEntries: rosterData.length };
    }),

    /** Debug query — returns raw DB stats for roster data verification */
    debugRoster: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { error: "no db" };

      const totalPlayers = await db.select({ count: sql<number>`COUNT(*)` }).from(players);
      const sample = await db.select().from(players).limit(10);
      const byYear = await db
        .select({ year: players.graduationYear, count: sql<number>`COUNT(DISTINCT ${players.name})` })
        .from(players)
        .groupBy(players.graduationYear)
        .orderBy(players.graduationYear);
      const withData = await db.selectDistinct({ sid: players.schoolId }).from(players);
      const rosterTrue = await db.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.hasRosterData, true));

      return {
        totalPlayerRows: Number(totalPlayers[0]?.count ?? 0),
        sample,
        uniquePlayersByYear: byYear,
        schoolsWithPlayers: withData.length,
        schoolsWithHasRosterDataTrue: Number(rosterTrue[0]?.count ?? 0),
      };
    }),

    /** Debug endpoint: return a sample of 10 schools from the database */
    debugSchools: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(schools).limit(10);
    }),
  }),

  // ─── Outreach List (Schools) ────────────────────────────────────────────────────
  outreach: router({
    /** Get the user's outreach list */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserOutreachList(ctx.user.id);
    }),

    /** Add a school to the outreach list (with server-side gating) */
    add: protectedProcedure
      .input(
        z.object({
          schoolId: z.string(),
          schoolName: z.string().optional(),
          coachName: z.string().optional(),
          sport: z.string().optional(),
          division: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const hasPaidAccess = user.hasPaidAccess ?? false;
        const limit = getSchoolsLimit(hasPaidAccess);

        // Server-side gating: enforce limit using the LIFETIME counter (totalSchoolsAdded),
        // not the current active count. This prevents the exploit where users remove and
        // re-add different schools to bypass the 5-school free tier limit.
        const lifetimeCount = await getUserTotalSchoolsAdded(user.id);

        if (limit !== Infinity && lifetimeCount >= limit) {
          throw new Error(
            "SCHOOL_LIMIT_REACHED: You've reached the 5 school limit for free accounts. Unlock full access for $49.99 to add unlimited schools."
          );
        }

        return addToOutreachList({
          userId: user.id,
          schoolId: input.schoolId,
          schoolName: input.schoolName ?? null,
          coachName: input.coachName ?? null,
          sport: input.sport ?? null,
          division: input.division ?? null,
        });
      }),

    /** Remove a school from the outreach list */
    remove: protectedProcedure
      .input(z.object({ schoolId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await removeFromOutreachList(ctx.user.id, input.schoolId);
        return { success: true };
      }),

    /** Toggle the starred state of a school in the outreach list */
    toggleStar: protectedProcedure
      .input(z.object({ schoolId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const newStarred = await toggleOutreachStarred(ctx.user.id, input.schoolId);
        return { starred: newStarred };
      }),
  }),

  // ─── Athlete Profile ─────────────────────────────────────────────────────────
  athleteProfile: router({
    /** Load the current user's athlete profile */
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getAthleteProfile(ctx.user.id);
    }),

    /** Save (upsert) the current user's athlete profile */
    save: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          position: z.string().optional(),
          positions: z.string().optional(),  // JSON array string e.g. '["Setter","Libero"]'
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          graduationYear: z.string().optional(),
          gpa: z.string().optional(),
          satScore: z.string().optional(),
          actScore: z.string().optional(),
          intendedMajor: z.string().optional(),
          primarySport: z.string().optional(),
          jerseyNumber: z.string().optional(),
          height: z.string().optional(),
          weight: z.string().optional(),
          keyStats: z.string().optional(),
          awards: z.string().optional(),
          hometown: z.string().optional(),
          highSchool: z.string().optional(),
          highlightFilmUrl: z.string().optional(),
          secondaryVideoUrl: z.string().optional(),
          highlightUrl: z.string().optional(),
          stats: z.string().optional(),
          academicInterest: z.string().optional(),
          personalNote: z.string().optional(),
          phoneNumber: z.string().optional(),
          instagram: z.string().optional(),
          twitter: z.string().optional(),
          twitterHandle: z.string().optional(),
          instagramHandle: z.string().optional(),
          clubTeam: z.string().optional(),
          verticalJump: z.string().optional(),
          maxVertical: z.string().optional(),
          blockHeight: z.string().optional(),
          serviceType: z.string().optional(),
          passingRating: z.string().optional(),
          hittingPercentage: z.string().optional(),
          aces: z.string().optional(),
          approachJump: z.string().optional(),
          ncsaUrl: z.string().optional(),
          hudlUrl: z.string().optional(),
          profilePhoto: z.string().nullable().optional(),
          actionPhoto: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Map legacy field aliases to canonical DB column names
        const mapped: Record<string, unknown> = { ...input };
        if (input.positions !== undefined) mapped.positions = input.positions;
        await saveAthleteProfile(ctx.user.id, mapped as any);
        return { success: true };
      }),
  }),

  // ─── Outreach Tracker ───────────────────────────────────────────────────────────────────
  outreachTracker: router({
    /** Log a sent email to the tracker */
    log: protectedProcedure
      .input(
        z.object({
          schoolId: z.string(),
          schoolName: z.string(),
          coachName: z.string().optional(),
          coachEmail: z.string().optional(),
          subject: z.string(),
          body: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await logSentEmail({
          userId: ctx.user.id,
          schoolId: input.schoolId,
          schoolName: input.schoolName,
          coachName: input.coachName ?? null,
          coachEmail: input.coachEmail ?? null,
          subject: input.subject,
          body: input.body,
        });
        return { id };
      }),

    /** Get the latest email per school for the tracker table */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getLatestEmailPerSchool(ctx.user.id);
    }),

    /** Update the status on the most recent email for a school */
    updateStatus: protectedProcedure
      .input(z.object({ schoolId: z.string(), status: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await updateEmailStatus(ctx.user.id, input.schoolId, input.status);
        return { success: true };
      }),

    /** Total emails sent count (for stat block) */
    emailsSentCount: protectedProcedure.query(async ({ ctx }) => {
      return getEmailsSentCount(ctx.user.id);
    }),

    /** Set of schoolIds with active outreach status (for green dot on school cards) */
    activeSchoolIds: protectedProcedure.query(async ({ ctx }) => {
      const ids = await getActiveOutreachSchoolIds(ctx.user.id);
      return Array.from(ids);
    }),

    /** Set of ALL schoolIds where the user has sent at least one email */
    sentSchoolIds: protectedProcedure.query(async ({ ctx }) => {
      const ids = await getSentSchoolIds(ctx.user.id);
      return Array.from(ids);
    }),

    /** Analyze a coach's response and generate a suggested reply using Claude */
    generateReply: protectedProcedure
      .input(
        z.object({
          schoolId: z.string(),
          schoolName: z.string(),
          coachName: z.string().optional(),
          originalSubject: z.string(),
          originalBody: z.string(),
          coachResponse: z.string().min(10, "Coach response is too short"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Fetch athlete profile for context
        const profile = await getAthleteProfile(ctx.user.id);
        const athleteName = profile
          ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
          : "the athlete";
        const rawPositions = profile?.positions ?? profile?.primarySport ?? "volleyball";
        const position = (() => {
          try {
            const parsed = JSON.parse(rawPositions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.length === 1 ? parsed[0] : parsed.slice(0, -1).join(", ") + " and " + parsed[parsed.length - 1];
            }
            return rawPositions;
          } catch {
            return rawPositions;
          }
        })();
        const gradYear = profile?.graduationYear ?? "";
        const gpa = profile?.gpa ?? "";
        const highSchool = profile?.highSchool ?? "";

        const systemPrompt = `You are an expert college athletic recruiting advisor helping a student-athlete respond to a college coach.
You analyze coach responses and generate professional, personalized reply emails.
Always respond with valid JSON matching the exact schema provided.

=== SPECIAL CASE: "WHO ELSE IS RECRUITING YOU?" DETECTION ===
If the coach's response contains any version of these questions — "who else is recruiting you", "what other programs are you looking at", "are you talking to other schools", "what other schools are on your list", or any similar phrasing — you MUST apply this exact strategic framework in the replyBody:

1. Express genuine appreciation that they asked (brief, natural — not sycophantic)
2. Acknowledge you are speaking with a few programs but are still in the evaluation phase — do NOT name specific schools, do NOT oversell, do NOT lie about interest level
3. Pivot back to emphasizing genuine interest in THIS program specifically, with a concrete reason
4. The response must never name competitors, never exaggerate interest levels, and never sound like a form answer

Example language to model (vary the phrasing each time):
"I'm glad you asked — I've been in contact with a few programs but I'm honestly still in the process of learning more about each opportunity and finding the right fit. What I can tell you is that ${input.schoolName} has been high on my list for [genuine reason], and that's not something I say to every coach."

If this question is NOT present in the coach's response, generate a normal reply.`;

        const userPrompt = `A student-athlete received a response from a college coach. Analyze it and generate a reply.

## ATHLETE INFO
- Name: ${athleteName}
- Position: ${position}
- Graduation Year: ${gradYear}
- GPA: ${gpa}
- High School: ${highSchool}

## SCHOOL & COACH
- School: ${input.schoolName}
- Coach: ${input.coachName ?? "the coach"}

## ORIGINAL EMAIL SENT BY ATHLETE
Subject: ${input.originalSubject}

${input.originalBody}

## COACH'S RESPONSE
${input.coachResponse}

## YOUR TASK
Respond with a JSON object with this exact structure:
{
  "interestLevel": "Hot" | "Warm" | "Neutral" | "Cold",
  "analysisBullets": ["string", "string", "string"],
  "actionItems": ["string"],
  "replySubject": "string",
  "replyBody": "string"
}

Rules:
- interestLevel: Hot = coach is very interested and proactive; Warm = positive but not urgent; Neutral = polite but non-committal; Cold = discouraging or form response
- analysisBullets: 2-3 concise bullets summarizing what the coach said
- actionItems: list any specific asks from the coach (film, questionnaire, visit, camp, etc.) — empty array if none
- replySubject: a natural subject line for the reply (can be "Re: ${input.originalSubject}" or something more specific)
- replyBody: a 100-150 word reply email that directly addresses the coach's response, follows up on any asks, maintains the same tone as the original email, and is signed with the athlete's name
- IMPORTANT: If the coach asked any version of "who else is recruiting you" or "what other programs are you looking at", apply the special strategic framework from the system prompt — do not name competitors, do not oversell, pivot back to genuine interest in ${input.schoolName}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "coach_reply_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  interestLevel: { type: "string", enum: ["Hot", "Warm", "Neutral", "Cold"] },
                  analysisBullets: { type: "array", items: { type: "string" } },
                  actionItems: { type: "array", items: { type: "string" } },
                  replySubject: { type: "string" },
                  replyBody: { type: "string" },
                },
                required: ["interestLevel", "analysisBullets", "actionItems", "replySubject", "replyBody"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response?.choices?.[0]?.message?.content;
        if (!content) throw new Error("LLM returned empty response");

        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        return parsed as {
          interestLevel: "Hot" | "Warm" | "Neutral" | "Cold";
          analysisBullets: string[];
          actionItems: string[];
          replySubject: string;
          replyBody: string;
        };
      }),

    generateFollowUp: protectedProcedure
      .input(
        z.object({
          schoolId: z.string(),
          schoolName: z.string(),
          coachName: z.string().optional(),
          originalSubject: z.string(),
          originalBody: z.string(),
          daysSince: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await getAthleteProfile(ctx.user.id);
        const athleteName = profile
          ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
          : "the athlete";
        const rawPositions = profile?.positions ?? profile?.primarySport ?? "volleyball";
        const position = (() => {
          try {
            const parsed = JSON.parse(rawPositions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.length === 1 ? parsed[0] : parsed.slice(0, -1).join(", ") + " and " + parsed[parsed.length - 1];
            }
            return rawPositions;
          } catch {
            return rawPositions;
          }
        })();
        const gradYear = profile?.graduationYear ?? "";

        const systemPrompt = `You are an expert college athletic recruiting advisor. Write short, friendly follow-up emails for student-athletes who haven't heard back from a coach. Always respond with valid JSON.`;

        const userPrompt = `Write a follow-up email for a student-athlete who sent an initial outreach email ${input.daysSince} day(s) ago and has not received a response.

## ATHLETE INFO
- Name: ${athleteName}
- Position: ${position}
- Graduation Year: ${gradYear}

## SCHOOL & COACH
- School: ${input.schoolName}
- Coach: ${input.coachName ?? "the coach"}

## ORIGINAL EMAIL SENT
Subject: ${input.originalSubject}

${input.originalBody}

## YOUR TASK
Respond with a JSON object:
{
  "subject": "string",
  "body": "string"
}

Rules:
- subject: a natural follow-up subject line (e.g. "Following Up — ${athleteName}")
- body: a SHORT follow-up email (under 100 words). It should: reference the original outreach, reaffirm interest in the program, ask if there is anything else the coach needs, and be signed with the athlete's name. Keep it friendly and direct — not pushy.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "follow_up_email",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  body: { type: "string" },
                },
                required: ["subject", "body"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response?.choices?.[0]?.message?.content;
        if (!content) throw new Error("LLM returned empty response");

        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        return parsed as { subject: string; body: string };
      }),
  }),

  // ─── Onboarding ──────────────────────────────────────────────────────────────────────────
  onboarding: router({
    /** Returns whether the current user has completed onboarding */
    status: protectedProcedure.query(async ({ ctx }) => {
      return { hasCompletedOnboarding: ctx.user.hasCompletedOnboarding ?? false };
    }),

    /** Complete onboarding: save profile data and mark hasCompletedOnboarding = true */
    complete: protectedProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          dateOfBirth: z.string().min(1),
          position: z.string().min(1),
          highSchool: z.string().min(1),
          graduationYear: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");

        // Upsert profile data into athleteProfiles
        const { athleteProfiles } = await import("../drizzle/schema");
        await db
          .insert(athleteProfiles)
          .values({
            userId: ctx.user.id,
            firstName: input.firstName,
            lastName: input.lastName,
            highSchool: input.highSchool,
            dateOfBirth: input.dateOfBirth,
            positions: input.position,
            graduationYear: input.graduationYear,
          })
          .onDuplicateKeyUpdate({
            set: {
              firstName: input.firstName,
              lastName: input.lastName,
              highSchool: input.highSchool,
              dateOfBirth: input.dateOfBirth,
              positions: input.position,
              graduationYear: input.graduationYear,
            },
          });

        // Mark onboarding as complete
        await db
          .update(users)
          .set({ hasCompletedOnboarding: true })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),
  }),

  // ─── Gmail ─────────────────────────────────────────────────────────────────────────────
  gmail: router({
    /**
     * Returns the current Gmail connection status for the authenticated user.
     * Exposes only the connected email address and emailsSent counter —
     * tokens are NEVER returned to the client.
     */
    status: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { connected: false, email: null, emailsSent: 0 };

      const rows = await db
        .select({
          gmailConnectedEmail: users.gmailConnectedEmail,
          gmailConnectedAt: users.gmailConnectedAt,
          emailsSent: users.emailsSent,
          // Check if tokens exist without returning them
          hasToken: users.gmailAccessToken,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const row = rows[0];
      if (!row || !row.hasToken) {
        return { connected: false, email: null, emailsSent: row?.emailsSent ?? 0, connectedAt: null };
      }

      return {
        connected: true,
        email: row.gmailConnectedEmail ?? null,
        emailsSent: row.emailsSent ?? 0,
        connectedAt: row.gmailConnectedAt ?? null,
      };
    }),
  }),

  debugRoster: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { error: "No database connection" };

    const { players, schools } = await import("../drizzle/schema");
    const { sql, eq } = await import("drizzle-orm");

    const totalPlayers = await db.select({ count: sql<number>`COUNT(*)` }).from(players);
    const samplePlayers = await db.select().from(players).limit(5);
    const byGradYear = await db
      .select({ graduationYear: players.graduationYear, count: sql<number>`COUNT(*)` })
      .from(players)
      .groupBy(players.graduationYear)
      .orderBy(players.graduationYear);
    const schoolsWithPlayers = await db.selectDistinct({ schoolId: players.schoolId }).from(players);
    const rosterTrue = await db.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.hasRosterData, true));
    const rosterFalse = await db.select({ count: sql<number>`COUNT(*)` }).from(schools).where(eq(schools.hasRosterData, false));

    return {
      totalPlayers: Number(totalPlayers[0]?.count ?? 0),
      samplePlayers,
      playersByGradYear: byGradYear,
      schoolsWithHasRosterDataTrue: Number(rosterTrue[0]?.count ?? 0),
      schoolsWithHasRosterDataFalse: Number(rosterFalse[0]?.count ?? 0),
      schoolsWithActualPlayers: schoolsWithPlayers.length,
    };
  }),

  waitlist: router({
    join: publicProcedure
      .input(z.object({
        email: z.string().email(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return addToWaitlist(input.email, input.source);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const adminEmails = ["georgeterp27@gmail.com", "contact.recruitpath@gmail.com"];
      if (!adminEmails.includes(ctx.user.email ?? "")) {
        throw new Error("Unauthorized");
      }
      return getWaitlistEntries();
    }),

    count: publicProcedure.query(async () => {
      const entries = await getWaitlistEntries();
      return { count: entries.length };
    }),
  }),
});
export type AppRouter = typeof appRouter;
