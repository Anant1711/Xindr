"use client";

import type { ReactNode } from "react";
import { NavBar, NavButton } from "./NavBar";
import { useModalDialog } from "./useModalDialog";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Right nav button, e.g. Send / Submit. */
  action?: ReactNode;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, action, children }: SheetProps) {
  const { ref, onBackdropClick } = useModalDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-label={title}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-[430px] overflow-hidden rounded-t-[12px] bg-bg p-0 backdrop:animate-fade-in backdrop:bg-black/40 open:animate-sheet-up"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div
          className="mx-auto mt-1.5 h-[5px] w-9 shrink-0 rounded-full bg-[#c4c4c7]"
          aria-hidden="true"
        />
        <NavBar
          modal
          title={title}
          left={<NavButton onClick={onClose}>Cancel</NavButton>}
          right={action}
        />
        <div className="pb-safe overflow-y-auto pt-4">{children}</div>
      </div>
    </dialog>
  );
}
