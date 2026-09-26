"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const inputRef = useRef<HTMLInputElement>(null);
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      {previewUrl ? (
        <div className="group relative overflow-hidden rounded-lg border shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Surrendered ID preview"
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retake
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
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
            isDraggingOver
              ? "border-accent bg-accent/10"
              : "border-input bg-secondary/40 hover:border-accent/60 hover:bg-secondary/60"
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm">
            <Camera className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Capture or upload the surrendered ID</p>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ImageUp className="h-3 w-3" /> Drag & drop, or tap to use the camera
            </p>
          </div>
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">Optional — stored privately, never public.</p>
    </div>
  );
}
