"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "./icons";

type NavBarProps = {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  /** Kept for call sites; every bar is now solid white. */
  modal?: boolean;
};

export function NavBar({ title, left, right }: NavBarProps) {
  return (
    <header className="pt-safe sticky top-0 z-20 bg-white/95 backdrop-blur-md">
      <div className="grid h-[52px] grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex min-w-0 justify-start">{left}</div>
        <div className="max-w-[220px] truncate text-center text-[16px] font-bold">
          {title}
        </div>
        <div className="flex min-w-0 justify-end">{right}</div>
      </div>
    </header>
  );
}

const textButtonClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center px-1 text-[15px] font-semibold rounded-md active:opacity-50 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent";

type NavButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  /** Primary action (accent); otherwise a quiet grey text button like Cancel. */
  bold?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit";
  form?: string;
};

/** Text button for a nav bar (Cancel, Send, Sign out). */
export function NavButton({
  children,
  onClick,
  href,
  bold,
  disabled,
  ariaLabel,
  type = "button",
  form,
}: NavButtonProps) {
  const cls = `${textButtonClass} ${bold ? "text-accent font-bold" : "text-secondary"}`;
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

const iconButtonClass =
  "relative inline-flex size-10 items-center justify-center rounded-full bg-surface text-label after:absolute after:-inset-[2px] after:content-[''] active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Round 40px icon button (back, more). Always needs a label. */
export function IconButton({
  children,
  label,
  onClick,
  href,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={iconButtonClass}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={iconButtonClass}
    >
      {children}
    </button>
  );
}

export function BackButton({
  label = "Back",
  href,
  fallbackHref = "/",
}: {
  label?: string;
  /** Always go here. */
  href?: string;
  /** Go back in history, or here when the page was opened directly. */
  fallbackHref?: string;
}) {
  const router = useRouter();
  const icon = <ChevronLeft size={18} strokeWidth={2.2} />;
  if (href) {
    return (
      <IconButton href={href} label={label}>
        {icon}
      </IconButton>
    );
  }
  return (
    <IconButton
      label={label}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
    >
      {icon}
    </IconButton>
  );
}
