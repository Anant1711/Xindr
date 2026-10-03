import { Suspense } from "react";
import { RefreshOnFocus } from "@/components/RefreshOnFocus";
import { parseLevelFilter } from "@/lib/buddy";
import { NearbyHeader } from "./NearbyHeader";
import { NearbyList } from "./NearbyList";

export const metadata = { title: "Nearby" };

function CarouselSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-1 flex-col">
      <span className="mx-auto h-4 w-52 animate-shimmer rounded bg-track" />
      <div className="flex flex-1 items-center justify-center gap-4 overflow-hidden pt-6 pb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex w-[240px] shrink-0 flex-col items-center gap-[18px]">
            <span className="h-[300px] w-full animate-shimmer rounded-[24px] bg-track" />
            <span className="h-5 w-32 animate-shimmer rounded bg-track" />
            <span className="h-3.5 w-40 animate-shimmer rounded bg-track" />
          </div>
        ))}
      </div>
      <div className="px-6 pt-2 pb-5">
        <span className="block h-[54px] animate-shimmer rounded-2xl bg-track" />
      </div>
    </div>
  );
}

export default async function NearbyPage(props: PageProps<"/nearby">) {
  const level = parseLevelFilter((await props.searchParams).level);

  return (
    // Fills the screen above the tab bar so the carousel sits centred and the button above it.
    <div className="flex min-h-[calc(100dvh-58px-env(safe-area-inset-bottom)-24px)] flex-col">
      <RefreshOnFocus />
      <NearbyHeader level={level} />
      <Suspense key={level} fallback={<CarouselSkeleton />}>
        <NearbyList level={level} />
      </Suspense>
    </div>
  );
}
