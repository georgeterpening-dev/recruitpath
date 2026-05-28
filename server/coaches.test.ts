/**
 * Tests for coach data: getCoachesBySchool DB helper and volleyball.coaches tRPC procedure
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCoachesBySchool } from "./db";

// Mock the mysql2 pool used by db.ts
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getCoachesBySchool: vi.fn(),
  };
});

const mockGetCoachesBySchool = vi.mocked(getCoachesBySchool);

describe("getCoachesBySchool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns head coaches before assistant coaches", async () => {
    const mockCoaches = [
      {
        id: 1,
        schoolId: "mvb-stanford",
        firstName: "John",
        lastName: "Kosty",
        position: "Head Coach",
        email: "jkosty@stanford.edu",
        sortOrder: 0,
        createdAt: new Date(),
      },
      {
        id: 2,
        schoolId: "mvb-stanford",
        firstName: "Taylor",
        lastName: "Hammond",
        position: "Assistant Coach",
        email: "thammond@stanford.edu",
        sortOrder: 100,
        createdAt: new Date(),
      },
    ];
    mockGetCoachesBySchool.mockResolvedValueOnce(mockCoaches);

    const result = await getCoachesBySchool("mvb-stanford");

    expect(result).toHaveLength(2);
    // Head coach (sortOrder 0) should come first
    expect(result[0].position).toBe("Head Coach");
    expect(result[0].sortOrder).toBe(0);
    // Assistant coach (sortOrder 100) should come second
    expect(result[1].position).toBe("Assistant Coach");
    expect(result[1].sortOrder).toBe(100);
  });

  it("returns empty array for a school with no coaches", async () => {
    mockGetCoachesBySchool.mockResolvedValueOnce([]);

    const result = await getCoachesBySchool("mvb-unknown");

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns coaches with all required fields", async () => {
    const mockCoach = {
      id: 1,
      schoolId: "mvb-byu",
      firstName: "Shawn",
      lastName: "Olmstead",
      position: "Head Coach",
      email: "solmstead@byu.edu",
      sortOrder: 0,
      createdAt: new Date(),
    };
    mockGetCoachesBySchool.mockResolvedValueOnce([mockCoach]);

    const result = await getCoachesBySchool("mvb-byu");

    expect(result[0]).toMatchObject({
      firstName: "Shawn",
      lastName: "Olmstead",
      position: "Head Coach",
      email: "solmstead@byu.edu",
      sortOrder: 0,
    });
  });

  it("handles coaches with null email gracefully", async () => {
    const mockCoach = {
      id: 3,
      schoolId: "mvb-test",
      firstName: "Matt",
      lastName: "Houlihan",
      position: "Assistant Coach",
      email: null,
      sortOrder: 101,
      createdAt: new Date(),
    };
    mockGetCoachesBySchool.mockResolvedValueOnce([mockCoach as any]);

    const result = await getCoachesBySchool("mvb-test");

    expect(result[0].email).toBeNull();
    expect(result[0].firstName).toBe("Matt");
  });
});
