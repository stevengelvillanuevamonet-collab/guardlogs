import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveVisitors, getRecentLogs } from "@/lib/actions";
import { CheckInForm } from "@/components/check-in-form";
import { ActiveVisitorsTable } from "@/components/active-visitors-table";
import { RecentLogTable } from "@/components/recent-log-table";
import { SignOutButton } from "@/components/sign-out-button";
import { LogoMark } from "@/components/logo-mark";

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
      <header className="relative bg-primary text-primary-foreground">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/40 bg-accent/15">
              <LogoMark className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold tracking-tight">
                EGardMo
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60">
                Visitor Check-in &amp; ID Register
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-primary-foreground/70 sm:inline">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
        {/* Brass hairline rule stands in for a drop shadow — the divider between rail and desk */}
        <div className="h-px brass-rule" />
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
