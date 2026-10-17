"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, FileText, Loader2, Paperclip, X } from "lucide-react";
import { submitGuardApplication } from "@/lib/admin-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_DOCUMENT_TYPES,
  DOCUMENT_ACCEPT,
  MAX_DOCUMENTS,
  MAX_DOCUMENT_BYTES,
  checkDocumentFile,
  formatFileSize,
  type ApplicationDocumentType,
} from "@/lib/application-documents";

interface PendingDocument {
  key: string;
  type: ApplicationDocumentType;
  file: File;
}

const selectClass =
  "flex h-11 w-full rounded-md border border-border/70 bg-secondary/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

const fieldClass = "h-11 border-border/70 bg-secondary/40 focus-visible:ring-accent/30 focus-visible:ring-offset-0";

export function ApplyForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [docType, setDocType] = useState<ApplicationDocumentType>(APPLICATION_DOCUMENT_TYPES[0]);
  const [docError, setDocError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    if (documents.length >= MAX_DOCUMENTS) {
      setDocError(`You can attach up to ${MAX_DOCUMENTS} documents.`);
      return;
    }
    const problem = checkDocumentFile(file);
    if (problem) {
      setDocError(problem);
      return;
    }
    setDocError(null);
    setDocuments((prev) => [...prev, { key: crypto.randomUUID(), type: docType, file }]);
  }

  function removeDocument(key: string) {
    setDocuments((prev) => prev.filter((d) => d.key !== key));
    setDocError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const full_name = String(data.get("full_name") || "");

    startTransition(async () => {
      try {
        // FormData carries the files; each file is paired with its dropdown choice.
        const payload = new FormData();
        for (const key of [
          "full_name",
          "email",
          "phone",
          "address",
          "years_experience",
          "license_no",
          "shift_preference",
          "about",
          "website",
        ]) {
          payload.set(key, String(data.get(key) ?? ""));
        }
        for (const d of documents) {
          payload.append("documents", d.file);
          payload.append("document_types", d.type);
        }
        await submitGuardApplication(payload);
        setSubmittedName(full_name.trim().split(" ")[0] || "there");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  if (submittedName) {
    return (
      <div className="py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[hsl(var(--signal-in))]" />
        <h2 className="mt-4 font-serif text-2xl font-semibold">Thanks, {submittedName}.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Your application is with the security administrator. If you're approved, they'll contact you with your
          login details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Honeypot — hidden from people, irresistible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required autoComplete="name" className={fieldClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" required autoComplete="tel" className={fieldClass} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">
          Home address <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="address" name="address" autoComplete="street-address" className={fieldClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="years_experience">Years of experience</Label>
          <Input id="years_experience" name="years_experience" type="number" min={0} max={60} defaultValue={0} required className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="license_no">
            License no. <span className="text-muted-foreground">(if any)</span>
          </Label>
          <Input id="license_no" name="license_no" autoComplete="off" className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="shift_preference">Preferred shift</Label>
          <select
            id="shift_preference"
            name="shift_preference"
            defaultValue="Any"
            className="flex h-11 w-full rounded-md border border-border/70 bg-secondary/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="Any">Any</option>
            <option value="Day">Day</option>
            <option value="Night">Night</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="about">
          Tell us about your experience <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="about" name="about" rows={4} maxLength={1500} className="border-border/70 bg-secondary/40 focus-visible:ring-accent/30 focus-visible:ring-offset-0" />
      </div>

      <div className="grid gap-3 rounded-lg border border-border/70 bg-secondary/20 p-4">
        <div>
          <p className="text-sm font-medium">
            Supporting documents <span className="font-normal text-muted-foreground">(optional)</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick the kind of document, then choose the file. PDF, Word, JPG or PNG, up to{" "}
            {MAX_DOCUMENT_BYTES / 1024 / 1024} MB each (max {MAX_DOCUMENTS}).
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="document_type">Document type</Label>
            <select
              id="document_type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as ApplicationDocumentType)}
              className={selectClass}
            >
              {APPLICATION_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={documents.length >= MAX_DOCUMENTS}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" /> Choose file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={addDocument}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a document file"
          />
        </div>

        {docError && (
          <p className="text-sm text-destructive" role="alert">
            {docError}
          </p>
        )}

        {documents.length > 0 && (
          <ul className="grid gap-2">
            {documents.map((d) => (
              <li
                key={d.key}
                className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.type}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.file.name} · {formatFileSize(d.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(d.key)}
                  aria-label={`Remove ${d.file.name}`}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" variant="accent" size="lg" disabled={isPending} className="h-12 text-[15px] font-semibold">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Submit application"
        )}
      </Button>
    </form>
  );
}
