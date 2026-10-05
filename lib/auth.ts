import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase/server";
import { getRole, isDisabled, type AppRole } from "./roles";

export interface SessionUser {
  user: User;
  role: AppRole;
}

/**
 * The signed-in user and their role, or null. Wrapped in React's cache() so the
 * header, the page and any data loaders share one auth round-trip per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || isDisabled(user)) return null;
  return { user, role: getRole(user) };
});

/** For server actions and data loaders: throws unless the caller is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) throw new Error("Not signed in.");
  if (session.role !== "admin") throw new Error("Administrator access required.");
  return session;
}

/** For admin pages: bounce anyone who isn't an admin (middleware also enforces this). */
export async function requireAdminPage(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");
  return session;
}
