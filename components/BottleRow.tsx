import type { Bottle } from "@/lib/types";

export default function BottleRow({
  bottle,
  onSelect,
}: {
  bottle: Bottle;
  onSelect: (bottle: Bottle) => void;
}) {
  const meta = [bottle.category, bottle.region && bottle.region !== bottle.category ? bottle.region : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(bottle)}
        className="press flex min-h-[68px] w-full items-center gap-3 border-b border-border px-4 py-3 text-left [@media(hover:hover)_and_(pointer:fine)]:hover:bg-badge-bg"
      >
        <span className="min-w-0 flex-1">
          <span className="eyebrow block truncate">{bottle.producer}</span>
          <span className="mt-0.5 block truncate font-display text-[19px] leading-tight">{bottle.name}</span>
          <span className="mt-0.5 block truncate text-xs text-text-muted">{meta}</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted" aria-hidden>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </li>
  );
}
