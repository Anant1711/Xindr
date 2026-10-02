import type { ReactNode } from "react";

type ListGroupProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** "card": bordered white card (default). "plain": rows straight on the page (e.g. message list). */
  variant?: "card" | "plain";
};

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mx-5 mb-2 text-foot font-bold tracking-[0.6px] text-secondary uppercase">
      {children}
    </h2>
  );
}

export function ListGroup({
  header,
  footer,
  children,
  className = "",
  variant = "card",
}: ListGroupProps) {
  return (
    <section className={`mb-6 ${className}`}>
      {header ? <SectionLabel>{header}</SectionLabel> : null}
      <div
        className={
          variant === "card"
            ? "ios-group mx-5 overflow-hidden rounded-group border border-separator bg-card"
            : "ios-group"
        }
      >
        {children}
      </div>
      {footer ? (
        <p className="mx-5 mt-2 text-sub text-secondary">{footer}</p>
      ) : null}
    </section>
  );
}
