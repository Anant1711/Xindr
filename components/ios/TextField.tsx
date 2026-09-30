import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full min-w-0 bg-transparent text-[17px] text-label placeholder:text-[#c4c4c7] outline-none";

type TextFieldRowProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

/** Grouped-list row with a label on the left and an input on the right. Font size stays >= 16px to avoid iOS zoom. */
export function TextFieldRow({
  label,
  id,
  className = "",
  ...rest
}: TextFieldRowProps) {
  return (
    <label htmlFor={id} className="flex w-full items-center gap-3 pl-4">
      <div className="ios-row-divider hairline-b flex min-h-[44px] flex-1 items-center gap-3 pr-4">
        <span className="w-28 shrink-0 text-body">{label}</span>
        <input
          id={id}
          className={`${fieldClass} text-right ${className}`}
          {...rest}
        />
      </div>
    </label>
  );
}

type TextAreaRowProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  count?: number;
};

export function TextAreaRow({
  label,
  count,
  maxLength,
  id,
  ...rest
}: TextAreaRowProps) {
  return (
    <div className="px-4 py-2.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        maxLength={maxLength}
        rows={3}
        className={`${fieldClass} resize-none`}
        {...rest}
      />
      {maxLength !== undefined && count !== undefined ? (
        <p className="text-right text-foot text-secondary" aria-live="polite">
          {count}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}
