/**
 * Outreach Tracker tests
 * Tests: logEmail, updateStatus, list, emailsSentCount, activeSchoolIds
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLogSentEmail = vi.fn();
const mockUpdateEmailStatus = vi.fn();
const mockGetLatestEmailPerSchool = vi.fn();
const mockGetEmailsSentCount = vi.fn();
const mockGetActiveOutreachSchoolIds = vi.fn();

vi.mock("./db", () => ({
  logSentEmail: (...args: unknown[]) => mockLogSentEmail(...args),
  updateEmailStatus: (...args: unknown[]) => mockUpdateEmailStatus(...args),
  getLatestEmailPerSchool: (...args: unknown[]) => mockGetLatestEmailPerSchool(...args),
  getEmailsSentCount: (...args: unknown[]) => mockGetEmailsSentCount(...args),
  getActiveOutreachSchoolIds: (...args: unknown[]) => mockGetActiveOutreachSchoolIds(...args),
  // other db helpers used by routers
  getUserById: vi.fn(),
  getUserTotalSchoolsAdded: vi.fn().mockResolvedValue(0),
  addToOutreachList: vi.fn(),
  removeFromOutreachList: vi.fn(),
  getOutreachList: vi.fn().mockResolvedValue([]),
  getSchoolById: vi.fn(),
  getAllSchools: vi.fn().mockResolvedValue([]),
  getCoachesBySchool: vi.fn().mockResolvedValue([]),
  getCoachBySchoolId: vi.fn().mockResolvedValue(null),
}));

vi.mock("./gmail", () => ({
  getGmailStatus: vi.fn().mockResolvedValue({ connected: false, email: null, emailsSent: 0 }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUser = { id: 42, email: "test@example.com", name: "Test User", role: "user" as const };

function makeCtx(user = mockUser) {
  return { user, req: { headers: { cookie: "" } } as unknown as import("express").Request };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("outreachTracker.log", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls logSentEmail with correct fields", async () => {
    mockLogSentEmail.mockResolvedValue({ id: 1 });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    await caller.outreachTracker.log({
      schoolId: "school-abc",
      schoolName: "Test University",
      coachName: "Coach Smith",
      coachEmail: "coach@test.edu",
      subject: "Prospective Athlete",
      body: "Dear Coach Smith,\n\nI am interested in your program.",
    });

    expect(mockLogSentEmail).toHaveBeenCalledWith({
      userId: 42,
      schoolId: "school-abc",
      schoolName: "Test University",
      coachName: "Coach Smith",
      coachEmail: "coach@test.edu",
      subject: "Prospective Athlete",
      body: "Dear Coach Smith,\n\nI am interested in your program.",
    });
  });

  it("throws UNAUTHORIZED when user is not authenticated", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} } as any);

    await expect(
      caller.outreachTracker.log({
        schoolId: "school-abc",
        schoolName: "Test University",
        coachName: "Coach Smith",
        coachEmail: "coach@test.edu",
        subject: "Subject",
        body: "Body",
      })
    ).rejects.toThrow();
  });
});

describe("outreachTracker.updateStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateEmailStatus with userId, schoolId, and status", async () => {
    mockUpdateEmailStatus.mockResolvedValue({ success: true });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    await caller.outreachTracker.updateStatus({
      schoolId: "school-abc",
      status: "response_received",
    });

    expect(mockUpdateEmailStatus).toHaveBeenCalledWith(42, "school-abc", "response_received");
  });
});

describe("outreachTracker.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns rows from getLatestEmailPerSchool", async () => {
    const mockRows = [
      {
        id: 1,
        userId: 42,
        schoolId: "school-abc",
        schoolName: "Test University",
        coachName: "Coach Smith",
        coachEmail: "coach@test.edu",
        subject: "Prospective Athlete",
        body: "Dear Coach...",
        status: "no_response",
        sentAt: new Date("2026-03-01"),
      },
    ];
    mockGetLatestEmailPerSchool.mockResolvedValue(mockRows);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    const result = await caller.outreachTracker.list();
    expect(result).toHaveLength(1);
    expect(result[0].schoolName).toBe("Test University");
  });

  it("returns empty array when no emails sent", async () => {
    mockGetLatestEmailPerSchool.mockResolvedValue([]);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    const result = await caller.outreachTracker.list();
    expect(result).toEqual([]);
  });
});

describe("outreachTracker.emailsSentCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the count from getEmailsSentCount", async () => {
    mockGetEmailsSentCount.mockResolvedValue(7);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    const count = await caller.outreachTracker.emailsSentCount();
    expect(count).toBe(7);
  });
});

describe("outreachTracker.activeSchoolIds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active school IDs", async () => {
    mockGetActiveOutreachSchoolIds.mockResolvedValue(new Set(["school-abc", "school-xyz"]));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    const ids = await caller.outreachTracker.activeSchoolIds();
    expect(ids).toContain("school-abc");
    expect(ids).toContain("school-xyz");
  });

  it("returns empty array when no active schools", async () => {
    mockGetActiveOutreachSchoolIds.mockResolvedValue(new Set());

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx() as any);

    const ids = await caller.outreachTracker.activeSchoolIds();
    expect(ids).toEqual([]);
  });
});
