import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRole, homeFor, isDisabled } from "@/lib/roles";

/**
 * Refreshes the Supabase session cookie on every request and enforces who can
 * see what:
 *   - signed-out visitors can only reach /login and the public /apply form
 *   - /admin/** is for admins only; guards are sent back to the guard desk
 *   - accounts an admin has deactivated are signed out immediately
 * There is still no public sign-up: guard accounts are only created by an
 * admin (directly, or by approving an application).
 */
export async function updateSession(request: NextRequest) {
  // Default pass-through response; cookies get attached below.
  let response = NextResponse.next({ request });

  // Supabase client that syncs session cookies onto the request/response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate the session with Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Classify the requested route.
  const path = request.nextUrl.pathname;
  const isLoginRoute = path.startsWith("/login");
  const isApplyRoute = path === "/apply" || path.startsWith("/apply/");
  const isPublicRoute = isLoginRoute || isApplyRoute;

  // Redirect, but keep any session cookies Supabase just refreshed or cleared.
  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // Signed out: only public routes allowed.
  if (!user) {
    return isPublicRoute ? response : redirectTo("/login");
  }

  // Deactivated account: sign out immediately.
  if (isDisabled(user)) {
    await supabase.auth.signOut();
    return redirectTo("/login", "?notice=disabled");
  }

  // Signed-in users skip login and go home.
  const role = getRole(user);

  if (isLoginRoute) {
    return redirectTo(homeFor(role));
  }

  // Keep non-admins out of /admin.
  if ((path === "/admin" || path.startsWith("/admin/")) && role !== "admin") {
    return redirectTo("/");
  }

  return response;
}
