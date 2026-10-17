/**
 * Documents an applicant can attach to a guard application. Shared by the
 * public form (dropdown + client-side checks) and the server action (the real
 * enforcement). To add or rename a document type, edit it here.
 */
export const APPLICATION_DOCUMENT_TYPES = [
  "Resume / CV",
  "Valid government ID",
  "Security guard license",
  "NBI / Police clearance",
  "Training certificate",
  "Barangay clearance",
  "Other",
] as const;

export type ApplicationDocumentType = (typeof APPLICATION_DOCUMENT_TYPES)[number];

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024; // per file
export const MAX_DOCUMENTS = 5; // per application
export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"] as const;
export const DOCUMENT_ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.map((e) => `.${e}`).join(",");

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Returns an error message, or null when the file is acceptable. */
export function checkDocumentFile(file: { name: string; size: number }): string | null {
  const ext = fileExtension(file.name);
  if (!(ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext)) {
    return `"${file.name}" isn't supported. Upload a PDF, Word document, JPG or PNG.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `"${file.name}" is too large. Each file can be up to ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
