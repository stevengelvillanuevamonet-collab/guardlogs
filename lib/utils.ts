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
