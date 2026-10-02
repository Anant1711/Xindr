import type { ButtonHTMLAttributes } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "plain"
  | "destructive"
  | "destructive-plain";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white active:opacity-85",
  secondary: "bg-accent-tint text-accent active:opacity-80",
  outline:
    "border-[1.5px] border-secondary bg-transparent text-secondary active:bg-surface",
  plain: "bg-transparent text-accent active:opacity-60",
  destructive: "bg-destructive text-white active:opacity-85",
  "destructive-plain": "bg-transparent text-destructive active:opacity-60",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** large: 56px full-width pill; small: 44px pill. */
  size?: "large" | "small";
  loading?: boolean;
};

export const buttonClass = (
  variant: Variant = "primary",
  size: "large" | "small" = "large",
) =>
  `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 ${
    size === "large"
      ? "h-14 w-full text-[16px]"
      : "min-h-[44px] px-5 text-[15px]"
  } ${variants[variant]}`;

export function Button({
  variant = "primary",
  size = "large",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClass(variant, size)} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
