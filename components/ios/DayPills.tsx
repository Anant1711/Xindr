"use client";

import { DAY_LETTER, DAY_SHORT } from "@/lib/constants";

type DayPillsProps = {
  /** Highlighted days, 0 = Monday ... 6 = Sunday. */
  days: readonly number[];
  /** When provided, pills are toggle buttons (onboarding); otherwise display only (overlap card). */
  onToggle?: (day: number) => void;
  tone?: "success" | "accent";
  label: string;
};

export function DayPills({
  days,
  onToggle,
  tone = "success",
  label,
}: DayPillsProps) {
  const on =
    tone === "success" ? "bg-success text-white" : "bg-accent text-white";
  return (
    <div
      role={onToggle ? "group" : "list"}
      aria-label={label}
      className="flex justify-between gap-1.5"
    >
      {DAY_SHORT.map((name, i) => {
        const active = days.includes(i);
        const cls = `flex size-[38px] items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
          active ? on : "bg-surface text-secondary"
        }`;
        if (onToggle) {
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              aria-label={name}
              onClick={() => onToggle(i)}
              className={`${cls} relative after:absolute after:-inset-[2px] after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
            >
              {DAY_LETTER[i]}
            </button>
          );
        }
        return (
          <span
            key={name}
            role="listitem"
            aria-label={`${name}${active ? ", shared" : ""}`}
            className={cls}
          >
            {DAY_LETTER[i]}
          </span>
        );
      })}
    </div>
  );
}
