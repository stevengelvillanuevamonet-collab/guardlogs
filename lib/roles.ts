import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "guard";

type RoleSource = Pick<User, "app_metadata"> | null | undefined;

/**
 * Role of a signed-in user. It lives in `app_metadata`, which only the
 * service role key can write, so a user can't promote themselves.
 * Accounts with no role (every guard created before roles existed) are guards.
 */
export function getRole(user: RoleSource): AppRole {
  return user?.app_metadata?.role === "admin" ? "admin" : "guard";
}

/** True when an admin has deactivated this account. */
export function isDisabled(user: RoleSource): boolean {
  return user?.app_metadata?.disabled === true;
}

/** Where each role lands after signing in. */
export function homeFor(role: AppRole): string {
  return role === "admin" ? "/admin" : "/";
}
