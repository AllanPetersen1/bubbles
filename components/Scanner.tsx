"use client";

import { useEffect, useRef, useState } from "react";

const EAN = /^\d{8}$|^\d{12,14}$/;

/**
 * Full-screen barcode scanner (@zxing/browser, runs entirely on the device).
 * Always offers typing the number as a fallback: desktop has no rear camera,
 * and worn labels or foil often will not scan.
 */
export default function Scanner({
  onDetect,
  onClose,
}: {
  onDetect: (ean: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const detectRef = useRef(onDetect);
  useEffect(() => {
    detectRef.current = onDetect;
  });

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | null = null;

    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (cancelled || !videoRef.current) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result, _err, ctrl) => {
            const text = result?.getText();
            if (text && EAN.test(text)) {
              ctrl.stop();
              detectRef.current(text);
            }
          },
        );
        if (cancelled) controls.stop();
        else stop = () => controls.stop();
      } catch {
        if (!cancelled) {
          setError("The camera is not available. Type the number printed under the barcode instead.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  const valid = EAN.test(typed);

  return (
    <div role="dialog" aria-modal="true" aria-label="Scan a barcode" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Scan barcode</p>
        <button
          type="button"
          onClick={onClose}
          className="press -mr-2 flex h-11 items-center px-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
        >
          Close
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[28%] w-[78%] max-w-sm">
            <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-brand-primary" />
            <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-brand-primary" />
            <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-brand-primary" />
            <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-brand-primary" />
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-4 px-6 text-center text-[13px] text-white/80">
          {error ?? "Hold the barcode inside the frame."}
        </p>
      </div>

      <form
        className="flex gap-2 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onDetect(typed);
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 14))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Or type the number"
          aria-label="Barcode number"
          className="field !border-white/30 !bg-transparent !text-white placeholder:!text-white/60"
        />
        <button type="submit" disabled={!valid} className="btn btn-gold press shrink-0">
          Look up
        </button>
      </form>
    </div>
  );
}
