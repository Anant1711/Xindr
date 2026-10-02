export function SkeletonRow({ tall = true }: { tall?: boolean }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 pl-4">
      {tall ? (
        <span className="size-10 shrink-0 animate-shimmer rounded-full bg-track" />
      ) : null}
      <div
        className={`ios-row-divider hairline-b flex flex-1 flex-col justify-center gap-1.5 pr-4 ${
          tall ? "min-h-[60px]" : "min-h-[44px]"
        }`}
      >
        <span className="h-3.5 w-28 animate-shimmer rounded bg-track" />
        {tall ? (
          <span className="h-3 w-40 animate-shimmer rounded bg-track" />
        ) : null}
      </div>
    </div>
  );
}

export function SkeletonList({
  rows = 5,
  tall = true,
}: {
  rows?: number;
  tall?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="ios-group mx-5 overflow-hidden rounded-group border border-separator bg-card"
    >
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} tall={tall} />
      ))}
    </div>
  );
}
