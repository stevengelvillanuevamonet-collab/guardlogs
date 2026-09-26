"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./supabase/server";
import type { CheckInInput, VisitorLog } from "./types";

/** Gets the current Supabase client + signed-in guard, or throws. */
async function requireGuard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Not signed in.");
  return { supabase, user };
}

/** Check a visitor in. Logs time_in with the server's clock at the moment of the request. */
export async function checkInVisitor(input: CheckInInput) {
  const { supabase, user } = await requireGuard();

  const visitor_name = input.visitor_name?.trim();
  const host_name = input.host_name?.trim();
  const purpose = input.purpose?.trim();
  const plate_number = input.plate_number?.trim() || null;

  if (!visitor_name || !host_name || !purpose) {
    throw new Error("Visitor name, host, and purpose are required.");
  }

  const { error } = await supabase.from("visitor_logs").insert({
    visitor_name,
    plate_number,
    host_name,
    purpose,
    status: "Inside Campus",
    time_in: new Date().toISOString(),
    logged_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

/** Check a visitor out. Stamps time_out with the current server time. */
export async function checkOutVisitor(logId: string) {
  const { supabase, user } = await requireGuard();

  const { error } = await supabase
    .from("visitor_logs")
    .update({
      status: "Checked Out",
      time_out: new Date().toISOString(),
      checked_out_by: user.id,
    })
    .eq("id", logId)
    .eq("status", "Inside Campus"); // guard against double checkout races

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

/** All visitors currently inside campus, most recent first. */
export async function getActiveVisitors(): Promise<VisitorLog[]> {
  const { supabase } = await requireGuard();
  const { data, error } = await supabase
    .from("visitor_logs")
    .select("*")
    .eq("status", "Inside Campus")
    .order("time_in", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Full log history (inside + checked out), most recent first, capped for the UI. */
export async function getRecentLogs(limit = 50): Promise<VisitorLog[]> {
  const { supabase } = await requireGuard();
  const { data, error } = await supabase
    .from("visitor_logs")
    .select("*")
    .order("time_in", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
