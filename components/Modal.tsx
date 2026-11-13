"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Native <dialog>: focus trap, Esc to close and an inert background come from the browser.
 * Children stay mounted while closed so the close transition can play; parents that need
 * fresh form state on each open give the content a changing `key`.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // The dialog box is all content, so a click that lands on the dialog itself hit the backdrop
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modal"
    >
      <div className="px-5 pt-5 pb-5">
        <h2 id={titleId} className="font-display text-[24px] leading-tight tracking-[-0.01em]">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
