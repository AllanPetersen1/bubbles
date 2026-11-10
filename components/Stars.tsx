"use client";

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
 * Tap input, 0.5 to 5.0 in half steps.
 * Each star is a 44px cell split into a left half (x.5) and a right half (x.0).
 */
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div role="group" aria-label="Rating" className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative flex h-12 w-11 items-center justify-center transition-transform duration-150 ease-out has-[button:active]:scale-90"
          >
            <Star fraction={value - i} size={32} />
            <button
              type="button"
              aria-label={`${i + 0.5} stars`}
              aria-pressed={value === i + 0.5}
              onClick={() => onChange(i + 0.5)}
              className="absolute inset-y-0 left-0 w-1/2"
            />
            <button
              type="button"
              aria-label={`${i + 1} stars`}
              aria-pressed={value === i + 1}
              onClick={() => onChange(i + 1)}
              className="absolute inset-y-0 right-0 w-1/2"
            />
          </div>
        ))}
      </div>
      <span className="font-display text-[34px] leading-none tabular-nums text-text-main">
        {value > 0 ? value.toFixed(1) : "–"}
      </span>
    </div>
  );
}
