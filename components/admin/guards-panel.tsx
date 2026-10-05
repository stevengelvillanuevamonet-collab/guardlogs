"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, Plus, UserCheck, UserX } from "lucide-react";
import { addGuard, resetGuardPassword, setGuardActive } from "@/lib/admin-actions";
import type { GuardProfile, IssuedCredentials } from "@/lib/types";
import { formatDateAndTime } from "@/lib/utils";
import { CredentialsDialog } from "@/components/admin/credentials-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GuardsPanel({ guards, currentUserId }: { guards: GuardProfile[]; currentUserId: string }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ value: IssuedCredentials; title: string } | null>(null);
  const [isAdding, startAdding] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startAdding(async () => {
      try {
        const issued = await addGuard({
          full_name: String(data.get("full_name") || ""),
          email: String(data.get("email") || ""),
          phone: String(data.get("phone") || ""),
        });
        form.reset();
        setAddOpen(false);
        setCredentials({ value: issued, title: "Guard account ready" });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not add the guard.");
      }
    });
  }

  async function toggleActive(g: GuardProfile) {
    setBusyId(g.id);
    try {
      await setGuardActive(g.id, !g.is_active);
      toast.success(g.is_active ? `${g.full_name || g.email} deactivated.` : `${g.full_name || g.email} reactivated.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the account.");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(g: GuardProfile) {
    if (!window.confirm(`Reset the password for ${g.full_name || g.email}? Their current password stops working immediately.`)) return;
    setBusyId(g.id);
    try {
      const issued = await resetGuardPassword(g.id);
      setCredentials({ value: issued, title: "New password issued" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusyId(null);
    }
  }

  const actions = (g: GuardProfile) =>
    g.id === currentUserId || g.role === "admin" ? (
      <span className="text-xs text-muted-foreground">{g.id === currentUserId ? "You" : "Administrator"}</span>
    ) : (
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" disabled={busyId === g.id} onClick={() => resetPassword(g)}>
          <KeyRound className="h-3.5 w-3.5" /> Reset password
        </Button>
        <Button size="sm" variant="outline" disabled={busyId === g.id} onClick={() => toggleActive(g)}>
          {g.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
          {g.is_active ? "Deactivate" : "Reactivate"}
        </Button>
      </div>
    );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Security guards</CardTitle>
            <CardDescription className="mt-1.5">
              {guards.filter((g) => g.role === "guard" && g.is_active).length} active guards. Deactivated
              guards are signed out and can't log in.
            </CardDescription>
          </div>
          <Button variant="accent" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add guard
          </Button>
        </CardHeader>
        <CardContent>
          {/* Phones */}
          <ul className="grid gap-3 md:hidden">
            {guards.map((g) => (
              <li key={g.id} className="rounded-lg border bg-background p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{g.full_name || "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{g.email}</p>
                    {g.phone && <p className="text-xs text-muted-foreground">{g.phone}</p>}
                  </div>
                  <Badge variant={g.is_active ? "inside" : "out"} dot className="shrink-0">
                    {g.role === "admin" ? "Admin" : g.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-3">{actions(g)}</div>
              </li>
            ))}
          </ul>

          {/* Tablet and up */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guards.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{g.email}</TableCell>
                    <TableCell className="font-mono-tabular text-muted-foreground">{g.phone || "—"}</TableCell>
                    <TableCell className="capitalize">{g.role}</TableCell>
                    <TableCell className="font-mono-tabular text-muted-foreground">
                      {formatDateAndTime(g.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={g.is_active ? "inside" : "out"} dot>
                        {g.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{actions(g)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add a security guard</DialogTitle>
            <DialogDescription>
              Creates a login right away. You'll get a temporary password to hand over.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="g_full_name">Full name</Label>
              <Input id="g_full_name" name="full_name" required autoComplete="off" placeholder="Juan Dela Cruz" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g_email">Email address</Label>
              <Input id="g_email" name="email" type="email" required autoComplete="off" placeholder="guard@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g_phone">
                Phone <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="g_phone" name="phone" type="tel" autoComplete="off" />
            </div>
            <Button type="submit" variant="accent" disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                "Create guard account"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <CredentialsDialog
        credentials={credentials?.value ?? null}
        title={credentials?.title}
        onClose={() => setCredentials(null)}
      />
    </>
  );
}
