import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// All check-in/check-out times are pinned to this timezone for display,
// regardless of whether the formatting happens on the server (Vercel's
// functions run in UTC) or a guard's device (which could be set to any
// timezone). Without this, the same event can show a different time
// depending on where/how it's rendered — not acceptable for a security log.
// Change this if the campus is ever in a different timezone.
const CAMPUS_TIMEZONE = "Asia/Manila";

/** e.g. "9:35 PM" */
export function formatTimeOfDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPUS_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** e.g. "Sep 26, 9:35 PM" */
export function formatDateAndTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPUS_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

// Fixed UTC offset matching CAMPUS_TIMEZONE. Asia/Manila has no daylight
// saving, so a constant offset is safe. Update both together if the campus
// timezone ever changes.
const CAMPUS_UTC_OFFSET = "+08:00";

/** Calendar date (YYYY-MM-DD) of an instant, as seen on campus. */
export function campusDateOf(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  // The en-CA locale formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Today's campus date (YYYY-MM-DD). */
export function todayInCampus(): string {
  return campusDateOf(new Date());
}

/** True for a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** [start, end) ISO timestamps covering one campus calendar day. */
export function campusDayRange(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00${CAMPUS_UTC_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Shift a YYYY-MM-DD date by a number of days. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** e.g. "Sunday, October 4, 2026" */
export function formatReportDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** e.g. "Oct 4, 2026, 9:35 PM" */
export function formatFullDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPUS_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/**
 * Time for a report row: just the clock time when it falls on the report date,
 * otherwise date + time so overnight stays are not ambiguous.
 */
export function formatReportTime(iso: string, reportDate: string): string {
  return campusDateOf(iso) === reportDate ? formatTimeOfDay(iso) : formatDateAndTime(iso);
}

/** e.g. "2h 15m", "45m", "< 1m" */
export function formatDuration(startIso: string, endIso: string): string {
  const minutes = Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (minutes < 1) return "< 1m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
