"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, RotateCcw, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/camera-capture";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

interface IdPhotoUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

function isAcceptableImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Please choose an image file.";
  if (file.size > MAX_FILE_BYTES) return "Image is larger than 8MB — try a smaller photo.";
  return null;
}

export function IdPhotoUpload({ value, onChange }: IdPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null); // choose an existing file
  const nativeCameraRef = useRef<HTMLInputElement>(null); // phone camera fallback
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Keep the object URL in sync with the current file, and clean up on change/unmount.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const acceptFile = useCallback(
    (file: File) => {
      const problem = isAcceptableImage(file);
      if (problem) {
        toast.error(problem);
        return;
      }
      onChange(file);
    },
    [onChange]
  );

  function openCamera() {
    // Live in-browser camera where supported (needs https or localhost);
    // otherwise fall back to the native capture input (opens the camera app on phones).
    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      setCameraOpen(true);
    } else {
      toast.info("Live camera isn't available here — opening your device's camera/file picker.");
      nativeCameraRef.current?.click();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
    e.target.value = ""; // allow re-selecting the same file later
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  return (
    <div>
      {/* Pick an existing image (gallery / files) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      {/* Fallback when a live camera isn't available: opens the phone's camera app */}
      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={acceptFile}
        onUnavailable={() => inputRef.current?.click()}
      />

      {previewUrl ? (
        <div className="group relative overflow-hidden rounded-lg border shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Surrendered ID preview"
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={openCamera}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retake
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-white"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-medium text-destructive shadow-sm transition-colors hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
          <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
            ID ON FILE
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
            isDraggingOver
              ? "border-accent bg-accent/10"
              : "border-input bg-secondary/40"
          )}
        >
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Surrendered ID</p>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ImageUp className="h-3 w-3" /> Take a photo, upload a file, or drag &amp; drop
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" variant="accent" size="sm" onClick={openCamera}>
              <Camera className="h-4 w-4" /> Take photo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
