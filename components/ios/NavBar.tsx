"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "./icons";

type NavBarProps = {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  /** Modal style: no translucency, used for sheets like Ask to Train and onboarding. */
  modal?: boolean;
};

export function NavBar({ title, left, right, modal }: NavBarProps) {
  return (
    <header
      className={`pt-safe sticky top-0 z-20 ${
        modal
          ? "bg-bg"
          : "hairline-b bg-bg/80 backdrop-blur-xl backdrop-saturate-150"
      }`}
    >
      <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center px-2">
        <div className="flex min-w-0 justify-start">{left}</div>
        <div className="max-w-[220px] truncate text-center text-body font-semibold">
          {title}
        </div>
        <div className="flex min-w-0 justify-end">{right}</div>
      </div>
    </header>
  );
}

const navButtonClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center px-2 text-body text-accent active:opacity-50 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent rounded-md";

type NavButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  bold?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit";
  form?: string;
};

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
  const cls = `${navButtonClass} ${bold ? "font-semibold" : ""}`;
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

export function BackButton({
  label = "Back",
  href,
}: {
  label?: string;
  href?: string;
}) {
  const router = useRouter();
  const content = (
    <>
      <ChevronLeft className="-ml-1" />
      <span>{label}</span>
    </>
  );
  if (href) return <NavButton href={href}>{content}</NavButton>;
  return <NavButton onClick={() => router.back()}>{content}</NavButton>;
}
