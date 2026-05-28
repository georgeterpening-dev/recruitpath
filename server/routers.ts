import { COOKIE_NAME } from "../shared/const";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getStripe } from "./stripe/client";
import { FULL_ACCESS_PRICE_CENTS } from "./stripe/products";
import { getSchoolsLimit } from "./stripe/products";
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
  getOpeningCountsForAllSchools,
  getAthleteProfile,
  saveAthleteProfile,
  getCoachesBySchool,
  getSchoolLinks,
  logSentEmail,
  getLatestEmailPerSchool,
  updateEmailStatus,
  getEmailsSentCount,
  getActiveOutreachSchoolIds,
  getSentSchoolIds,
} from "./db";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendPurchaseConfirmationEmail } from "./email";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    /** Mark the welcome overlay as seen — called when user dismisses or clicks through it */
    dismissWelcome: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      await db!.update(users).set({ hasSeenWelcome: true }).where(eq(users.id, ctx.user.id));
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
      const hasPaidAccess = user.hasPaidAccess ?? false;
      const schoolsUsed = await getUserOutreachCount(user.id);
      const schoolsLimit = getSchoolsLimit(hasPaidAccess);
      // Lifetime counter: how many unique schools the user has ever added
      const totalSchoolsAdded = await getUserTotalSchoolsAdded(user.id);

      return {
        hasPaidAccess,
        interestedInPro: user.interestedInPro ?? false,
        // Legacy fields kept for backward compat
        plan: hasPaidAccess ? "pro" : "free",
        schoolsUsed,
        schoolsLimit: schoolsLimit === Infinity ? -1 : schoolsLimit, // -1 = unlimited
        stripeCustomerId: user.stripeCustomerId,
        /** Lifetime total of unique schools ever added — used for Settings display */
        totalSchoolsAdded,
      };
    }),

    /** Create a Stripe Checkout Session for one-time $49.99 Full Access purchase */
    createCheckout: protectedProcedure
      .mutation(async ({ ctx }) => {
        const stripe = getStripe();
        const origin = ctx.req.headers.origin || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "RecruitPath Full Access",
                  description: "One-time payment. Unlimited schools, AI emails, Roster Gap Finder, and more.",
                },
                unit_amount: FULL_ACCESS_PRICE_CENTS,
              },
              quantity: 1,
            },
          ],
          client_reference_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
          },
          allow_promotion_codes: true,
          success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing?upgrade=canceled`,
        });

        return { sessionUrl: session.url };
      }),

    /** Verify a Stripe Checkout Session and grant Full Access */
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
          const paymentIntentId = session.payment_intent as string;

          const db = await getDb();
          if (db) {
            await db
              .update(users)
              .set({
                hasPaidAccess: true,
                plan: "pro",
                stripeCustomerId: customerId,
                stripePaymentIntentId: paymentIntentId,
              })
              .where(eq(users.id, ctx.user.id));
          }

          console.log(`[verifySession] User ${ctx.user.id} granted Full Access`);

          // Send confirmation email (fire-and-forget — don't block the response)
          if (ctx.user.email) {
            const origin = ctx.req.headers.origin || "https://recruitpath.manus.space";
            sendPurchaseConfirmationEmail({
              toEmail: ctx.user.email,
              toName: ctx.user.name || "Athlete",
              dashboardUrl: `${origin}/dashboard`,
            }).catch(err => console.error("[verifySession] Email send failed:", err));
          }

          return { activated: true, message: "Full Access activated!" };
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

    openingCounts: publicProcedure.query(async () => {
      return getOpeningCountsForAllSchools();
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
          // Tone — accept both field names
          toneStyle: z.enum(["confident", "respectful", "energetic"]).optional(),
          tone: z.enum(["confident", "respectful", "energetic", "concise"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Fetch roster gap data for this school
        const openingCounts = await getOpeningCountsForAllSchools();
        const schoolOpenings = openingCounts[input.schoolId];

        // Build roster gap context
        let rosterContext = "";
        if (schoolOpenings !== undefined && schoolOpenings > 0) {
          rosterContext = `Roster gap data: ${schoolOpenings} opening(s) at ${input.athletePosition} position for ${input.athleteYear} class.`;
        } else if (schoolOpenings === 0) {
          rosterContext = `Roster gap data: Position appears filled for ${input.athleteYear} class.`;
        }

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
        const academicContext = academicStrengths[input.schoolId]
          ? `Academic note: ${academicStrengths[input.schoolId]}.`
          : "Mention academics generally without specifying a program.";

        // Build athlete profile context
        const profileLines = [
          `Name: ${input.athleteName}`,
          `Position: ${input.athletePosition}`,
          `Graduation Year: ${input.athleteGradYear || input.athleteYear}`,  // Support both field names
          input.athleteHeight ? `Height: ${input.athleteHeight}` : "",
          input.athleteGpa ? `GPA: ${input.athleteGpa}` : "",
          input.athleteHometown ? `Hometown: ${input.athleteHometown}` : "",
          input.athleteStats ? `Stats: ${input.athleteStats}` : "",
          input.athleteMaxVertical ? `Max Vertical: ${input.athleteMaxVertical}` : "",
          input.athleteBlockHeight ? `Block Height: ${input.athleteBlockHeight}` : "",
          input.athleteServiceType ? `Service Type: ${input.athleteServiceType}` : "",
          input.athletePassingRating ? `Passing Rating: ${input.athletePassingRating}` : "",
          input.athleteHittingPercentage ? `Hitting %: ${input.athleteHittingPercentage}` : "",
          input.athleteAces ? `Aces: ${input.athleteAces}` : "",
          input.athleteApproachJump ? `Approach Jump: ${input.athleteApproachJump}` : "",
          input.athleteAcademicInterest ? `Academic Interest: ${input.athleteAcademicInterest}` : "",
          input.athletePersonalNote ? `Personal Note: ${input.athletePersonalNote}` : "",
          input.athleteHighlightUrl ? `Highlight Film: ${input.athleteHighlightUrl}` : "",
          input.athletePhoneNumber ? `Phone: ${input.athletePhoneNumber}` : "",
          input.athleteInstagram ? `Instagram: ${input.athleteInstagram}` : "",
          input.athleteTwitter ? `Twitter/X: ${input.athleteTwitter}` : "",
        ].filter(Boolean).join("\n");

        const toneInstructions: Record<string, string> = {
          confident: "Tone: CONFIDENT. Lead with achievements. Be direct and assertive. Show you know your value.",
          respectful: "Tone: RESPECTFUL. Use a formal, coach-focused tone. Acknowledge the program specifically. More about what the athlete can contribute to the program than personal achievements.",
          energetic: "Tone: ENERGETIC. High energy, enthusiastic, show genuine excitement for the program. Conversational but professional.",
        };
        const toneInstruction = toneInstructions[input.toneStyle || "respectful"];

        const divisionContext = input.division === "D1"
          ? "open with a specific observation about the program"
          : input.division === "D2"
          ? "open with what drew you to this specific program or conference"
          : "open with genuine interest in the academic and athletic balance";

        const systemPrompt = `You are helping a student athlete write a personalized recruiting email to a college volleyball coaching staff.
