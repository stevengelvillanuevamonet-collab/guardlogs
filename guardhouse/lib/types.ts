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
