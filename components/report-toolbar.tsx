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
    <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => go(shiftDate(date, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={date}
          max={today}
          onChange={(e) => go(e.target.value)}
          className="w-44"
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

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="outline" asChild>
          <a href={download("docx")}>
            <FileText className="h-4 w-4" /> Word (.docx)
          </a>
        </Button>
        <Button variant="accent" asChild>
          <a href={download("xlsx")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
          </a>
        </Button>
      </div>
    </div>
  );
}
