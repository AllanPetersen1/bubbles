"use client";

import { useState } from "react";
import CheckInCard, { toEdit, type CheckInDraft } from "@/components/CheckInCard";
import Modal from "@/components/Modal";
import { NotSignedInError, deleteCheckIn, updateCheckIn } from "@/lib/data";
import type { FeedItem } from "@/lib/types";

const icon = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const iconButton =
  "press flex size-11 items-center justify-center text-text-muted [@media(hover:hover)_and_(pointer:fine)]:hover:text-text-main";

const draftFrom = (item: FeedItem): CheckInDraft => ({
  note: item.note ?? "",
  photos: null,
  rating: item.rating,
  vintage: item.vintage ? String(item.vintage) : "NV",
  dosage: item.dosage,
  venue: item.venue ?? "",
});

function errorText(err: unknown) {
  console.error("[bubbles] check-in change failed", err);
  return err instanceof NotSignedInError
    ? err.message
    : "That did not go through. Check your connection and try again.";
}

function EditForm({
  item,
  onSaved,
  onCancel,
}: {
  item: FeedItem;
  onSaved: (item: FeedItem) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => draftFrom(item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (draft.rating === 0) return setError("Give it a rating first.");
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateCheckIn(item, toEdit(draft)));
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4">
      <p className="eyebrow mb-3 truncate">
        {item.producer} · {item.cuvee}
      </p>
      <CheckInCard value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} showPhoto={false} />
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-brand-hover">
          {error}
        </p>
      )}
      {/* Sticky: on a short phone the form scrolls inside the dialog, the buttons stay in reach */}
      <div className="sticky bottom-0 -mx-1 mt-4 flex gap-2 bg-surface px-1 pt-2 pb-1">
        <button type="button" onClick={onCancel} className="btn btn-quiet press flex-1">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn btn-primary press flex-1">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({
  item,
  onDeleted,
  onCancel,
}: {
  item: FeedItem;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteCheckIn(item);
      onDeleted();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-text-muted">
        {item.producer} {item.cuvee} will be removed from the feed along with its photo. This cannot be undone.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-brand-hover">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCancel} className="btn btn-quiet press flex-1">
          Keep it
        </button>
        <button type="button" onClick={confirm} disabled={busy} className="btn btn-primary press flex-1">
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

/**
 * Edit and delete for one of your own check-ins. Render it only for the owner:
 * the data layer and the database enforce ownership again on every write.
 */
export default function ReviewActions({
  item,
  onChange,
  onDelete,
}: {
  item: FeedItem;
  onChange: (item: FeedItem) => void;
  onDelete: (id: string) => void;
}) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [opens, setOpens] = useState(0); // new key per open = fresh form state
  const close = () => setMode(null);

  return (
    <>
      <button
        type="button"
        aria-label="Edit check-in"
        onClick={() => {
          setOpens((n) => n + 1);
          setMode("edit");
        }}
        className={iconButton}
      >
        <svg {...icon}>
          <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Delete check-in"
        onClick={() => {
          setOpens((n) => n + 1);
          setMode("delete");
        }}
        className={iconButton}
      >
        <svg {...icon}>
          <path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7M10.5 11v5M13.5 11v5" />
        </svg>
      </button>

      <Modal open={mode === "edit"} onClose={close} title="Edit check-in">
        <EditForm
          key={opens}
          item={item}
          onCancel={close}
          onSaved={(next) => {
            close();
            onChange(next);
          }}
        />
      </Modal>
      <Modal open={mode === "delete"} onClose={close} title="Delete this check-in?">
        <DeleteConfirm key={opens} item={item} onCancel={close} onDeleted={() => onDelete(item.id)} />
      </Modal>
    </>
  );
}
