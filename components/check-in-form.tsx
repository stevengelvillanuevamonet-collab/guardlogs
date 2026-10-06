"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { checkInVisitor } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdPhotoUpload } from "@/components/id-photo-upload";
import { VISIT_DESTINATIONS, VISIT_PURPOSES } from "@/lib/visit-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Native <select>: opens the platform's own picker on phones and tablets, which
// is faster at the guard desk than a custom dropdown.
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 invalid:text-muted-foreground";

export function CheckInForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [plateWarning, setPlateWarning] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const visitor_name = String(data.get("visitor_name") || "");
    const host_name = String(data.get("host_name") || "");
    const purpose = String(data.get("purpose") || "");
    const plate_number = String(data.get("plate_number") || "");

    if (!visitor_name.trim() || !host_name.trim() || !purpose.trim()) {
      toast.error("Visitor name, where they're visiting, and purpose are required.");
      return;
    }

    // Send everything as FormData so the photo File uploads reliably.
    const payload = new FormData();
    payload.set("visitor_name", visitor_name);
    payload.set("host_name", host_name);
    payload.set("purpose", purpose);
    payload.set("plate_number", plate_number);
    if (idPhoto) payload.set("id_photo", idPhoto);

    startTransition(async () => {
      try {
        const result = await checkInVisitor(payload);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`${visitor_name} checked in.`, {
          description: "Hold their ID at the counter until check-out.",
        });
        formRef.current?.reset();
        setPlateWarning(false);
        setIdPhoto(null);
      } catch (err) {
        console.error(err);
        toast.error("Check-in failed. The photo may be too large or the connection dropped — try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check in a visitor</CardTitle>
        <CardDescription>
          Log their details and surrender their ID at the counter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="visitor_name">Visitor name</Label>
            <Input
              id="visitor_name"
              name="visitor_name"
              placeholder="Fullname"
              autoComplete="off"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plate_number">
              Plate number <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="plate_number"
              name="plate_number"
              placeholder="Input Here"
              autoComplete="off"
              onChange={(e) => setPlateWarning(e.target.value.length > 0 && e.target.value.length < 5)}
            />
            {plateWarning && (
              <p className="text-xs text-muted-foreground">
                Double-check the plate — it looks short for a standard format.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="host_name">Visiting where</Label>
            <select
              id="host_name"
              name="host_name"
              defaultValue=""
              required
              className={selectClass}
            >
              <option value="" disabled>
                Select a place…
              </option>
              {VISIT_DESTINATIONS.map((place) => (
                <option key={place} value={place} className="text-foreground">
                  {place}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose of visit</Label>
            <select
              id="purpose"
              name="purpose"
              defaultValue=""
              required
              className={selectClass}
            >
              <option value="" disabled>
                Select a purpose…
              </option>
              {VISIT_PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose} className="text-foreground">
                  {purpose}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Surrendered ID</Label>
            <IdPhotoUpload value={idPhoto} onChange={setIdPhoto} />
          </div>

          <Button type="submit" variant="accent" className="w-full" disabled={isPending}>
            {isPending ? "Checking in..." : "Check In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
