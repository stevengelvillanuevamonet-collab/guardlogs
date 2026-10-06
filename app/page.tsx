import { getSessionUser } from "@/lib/auth";
import { getActiveVisitors, getRecentLogs } from "@/lib/actions";
import { CheckInForm } from "@/components/check-in-form";
import { ActiveVisitorsTable } from "@/components/active-visitors-table";
import { RecentLogTable } from "@/components/recent-log-table";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function GuardhousePage() {
  const session = await getSessionUser();

  const [activeVisitors, recentLogs] = await Promise.all([
    getActiveVisitors(),
    getRecentLogs(50),
  ]);

  return (
    <AppShell email={session?.user.email} role={session?.role}>
      <main className="container grid grid-cols-1 gap-4 py-5 sm:gap-6 sm:py-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <CheckInForm />
        </div>

        <div className="grid min-w-0 gap-4 sm:gap-6">
          <ActiveVisitorsTable initialVisitors={activeVisitors} />
          <RecentLogTable logs={recentLogs} />
        </div>
      </main>
    </AppShell>
  );
}
