import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDailyReport } from "@/lib/reports";
import { AppHeader } from "@/components/app-header";
import { ReportToolbar } from "@/components/report-toolbar";
import { isValidDateString, todayInCampus } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daily Report — EGardMo" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = todayInCampus();
  const date = dateParam && isValidDateString(dateParam) ? dateParam : today;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const report = await getDailyReport(date);
  const { stats } = report;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <AppHeader email={user?.email} active="reports" />

      <main className="container grid gap-6 py-8 print:p-0">
        <ReportToolbar date={date} today={today} />

        <article className="rounded-lg border bg-card p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b pb-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              EGardMo — Guardhouse Visitor Check-in &amp; ID Register
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
              Daily Visitor Report
            </h1>
            <p className="text-base font-medium">{report.label}</p>
          </header>

          <dl className="grid grid-cols-2 gap-4 border-b py-4 sm:grid-cols-4">
            {[
              ["Total visitors", stats.total],
              ["Checked out", stats.checkedOut],
              ["Still inside", stats.stillInside],
              ["With vehicle", stats.withVehicle],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="font-mono-tabular text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {report.rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No visitors were logged on this date.
            </p>
          ) : (
            <div className="overflow-x-auto py-4 print:overflow-visible">
              <table className="w-full border-collapse text-sm print:text-[11px]">
                <thead>
                  <tr className="bg-primary text-left text-primary-foreground print:bg-slate-900 [&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                    <th className="w-10 text-center">No.</th>
                    <th>Visitor</th>
                    <th>Plate #</th>
                    <th>Visiting</th>
                    <th>Purpose of visit</th>
                    <th>Time in</th>
                    <th>Time out</th>
                    <th>Time inside</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr
                      key={r.no}
                      className="border-b align-top even:bg-secondary/40 print:break-inside-avoid [&>td]:px-3 [&>td]:py-2"
                    >
                      <td className="text-center text-muted-foreground">{r.no}</td>
                      <td className="font-medium">{r.visitor}</td>
                      <td className="font-mono-tabular">{r.plate}</td>
                      <td>{r.host}</td>
                      <td className="max-w-[260px]">{r.purpose}</td>
                      <td className="font-mono-tabular whitespace-nowrap">{r.timeIn}</td>
                      <td className="font-mono-tabular whitespace-nowrap">{r.timeOut}</td>
                      <td className="font-mono-tabular whitespace-nowrap">{r.duration}</td>
                      <td className={r.inside ? "font-semibold text-amber-800" : ""}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-16 print:break-inside-avoid">
            {["Prepared by (Guard on duty)", "Noted by (Security head)"].map((label) => (
              <div key={label}>
                <div className="h-10 border-b border-foreground/60" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {label} — signature over printed name / date
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">Generated {report.generatedAt}</p>
        </article>
      </main>
    </div>
  );
}
