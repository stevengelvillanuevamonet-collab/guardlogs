"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import type { AdminVisitorLog } from "@/lib/types";
import { formatDateAndTime, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Photo({ log }: { log: AdminVisitorLog }) {
  const [open, setOpen] = useState(false);

  if (!log.id_photo_signed_url) {
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
        aria-label={`View ID photo for ${log.visitor_name}`}
        className="block h-10 w-10 overflow-hidden rounded-full ring-1 ring-border transition-shadow hover:ring-2 hover:ring-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={log.id_photo_signed_url} alt="" className="h-full w-full object-cover" />
      </button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{log.visitor_name}&apos;s ID</DialogTitle>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={log.id_photo_signed_url} alt={`ID photo for ${log.visitor_name}`} className="w-full rounded-md object-contain" />
      </DialogContent>
    </Dialog>
  );
}

export function LogsTable({ logs }: { logs: AdminVisitorLog[] }) {
  const badge = (l: AdminVisitorLog) => (
    <Badge variant={l.status === "Inside Campus" ? "inside" : "out"} dot className="shrink-0">
      {l.status}
    </Badge>
  );

  return (
    <>
      {/* Phones */}
      <ul className="grid gap-3 md:hidden">
        {logs.map((l) => (
          <li key={l.id} className="rounded-lg border bg-background p-3.5">
            <div className="flex items-center gap-3">
              <Photo log={l} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.visitor_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Visiting {l.host_name}
                  {l.plate_number ? ` · ${l.plate_number}` : ""}
                </p>
              </div>
              {badge(l)}
            </div>
            <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">{l.purpose}</p>
            <p className="font-mono-tabular mt-2 text-xs text-muted-foreground">
              {formatDateAndTime(l.time_in)} → {l.time_out ? formatDateAndTime(l.time_out) : "still inside"}
            </p>
            {(l.logged_by_name || l.checked_out_by_name) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {l.logged_by_name && <>In: {l.logged_by_name}</>}
                {l.checked_out_by_name && <> · Out: {l.checked_out_by_name}</>}
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Tablet and up */}
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
              <TableHead>Time out</TableHead>
              <TableHead>Checked in / out by</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Photo log={l} />
                </TableCell>
                <TableCell className="font-medium">{l.visitor_name}</TableCell>
                <TableCell className="font-mono-tabular text-muted-foreground">{l.plate_number || "—"}</TableCell>
                <TableCell>{l.host_name}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground" title={l.purpose}>
                  {l.purpose}
                </TableCell>
                <TableCell className="font-mono-tabular whitespace-nowrap">{formatDateAndTime(l.time_in)}</TableCell>
                <TableCell className="font-mono-tabular whitespace-nowrap text-muted-foreground">
                  {l.time_out ? (
                    <>
                      {formatDateAndTime(l.time_out)}
                      <span className="block text-xs">{formatDuration(l.time_in, l.time_out)} inside</span>
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <span className="block">{l.logged_by_name || "—"}</span>
                  {l.checked_out_by_name && <span className="block text-xs">{l.checked_out_by_name}</span>}
                </TableCell>
                <TableCell>{badge(l)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
