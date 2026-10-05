"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Status = "connecting" | "live" | "polling";

// Safety net: if the realtime socket isn't connected (flaky tablet Wi-Fi, a
// sleeping tab), fall back to re-fetching on a timer so the board never goes stale.
const POLL_WHEN_OFFLINE_MS = 15_000;
const POLL_WHEN_LIVE_MS = 120_000;
// A burst of changes (e.g. several check-ins at once) triggers one refresh.
const DEBOUNCE_MS = 350;

/**
 * Keeps the server-rendered visitor lists up to date without a manual reload.
 *
 * It listens to Postgres changes on `visitor_logs` through Supabase Realtime
 * (any guard's check-in or check-out, on any device) and calls router.refresh(),
 * which re-runs the page's server data fetch — so ID-photo signed URLs and
 * guard names stay correct too. Renders a small "Live" pill.
 */
export function LiveRefresh({ className }: { className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<Status>("connecting");

  useEffect(() => {
    const supabase = createClient();

    const refresh = () => startTransition(() => router.refresh());
    const refreshSoon = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(refresh, DEBOUNCE_MS);
    };
    const setBoth = (next: Status) => {
      statusRef.current = next;
      setStatus(next);
    };

    const channel = supabase
      .channel("visitor-logs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_logs" }, refreshSoon)
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setBoth("live");
          refresh(); // catch anything that changed while we were connecting
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setBoth("polling");
        }
      });

    // Poll only while the tab is visible; refresh right away when it comes back.
    let poll: ReturnType<typeof setTimeout>;
    const schedulePoll = () => {
      const delay = statusRef.current === "live" ? POLL_WHEN_LIVE_MS : POLL_WHEN_OFFLINE_MS;
      poll = setTimeout(() => {
        if (document.visibilityState === "visible") refresh();
        schedulePoll();
      }, delay);
    };
    schedulePoll();

    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      clearTimeout(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const label = status === "live" ? "Live" : status === "connecting" ? "Connecting…" : "Auto-refreshing";

  return (
    <span
      role="status"
      aria-live="polite"
      title={
        status === "live"
          ? "Updates appear instantly — no need to refresh."
          : status === "connecting"
            ? "Connecting to live updates…"
            : "Live connection unavailable — checking for updates every few seconds."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        status === "live"
          ? "border-transparent bg-[hsl(var(--signal-in-bg))] text-[hsl(var(--signal-in))]"
          : "border-border bg-secondary text-muted-foreground",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {status === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--signal-in))] opacity-50 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            status === "live" ? "bg-[hsl(var(--signal-in))]" : "bg-muted-foreground/60"
          )}
        />
      </span>
      {label}
    </span>
  );
}
