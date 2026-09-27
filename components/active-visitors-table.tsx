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

export function ActiveVisitorsTable({
  initialVisitors,
}: {
  initialVisitors: VisitorLog[];
}) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Inside Campus</CardTitle>
          <CardDescription>
            IDs currently held at the counter — click Check Out to return one.
          </CardDescription>
        </div>
        <Badge variant="inside" className="text-sm">
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
        )}
      </CardContent>
    </Card>
  );
}
