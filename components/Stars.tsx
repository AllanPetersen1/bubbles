"use client";

import { RATING_MAX, RATING_STEP, formatRating } from "@/lib/rating";

const STAR_PATH =
  "M12 2.6l2.8 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17.1l-6.1 3.6 1.6-6.7-5.2-4.5 6.9-.6z";

function StarShape({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={STAR_PATH} />
    </svg>
  );
}

/** One star, filled from the left by `fraction` (0 to 1): handles half stars. */
function Star({ fraction, size }: { fraction: number; size: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <span className="absolute inset-0 text-border">
        <StarShape size={size} />
      </span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-rating-star"
        style={{ width: `${Math.min(1, Math.max(0, fraction)) * 100}%` }}
      >
        <StarShape size={size} />
      </span>
    </span>
  );
}

/** Read-only rating, e.g. in the feed. */
export function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span role="img" aria-label={`${value} out of 5`} className="inline-flex gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fraction={value - i} size={size} />
      ))}
    </span>
  );
}

/**
 * Range slider, 0.25 to 5.00 in quarter steps (0 = not rated).
 * The native range input gives drag, tap, keyboard and screen-reader support for free;
 * the stars and the number are just two more views of the same value.
 */
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span aria-hidden>
          <StarRow value={value} size={32} />
        </span>
        <span className="font-display text-[34px] leading-none tabular-nums text-text-main">
          {value > 0 ? formatRating(value) : "–"}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={RATING_MAX}
        step={RATING_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rating"
        aria-valuetext={value > 0 ? `${formatRating(value)} out of 5` : "Not rated"}
        className="rating-range mt-1"
        style={{ "--fill": `${(value / RATING_MAX) * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}
