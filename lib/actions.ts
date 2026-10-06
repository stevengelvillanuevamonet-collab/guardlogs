"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./supabase/server";
import type { VisitorLog } from "./types";
import { VISIT_DESTINATIONS, VISIT_PURPOSES } from "./visit-options";

// Photos are stored in a private Supabase bucket so the app can display them
// without exposing the whole storage folder to the public internet.
const ID_PHOTO_BUCKET = "visitor-ids";
const ID_PHOTO_SIGNED_URL_TTL_SECONDS = 300;

// Every server action in this file must be guarded by an authenticated user.
// This central check prevents anonymous visitors from creating or changing logs.
async function requireGuard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Not signed in.");
  return { supabase, user };
}

// Upload the surrendered ID photo to the private storage bucket and keep only
// the file path in the database. This avoids storing raw image data in the
// database and keeps the bucket locked down behind signed URLs.
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


// Convert uploaded storage paths into temporary signed URLs that are valid for a
// short time. The UI can preview them, but the bucket itself stays private.
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

// Creates a new visitor log entry. We validate the required fields on the server,
// so the database still gets clean data even if the browser sends malformed input.
//
// Takes FormData (the reliable way to ship a File to a server action) and returns
// a result object instead of throwing: in production Next.js replaces any thrown
// error message with a generic one, so the guard would never see what went wrong.
export async function checkInVisitor(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase, user } = await requireGuard();

    // Normalise free-text fields before saving so accidental extra spaces do not
    // create inconsistent records or display glitches.
    const visitor_name = String(formData.get("visitor_name") ?? "").trim();
    const host_name = String(formData.get("host_name") ?? "").trim();
    const purpose = String(formData.get("purpose") ?? "").trim();
    const plate_number = String(formData.get("plate_number") ?? "").trim() || null;
    const photo = formData.get("id_photo");

    if (!visitor_name || !host_name || !purpose) {
      return { ok: false, error: "Visitor name, where they're visiting, and purpose are required." };
    }

    // Destination and purpose are dropdowns in the UI; enforce the same lists here
    // so a tampered request can't save anything else.
    if (!(VISIT_DESTINATIONS as readonly string[]).includes(host_name)) {
      return { ok: false, error: "Choose a valid place to visit." };
    }
    if (!(VISIT_PURPOSES as readonly string[]).includes(purpose)) {
      return { ok: false, error: "Choose a valid purpose of visit." };
    }

    // Upload the optional ID photo before inserting the log row. If a photo was
    // provided, the database stores the object path and the UI fetches a signed URL.
    let id_photo_path: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      id_photo_path = await uploadIdPhoto(supabase, user.id, photo);
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

    if (error) return { ok: false, error: error.message };
  } catch (err) {
    console.error("checkInVisitor failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Check-in failed." };
  }

  // Tell Next.js to refresh any page that depends on the home dashboard data.
  revalidatePath("/");
  return { ok: true };
}

// Marks a currently checked-in visitor as having left campus. This writes the
// server timestamp at the moment the action runs and blocks duplicate check-outs.
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
    .eq("status", "Inside Campus"); // Prevents a race where the same visitor gets checked out twice.

  if (error) throw new Error(error.message);

  // Refresh the page so the visitor disappears from the "Inside Campus" view.
  revalidatePath("/");
}

// Returns the currently inside visitors in reverse chronological order so the most
// recent entries appear at the top of the guard desk dashboard.
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

// Fetches recent visitor history for the activity panel. It includes both active and
// checked-out records, and it limits the result count to keep the UI responsive.
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
