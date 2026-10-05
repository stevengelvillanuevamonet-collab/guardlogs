import type { Report } from "@/lib/reports";

/**
 * The printable report sheet, shared by the guard reports page and the admin
 * view. Daily reports show the visitor table; monthly and yearly reports add a
 * per-day / per-month summary ahead of it.
 */
export function ReportDocument({ report }: { report: Report }) {
  const { stats } = report;
  const periodWord =
    report.period === "daily" ? "on this date" : report.period === "monthly" ? "this month" : "this year";

  return (
    <article className="min-w-0 rounded-lg border bg-card p-4 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b pb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          EGardMo — Guardhouse Visitor Check-in &amp; ID Register
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight">{report.title}</h1>
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

      {report.breakdown.length > 0 && (
        <section className="border-b py-4 print:break-inside-avoid">
          <h2 className="mb-3 font-serif text-lg font-semibold">{report.breakdownTitle}</h2>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full max-w-3xl border-collapse text-sm print:text-[11px]">
              <thead>
                <tr className="bg-primary text-left text-primary-foreground print:bg-slate-900 [&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                  <th>{report.period === "monthly" ? "Day" : "Month"}</th>
                  <th className="text-right">Visitors</th>
                  <th className="text-right">Checked out</th>
                  <th className="text-right">Still inside</th>
                  <th className="text-right">With vehicle</th>
                </tr>
              </thead>
              <tbody className="font-mono-tabular">
                {report.breakdown.map((b) => (
                  <tr
                    key={b.label}
                    className={
                      "border-b even:bg-secondary/40 [&>td]:px-3 [&>td]:py-1.5 " +
                      (b.total === 0 ? "text-muted-foreground/70" : "")
                    }
                  >
                    <td className="font-sans">{b.label}</td>
                    <td className="text-right">{b.total}</td>
                    <td className="text-right">{b.checkedOut}</td>
                    <td className="text-right">{b.stillInside}</td>
                    <td className="text-right">{b.withVehicle}</td>
                  </tr>
                ))}
                <tr className="bg-secondary font-semibold [&>td]:px-3 [&>td]:py-2">
                  <td className="font-sans">Total</td>
                  <td className="text-right">{stats.total}</td>
                  <td className="text-right">{stats.checkedOut}</td>
                  <td className="text-right">{stats.stillInside}</td>
                  <td className="text-right">{stats.withVehicle}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report.rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No visitors were logged {periodWord}.
        </p>
      ) : (
        <div className="overflow-x-auto py-4 print:overflow-visible">
          {report.breakdown.length > 0 && (
            <h2 className="mb-3 font-serif text-lg font-semibold print:break-before-page">Visitor log</h2>
          )}
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

      <div className="mt-10 grid grid-cols-1 gap-8 sm:mt-12 sm:grid-cols-2 sm:gap-16 print:grid-cols-2 print:break-inside-avoid">
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
  );
}
