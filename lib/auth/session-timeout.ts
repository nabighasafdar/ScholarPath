/** Cookie storing when the current browser login window began (epoch ms). */
export const AUTH_STARTED_COOKIE = "sp_auth_started_at";

/** Absolute max login duration before re-auth is required. Default 2 hours. */
export function getAuthSessionMaxMs(): number {
  const raw = process.env.AUTH_SESSION_MAX_HOURS;
  const hours = raw ? Number(raw) : 2;
  if (!Number.isFinite(hours) || hours <= 0) return 2 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

/**
 * Cookie must outlive the session timeout — expiry is enforced by the
 * timestamp value inside, not by cookie maxAge. If the cookie vanished at
 * the same time as the timeout, we'd treat the next visit as a fresh login.
 */
export function authStartedCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}
