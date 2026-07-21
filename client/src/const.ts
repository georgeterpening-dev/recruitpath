export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the RecruitPath sign-in URL.
 * Optionally encodes a returnPath so the sign-in page can redirect back after login.
 */
export const getLoginUrl = (returnPath?: string) => {
  const base = "/signin";
  if (returnPath && returnPath !== "/signin" && returnPath !== "/signup") {
    return `${base}?return=${encodeURIComponent(returnPath)}`;
  }
  return base;
};
