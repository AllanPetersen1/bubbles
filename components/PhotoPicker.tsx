"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { compressPhoto, kb } from "@/lib/image";
import type { PhotoPair } from "@/lib/types";

export default function PhotoPicker({
  value,
  onChange,
}: {
  value: PhotoPair | null;
  onChange: (photos: PhotoPair | null) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value.thumb.blob) : null),
    [value],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await compressPhoto(file));
    } catch {
      setError("That photo could not be read. Try another one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* capture="environment" opens the native camera. No getUserMedia, so no iOS PWA quirks. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!value ? (
        <div>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="press flex h-28 w-full flex-col items-center justify-center gap-1 border border-border bg-surface [@media(hover:hover)_and_(pointer:fine)]:hover:border-text-muted"
          >
            <span className="font-display text-[19px]">{busy ? "Preparing photo…" : "Take a photo"}</span>
            <span className="text-xs text-text-muted">Opens your camera</span>
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            disabled={busy}
            className="press mt-1 min-h-11 text-[13px] text-text-muted underline underline-offset-4"
          >
            Choose from your library
          </button>
        </div>
      ) : (
        <div>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Your photo"
              width={value.thumb.width}
              height={value.thumb.height}
              className="max-h-80 w-full border border-border bg-badge-bg object-cover"
            />
          )}
          <p className="mt-2 text-xs tabular-nums text-text-muted">
            Feed {kb(value.thumb.blob.size)} · Full {kb(value.full.blob.size)} · {value.thumb.ext.toUpperCase()}
          </p>
          <div className="mt-1 flex gap-4">
            <button type="button" onClick={() => cameraRef.current?.click()} className="press min-h-11 text-[13px] underline underline-offset-4">
              Retake
            </button>
            <button type="button" onClick={() => onChange(null)} className="press min-h-11 text-[13px] text-text-muted underline underline-offset-4">
              Remove
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-[13px] text-brand-hover">{error}</p>}
    </div>
  );
}
