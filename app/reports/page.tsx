import { getSessionUser } from "@/lib/auth";
import { getReport, parsePeriod } from "@/lib/reports";
import { AppShell } from "@/components/app-shell";
import { ReportToolbar } from "@/components/report-toolbar";
import { ReportDocument } from "@/components/report-document";
import { isValidDateString, todayInCampus } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visitor Reports — EGardMo" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const { period: periodParam, date: dateParam } = await searchParams;
  const today = todayInCampus();
  const period = parsePeriod(periodParam);
  const requested = dateParam && isValidDateString(dateParam) ? dateParam : today;
  const date = requested > today ? today : requested;

  const session = await getSessionUser();
  const report = await getReport(period, date);

  return (
    <AppShell email={session?.user.email} role={session?.role}>
      <main className="container grid grid-cols-1 gap-4 py-5 sm:gap-6 sm:py-8 print:p-0">
        <ReportToolbar period={period} date={date} today={today} />
        <ReportDocument report={report} />
      </main>
    </AppShell>
  );
}
