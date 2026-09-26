"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { checkInVisitor } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IdPhotoUpload } from "@/components/id-photo-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      toast.error("Visitor name, host, and purpose are required.");
      return;
    }

    startTransition(async () => {
      try {
        await checkInVisitor({
          visitor_name,
          host_name,
          purpose,
          plate_number,
          id_photo: idPhoto,
        });
        toast.success(`${visitor_name} checked in.`, {
          description: "Hold their ID at the counter until check-out.",
        });
        formRef.current?.reset();
        setPlateWarning(false);
        setIdPhoto(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-in failed.");
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
            <Label htmlFor="host_name">Visiting who</Label>
            <Input
              id="host_name"
              name="host_name"
              placeholder="CB Registrar"
              autoComplete="off"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose of visit</Label>
            <Textarea
              id="purpose"
              name="purpose"
              placeholder="Delivery, guest, contractor, meeting..."
              rows={3}
              required
            />
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
