"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { approveApplication, rejectApplication } from "@/lib/admin-actions";
import type { ApplicationStatus, GuardApplication, IssuedCredentials } from "@/lib/types";
import { cn, formatDateAndTime } from "@/lib/utils";
import { CredentialsDialog } from "@/components/admin/credentials-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Filter = ApplicationStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "approved") return <Badge variant="inside" dot>Approved</Badge>;
  if (status === "rejected") return <Badge variant="out" dot>Rejected</Badge>;
  return (
    <Badge variant="secondary" className="border-accent/40 bg-accent/10 text-accent" dot>
      Pending
    </Badge>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value || "—"}</dd>
    </div>
  );
}

export function ApplicationsPanel({ applications }: { applications: GuardApplication[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<GuardApplication | null>(null);
  const [note, setNote] = useState("");
  const [credentials, setCredentials] = useState<IssuedCredentials | null>(null);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    all: applications.length,
  };
  const visible = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  function open(a: GuardApplication) {
    setSelected(a);
    setNote(a.review_note ?? "");
  }

  function review(kind: "approve" | "reject") {
    if (!selected) return;
    const app = selected;
    setAction(kind);
    startTransition(async () => {
      try {
        if (kind === "approve") {
          const issued = await approveApplication(app.id, note);
          setSelected(null);
          setCredentials(issued);
          toast.success(`${app.full_name} is now a security guard.`);
        } else {
          await rejectApplication(app.id, note);
          setSelected(null);
          toast.success(`Application from ${app.full_name} rejected.`);
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save the review.");
      } finally {
        setAction(null);
      }
    });
  }

  return (
    <>
      <div role="tablist" aria-label="Filter applications" className="mb-4 inline-flex max-w-full overflow-x-auto rounded-lg border bg-card p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {f.label}
            <span className="font-mono-tabular text-xs opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center sm:pt-14">
            <p className="text-sm font-medium">
              {filter === "pending" ? "No applications are waiting for review." : "Nothing to show here."}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Applicants fill in the public form at <span className="font-mono">/apply</span>. Share that link
              to receive applications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {visible.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => open(a)}
                className="flex w-full flex-col gap-2 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.full_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {a.years_experience} {a.years_experience === 1 ? "year" : "years"} experience ·{" "}
                    {a.shift_preference} shift
                    {a.license_no ? ` · License ${a.license_no}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono-tabular text-xs text-muted-foreground">
                    {formatDateAndTime(a.created_at)}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && !isPending && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="font-serif text-xl">{selected.full_name}</DialogTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <DialogDescription>
                  Applied {formatDateAndTime(selected.created_at)}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Address" value={selected.address} />
                <Detail label="Security license no." value={selected.license_no} />
                <Detail
                  label="Experience"
                  value={`${selected.years_experience} ${selected.years_experience === 1 ? "year" : "years"}`}
                />
                <Detail label="Shift preference" value={selected.shift_preference} />
                <div className="sm:col-span-2">
                  <Detail label="About the applicant" value={selected.about} />
                </div>
              </dl>

              {selected.status === "pending" ? (
                <div className="grid gap-4 border-t pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="review_note">
                      Note <span className="text-muted-foreground">(optional, kept in the record)</span>
                    </Label>
                    <Textarea
                      id="review_note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. License verified with the agency."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Approving creates a guard login for {selected.email} and gives you a temporary password to
                    hand over.
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" disabled={isPending} onClick={() => review("reject")}>
                      {isPending && action === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Reject
                    </Button>
                    <Button variant="accent" disabled={isPending} onClick={() => review("approve")}>
                      {isPending && action === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve &amp; create guard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 text-sm text-muted-foreground">
                  {selected.reviewed_at && <p>Reviewed {formatDateAndTime(selected.reviewed_at)}.</p>}
                  {selected.review_note && <p className="mt-1 text-foreground">“{selected.review_note}”</p>}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <CredentialsDialog
        credentials={credentials}
        title="Guard approved"
        onClose={() => setCredentials(null)}
      />
    </>
  );
}
