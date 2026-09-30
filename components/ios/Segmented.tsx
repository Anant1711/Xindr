"use client";

import { useRef, type KeyboardEvent } from "react";

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
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
      className="flex h-9 w-full rounded-[9px] bg-track p-[2px]"
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
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative min-w-0 flex-1 truncate rounded-[8px] px-1 text-[13px] transition-[background-color,box-shadow] duration-150 after:absolute after:inset-x-0 after:-top-1 after:-bottom-1 after:content-[''] focus-visible:outline-2 focus-visible:outline-accent ${
              selected
                ? "bg-white font-semibold shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)]"
                : "font-medium"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
