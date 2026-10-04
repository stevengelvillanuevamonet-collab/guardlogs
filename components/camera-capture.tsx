"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_DIMENSION = 1600; // longest edge of the saved photo, keeps uploads small
const JPEG_QUALITY = 0.88;

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  /** Called when the camera can't be used, so the caller can offer the file picker instead. */
  onUnavailable?: () => void;
}

function describeCameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow camera permission in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No camera was found on this device.";
  if (name === "NotReadableError")
    return "The camera is being used by another app. Close it and try again.";
  return "Could not start the camera.";
}

export function CameraCapture({ open, onOpenChange, onCapture, onUnavailable }: CameraCaptureProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Start (or restart when switching cameras) whenever the dialog is open.
  useEffect(() => {
    if (!open || !video) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Insecure context (plain http) or an old browser.
        setError("Live camera isn't available here (it needs a secure https connection).");
        return;
      }
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play().catch(() => {});
      } catch (err) {
        if (!cancelled) setError(describeCameraError(err));
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
      video.srcObject = null;
    };
  }, [open, video, facing, stopStream]);

  function handleCapture() {
    if (!video || !video.videoWidth) return;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture the photo. Please try again.");
          return;
        }
        const file = new File([blob], `surrendered-id-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        onOpenChange(false);
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Take a photo of the ID</DialogTitle>
          <DialogDescription>
            Hold the ID flat inside the frame so the name and photo are readable.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-black">
          <video
            ref={setVideo}
            playsInline
            muted
            onPlaying={() => setReady(true)}
            className="h-full w-full object-cover"
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
              <p>{error}</p>
              {onUnavailable && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onOpenChange(false);
                    onUnavailable();
                  }}
                >
                  Choose a file instead
                </Button>
              )}
            </div>
          )}
          {ready && !error && (
            <div className="pointer-events-none absolute inset-6 rounded-md border-2 border-dashed border-white/60" />
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            disabled={!!error}
          >
            <SwitchCamera className="h-4 w-4" /> Switch camera
          </Button>
          <Button type="button" variant="accent" onClick={handleCapture} disabled={!ready || !!error}>
            <Camera className="h-4 w-4" /> Capture
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
