import { Suspense } from "react";
import { RefreshOnFocus } from "@/components/RefreshOnFocus";
import { LargeTitle } from "@/components/ios/LargeTitle";
import { SkeletonList } from "@/components/ios/Skeleton";
import { parseLevelFilter } from "@/lib/buddy";
import { LevelFilterControl } from "./LevelFilterControl";
import { NearbyList } from "./NearbyList";

export const metadata = { title: "Nearby" };

export default async function NearbyPage(props: PageProps<"/nearby">) {
  const level = parseLevelFilter((await props.searchParams).level);

  return (
    <div className="pt-safe">
      <RefreshOnFocus />
      <LargeTitle>Nearby</LargeTitle>
      <div className="px-5 pt-3 pb-5">
        <LevelFilterControl value={level} />
      </div>
      <Suspense
        key={level}
        fallback={
          <section className="mb-8">
            <div className="mx-5 mb-2 h-4" />
            <SkeletonList rows={6} />
          </section>
        }
      >
        <NearbyList level={level} />
      </Suspense>
    </div>
  );
}
