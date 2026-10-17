"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./auth";
import { createAdminSupabaseClient, createServerSupabaseClient } from "./supabase/server";
import { campusDayRange, isValidDateString, shiftDate, todayInCampus } from "./utils";
import {
  APPLICATION_DOCUMENT_TYPES,
  MAX_DOCUMENTS,
  checkDocumentFile,
  fileExtension,
} from "./application-documents";
import type {
  AdminVisitorLog,
  ApplicationDocument,
  ApplicationStatus,
  GuardApplication,
  GuardProfile,
  IssuedCredentials,
  ShiftPreference,
  VisitorLog,
} from "./types";
import { VISITOR_LOG_PAGE_SIZE } from "./types";

const ID_PHOTO_BUCKET = "visitor-ids";
const APPLICATION_DOC_BUCKET = "application-documents";
const APPLICATION_DOC_URL_TTL_SECONDS = 600;
const ID_PHOTO_SIGNED_URL_TTL_SECONDS = 300;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ───────────────────────── helpers ───────────────────────── */

// Readable temporary password: no 0/O/1/l/I lookalikes. The guard is asked to
// change it, and the admin only ever sees it once, right after it's issued.
function generatePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

// Strip characters that have special meaning inside a PostgREST filter string.
function cleanSearch(q: string): string {
  return q.replace(/[%_,()\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Creates a guard login (Supabase Auth user with role "guard") and its profile.
 * Shared by "Add guard" and "Approve application".
 */
async function provisionGuardAccount(input: {
  full_name: string;
  email: string;
  phone?: string | null;
  password?: string;
}): Promise<IssuedCredentials & { userId: string }> {
  const admin = createAdminSupabaseClient();
  const password = input.password || generatePassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    app_metadata: { role: "guard" },
    user_metadata: { full_name: input.full_name },
  });

  if (error || !data.user) {
    const msg = error?.message ?? "Could not create the account.";
    throw new Error(
      /already|registered|exists/i.test(msg)
        ? "An account with that email already exists."
        : msg
    );
  }

  // A trigger normally creates the profile; upsert makes sure it carries the
  // name/phone and exists even if the trigger isn't installed yet.
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    email: input.email,
    full_name: input.full_name,
    phone: input.phone || null,
    role: "guard",
    is_active: true,
  });
  if (profileError) {
    // Don't leave a half-created login behind.
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(`Could not save the guard profile: ${profileError.message}`);
  }

  return { userId: data.user.id, full_name: input.full_name, email: input.email, password };
}

/* ───────────────────────── overview ───────────────────────── */

export interface AdminOverview {
  insideNow: number;
  visitorsToday: number;
  activeGuards: number;
  pendingApplications: number;
  recentApplications: GuardApplication[];
  recentLogs: AdminVisitorLog[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { start, end } = campusDayRange(todayInCampus());

  const [inside, today, guards, pending, recentApps, recentLogs] = await Promise.all([
    supabase.from("visitor_logs").select("id", { count: "exact", head: true }).eq("status", "Inside Campus"),
    supabase
      .from("visitor_logs")
      .select("id", { count: "exact", head: true })
      .gte("time_in", start)
      .lt("time_in", end),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "guard")
      .eq("is_active", true),
    supabase.from("guard_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("guard_applications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("visitor_logs").select("*").order("time_in", { ascending: false }).limit(6),
  ]);

  const firstError = [inside, today, guards, pending, recentApps, recentLogs].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  return {
    insideNow: inside.count ?? 0,
    visitorsToday: today.count ?? 0,
    activeGuards: guards.count ?? 0,
    pendingApplications: pending.count ?? 0,
    recentApplications: (recentApps.data ?? []) as GuardApplication[],
    recentLogs: await attachGuardNames(supabase, (recentLogs.data ?? []) as VisitorLog[]),
  };
}

/* ───────────────────────── guards ───────────────────────── */

export async function listGuards(): Promise<GuardProfile[]> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as GuardProfile[];
}

