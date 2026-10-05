import { LogoMark } from "@/components/logo-mark";
import { SignOutButton } from "@/components/sign-out-button";
import { HeaderNav } from "@/components/header-nav";
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

export async function AppHeader({
  email,
  role = "guard",
}: {
  email?: string | null;
  role?: "admin" | "guard";
  /** @deprecated The active link is now detected from the URL. */
  active?: string;
}) {
  const pending = role === "admin" ? await countPendingApplications() : 0;

  return (
    <header className="relative bg-primary text-primary-foreground print:hidden">
      <div className="container flex min-h-[4.25rem] items-center justify-between gap-3 py-3 sm:h-20 sm:py-0">
        <div className="flex min-w-0 items-center gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/15">
              <LogoMark className="h-5 w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-serif text-lg font-semibold tracking-tight">EGardMo</p>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-primary-foreground/60 sm:text-xs sm:tracking-[0.14em]">
                {role === "admin" ? "Administration" : "Visitor Check-in & ID Register"}
              </p>
            </div>
          </div>
          <HeaderNav role={role} pendingApplications={pending} variant="desktop" />
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {role === "admin" && (
            <span className="rounded-full border border-accent/50 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
              Admin
            </span>
          )}
          <span className="hidden text-sm text-primary-foreground/70 md:inline">{email}</span>
          <SignOutButton />
        </div>
      </div>
      <HeaderNav role={role} pendingApplications={pending} variant="mobile" />
      <div className="h-px brass-rule" />
    </header>
  );
}
