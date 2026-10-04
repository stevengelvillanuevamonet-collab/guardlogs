import { createServerSupabaseClient } from "./supabase/server";
import type { VisitorLog } from "./types";
import {
  campusDayRange,
  formatDuration,
  formatFullDateTime,
  formatReportDate,
  formatReportTime,
  isValidDateString,
} from "./utils";

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

export interface DailyReport {
  date: string; // YYYY-MM-DD
  label: string; // "Sunday, October 4, 2026"
  generatedAt: string; // "Oct 4, 2026, 9:35 PM"
  rows: ReportRow[];
  stats: {
    total: number;
    stillInside: number;
    checkedOut: number;
    withVehicle: number;
  };
}

/**
 * Builds the daily visitor report for one campus calendar day: every visitor
 * whose check-in (time_in) falls on that day, in chronological order.
 * Requires a signed-in guard (RLS also enforces this).
 */
export async function getDailyReport(date: string): Promise<DailyReport> {
  if (!isValidDateString(date)) throw new Error("Invalid date.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not signed in.");

  const { start, end } = campusDayRange(date);
  const { data, error } = await supabase
    .from("visitor_logs")
    .select("*")
    .gte("time_in", start)
    .lt("time_in", end)
    .order("time_in", { ascending: true });

  if (error) throw new Error(error.message);

  const logs = (data ?? []) as VisitorLog[];
  const rows: ReportRow[] = logs.map((log, i) => {
    const inside = log.status === "Inside Campus";
    return {
      no: i + 1,
      visitor: log.visitor_name,
      plate: log.plate_number || "—",
      host: log.host_name,
      purpose: log.purpose,
      timeIn: formatReportTime(log.time_in, date),
      timeOut: log.time_out ? formatReportTime(log.time_out, date) : "—",
      duration: log.time_out ? formatDuration(log.time_in, log.time_out) : "—",
      status: inside ? "Still inside" : "Checked out",
      inside,
    };
  });

  const stillInside = rows.filter((r) => r.inside).length;

  return {
    date,
    label: formatReportDate(date),
    generatedAt: formatFullDateTime(new Date().toISOString()),
    rows,
    stats: {
      total: rows.length,
      stillInside,
      checkedOut: rows.length - stillInside,
      withVehicle: logs.filter((l) => !!l.plate_number).length,
    },
  };
}
