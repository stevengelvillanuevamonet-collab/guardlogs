import { cookies } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Number of applications waiting for review — shown as a badge on the admin nav.
async function countPendingApplications(): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient();
    const { count } = await supabase
      .from("guard_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return count ?? 0;
  } catch {
    return 0; // table not migrated yet, or a transient error — never break the page for a badge
  }
}

/**
 * Page chrome shared by the guard desk, reports and every admin page:
 * collapsible sidebar + slim top bar + the page content.
 * The collapsed/expanded choice is stored in a cookie so the server renders the
 * right width on first paint (no flash on reload).
 */
export async function AppShell({
  email,
  role = "guard",
  children,
}: {
  email?: string | null;
  role?: "admin" | "guard";
  children: React.ReactNode;
}) {
  const [pending, cookieStore] = await Promise.all([
    role === "admin" ? countPendingApplications() : Promise.resolve(0),
    cookies(),
  ]);
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar email={email} role={role} pendingApplications={pending} />
      <SidebarInset>
        <AppTopbar email={email} role={role} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
