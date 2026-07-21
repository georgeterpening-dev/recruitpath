import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getUserByOpenId } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Verify the RecruitPath session cookie (HS256 JWT signed with JWT_SECRET).
 * Returns the openId from the payload, or null if invalid/missing.
 */
async function verifySessionCookie(cookieHeader: string | undefined): Promise<string | null> {
  if (!cookieHeader) return null;

  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    const openId = payload.openId;
    if (typeof openId !== "string" || !openId) return null;
    return openId;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const openId = await verifySessionCookie(opts.req.headers.cookie);
    if (openId) {
      user = (await getUserByOpenId(openId)) ?? null;
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
