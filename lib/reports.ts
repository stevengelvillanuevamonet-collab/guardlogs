import { createServerSupabaseClient } from "./supabase/server";
import type { VisitorLog } from "./types";
import {
  campusDateOf,
  campusDayRange,
  campusMonthRange,
  campusYearRange,
  daysInMonth,
  formatDateAndTime,
  formatDuration,
  formatFullDateTime,
  formatMonthLabel,
  formatReportDate,
  formatReportTime,
  formatShortDay,
  isValidDateString,
  monthName,
} from "./utils";

export type ReportPeriod = "daily" | "monthly" | "yearly";

export const REPORT_PERIODS: ReportPeriod[] = ["daily", "monthly", "yearly"];

/** Reads ?period= safely; anything unknown falls back to daily. */
export function parsePeriod(value: string | null | undefined): ReportPeriod {
  return value === "monthly" || value === "yearly" ? value : "daily";
}

export interface ReportRow {
  no: number;
  visitor: string;
  plate: string;
  host: string;
  purpose: string;
  timeIn: string;
  timeOut: string;
  duration: string;
  status: string;
  inside: boolean;
}

/** One line of the per-day (monthly report) or per-month (yearly report) summary. */
export interface BreakdownRow {
  label: string;
  total: number;
  checkedOut: number;
  stillInside: number;
  withVehicle: number;
}

export interface Report {
  period: ReportPeriod;
  anchor: string; // YYYY-MM-DD — any date inside the reported period
  title: string; // "Monthly Visitor Report"
  label: string; // "Sunday, October 4, 2026" / "October 2026" / "2026"
  fileSlug: string; // "2026-10-04" / "2026-10" / "2026" — used in download names
  generatedAt: string; // "Oct 4, 2026, 9:35 PM"
  rows: ReportRow[];
  stats: {
    total: number;
    stillInside: number;
    checkedOut: number;
    withVehicle: number;
  };
  /** Empty for daily reports. */
  breakdownTitle: string;
  breakdown: BreakdownRow[];
}

/** Kept so existing imports of the old name keep working. */
export type DailyReport = Report;

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request
const MAX_ROWS = 50_000; // safety valve so a runaway range can't exhaust memory

const TITLES: Record<ReportPeriod, string> = {
  daily: "Daily Visitor Report",
  monthly: "Monthly Visitor Report",
  yearly: "Yearly Visitor Report",
};

function rangeFor(period: ReportPeriod, anchor: string) {
  if (period === "monthly") return campusMonthRange(anchor.slice(0, 7));
  if (period === "yearly") return campusYearRange(anchor.slice(0, 4));
  return campusDayRange(anchor);
}

function labelFor(period: ReportPeriod, anchor: string) {
  if (period === "monthly") return formatMonthLabel(anchor.slice(0, 7));
  if (period === "yearly") return anchor.slice(0, 4);
  return formatReportDate(anchor);
}

function slugFor(period: ReportPeriod, anchor: string) {
  if (period === "monthly") return anchor.slice(0, 7);
  if (period === "yearly") return anchor.slice(0, 4);
  return anchor;
}

/**
 * Builds the visitor report for one campus calendar day, month or year: every
 * visitor whose check-in (time_in) falls in that period, in chronological
 * order. Monthly and yearly reports add a per-day / per-month summary.
 * Requires a signed-in guard or admin (RLS also enforces this).
 */
export async function getReport(period: ReportPeriod, anchor: string): Promise<Report> {
  if (!isValidDateString(anchor)) throw new Error("Invalid date.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not signed in.");

  const { start, end } = rangeFor(period, anchor);

  // Page through the results so month/year reports aren't cut off at 1000 rows.
  const logs: VisitorLog[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("visitor_logs")
      .select("*")
      .gte("time_in", start)
      .lt("time_in", end)
      .order("time_in", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const page = (data ?? []) as VisitorLog[];
    logs.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  // Daily rows show a bare clock time when it falls on the report date; longer
  // periods always show the date (with the year for yearly reports).
  const formatTime = (iso: string) => {
    if (period === "daily") return formatReportTime(iso, anchor);
    return period === "yearly" ? formatFullDateTime(iso) : formatDateAndTime(iso);
  };

  const rows: ReportRow[] = logs.map((log, i) => {
    const inside = log.status === "Inside Campus";
    return {
      no: i + 1,
      visitor: log.visitor_name,
      plate: log.plate_number || "—",
      host: log.host_name,
      purpose: log.purpose,
      timeIn: formatTime(log.time_in),
      timeOut: log.time_out ? formatTime(log.time_out) : "—",
      duration: log.time_out ? formatDuration(log.time_in, log.time_out) : "—",
      status: inside ? "Still inside" : "Checked out",
      inside,
    };
  });

  const stillInside = rows.filter((r) => r.inside).length;

  return {
    period,
    anchor,
    title: TITLES[period],
    label: labelFor(period, anchor),
    fileSlug: slugFor(period, anchor),
    generatedAt: formatFullDateTime(new Date().toISOString()),
    rows,
    stats: {
      total: rows.length,
      stillInside,
      checkedOut: rows.length - stillInside,
      withVehicle: logs.filter((l) => !!l.plate_number).length,
    },
    breakdownTitle:
      period === "monthly" ? "Visitors per day" : period === "yearly" ? "Visitors per month" : "",
    breakdown: buildBreakdown(period, anchor, logs),
  };
}

/** Back-compat wrapper for the original daily-only API. */
export function getDailyReport(date: string): Promise<Report> {
  return getReport("daily", date);
}

function buildBreakdown(period: ReportPeriod, anchor: string, logs: VisitorLog[]): BreakdownRow[] {
  if (period === "daily") return [];

  // Pre-create every bucket so quiet days / months still appear as zero.
  const buckets = new Map<string, BreakdownRow>();
  if (period === "monthly") {
    const month = anchor.slice(0, 7);
    for (let d = 1; d <= daysInMonth(month); d++) {
      const key = `${month}-${String(d).padStart(2, "0")}`;
      buckets.set(key, { label: formatShortDay(key), total: 0, checkedOut: 0, stillInside: 0, withVehicle: 0 });
    }
  } else {
    const year = anchor.slice(0, 4);
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      buckets.set(key, { label: monthName(m), total: 0, checkedOut: 0, stillInside: 0, withVehicle: 0 });
    }
  }

  for (const log of logs) {
    const day = campusDateOf(log.time_in);
    const bucket = buckets.get(period === "monthly" ? day : day.slice(0, 7));
    if (!bucket) continue;
    bucket.total += 1;
    if (log.status === "Inside Campus") bucket.stillInside += 1;
    else bucket.checkedOut += 1;
    if (log.plate_number) bucket.withVehicle += 1;
  }

  return Array.from(buckets.values());
}
