import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the db module
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserOutreachCount: vi.fn().mockResolvedValue(0),
  getUserTotalSchoolsAdded: vi.fn().mockResolvedValue(0),
  getUserOutreachList: vi.fn().mockResolvedValue([]),
  addToOutreachList: vi.fn().mockResolvedValue({ id: 1, schoolId: "test-school" }),
  removeFromOutreachList: vi.fn().mockResolvedValue(undefined),
  updateUserPlan: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null), // null db skips DB writes in tests
}));

// Mock the stripe client
vi.mock("./stripe/client", () => ({
  getStripe: vi.fn().mockReturnValue({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/test-session",
        }),
        retrieve: vi.fn().mockResolvedValue({
          payment_status: "paid",
          metadata: { user_id: "1" },
          customer: "cus_test123",
          payment_intent: "pi_test123",
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://billing.stripe.com/test-portal",
        }),
      },
    },
  }),
}));

function createTestUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-123",
    email: "athlete@example.com",
    name: "Test Athlete",
    loginMethod: "manus",
    role: "user",
    plan: "free",
    hasPaidAccess: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePaymentIntentId: null,
    interestedInPro: false,
    totalSchoolsAdded: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createTestContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://recruitpath.test" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("subscription.status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns free status for a new user with no paid access", async () => {
    const user = createTestUser({ plan: "free", hasPaidAccess: false });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.status();

    expect(result).toMatchObject({
      plan: "free",
      hasPaidAccess: false,
      schoolsUsed: 0,
      schoolsLimit: 5,
      stripeCustomerId: null,
    });
  });

  it("returns full access status for a paid user", async () => {
    const user = createTestUser({
      plan: "pro",
      hasPaidAccess: true,
      stripeCustomerId: "cus_test123",
      stripePaymentIntentId: "pi_test123",
    });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.status();

    expect(result).toMatchObject({
      plan: "pro",
      hasPaidAccess: true,
      schoolsLimit: -1, // unlimited
      stripeCustomerId: "cus_test123",
    });
  });

  it("returns unlimited schools for paid user", async () => {
    const user = createTestUser({ hasPaidAccess: true, plan: "pro" });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.status();

    expect(result.schoolsLimit).toBe(-1);
  });
});

describe("subscription.createCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a one-time checkout session", async () => {
    process.env.STRIPE_FULL_ACCESS_PRICE_ID = "price_test_full_access";
    const user = createTestUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.createCheckout();

    expect(result).toHaveProperty("sessionUrl");
    expect(result.sessionUrl).toBe("https://checkout.stripe.com/test-session");
  });
});

describe("subscription.createPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when user has no Stripe customer ID", async () => {
    const user = createTestUser({ stripeCustomerId: null });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.subscription.createPortal()).rejects.toThrow(
      "No Stripe customer found"
    );
  });

  it("creates a portal session for a paid user", async () => {
    const user = createTestUser({
      hasPaidAccess: true,
      plan: "pro",
      stripeCustomerId: "cus_test123",
    });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.createPortal();

    expect(result).toHaveProperty("portalUrl");
    expect(result.portalUrl).toBe("https://billing.stripe.com/test-portal");
  });
});

