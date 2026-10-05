"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shiftDate } from "@/lib/utils";

export function ReportToolbar({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const go = (d: string) => d && router.push(`/reports?date=${d}`);
  const download = (format: "xlsx" | "docx") => `/api/reports/daily?date=${date}&format=${format}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 print:hidden">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => go(shiftDate(date, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={date}
          max={today}
          onChange={(e) => go(e.target.value)}
          className="min-w-0 flex-1 sm:w-44 sm:flex-none"
          aria-label="Report date"
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="Next day"
          disabled={date >= today}
          onClick={() => go(shiftDate(date, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {date !== today && (
          <Button variant="ghost" size="sm" onClick={() => go(today)}>
            Today
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
  );
}
