"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, shiftDate, shiftMonth } from "@/lib/utils";

type Period = "daily" | "monthly" | "yearly";

const TABS: { id: Period; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

/** Move the anchor date one period back (-1) or forward (+1). */
function shiftAnchor(period: Period, date: string, step: number): string {
  if (period === "daily") return shiftDate(date, step);
  if (period === "monthly") return `${shiftMonth(date.slice(0, 7), step)}-01`;
  return `${Number(date.slice(0, 4)) + step}-01-01`;
}

export function ReportToolbar({
  period,
  date,
  today,
}: {
  period: Period;
  date: string;
  today: string;
}) {
  const router = useRouter();
  const go = (p: Period, d: string) => d && router.push(`/reports?period=${p}&date=${d}`);

  const month = date.slice(0, 7);
  const year = date.slice(0, 4);
  const isCurrent =
    period === "daily"
      ? date >= today
      : period === "monthly"
        ? month >= today.slice(0, 7)
        : year >= today.slice(0, 4);
  const noun = period === "daily" ? "day" : period === "monthly" ? "month" : "year";
  const download = (format: "xlsx" | "docx") =>
    `/api/reports/export?period=${period}&date=${date}&format=${format}`;

  // When switching period, keep the anchor but never jump past today.
  const switchTo = (p: Period) => go(p, date > today ? today : date);

  return (
    <div className="grid gap-3 print:hidden">
      <div
        role="tablist"
        aria-label="Report period"
        className="inline-flex w-full rounded-lg border bg-card p-1 sm:w-auto sm:self-start"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={period === t.id}
            onClick={() => switchTo(t.id)}
            className={cn(
              "flex-1 rounded-md px-5 py-1.5 text-sm font-medium transition-colors sm:flex-none",
              period === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={`Previous ${noun}`}
            onClick={() => go(period, shiftAnchor(period, date, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {period === "daily" && (
            <Input
              type="date"
              value={date}
              max={today}
              onChange={(e) => go("daily", e.target.value)}
              className="min-w-0 flex-1 sm:w-44 sm:flex-none"
              aria-label="Report date"
            />
          )}
          {period === "monthly" && (
            <Input
              type="month"
              value={month}
              max={today.slice(0, 7)}
              onChange={(e) => e.target.value && go("monthly", `${e.target.value}-01`)}
              className="min-w-0 flex-1 sm:w-44 sm:flex-none"
              aria-label="Report month"
            />
          )}
          {period === "yearly" && (
            <Input
              type="number"
              value={year}
              min={2000}
              max={Number(today.slice(0, 4))}
              onChange={(e) => {
                const y = e.target.value;
                if (/^\d{4}$/.test(y) && Number(y) >= 2000 && Number(y) <= Number(today.slice(0, 4)))
                  go("yearly", `${y}-01-01`);
              }}
              className="min-w-0 flex-1 sm:w-32 sm:flex-none"
              aria-label="Report year"
            />
          )}

          <Button
            variant="outline"
            size="icon"
            aria-label={`Next ${noun}`}
            disabled={isCurrent}
            onClick={() => go(period, shiftAnchor(period, date, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrent && (
            <Button variant="ghost" size="sm" onClick={() => go(period, today)}>
              {period === "daily" ? "Today" : period === "monthly" ? "This month" : "This year"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" asChild>
            <a href={download("docx")}>
              <FileText className="h-4 w-4" /> Word (.docx)
            </a>
          </Button>
          <Button variant="accent" asChild className="col-span-2 sm:col-span-1">
            <a href={download("xlsx")}>
              <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