describe("outreach.add", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows free user to add a school within lifetime limit", async () => {
    const { getUserTotalSchoolsAdded } = await import("./db");
    (getUserTotalSchoolsAdded as ReturnType<typeof vi.fn>).mockResolvedValueOnce(2);

    const user = createTestUser({ plan: "free", hasPaidAccess: false });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.outreach.add({
      schoolId: "school-1",
      schoolName: "University of Texas",
      coachName: "John Smith",
      sport: "Men's Volleyball",
      division: "D1",
    });

    expect(result).toHaveProperty("schoolId", "test-school");
  });

  it("blocks free user when lifetime counter is at limit (even if active count is low)", async () => {
    // Exploit scenario: user added 5 schools, removed 4, now has 1 active.
    // The lifetime counter is still 5, so the limit should block them.
    const { getUserTotalSchoolsAdded } = await import("./db");
    (getUserTotalSchoolsAdded as ReturnType<typeof vi.fn>).mockResolvedValueOnce(5);

    const user = createTestUser({ plan: "free", hasPaidAccess: false });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.outreach.add({
        schoolId: "school-6",
        schoolName: "Blocked School",
      })
    ).rejects.toThrow("SCHOOL_LIMIT_REACHED");
  });

  it("blocks free user when lifetime counter exceeds limit", async () => {
    const { getUserTotalSchoolsAdded } = await import("./db");
    (getUserTotalSchoolsAdded as ReturnType<typeof vi.fn>).mockResolvedValueOnce(7);

    const user = createTestUser({ plan: "free", hasPaidAccess: false });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.outreach.add({
        schoolId: "school-8",
        schoolName: "Another Blocked School",
      })
    ).rejects.toThrow("SCHOOL_LIMIT_REACHED");
  });

  it("allows paid user to add schools beyond free limit regardless of lifetime count", async () => {
    const { getUserTotalSchoolsAdded } = await import("./db");
    (getUserTotalSchoolsAdded as ReturnType<typeof vi.fn>).mockResolvedValueOnce(50);

    const user = createTestUser({ plan: "pro", hasPaidAccess: true });
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.outreach.add({
      schoolId: "school-51",
      schoolName: "Another School",
    });

    expect(result).toHaveProperty("schoolId");
  });
});

describe("outreach.remove", () => {
  it("removes a school from the outreach list", async () => {
    const user = createTestUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.outreach.remove({ schoolId: "school-1" });

    expect(result).toEqual({ success: true });
  });
});

describe("subscription.verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activates full access when payment is confirmed", async () => {
    const { getStripe } = await import("./stripe/client");
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
          retrieve: vi.fn().mockResolvedValue({
            payment_status: "paid",
            metadata: { user_id: "1" },
            customer: "cus_verified_123",
            payment_intent: "pi_verified_123",
          }),
        },
      },
      billingPortal: {
        sessions: { create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/test" }) },
      },
    });

    const user = createTestUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.verifySession({ sessionId: "cs_test_abc123" });

    expect(result.activated).toBe(true);
    expect(result.message).toContain("Full Access");
  });

  it("returns not activated when payment is unpaid", async () => {
    const { getStripe } = await import("./stripe/client");
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn(),
          retrieve: vi.fn().mockResolvedValue({
            payment_status: "unpaid",
            metadata: { user_id: "1" },
            customer: null,
            payment_intent: null,
          }),
        },
      },
      billingPortal: { sessions: { create: vi.fn() } },
    });

    const user = createTestUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.verifySession({ sessionId: "cs_test_unpaid" });

    expect(result.activated).toBe(false);
  });

  it("rejects when session belongs to a different user", async () => {
    const { getStripe } = await import("./stripe/client");
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn(),
          retrieve: vi.fn().mockResolvedValue({
            payment_status: "paid",
            metadata: { user_id: "999" }, // Different user
            customer: "cus_other",
            payment_intent: "pi_other",
          }),
        },
      },
      billingPortal: { sessions: { create: vi.fn() } },
    });

    const user = createTestUser(); // user.id = 1
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.subscription.verifySession({ sessionId: "cs_test_wrong_user" })
    ).rejects.toThrow("Session does not belong to this user");
  });
});

describe("outreach.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user's outreach list", async () => {
    const { getUserOutreachList } = await import("./db");
    (getUserOutreachList as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 1,
        userId: 1,
        schoolId: "school-1",
        schoolName: "UCLA",
        coachName: "John Hawks",
        sport: "Men's Volleyball",
        division: "D1",
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        schoolId: "school-2",
        schoolName: "USC",
        coachName: "Jeff Nygaard",
        sport: "Men's Volleyball",
        division: "D1",
        createdAt: new Date(),
      },
    ]);

    const user = createTestUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.outreach.list();

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("schoolId", "school-1");
    expect(result[1]).toHaveProperty("schoolId", "school-2");
  });

  it("returns empty array when user has no schools", async () => {
    const { getUserOutreachList } = await import("./db");
    (getUserOutreachList as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const user = createTestUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.outreach.list();

    expect(result).toEqual([]);
  });
});
