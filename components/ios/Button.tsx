import type { ButtonHTMLAttributes } from "react";

type Variant =
  "primary" | "secondary" | "plain" | "destructive" | "destructive-plain";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white active:opacity-80",
  secondary: "bg-accent/10 text-accent active:bg-accent/20",
  plain: "bg-transparent text-accent active:opacity-60",
  destructive: "bg-destructive text-white active:opacity-80",
  "destructive-plain": "bg-transparent text-destructive active:opacity-60",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "large" | "small";
  loading?: boolean;
};

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
  const sizing =
    size === "large"
      ? "h-[50px] w-full rounded-button text-body font-semibold"
      : "min-h-[44px] rounded-[10px] px-4 text-sub font-semibold";
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 ${sizing} ${variants[variant]} ${className}`}
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