export async function addGuard(input: {
  full_name: string;
  email: string;
  phone?: string;
}): Promise<IssuedCredentials> {
  await requireAdmin();

  const full_name = input.full_name?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim() || null;

  if (!full_name || full_name.length < 2) throw new Error("Enter the guard's full name.");
  if (!email || !EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");

  const { userId: _userId, ...credentials } = await provisionGuardAccount({ full_name, email, phone });
  revalidatePath("/admin/guards");
  revalidatePath("/admin");
  return credentials;
}

export async function setGuardActive(guardId: string, active: boolean) {
  const { user } = await requireAdmin();
  if (guardId === user.id) throw new Error("You can't deactivate your own account.");

  const admin = createAdminSupabaseClient();
  const { data: target, error: findError } = await admin.auth.admin.getUserById(guardId);
  if (findError || !target.user) throw new Error("Guard not found.");

  // `ban_duration` blocks new sign-ins at the auth layer; `disabled` in
  // app_metadata makes the middleware sign them out on their next request.
  const { error } = await admin.auth.admin.updateUserById(guardId, {
    ban_duration: active ? "none" : "876000h",
    app_metadata: { ...target.user.app_metadata, disabled: !active },
  });
  if (error) throw new Error(error.message);

  const { error: profileError } = await admin.from("profiles").update({ is_active: active }).eq("id", guardId);
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/guards");
  revalidatePath("/admin");
}

export async function resetGuardPassword(guardId: string): Promise<IssuedCredentials> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data: target, error: findError } = await admin.auth.admin.getUserById(guardId);
  if (findError || !target.user?.email) throw new Error("Guard not found.");

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(guardId, { password });
  if (error) throw new Error(error.message);

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", guardId).maybeSingle();
  return {
    full_name: profile?.full_name || target.user.email,
    email: target.user.email,
    password,
  };
}

/* ───────────────────────── applications ───────────────────────── */

const DOCUMENT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

// The extension is user-controlled, so also check the file's first bytes match
// what the extension claims (cheap protection against renamed executables).
async function looksLikeDeclaredType(file: File, ext: string): Promise<boolean> {
  const b = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const starts = (...sig: number[]) => sig.every((v, i) => b[i] === v);
  if (ext === "pdf") return starts(0x25, 0x50, 0x44, 0x46); // %PDF
  if (ext === "png") return starts(0x89, 0x50, 0x4e, 0x47);
  if (ext === "jpg" || ext === "jpeg") return starts(0xff, 0xd8, 0xff);
  if (ext === "docx") return starts(0x50, 0x4b); // zip container
  if (ext === "doc") return starts(0xd0, 0xcf, 0x11, 0xe0); // legacy OLE
  return false;
}

/**
 * PUBLIC action — applicants aren't signed in. It validates everything on the
 * server and writes with the service role key, so there is no anonymous write
 * policy on the table or the storage bucket.
 *
 * Takes FormData: the application fields, plus parallel `documents` (files) and
 * `document_types` (the dropdown choice for each file) entries.
 */
