/**
 * Mock fetch interceptor for VITE_MOCK=true preview mode.
 * Intercepts all /api/trpc requests and returns realistic fake data
 * without needing a real server or database.
 */
import {
  MOCK_USER,
  MOCK_SUBSCRIPTION_STATUS,
  MOCK_SCHOOLS,
  MOCK_OPENING_COUNTS,
  MOCK_OUTREACH_LIST,
  MOCK_OUTREACH_TRACKER,
  MOCK_ATHLETE_PROFILE,
  MOCK_GMAIL_STATUS,
  MOCK_COACHES,
  MOCK_PLAYERS,
  MOCK_SCHOOL_LINKS,
  MOCK_EMAILS_SENT_COUNT,
  MOCK_ACTIVE_SCHOOL_IDS,
  MOCK_SENT_SCHOOL_IDS,
  MOCK_GENERATED_EMAIL,
  MOCK_FOLLOW_UP_EMAIL,
} from "./mockData";

// tRPC superjson response envelope
function trpcOk(data: unknown) {
  return { result: { data: { json: data } } };
}

function trpcErr(message: string) {
  return { error: { message, code: -32600 } };
}

// Map each tRPC procedure path to its mock response
function getMockForProcedure(procedure: string, _input: unknown): unknown {
  switch (procedure) {
    // ── Auth ──────────────────────────────────────────────────────────────
    case "auth.me":
      return MOCK_USER;
    case "auth.logout":
      return { success: true };
    case "auth.dismissWelcome":
      return { success: true };

    // ── Subscription ──────────────────────────────────────────────────────
    case "subscription.status":
      return MOCK_SUBSCRIPTION_STATUS;
    case "subscription.createCheckout":
      return { sessionUrl: null };
    case "subscription.verifySession":
      return { activated: true };
    case "subscription.notifyProInterest":
      return { success: true };
    case "subscription.createPortal":
      return { url: null };

    // ── Volleyball / Schools ──────────────────────────────────────────────
    case "volleyball.schools":
      return MOCK_SCHOOLS;
    case "volleyball.school":
      return MOCK_SCHOOLS[0];
    case "volleyball.openingCounts":
      return MOCK_OPENING_COUNTS;
    case "volleyball.coaches":
      return MOCK_COACHES;
    case "volleyball.players":
      return MOCK_PLAYERS;
    case "volleyball.links":
      return MOCK_SCHOOL_LINKS;
    case "volleyball.generate":
      return MOCK_GENERATED_EMAIL;

    // ── Outreach List ─────────────────────────────────────────────────────
    case "outreach.list":
      return MOCK_OUTREACH_LIST;
    case "outreach.add":
      return MOCK_OUTREACH_LIST[0];
    case "outreach.remove":
      return { success: true };

    // ── Outreach Tracker ──────────────────────────────────────────────────
    case "outreachTracker.list":
      return MOCK_OUTREACH_TRACKER;
    case "outreachTracker.emailsSentCount":
      return MOCK_EMAILS_SENT_COUNT;
    case "outreachTracker.activeSchoolIds":
      return Array.from(MOCK_ACTIVE_SCHOOL_IDS);
    case "outreachTracker.sentSchoolIds":
      return Array.from(MOCK_SENT_SCHOOL_IDS);
    case "outreachTracker.log":
      return { success: true };
    case "outreachTracker.updateStatus":
      return { success: true };
    case "outreachTracker.generateFollowUp":
      return MOCK_FOLLOW_UP_EMAIL;
    case "outreachTracker.generateReply":
      return MOCK_FOLLOW_UP_EMAIL;

    // ── Athlete Profile ───────────────────────────────────────────────────
    case "athleteProfile.get":
      return MOCK_ATHLETE_PROFILE;
    case "athleteProfile.save":
      return { success: true };

    // ── Gmail ─────────────────────────────────────────────────────────────
    case "gmail.status":
      return MOCK_GMAIL_STATUS;
    case "gmail.send":
      return { success: true, messageId: "mock-msg-123" };

    // ── System ────────────────────────────────────────────────────────────
    case "system.healthcheck":
      return { ok: true };

    default:
      console.warn(`[mock] Unhandled tRPC procedure: ${procedure}`);
      return null;
  }
}

const realFetch = globalThis.fetch;

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

  // Only intercept /api/trpc calls
  if (!url.includes("/api/trpc")) {
    return realFetch(input, init);
  }

  // Extract procedure name(s) from URL path
  // e.g. /api/trpc/auth.me,subscription.status or /api/trpc/outreach.list
  const match = url.match(/\/api\/trpc\/([^?]+)/);
  if (!match) return realFetch(input, init);

  const procedures = match[1].split(",");

  // Parse per-procedure inputs from query string or body
  let inputs: Record<string, unknown> = {};
  try {
    const queryMatch = url.match(/[?&]input=([^&]+)/);
    if (queryMatch) {
      const raw = JSON.parse(decodeURIComponent(queryMatch[1]));
      inputs = raw;
    } else if (init?.body && typeof init.body === "string") {
      const raw = JSON.parse(init.body);
      inputs = raw;
    }
  } catch {
    // ignore parse errors
  }

  const responses = procedures.map((proc, i) => {
    const input = inputs[String(i)] ?? null;
    const data = getMockForProcedure(proc, input);
    return trpcOk(data);
  });

  // Simulate a tiny async delay so React Query doesn't skip loading states
  return new Promise<Response>((resolve) => {
    setTimeout(() => {
      resolve(
        new Response(JSON.stringify(responses), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }, 80);
  });
}

export function installMockFetch() {
  globalThis.fetch = mockFetch as typeof fetch;
  console.info(
    "%c[RecruitPath Mock Mode] All API calls are mocked — no database needed.",
    "color: #F5C518; font-weight: bold; background: #090D18; padding: 4px 8px; border-radius: 4px;"
  );
}
