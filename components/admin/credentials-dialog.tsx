"use client";

import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import type { IssuedCredentials } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shows a new login exactly once. There is no email service wired up, so the
 * admin hands these details to the guard directly; the password is never
 * stored anywhere readable, so closing this dialog loses it (Reset password
 * issues a new one).
 */
export function CredentialsDialog({
  credentials,
  title = "Guard account ready",
  onClose,
}: {
  credentials: IssuedCredentials | null;
  title?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!credentials) return;
    const text = `EGardMo login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the values are visible to copy by hand */
    }
  }

  return (
    <Dialog open={!!credentials} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
          <DialogDescription>
            Give these details to {credentials?.full_name || "the guard"}. They can sign in at the
            login page straight away.
          </DialogDescription>
        </DialogHeader>

        {credentials && (
          <dl className="grid gap-3 rounded-md border bg-secondary/40 p-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="break-all font-mono-tabular font-medium">{credentials.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Temporary password</dt>
              <dd className="select-all font-mono text-base font-semibold tracking-wide">
                {credentials.password}
              </dd>
            </div>
          </dl>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
          This password is shown only once. If it's lost, use “Reset password” on the Guards page.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
          <Button variant="accent" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy details"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
