import Link from "next/link";
import type { ReactNode } from "react";
import { Checkmark, ChevronRight } from "./icons";

type ListRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  selected?: boolean;
  tone?: "default" | "accent" | "destructive";
  bold?: boolean;
  dimmed?: boolean;
  tall?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  role?: string;
  ariaChecked?: boolean;
  ariaLabel?: string;
};

const toneClass = {
  default: "text-label",
  accent: "text-accent",
  destructive: "text-destructive",
} as const;

export function ListRow({
  title,
  subtitle,
  detail,
  leading,
  trailing,
  chevron,
  selected,
  tone = "default",
  bold,
  dimmed,
  tall,
  href,
  onClick,
  disabled,
  role,
  ariaChecked,
  ariaLabel,
}: ListRowProps) {
  const interactive = Boolean(href || onClick);
  const outer = `flex w-full items-center gap-3 pl-4 text-left ${
    interactive
      ? "transition-colors active:bg-surface focus-visible:bg-surface focus-visible:outline-none"
      : ""
  } ${dimmed ? "opacity-50" : ""} ${disabled ? "pointer-events-none opacity-40" : ""}`;

  const body = (
    <>
      {leading}
      <div
        className={`ios-row-divider hairline-b flex min-w-0 flex-1 items-center gap-2 py-2 pr-4 ${
          tall ? "min-h-[60px]" : "min-h-[44px]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-body ${toneClass[tone]} ${bold ? "font-semibold" : ""}`}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              className={`truncate text-sub ${bold ? "text-label" : "text-secondary"}`}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {detail ? (
          <div className="shrink-0 text-body text-secondary">{detail}</div>
        ) : null}
        {trailing}
        {selected ? <Checkmark className="shrink-0 text-accent" /> : null}
        {chevron ? <ChevronRight className="shrink-0 text-[#8e9198]" /> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={outer} aria-label={ariaLabel}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={outer}
        disabled={disabled}
        role={role}
        aria-checked={ariaChecked}
        aria-label={ariaLabel}
      >
        {body}
      </button>
    );
  }
  return <div className={outer}>{body}</div>;
}
