import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveVisitors, getRecentLogs } from "@/lib/actions";
import { CheckInForm } from "@/components/check-in-form";
import { ActiveVisitorsTable } from "@/components/active-visitors-table";
import { RecentLogTable } from "@/components/recent-log-table";
import { AppHeader } from "@/components/app-header";

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
      <AppHeader email={user?.email} active="dashboard" />

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
