"use client";

import { useModalDialog } from "./useModalDialog";

export type SheetAction = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

type ActionSheetProps = {
  open: boolean;
  onClose: () => void;
  actions: SheetAction[];
  title?: string;
  message?: string;
  cancelLabel?: string;
};

const itemClass =
  "flex min-h-[57px] w-full items-center justify-center px-4 text-[17px] font-semibold active:bg-surface focus-visible:bg-surface focus-visible:outline-none";

export function ActionSheet({
  open,
  onClose,
  actions,
  title,
  message,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const { ref, onBackdropClick } = useModalDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-label={title ?? "Actions"}
      className="mx-auto mt-auto mb-0 w-full max-w-[430px] bg-transparent p-0 backdrop:animate-fade-in backdrop:bg-black/40 open:animate-sheet-up"
    >
      <div className="pb-safe px-2 pb-2">
        <div className="overflow-hidden rounded-[18px] bg-white">
          {title || message ? (
            <div className="hairline-b px-4 py-3.5 text-center">
              {title ? (
                <p className="text-foot font-semibold text-secondary">
                  {title}
                </p>
              ) : null}
              {message ? (
                <p className="mt-0.5 text-foot text-secondary">{message}</p>
              ) : null}
            </div>
          ) : null}
          {actions.map((action, i) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                onClose();
                action.onSelect();
              }}
              className={`${itemClass} ${i < actions.length - 1 ? "hairline-b" : ""} ${
                action.destructive ? "text-destructive" : "text-accent"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className={`${itemClass} mt-2 rounded-[18px] bg-white font-bold text-label`}
        >
          {cancelLabel}
        </button>
      </div>
    </dialog>
  );
}
