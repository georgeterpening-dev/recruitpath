import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/types/manusTypes";
import type { Request, Response } from "express";

describe("volleyball.debugRoster query", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx: TrpcContext = {
      req: {} as Request,
      res: {} as Response,
      user: null, // public procedure — no auth needed
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should return roster statistics with correct shape", async () => {
    const result = await caller.volleyball.debugRoster();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalPlayerRows");
    expect(result).toHaveProperty("sample");
    expect(result).toHaveProperty("uniquePlayersByYear");
    expect(result).toHaveProperty("schoolsWithPlayers");
    expect(result).toHaveProperty("schoolsWithHasRosterDataTrue");
  });

  it("should return numeric counts", async () => {
    const result = await caller.volleyball.debugRoster();
    if ("error" in result) return; // skip if no DB

    expect(typeof result.totalPlayerRows).toBe("number");
    expect(typeof result.schoolsWithPlayers).toBe("number");
    expect(typeof result.schoolsWithHasRosterDataTrue).toBe("number");
    expect(result.totalPlayerRows).toBeGreaterThanOrEqual(0);
  });

  it("should return sample array with at most 10 entries", async () => {
    const result = await caller.volleyball.debugRoster();
    if ("error" in result) return;

    expect(Array.isArray(result.sample)).toBe(true);
    expect(result.sample.length).toBeLessThanOrEqual(10);
  });

  it("should return uniquePlayersByYear array with year and count fields", async () => {
    const result = await caller.volleyball.debugRoster();
    if ("error" in result) return;

    expect(Array.isArray(result.uniquePlayersByYear)).toBe(true);
    if (result.uniquePlayersByYear.length > 0) {
      const entry = result.uniquePlayersByYear[0];
      expect(entry).toHaveProperty("year");
      expect(entry).toHaveProperty("count");
    }
  });

  it("should be callable as a public procedure (no auth required)", async () => {
    const ctx: TrpcContext = {
      req: {} as Request,
      res: {} as Response,
      user: null,
    };
    const publicCaller = appRouter.createCaller(ctx);
    const result = await publicCaller.volleyball.debugRoster();
    expect(result).toBeDefined();
  });
});