export async function submitGuardApplication(formData: FormData): Promise<void> {
  // Bots fill hidden fields; pretend it worked and drop the submission.
  if (String(formData.get("website") ?? "")) return;

  const text = (key: string) => String(formData.get(key) ?? "");
  const full_name = text("full_name").trim();
  const email = text("email").trim().toLowerCase();
  const phone = text("phone").trim();
  const years = Number(text("years_experience") || 0);
  const shift = text("shift_preference") as ShiftPreference;

  if (!full_name || full_name.length < 2 || full_name.length > 120) throw new Error("Enter your full name.");
  if (!email || email.length > 160 || !EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
  if (!phone || phone.length < 7 || phone.length > 30) throw new Error("Enter a valid phone number.");
  if (!Number.isFinite(years) || years < 0 || years > 60) throw new Error("Years of experience must be between 0 and 60.");
  if (!["Day", "Night", "Any"].includes(shift)) throw new Error("Choose a shift preference.");

  // Validate every document before touching the database.
  const files = formData.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
  const types = formData.getAll("document_types").map(String);
  if (files.length !== types.length) throw new Error("Choose a document type for each file.");
  if (files.length > MAX_DOCUMENTS) throw new Error(`You can attach up to ${MAX_DOCUMENTS} documents.`);
  for (let i = 0; i < files.length; i++) {
    if (!(APPLICATION_DOCUMENT_TYPES as readonly string[]).includes(types[i])) {
      throw new Error("Choose a valid document type.");
    }
    const problem = checkDocumentFile(files[i]);
    if (problem) throw new Error(problem);
    if (!(await looksLikeDeclaredType(files[i], fileExtension(files[i].name)))) {
      throw new Error(`"${files[i].name}" doesn't look like a valid ${fileExtension(files[i].name).toUpperCase()} file.`);
    }
  }

  const admin = createAdminSupabaseClient();
  const { data: created, error } = await admin
    .from("guard_applications")
    .insert({
      full_name,
      email,
      phone,
      address: text("address").trim().slice(0, 300) || null,
      years_experience: Math.floor(years),
      license_no: text("license_no").trim().slice(0, 60) || null,
      shift_preference: shift,
      about: text("about").trim().slice(0, 1500) || null,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      throw new Error("An application for this email is already waiting for review.");
    }
    throw new Error("We couldn't submit your application. Please try again.");
  }
  if (files.length === 0) return;

  // Upload the files, then record them. If anything fails, undo the whole
  // submission so the applicant can retry without hitting the one-per-email rule.
  const uploaded: string[] = [];
  try {
    const rows = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = fileExtension(file.name);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `${created.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await admin.storage
        .from(APPLICATION_DOC_BUCKET)
        .upload(path, file, { contentType: DOCUMENT_MIME[ext], upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      uploaded.push(path);

      rows.push({
        application_id: created.id,
        doc_type: types[i],
        file_name: file.name.slice(0, 200),
        storage_path: path,
        mime_type: DOCUMENT_MIME[ext],
        size_bytes: file.size,
      });
    }
    const { error: rowError } = await admin.from("application_documents").insert(rows);
    if (rowError) throw new Error(rowError.message);
  } catch (err) {
    console.error("submitGuardApplication document upload failed:", err);
    if (uploaded.length > 0) await admin.storage.from(APPLICATION_DOC_BUCKET).remove(uploaded);
    await admin.from("guard_applications").delete().eq("id", created.id);
    throw new Error("We couldn't upload your documents. Please try again.");
  }
}

/** Admin: the documents an applicant attached, with short-lived view links. */
export async function getApplicationDocuments(applicationId: string): Promise<ApplicationDocument[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("application_documents")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const docs = (data ?? []) as ApplicationDocument[];
  if (docs.length === 0) return docs;

  const { data: signed } = await admin.storage
    .from(APPLICATION_DOC_BUCKET)
    .createSignedUrls(docs.map((d) => d.storage_path), APPLICATION_DOC_URL_TTL_SECONDS);
  const urlByPath = new Map((signed ?? []).map((e) => [e.path, e.signedUrl]));

  return docs.map((d) => ({ ...d, signed_url: urlByPath.get(d.storage_path) ?? null }));
}

export async function listApplications(status?: ApplicationStatus): Promise<GuardApplication[]> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  let query = supabase.from("guard_applications").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as GuardApplication[];
}

/**
 * Approves an application: turns the applicant into a real guard account with
 * a one-time temporary password the admin hands over.
 */
export async function approveApplication(
  applicationId: string,
  note?: string
): Promise<IssuedCredentials> {
  const { user } = await requireAdmin();
  const admin = createAdminSupabaseClient();

  // Claim the application first so two admins can't approve it twice.
  const { data: claimed, error: claimError } = await admin
    .from("guard_applications")
    .update({
      status: "approved",
      review_note: note?.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) throw new Error(claimError.message);
  if (!claimed) throw new Error("This application was already reviewed.");

  const app = claimed as GuardApplication;
  try {
    const { userId, ...credentials } = await provisionGuardAccount({
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
    });
    await admin.from("guard_applications").update({ guard_user_id: userId }).eq("id", app.id);

    revalidatePath("/admin/applications");
    revalidatePath("/admin/guards");
    revalidatePath("/admin");
    return credentials;
  } catch (err) {
    // Account creation failed (e.g. email already in use) — put it back in the queue.
    await admin
      .from("guard_applications")
      .update({ status: "pending", review_note: null, reviewed_by: null, reviewed_at: null })
      .eq("id", app.id);
    throw err;
  }
}

export async function rejectApplication(applicationId: string, note?: string) {
  const { user } = await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("guard_applications")
    .update({
      status: "rejected",
      review_note: note?.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("This application was already reviewed.");

  revalidatePath("/admin/applications");
  revalidatePath("/admin");
}

/* ───────────────────────── visitor logs ───────────────────────── */

export interface VisitorLogFilters {
  q?: string;
  status?: "all" | "inside" | "out";
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
}

export interface VisitorLogPage {
  logs: AdminVisitorLog[];
  total: number;
  page: number;
  pageSize: number;
}

async function attachGuardNames(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  logs: VisitorLog[]
): Promise<AdminVisitorLog[]> {
  const ids = Array.from(
    new Set(logs.flatMap((l) => [l.logged_by, l.checked_out_by]).filter((id): id is string => !!id))
  );

  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    for (const p of data ?? []) names.set(p.id, p.full_name || p.email || "Unknown guard");
  }

  // Short-lived signed URLs for ID photos (bucket stays private).
  const paths = logs.map((l) => l.id_photo_path).filter((p): p is string => !!p);
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from(ID_PHOTO_BUCKET)
      .createSignedUrls(paths, ID_PHOTO_SIGNED_URL_TTL_SECONDS);
    for (const entry of data ?? []) if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
  }

  return logs.map((l) => ({
    ...l,
    id_photo_signed_url: l.id_photo_path ? urlByPath.get(l.id_photo_path) ?? null : null,
    logged_by_name: l.logged_by ? names.get(l.logged_by) ?? "Unknown guard" : null,
    checked_out_by_name: l.checked_out_by ? names.get(l.checked_out_by) ?? "Unknown guard" : null,
  }));
}

/** Searchable, filterable, paginated visitor logs for the admin panel. */
export async function getAdminVisitorLogs(filters: VisitorLogFilters = {}): Promise<VisitorLogPage> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const from = (page - 1) * VISITOR_LOG_PAGE_SIZE;

  let query = supabase.from("visitor_logs").select("*", { count: "exact" });

  const q = cleanSearch(filters.q ?? "");
  if (q) {
    query = query.or(`visitor_name.ilike.%${q}%,host_name.ilike.%${q}%,plate_number.ilike.%${q}%,purpose.ilike.%${q}%`);
  }
  if (filters.status === "inside") query = query.eq("status", "Inside Campus");
  if (filters.status === "out") query = query.eq("status", "Checked Out");
  if (filters.from && isValidDateString(filters.from)) {
    query = query.gte("time_in", campusDayRange(filters.from).start);
  }
  if (filters.to && isValidDateString(filters.to)) {
    // `to` is inclusive, so stop at the start of the following day.
    query = query.lt("time_in", campusDayRange(shiftDate(filters.to, 1)).start);
  }

  const { data, error, count } = await query
    .order("time_in", { ascending: false })
    .range(from, from + VISITOR_LOG_PAGE_SIZE - 1);

  if (error) throw new Error(error.message);

  return {
    logs: await attachGuardNames(supabase, (data ?? []) as VisitorLog[]),
    total: count ?? 0,
    page,
    pageSize: VISITOR_LOG_PAGE_SIZE,
  };
}
