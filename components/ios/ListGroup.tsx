import type { ReactNode } from "react";

type ListGroupProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ListGroup({
  header,
  footer,
  children,
  className = "",
}: ListGroupProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {header ? (
        <h2 className="mx-8 mb-1.5 text-foot tracking-[0.2px] text-secondary uppercase">
          {header}
        </h2>
      ) : null}
      <div className="ios-group mx-4 overflow-hidden rounded-group bg-card">
        {children}
      </div>
      {footer ? (
        <p className="mx-8 mt-1.5 text-foot text-secondary">{footer}</p>
      ) : null}
    </section>
  );
}
