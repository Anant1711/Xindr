"use client";

import { useEffect, useRef, type MouseEvent } from "react";

export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // Content is mounted while the dialog is closed, so React's autoFocus has already fired.
      el.querySelector<HTMLElement>(
        "[data-autofocus], input:not([type=hidden]):not([type=checkbox]), textarea",
      )?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return { ref, onBackdropClick };
}
