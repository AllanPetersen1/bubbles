"use client";

import PhotoPicker from "@/components/PhotoPicker";
import { StarInput } from "@/components/Stars";
import { DOSAGES, type CheckInEdit, type Dosage, type PhotoPair } from "@/lib/types";

/** Everything the card edits. `vintage` is "NV" or a year, as the <select> holds it. */
export type CheckInDraft = {
  note: string;
  photos: PhotoPair | null;
  rating: number;
  vintage: string;
  dosage: Dosage | null;
  venue: string;
};

export const emptyDraft: CheckInDraft = {
  note: "",
  photos: null,
  rating: 0,
  vintage: "NV",
  dosage: null,
  venue: "",
};

export const toEdit = (d: CheckInDraft): CheckInEdit => ({
  vintage: d.vintage === "NV" ? null : Number(d.vintage),
  rating: d.rating,
  dosage: d.dosage,
  note: d.note,
  venue: d.venue,
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <h3 className="eyebrow mb-2.5">{label}</h3>
      {children}
    </div>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%23736F6E' stroke-width='1.5'%3E%3Cpath d='m1 1 5 5 5-5'/%3E%3C/svg%3E\")";

/**
 * One connected card, fields in a fixed order:
 * notes, photo, rating, vintage, dosage, where. The photo row is hidden when editing:
 * a posted photo stays as posted.
 */
export default function CheckInCard({
  value,
  onChange,
  showPhoto = true,
}: {
  value: CheckInDraft;
  onChange: (patch: Partial<CheckInDraft>) => void;
  showPhoto?: boolean;
}) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1949 }, (_, i) => thisYear - i);
  // An older vintage already on the check-in must stay selectable
  if (value.vintage !== "NV" && !years.includes(Number(value.vintage))) years.push(Number(value.vintage));

  return (
    <div className="divide-y divide-border border border-border bg-surface">
      <textarea
        value={value.note}
        onChange={(e) => onChange({ note: e.target.value })}
        maxLength={1000}
        placeholder="What are you tasting? Brioche, citrus, chalk, a long finish…"
        aria-label="Tasting notes"
        className="block min-h-[120px] w-full resize-none bg-transparent px-4 py-4 text-[16px] leading-6 placeholder:text-text-muted/80 focus:outline-none focus-visible:outline-offset-[-2px]"
      />

      {showPhoto && (
        <Row label="Photo">
          <PhotoPicker value={value.photos} onChange={(photos) => onChange({ photos })} />
        </Row>
      )}

      <Row label="Rating">
        <StarInput value={value.rating} onChange={(rating) => onChange({ rating })} />
      </Row>

      <Row label="Vintage">
        <select
          value={value.vintage}
          onChange={(e) => onChange({ vintage: e.target.value })}
          aria-label="Vintage year"
          className="field appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9"
          style={{ backgroundImage: CHEVRON }}
        >
          <option value="NV">Non-vintage</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Row>

      <Row label="Dosage">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {DOSAGES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={value.dosage === d}
              onClick={() => onChange({ dosage: value.dosage === d ? null : d })}
              className="chip press shrink-0"
            >
              {d}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">Optional. It is printed on the back label.</p>
      </Row>

      <Row label="Where">
        <input
          value={value.venue}
          onChange={(e) => onChange({ venue: e.target.value })}
          maxLength={120}
          placeholder="Home, a bar, a vineyard…"
          aria-label="Where"
          autoComplete="off"
          className="field"
        />
      </Row>
    </div>
  );
}
