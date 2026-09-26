"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./supabase/server";
import type { CheckInInput, VisitorLog } from "./types";

const ID_PHOTO_BUCKET = "visitor-ids";
const ID_PHOTO_SIGNED_URL_TTL_SECONDS = 300; // 5 minutes — just long enough to load the page

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

/**
 * Uploads a surrendered ID photo to the private "visitor-ids" bucket and
 * returns its storage path (not a URL — the bucket has no public access).
 */
async function uploadIdPhoto(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  guardId: string,
  file: File
): Promise<string> {
  const extension = file.type === "image/png" ? "png" : "jpg";
  const path = `${guardId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(ID_PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`ID photo upload failed: ${error.message}`);
  return path;
}

/** Attaches short-lived signed URLs to any logs that have an ID photo on file. */
async function withSignedPhotoUrls(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  logs: VisitorLog[]
): Promise<VisitorLog[]> {
  const paths = logs
    .map((log) => log.id_photo_path)
    .filter((path): path is string => !!path);

  if (paths.length === 0) return logs;

  const { data, error } = await supabase.storage
    .from(ID_PHOTO_BUCKET)
    .createSignedUrls(paths, ID_PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error || !data) return logs; // fall back to no-photo rendering rather than failing the page

  const urlByPath = new Map(data.map((entry) => [entry.path, entry.signedUrl]));

  return logs.map((log) => ({
    ...log,
    id_photo_signed_url: log.id_photo_path ? urlByPath.get(log.id_photo_path) ?? null : null,
  }));
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

  let id_photo_path: string | null = null;
  if (input.id_photo && input.id_photo.size > 0) {
    id_photo_path = await uploadIdPhoto(supabase, user.id, input.id_photo);
  }

  const { error } = await supabase.from("visitor_logs").insert({
    visitor_name,
    plate_number,
    host_name,
    purpose,
    status: "Inside Campus",
    time_in: new Date().toISOString(),
    logged_by: user.id,
    id_photo_path,
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

/** All visitors currently inside campus, most recent first, with signed ID photo URLs attached. */
export async function getActiveVisitors(): Promise<VisitorLog[]> {
  const { supabase } = await requireGuard();
  const { data, error } = await supabase
    .from("visitor_logs")
    .select("*")
    .eq("status", "Inside Campus")
    .order("time_in", { ascending: false });

  if (error) throw new Error(error.message);
  return withSignedPhotoUrls(supabase, data ?? []);
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
  return withSignedPhotoUrls(supabase, data ?? []);
}