Write in first person as the athlete. Be specific, genuine, and professional.
${toneInstruction}
${academicContext}
${rosterContext ? `\n${rosterContext}` : ""}
Format: Subject line first (Subject: ...), then the email body. No placeholders like [Your Name].`;

        const coachGreeting = input.coachName ? `Coach ${input.coachName},` : "Coaching Staff,";

        const userPrompt = `Write a recruiting email from this athlete to the ${input.schoolName} coaching staff.

Start with: "${coachGreeting}"

Athlete profile:
${profileLines}

Requirements:
- ${divisionContext}
- Reference specific details about ${input.schoolName}'s volleyball program if known
- Keep it under 250 words
- Include media links only if provided — do not invent URLs
- End with a clear, specific ask (e.g. request a call, campus visit, or to be considered for the program)`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        console.log(`[volleyball.generate] Generated email for ${input.athleteName} to ${input.schoolName} (Coach: ${input.coachName || 'N/A'}, GradYear: ${input.athleteGradYear || input.athleteYear || 'N/A'})`);

        const content = response.choices[0]?.message?.content || "";
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        console.log(`[volleyball.generate] Email preview: ${contentStr.substring(0, 100)}...`);
        return { email: contentStr };
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
          graduationYear: z.string().optional(),
          gpa: z.string().optional(),
          height: z.string().optional(),
          hometown: z.string().optional(),
          highlightUrl: z.string().optional(),
          stats: z.string().optional(),
          academicInterest: z.string().optional(),
          personalNote: z.string().optional(),
          phoneNumber: z.string().optional(),
          instagram: z.string().optional(),
          twitter: z.string().optional(),
          maxVertical: z.string().optional(),
          blockHeight: z.string().optional(),
          serviceType: z.string().optional(),
          passingRating: z.string().optional(),
          hittingPercentage: z.string().optional(),
          aces: z.string().optional(),
          approachJump: z.string().optional(),
          profilePhoto: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await saveAthleteProfile(ctx.user.id, input);
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
        const position = profile?.positions ?? profile?.primarySport ?? "volleyball";
        const gradYear = profile?.graduationYear ?? "";
        const gpa = profile?.gpa ?? "";
        const highSchool = profile?.highSchool ?? "";

        const systemPrompt = `You are an expert college athletic recruiting advisor helping a student-athlete respond to a college coach. 
You analyze coach responses and generate professional, personalized reply emails.
Always respond with valid JSON matching the exact schema provided.`;

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
- replyBody: a 100-150 word reply email that directly addresses the coach's response, follows up on any asks, maintains the same tone as the original email, and is signed with the athlete's name`;

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
        const position = profile?.positions ?? profile?.primarySport ?? "volleyball";
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
});
export type AppRouter = typeof appRouter;
