export type VisitorStatus = "Inside Campus" | "Checked Out";

export interface VisitorLog {
  id: string;
  visitor_name: string;
  plate_number: string | null;
  host_name: string;
  purpose: string;
  status: VisitorStatus;
  time_in: string; // ISO timestamp
  time_out: string | null; // ISO timestamp
  logged_by: string | null; // Supabase auth.users.id of the guard who checked the visitor in
  checked_out_by: string | null; // Supabase auth.users.id of the guard who checked the visitor out
  created_at: string;
  id_photo_path: string | null; // path within the private "visitor-ids" storage bucket
  id_photo_signed_url?: string | null; // attached at fetch time, expires after a few minutes — never stored
}

export interface CheckInInput {
  visitor_name: string;
  plate_number?: string;
  host_name: string;
  purpose: string;
  id_photo?: File | null;
}

/* ───────────── Admin: guards & applications ───────────── */

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ShiftPreference = "Day" | "Night" | "Any";

export interface GuardApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  years_experience: number;
  license_no: string | null;
  shift_preference: ShiftPreference;
  about: string | null;
  status: ApplicationStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  guard_user_id: string | null;
  created_at: string;
}

export interface GuardProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "guard";
  is_active: boolean;
  created_at: string;
}

/** A visitor log plus the names of the guards who handled it (admin views). */
export interface AdminVisitorLog extends VisitorLog {
  logged_by_name: string | null;
  checked_out_by_name: string | null;
}

/** One-time login details shown to an admin right after an account is created. */
export interface IssuedCredentials {
  full_name: string;
  email: string;
  password: string;
}

/** Rows per page in the admin visitor-log viewer. */
export const VISITOR_LOG_PAGE_SIZE = 25;
