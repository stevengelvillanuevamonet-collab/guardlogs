import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveVisitors, getRecentLogs } from "@/lib/actions";
import { CheckInForm } from "@/components/check-in-form";
import { ActiveVisitorsTable } from "@/components/active-visitors-table";
import { RecentLogTable } from "@/components/recent-log-table";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function GuardhousePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [activeVisitors, recentLogs] = await Promise.all([
    getActiveVisitors(),
    getRecentLogs(50),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground font-mono text-sm font-semibold">
              GH
            </div>
            <div className="leading-tight">
              <p className="font-semibold">EGardMo</p>
              <p className="text-xs text-primary-foreground/70">
                Visitor check-in &amp; ID surrender
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-primary-foreground/80 sm:inline">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="container grid gap-6 py-8 lg:grid-cols-[380px_1fr]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <CheckInForm />
        </div>

        <div className="grid gap-6">
          <ActiveVisitorsTable initialVisitors={activeVisitors} />
          <RecentLogTable logs={recentLogs} />
        </div>
      </main>
    </div>
  );
}
