"use client";

import { useRef, type KeyboardEvent } from "react";

type Option<T extends string> = { value: T; label: string };

type ChipsProps<T extends string> = {
  options: readonly Option<T>[];
  /** null = nothing chosen yet (e.g. a required onboarding choice). */
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  /** One row that scrolls sideways (filters) instead of wrapping (forms). */
  scroll?: boolean;
};

/** Single-choice pill chips (a radio group). */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
  scroll,
}: ChipsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-2 py-[3px] ${scroll ? "no-scrollbar -mx-5 overflow-x-auto px-5" : "flex-wrap"}`}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (value === null && i === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative h-[38px] shrink-0 rounded-full px-4 text-[13px] whitespace-nowrap transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-[3px] after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected
                ? "bg-accent font-bold text-white"
                : "bg-surface font-semibold text-label"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
