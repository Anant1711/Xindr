import type { ReactNode } from "react";

export function LargeTitle({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between px-4 pt-2 pb-2">
      <h1 className="text-large-title">{children}</h1>
      {trailing}
    </div>
  );
}
