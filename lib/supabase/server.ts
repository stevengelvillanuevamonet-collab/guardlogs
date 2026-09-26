import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Reads the guard's session from cookies set by
 * `middleware.ts`, so Row Level Security policies scoped `to authenticated`
 * see the signed-in guard.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — the session cookie is
            // still refreshed by middleware.ts on the next request, so this
            // is safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. Bypasses Row Level Security —
 * only ever import this in server-only code. Used by scripts/create-guard.mjs
 * to provision guard accounts; not used in normal request handling.
 */
export function createAdminSupabaseClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
