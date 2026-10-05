"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { UserRound } from "lucide-react";
import { checkOutVisitor } from "@/lib/actions";
import type { VisitorLog } from "@/lib/types";
import { formatTimeOfDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Displays a small avatar for each visitor and opens a modal when the guard clicks
// it. If no photo exists, a generic user icon is shown instead.
function IdPhotoThumbnail({ visitor }: { visitor: VisitorLog }) {
  const [open, setOpen] = useState(false);

  if (!visitor.id_photo_signed_url) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <UserRound className="h-4 w-4" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block h-10 w-10 overflow-hidden rounded-full ring-1 ring-border transition-shadow hover:ring-2 hover:ring-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visitor.id_photo_signed_url}
          alt={`ID photo for ${visitor.visitor_name}`}
          className="h-full w-full object-cover"
        />
      </button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{visitor.visitor_name}'s ID</DialogTitle>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visitor.id_photo_signed_url}
          alt={`ID photo for ${visitor.visitor_name}`}
          className="w-full rounded-md object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}

// Presents the live list of people currently inside campus and lets the guard check
// them out with one button press.
export function ActiveVisitorsTable({
  initialVisitors,
}: {
  initialVisitors: VisitorLog[];
}) {
  // Local state mirrors the server-fetched data so the UI can update immediately
  // after a successful check-out without waiting for a page refresh.
  const [visitors, setVisitors] = useState(initialVisitors);
  const [, forceTick] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Keep the client list in sync when the server re-fetches after an action.
  useEffect(() => setVisitors(initialVisitors), [initialVisitors]);

  // Re-render every 30s so "time inside" stays fresh without a full refetch.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Trigger the server action, optimistically remove the visitor from the list on
  // success, and surface a toast if the action fails.
  function handleCheckOut(log: VisitorLog) {
    setPendingId(log.id);
    startTransition(async () => {
      try {
        await checkOutVisitor(log.id);
        setVisitors((prev) => prev.filter((v) => v.id !== log.id));
        toast.success(`${log.visitor_name} checked out.`, {
          description: "Return their ID now.",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-out failed.");
      } finally {
        setPendingId(null);
      }
    });
  }

  // The table is rendered as a dashboard card. When no visitors are inside, it
  // shows an empty-state message instead of a blank list.
  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <CardTitle>Inside Campus</CardTitle>
          <CardDescription>
            IDs currently held at the counter — click Check Out to return one.
          </CardDescription>
        </div>
        <Badge variant="inside" dot className="text-sm">
          {visitors.length} {visitors.length === 1 ? "visitor" : "visitors"}
        </Badge>
      </CardHeader>
      <CardContent>
        {visitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
            <p className="text-sm font-medium">No one is inside right now.</p>
            <p className="text-sm text-muted-foreground">
              Checked-in visitors will show up here until they're checked out.
            </p>
          </div>
        ) : (
          <>
          {/* Phones: one card per visitor, no sideways scrolling */}
          <ul className="grid gap-3 md:hidden">
            {visitors.map((v) => (
              <li key={v.id} className="rounded-lg border bg-background p-3.5">
                <div className="flex items-center gap-3">
                  <IdPhotoThumbnail visitor={v} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{v.visitor_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Visiting {v.host_name}
                      {v.plate_number ? ` · ${v.plate_number}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-tabular text-sm font-medium">
                      {formatTimeOfDay(v.time_in)}
                    </p>
                    <p className="font-mono-tabular text-xs text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(v.time_in))}
                    </p>
                  </div>
                </div>
                {v.purpose && (
                  <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">
                    {v.purpose}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  disabled={isPending && pendingId === v.id}
                  onClick={() => handleCheckOut(v)}
                >
                  {isPending && pendingId === v.id ? "Checking out..." : "Check Out"}
                </Button>
              </li>
            ))}
          </ul>

          {/* Tablet and up: full table */}
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">ID</TableHead>
                <TableHead>Visitor</TableHead>
                <TableHead>Plate #</TableHead>
                <TableHead>Visiting</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Time in</TableHead>
                <TableHead>Inside for</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <IdPhotoThumbnail visitor={v} />
                  </TableCell>
                  <TableCell className="font-medium">{v.visitor_name}</TableCell>
                  <TableCell className="font-mono-tabular text-muted-foreground">
                    {v.plate_number || "—"}
                  </TableCell>
                  <TableCell>{v.host_name}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {v.purpose}
                  </TableCell>
                  <TableCell className="font-mono-tabular">
                    {formatTimeOfDay(v.time_in)}
                  </TableCell>
                  <TableCell className="font-mono-tabular text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(v.time_in))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending && pendingId === v.id}
                      onClick={() => handleCheckOut(v)}
                    >
                      {isPending && pendingId === v.id ? "Checking out..." : "Check Out"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
