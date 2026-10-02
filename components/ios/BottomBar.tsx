import type { ReactNode } from "react";

/** Sticky action area pinned to the bottom of a full-screen page (above the safe area). */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Spacer so page content can scroll clear of the bar. */}
      <div
        aria-hidden="true"
        className="h-[calc(104px+env(safe-area-inset-bottom))]"
      />
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[430px] flex-col gap-2.5 border-t border-separator bg-white px-5 pt-3.5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {children}
      </div>
    </>
  );
}
