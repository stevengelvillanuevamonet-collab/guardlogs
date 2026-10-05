"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitGuardApplication } from "@/lib/admin-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ShiftPreference } from "@/lib/types";

const fieldClass = "h-11 border-border/70 bg-secondary/40 focus-visible:ring-accent/30 focus-visible:ring-offset-0";

export function ApplyForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const full_name = String(data.get("full_name") || "");

    startTransition(async () => {
      try {
        await submitGuardApplication({
          full_name,
          email: String(data.get("email") || ""),
          phone: String(data.get("phone") || ""),
          address: String(data.get("address") || ""),
          years_experience: Number(data.get("years_experience") || 0),
          license_no: String(data.get("license_no") || ""),
          shift_preference: String(data.get("shift_preference") || "Any") as ShiftPreference,
          about: String(data.get("about") || ""),
          website: String(data.get("website") || ""),
        });
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
