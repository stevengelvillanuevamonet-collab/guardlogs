import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Refresh the Supabase session and apply route guards on every matched request.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Skip static assets and image files.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
